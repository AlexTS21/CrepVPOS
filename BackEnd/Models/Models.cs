using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace CafeCreperiaApi.Models;

// ─── Enums ────────────────────────────────────────────────────────────────────

public enum UserRole { admin, seller }
public enum Department { creperia, tienda }
public enum CajaStatus { open, closed }
public enum Category { bebidas_frias, bebidas_calientes, salados, dulces, extras }
public enum PaymentMethod { cash, card }
public enum OrderStatus { pending, delivered }
public enum ConsumeType { dine_in, takeout }

// ─── User ─────────────────────────────────────────────────────────────────────

public class User
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    public UserRole Role { get; set; }

    public Department Department { get; set; }

    // Navigation
    public ICollection<Apertura> Aperturas { get; set; } = [];
    public ICollection<Order> Orders { get; set; } = [];
}

// ─── Caja ─────────────────────────────────────────────────────────────────────

public class Apertura
{
    [Key]
    public int Id { get; set; }

    public int OpenedBy { get; set; }

    [ForeignKey(nameof(OpenedBy))]
    public User? OpenedByUser { get; set; }

    public DateTime OpenedAt { get; set; } = DateTime.UtcNow;

    [Column(TypeName = "decimal(10,2)")]
    public decimal OpeningCash { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal TiendaOpeningCash { get; set; }

    public CajaStatus Status { get; set; } = CajaStatus.open;

    public ICollection<Order> Orders { get; set; } = [];

    public Corte? Corte { get; set; }
}

public class Corte
{
    [Key]
    public int Id { get; set; }

    public int AperturaId { get; set; }

    [ForeignKey(nameof(AperturaId))]
    public Apertura? Apertura { get; set; }

    public int ClosedBy { get; set; }

    [ForeignKey(nameof(ClosedBy))]
    public User? ClosedByUser { get; set; }

    public DateTime ClosedAt { get; set; } = DateTime.UtcNow;

    // Crepería
    [Column(TypeName = "decimal(10,2)")]
    public decimal ClosingCash { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal CardSales { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal ExpectedCash { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Difference { get; set; }

    // Tienda
    [Column(TypeName = "decimal(10,2)")]
    public decimal TiendaClosingCash { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal TiendaCardSales { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal TiendaExpectedCash { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal TiendaDifference { get; set; }
}

// ─── Product ──────────────────────────────────────────────────────────────────

public class Product
{
    [Key]
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Column(TypeName = "decimal(10,2)")]
    public decimal Price { get; set; }

    public Category Category { get; set; }

    public Department Department { get; set; }

    public bool Available { get; set; } = true;

    public string? ImageUrl { get; set; }
}

// ─── Order ────────────────────────────────────────────────────────────────────

public class Order
{
    [Key]
    public int Id { get; set; }

    public int AperturaId { get; set; }

    [ForeignKey(nameof(AperturaId))]
    public Apertura? Apertura { get; set; }

    public Department Department { get; set; }

    [Required, MaxLength(100)]
    public string CustomerName { get; set; } = string.Empty;

    public ConsumeType ConsumeType { get; set; }

    [MaxLength(20)]
    public string? TableNumber { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Total { get; set; }

    public PaymentMethod PaymentMethod { get; set; }

    public OrderStatus Status { get; set; } = OrderStatus.pending;

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime? DeliveredAt { get; set; }

    public int CreatedBy { get; set; }

    [ForeignKey(nameof(CreatedBy))]
    public User? CreatedByUser { get; set; }

    // Navigation
    public ICollection<OrderItem> Items { get; set; } = [];
}

public class OrderItem
{
    [Key]
    public int Id { get; set; }

    public int OrderId { get; set; }

    [ForeignKey(nameof(OrderId))]
    public Order? Order { get; set; }

    public int ProductId { get; set; }

    [ForeignKey(nameof(ProductId))]
    public Product? Product { get; set; }

    [Required, MaxLength(100)]
    public string ProductName { get; set; } = string.Empty;

    public int Quantity { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal UnitPrice { get; set; }

    [Column(TypeName = "decimal(10,2)")]
    public decimal Subtotal { get; set; }
}
