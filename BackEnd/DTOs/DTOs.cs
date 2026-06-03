using System.ComponentModel.DataAnnotations;
using CafeCreperiaApi.Models;

namespace CafeCreperiaApi.DTOs;

// ─── Auth ─────────────────────────────────────────────────────────────────────

public record LoginRequest(
    [Required] string Username,
    [Required] string Password
);

public record LoginResponse(UserDto User, string Token);

public record UserDto(
    int Id,
    string Username,
    string Role
);

// ─── Caja ─────────────────────────────────────────────────────────────────────

public record AperturaRequest(
    [Range(0, double.MaxValue)] decimal OpeningCash,
    [Range(0, double.MaxValue)] decimal TiendaOpeningCash
);

public record CorteRequest(
    int AperturaId,

    [Range(0, double.MaxValue)] decimal ClosingCash,
    [Range(0, double.MaxValue)] decimal TiendaClosingCash
);

public record AperturaDto(
    int Id,
    int OpenedBy,
    DateTime OpenedAt,
    decimal OpeningCash,
    decimal TiendaOpeningCash,
    string Status,
    decimal CashSales,
    decimal CardSales,
    decimal TiendaCashSales, 
    decimal TiendaCardSales
);

public record AperturaDtoReport(
    int Id,
    int OpenedBy,
    DateTime OpenedAt,
    decimal OpeningCash,
    decimal TiendaOpeningCash,
    string Status
);

public record CorteDto(
    int Id,
    int AperturaId,
    int ClosedBy,
    DateTime ClosedAt,
    decimal ClosingCash,
    decimal ExpectedCash,
    decimal CardSales,
    decimal Difference,

    decimal TiendaClosingCash,
    decimal TiendaExpectedCash,
    decimal TiendaCardSales,
    decimal TiendaDifference
);

// ─── Products ────────────────────────────────────────────────────────────────

public record ProductRequest(
    [Required, MaxLength(100)] string Name,
    [Range(0, double.MaxValue)] decimal Price,
    [Required] string Category,
    [Required] string Department,
    bool Available
);

public record ProductDto(
    int Id,
    string Name,
    decimal Price,
    string Category,
    string Department,
    bool Available,
    string? ImageUrl
);

// ─── Orders ──────────────────────────────────────────────────────────────────

public record OrderItemRequest(
    int ProductId,
    [Range(1, int.MaxValue)] int Quantity,
    decimal? CustomPrice,
    Department Department
);

public record OrderRequest(
    int AperturaId,
    [Required] string CustomerName,
    [Required] string ConsumeType,
    string? TableNumber,
    [Required] List<OrderItemRequest> Items,
    [Required] string PaymentMethod
);

public record OrderStatusRequest([Required] string Status);

public record OrderItemDto(
    int ProductId,
    string ProductName,
    string Department,
    int Quantity,
    decimal UnitPrice,
    decimal Subtotal
);

public record OrderDto(
    int Id,
    int AperturaId,
    string CustomerName,
    string ConsumeType,
    string? TableNumber,
    List<OrderItemDto> Items,
    decimal Total,
    string PaymentMethod,
    string Status,
    DateTime CreatedAt,
    DateTime? DeliveredAt,
    int CreatedBy
);

// ─── Reports ─────────────────────────────────────────────────────────────────

public record DayCycleReportDto(
    int Id,
    AperturaDtoReport Apertura,
    CorteDto Corte,
    List<OrderDto> Orders,
    int TotalOrders,
    decimal TotalCashSales,
    decimal TotalCardSales,
    decimal GrandTotal,
    decimal TiendaTotalCashSales,
    decimal TiendaTotalCardSales,
    decimal TiendaGrandTotal,
    decimal AllGrandTotal,
    string Date
);
