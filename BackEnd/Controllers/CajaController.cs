using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeCreperiaApi.Data;
using CafeCreperiaApi.DTOs;
using CafeCreperiaApi.Models;

namespace CafeCreperiaApi.Controllers;

[ApiController]
[Route("api/caja")]
[Authorize]
public class CajaController(AppDbContext db) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
        ?? "0");

    // GET /api/caja/apertura/active?department=creperia
    [HttpGet("apertura/active")]
    public async Task<ActionResult<AperturaDto?>> GetActiveApertura()
    {
        var apertura = await db.Aperturas
            .FirstOrDefaultAsync(a => a.Status == CajaStatus.open);

        if (apertura is null) return Ok(null);

        return Ok(MapApertura(apertura));
    }

    // POST /api/caja/apertura
    [HttpPost("apertura")]
    public async Task<ActionResult<AperturaDto>> OpenCaja([FromBody] AperturaRequest req)
    {

        // Verificar que no haya apertura activa 
        var existing = await db.Aperturas
            .AnyAsync(a => a.Status == CajaStatus.open);

        if (existing)
            return Conflict(new { message = "Ya existe una caja abierta para este departamento" });

        var apertura = new Apertura
        {
            OpenedBy    = CurrentUserId,
            OpenedAt    = DateTime.UtcNow,
            OpeningCash = req.OpeningCash,
            TiendaOpeningCash = req.TiendaOpeningCash,
            Status      = CajaStatus.open
        };

        db.Aperturas.Add(apertura);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetActiveApertura), MapApertura(apertura));
    }

    // POST /api/caja/corte
    [HttpPost("corte")]
    public async Task<ActionResult<CorteDto>> CloseCaja([FromBody] CorteRequest req)
    {
        var apertura = await db.Aperturas
            .Include(a => a.Orders)
            .FirstOrDefaultAsync(a => a.Id == req.AperturaId && a.Status == CajaStatus.open);

        if (apertura is null)
            return NotFound(new { message = "Apertura no encontrada o ya cerrada" });

        // Calcular ventas en efectivo desde las órdenes
        var cashSales = apertura.Orders
            .Where(o => o.PaymentMethod == PaymentMethod.cash && o.Department == Department.creperia)
            .Sum(o => o.Total);

        // Calcular ventas TIENDA en efectivo desde las órdenes
        var cardSales = apertura.Orders
            .Where(o => o.PaymentMethod == PaymentMethod.card && o.Department == Department.creperia)
            .Sum(o => o.Total);

        
        // Calcular ventas en efectivo desde las órdenes
        var tiendaCashSales = apertura.Orders
            .Where(o => o.PaymentMethod == PaymentMethod.cash && o.Department == Department.tienda)
            .Sum(o => o.Total);

        // Calcular ventas TIENDA en efectivo desde las órdenes
        var tiendaCardSales = apertura.Orders
            .Where(o => o.PaymentMethod == PaymentMethod.card && o.Department == Department.tienda)
            .Sum(o => o.Total);

        
        //Calculate Card sales 
        var expectedCash = apertura.OpeningCash + cashSales;
        var difference   = req.ClosingCash - expectedCash;

        //Calculate Card sales 
        var tiendaExpectedCash = apertura.TiendaOpeningCash + tiendaCashSales;
        var tiendaDifference   = req.TiendaClosingCash - tiendaExpectedCash;

        var corte = new Corte
        {
            AperturaId   = apertura.Id,
            ClosedBy     = CurrentUserId,
            ClosedAt     = DateTime.UtcNow,

            ClosingCash  = req.ClosingCash,
            CardSales    = cardSales,
            ExpectedCash = expectedCash,
            Difference   = difference,

            TiendaClosingCash  = req.TiendaClosingCash,
            TiendaCardSales    = tiendaCardSales,
            TiendaExpectedCash = tiendaExpectedCash,
            TiendaDifference   = tiendaDifference
        };

        apertura.Status = CajaStatus.closed;

        db.Cortes.Add(corte);
        await db.SaveChangesAsync();

        return Ok(MapCorte(corte));
    }

    // GET /api/caja/cortes?aperturaId=1
    [HttpGet("cortes")]
    public async Task<ActionResult<CorteDto>> GetCorte([FromQuery] int aperturaId)
    {
        var corte = await db.Cortes
            .FirstOrDefaultAsync(c => c.AperturaId == aperturaId);

        if (corte is null) return NotFound();

        return Ok(MapCorte(corte));
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private static AperturaDto MapApertura(Apertura a) => new(
        a.Id, a.OpenedBy,
        a.OpenedAt, a.OpeningCash, a.TiendaOpeningCash, a.Status.ToString()
    );

    private static CorteDto MapCorte(Corte c) => new(
        c.Id, c.AperturaId, c.ClosedBy,
        c.ClosedAt, c.ClosingCash, 2, c.ExpectedCash, c.Difference,
        c.TiendaClosingCash, c.TiendaCardSales, c.TiendaExpectedCash, c.TiendaDifference
    );
}
