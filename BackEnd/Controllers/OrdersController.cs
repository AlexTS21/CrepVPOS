using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeCreperiaApi.Data;
using CafeCreperiaApi.DTOs;
using CafeCreperiaApi.Models;

namespace CafeCreperiaApi.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController(AppDbContext db) : ControllerBase
{
    private int CurrentUserId => int.Parse(
        User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
        ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
        ?? "0");

    // GET /api/orders?aperturaId=1
    [HttpGet]
    public async Task<ActionResult<List<OrderDto>>> GetOrders([FromQuery] int aperturaId)
    {
        var orders = await db.Orders
            .Include(o => o.Items)
            .Where(o => o.AperturaId == aperturaId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(Map).ToList());
    }

    // GET /api/orders/5
    [HttpGet("{id}")]
    public async Task<ActionResult<OrderDto>> GetOrder(int id)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();
        return Ok(Map(order));
    }

    // POST /api/orders
    [HttpPost]
    public async Task<ActionResult<OrderDto>> CreateOrder([FromBody] OrderRequest req)
    {
        // Validar que existe apertura activa para ese departamento
        if (!Enum.TryParse<ConsumeType>(req.ConsumeType, out var consumeType))
            return BadRequest("Tipo de consumo inválido");
        if (!Enum.TryParse<PaymentMethod>(req.PaymentMethod, out var paymentMethod))
            return BadRequest("Método de pago inválido");

        var apertura = await db.Aperturas
            .FirstOrDefaultAsync(a => a.Id == req.AperturaId && a.Status == CajaStatus.open);

        if (apertura is null)
            return BadRequest(new { message = "No hay caja abierta para este departamento" });

        // Construir los items resolviendo precios desde la BD
        var productIds = req.Items.Select(i => i.ProductId).ToList();
        var products   = await db.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var items = new List<OrderItem>();
        decimal total = 0;

        foreach (var itemReq in req.Items)
        {
            products.TryGetValue(itemReq.ProductId, out var product);

            // Para tienda el precio es libre (customPrice), para crepería se usa el de BD
            var unitPrice = itemReq.CustomPrice.HasValue && itemReq.CustomPrice > 0
                ? itemReq.CustomPrice.Value
                : (product?.Price ?? 0);

            var subtotal = unitPrice * itemReq.Quantity;
            total += subtotal;

            items.Add(new OrderItem
            {
                ProductId   = itemReq.ProductId,
                ProductName = product?.Name ?? "Producto",
                Quantity    = itemReq.Quantity,
                UnitPrice   = unitPrice,
                Subtotal    = subtotal
            });
        }

        var order = new Order
        {
            AperturaId    = req.AperturaId,
            CustomerName  = req.CustomerName,
            ConsumeType   = consumeType,
            TableNumber   = consumeType == ConsumeType.dine_in ? req.TableNumber : null,
            Total         = total,
            PaymentMethod = paymentMethod,
            Status        = OrderStatus.pending,
            CreatedAt     = DateTime.UtcNow,
            CreatedBy     = CurrentUserId,
            Items         = items
        };

        db.Orders.Add(order);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, Map(order));
    }

    // PUT /api/orders/5/status
    [HttpPut("{id}/status")]
    public async Task<ActionResult<OrderDto>> UpdateStatus(int id, [FromBody] OrderStatusRequest req)
    {
        var order = await db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound();

        if (!Enum.TryParse<OrderStatus>(req.Status, out var status))
            return BadRequest("Estado inválido");

        order.Status = status;
        if (status == OrderStatus.delivered)
            order.DeliveredAt = DateTime.UtcNow;

        await db.SaveChangesAsync();
        return Ok(Map(order));
    }

    private static OrderDto Map(Order o) => new(
        o.Id,
        o.AperturaId,
        o.CustomerName,
        o.ConsumeType.ToString(),
        o.TableNumber,
        o.Items.Select(i => new OrderItemDto(
            i.ProductId,  i.ProductName, i.Department.ToString(), i.Quantity, i.UnitPrice, i.Subtotal
        )).ToList(),
        o.Total,
        o.PaymentMethod.ToString(),
        o.Status.ToString(),
        o.CreatedAt,
        o.DeliveredAt,
        o.CreatedBy
    );
}
