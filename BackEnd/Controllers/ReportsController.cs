// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.EntityFrameworkCore;
// using CafeCreperiaApi.Data;
// using CafeCreperiaApi.DTOs;
// using CafeCreperiaApi.Models;

// namespace CafeCreperiaApi.Controllers;

// [ApiController]
// [Route("api/reports")]
// [Authorize(Roles = "admin")]
// public class ReportsController(AppDbContext db) : ControllerBase
// {
//     // GET /api/reports/cycles?department=creperia&from=2024-01-01&to=2024-12-31
//     [HttpGet("cycles")]
//     public async Task<ActionResult<List<DayCycleReportDto>>> GetCycles(
//         [FromQuery] string? department,
//         [FromQuery] string? from,
//         [FromQuery] string? to)
//     {
//         // Solo los ciclos COMPLETOS (apertura + corte)
//         var query = db.Aperturas
//             .Include(a => a.Corte)
//             .Include(a => a.Orders)
//                 .ThenInclude(o => o.Items)
//             .Where(a => a.Status == CajaStatus.closed && a.Corte != null)
//             .AsQueryable();

//         if (!string.IsNullOrWhiteSpace(department) && Enum.TryParse<Department>(department, out var dept))
//             query = query.Where(a => a.Department == dept);

//         if (DateTime.TryParse(from, out var fromDate))
//             query = query.Where(a => a.OpenedAt >= fromDate);

//         if (DateTime.TryParse(to, out var toDate))
//             query = query.Where(a => a.OpenedAt <= toDate.AddDays(1));

//         var aperturas = await query
//             .OrderByDescending(a => a.OpenedAt)
//             .ToListAsync();

//         var result = aperturas.Select((a, idx) => BuildCycleReport(idx + 1, a)).ToList();
//         return Ok(result);
//     }

//     // GET /api/reports/cycles/5
//     [HttpGet("cycles/{id}")]
//     public async Task<ActionResult<DayCycleReportDto>> GetCycle(int id)
//     {
//         var apertura = await db.Aperturas
//             .Include(a => a.Corte)
//             .Include(a => a.Orders)
//                 .ThenInclude(o => o.Items)
//             .FirstOrDefaultAsync(a => a.Id == id && a.Status == CajaStatus.closed && a.Corte != null);

//         if (apertura is null) return NotFound();

//         return Ok(BuildCycleReport(id, apertura));
//     }

//     // ── Builder ───────────────────────────────────────────────────────────────

//     private static DayCycleReportDto BuildCycleReport(int reportId, Apertura a)
//     {
//         var corte = a.Corte!;
//         var orders = a.Orders.ToList();

//         var cashSales  = orders.Where(o => o.PaymentMethod == PaymentMethod.cash).Sum(o => o.Total);
//         var cardSales  = orders.Where(o => o.PaymentMethod == PaymentMethod.card).Sum(o => o.Total);
//         var grandTotal = cashSales + cardSales;

//         return new DayCycleReportDto(
//             Id:            reportId,
//             Department:    a.Department.ToString(),
//             Apertura:      new AperturaDto(a.Id, a.Department.ToString(), a.OpenedBy, a.OpenedAt, a.OpeningCash, a.Status.ToString()),
//             Corte:         new CorteDto(corte.Id, corte.AperturaId, corte.Department.ToString(), corte.ClosedBy, corte.ClosedAt, corte.ClosingCash, corte.CardSales, corte.ExpectedCash, corte.Difference),
//             Orders:        orders.Select(MapOrder).ToList(),
//             TotalOrders:   orders.Count,
//             TotalCashSales: cashSales,
//             TotalCardSales: cardSales,
//             GrandTotal:    grandTotal,
//             Date:          a.OpenedAt.ToString("yyyy-MM-dd")
//         );
//     }

//     private static OrderDto MapOrder(Order o) => new(
//         o.Id, o.AperturaId, o.Department.ToString(), o.CustomerName,
//         o.ConsumeType.ToString(), o.TableNumber,
//         o.Items.Select(i => new OrderItemDto(i.ProductId, i.ProductName, i.Quantity, i.UnitPrice, i.Subtotal)).ToList(),
//         o.Total, o.PaymentMethod.ToString(), o.Status.ToString(),
//         o.CreatedAt, o.DeliveredAt, o.CreatedBy
//     );
// }
