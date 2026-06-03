using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeCreperiaApi.Data;
using CafeCreperiaApi.DTOs;
using CafeCreperiaApi.Models;

namespace CafeCreperiaApi.Controllers;

[ApiController]
[Route("api/reports")]
[Authorize(Roles = "admin")]
public class ReportsController(AppDbContext db) : ControllerBase
{
    // GET /api/reports/cycles?from=2024-01-01&to=2024-12-31
    [HttpGet("cycles")]
    public async Task<ActionResult<List<DayCycleReportDto>>> GetCycles(
        [FromQuery] string? from,
        [FromQuery] string? to)
    {
        // Solo los ciclos COMPLETOS (apertura + corte)
        var query = db.Aperturas
            .Include(a => a.Corte)
            .Include(a => a.Orders)
                .ThenInclude(o => o.Items)
            .Where(a => a.Status == CajaStatus.closed && a.Corte != null)
            .AsQueryable();


        if (DateTime.TryParse(from, out var fromDate))
            query = query.Where(a => a.OpenedAt >= fromDate);

        if (DateTime.TryParse(to, out var toDate))
            query = query.Where(a => a.OpenedAt <= toDate.AddDays(1));

        var aperturas = await query
            .OrderByDescending(a => a.OpenedAt)
            .ToListAsync();

        var tasks = aperturas
            .Select((a, idx) => BuildCycleReport(idx + 1, a));

        var result = await Task.WhenAll(tasks);
        return Ok(result);
    }

    // GET /api/reports/cycles/5
    [HttpGet("cycles/{id}")]
    public async Task<ActionResult<DayCycleReportDto>> GetCycle(int id)
    {
        var apertura = await db.Aperturas
            .Include(a => a.Corte)
            .Include(a => a.Orders)
                .ThenInclude(o => o.Items)
            .FirstOrDefaultAsync(a => a.Id == id && a.Status == CajaStatus.closed && a.Corte != null);


        if (apertura is null) return NotFound();
         var tasks = BuildCycleReport(id + 1, apertura);

        var result = await Task.WhenAll(tasks);

        return Ok( result);
    }

    // ── Builder ───────────────────────────────────────────────────────────────

    private async  Task<DayCycleReportDto> BuildCycleReport(int reportId, Apertura a)
    {
        var corte = a.Corte!;
        var orders = a.Orders.ToList();

      

        var cashSales = await db.OrderItems
        .Where(i =>
            i.Order!.AperturaId == a.Id &&
            i.Order.PaymentMethod == PaymentMethod.cash &&
            i.Department == Department.creperia)
        .SumAsync(i => i.Subtotal);

        var tiendaCashSales = await db.OrderItems
            .Where(i =>
                i.Order!.AperturaId == a.Id &&
                i.Order.PaymentMethod == PaymentMethod.cash &&
                i.Department == Department.tienda)
            .SumAsync(i => i.Subtotal);


        var cardSales = await db.OrderItems
            .Where(i =>
                i.Order!.AperturaId == a.Id &&
                i.Order.PaymentMethod == PaymentMethod.card &&
                i.Department == Department.creperia)
            .SumAsync(i => i.Subtotal);

        var tiendaCardSales = await db.OrderItems
            .Where(i =>
                i.Order!.AperturaId == a.Id &&
                i.Order.PaymentMethod == PaymentMethod.card &&
                i.Department == Department.tienda)
            .SumAsync(i => i.Subtotal);

        return new DayCycleReportDto(
            Id:            reportId,
            Apertura:      new AperturaDtoReport(a.Id, a.OpenedBy, a.OpenedAt, a.OpeningCash, a.TiendaOpeningCash, a.Status.ToString()),
            Corte:         new CorteDto(corte.Id, corte.AperturaId, corte.ClosedBy, 
                                        corte.ClosedAt, corte.ClosingCash,  corte.ExpectedCash, 
                                        corte.CardSales,corte.Difference, corte.TiendaClosingCash, 
                                        corte.TiendaExpectedCash,
                                        corte.TiendaCardSales, corte.Difference),
            Orders:        orders.Select(MapOrder).ToList(),
            TotalOrders:   orders.Count,
            TotalCashSales: cashSales,
            TotalCardSales: cardSales,
            GrandTotal:    cashSales + cardSales,
            TiendaTotalCashSales: tiendaCashSales,
            TiendaTotalCardSales: tiendaCardSales,
            TiendaGrandTotal:    tiendaCashSales + tiendaCardSales,
            AllGrandTotal: cashSales + cardSales + tiendaCashSales + tiendaCardSales,
            Date:          a.OpenedAt.ToString("yyyy-MM-dd")
        );
    }

    private static OrderDto MapOrder(Order o) => new(
        o.Id, o.AperturaId,  o.CustomerName,
        o.ConsumeType.ToString(), o.TableNumber,
        o.Items.Select(i => new OrderItemDto(i.ProductId,  i.ProductName, i.Department.ToString(), i.Quantity, i.UnitPrice, i.Subtotal)).ToList(),
        o.Total, o.PaymentMethod.ToString(), o.Status.ToString(),
        o.CreatedAt, o.DeliveredAt, o.CreatedBy
    );
}
