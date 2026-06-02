using Microsoft.EntityFrameworkCore;
using CafeCreperiaApi.Models;

namespace CafeCreperiaApi.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Apertura> Aperturas => Set<Apertura>();
    public DbSet<Corte> Cortes => Set<Corte>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        base.OnModelCreating(mb);

        // Enums stored as strings for readability
        mb.Entity<User>().Property(u => u.Role).HasConversion<string>();
        mb.Entity<User>().Property(u => u.Department).HasConversion<string>();
        mb.Entity<Apertura>().Property(a => a.Status).HasConversion<string>();
        mb.Entity<Product>().Property(p => p.Category).HasConversion<string>();
        mb.Entity<Product>().Property(p => p.Department).HasConversion<string>();
        mb.Entity<Order>().Property(o => o.Department).HasConversion<string>();
        mb.Entity<Order>().Property(o => o.ConsumeType).HasConversion<string>();
        mb.Entity<Order>().Property(o => o.PaymentMethod).HasConversion<string>();
        mb.Entity<Order>().Property(o => o.Status).HasConversion<string>();

        mb.Entity<Corte>()
        .HasOne(c => c.ClosedByUser)
        .WithMany()
        .HasForeignKey(c => c.ClosedBy)
        .OnDelete(DeleteBehavior.NoAction);

        mb.Entity<Apertura>()
            .HasOne(a => a.OpenedByUser)
            .WithMany(u => u.Aperturas)
            .HasForeignKey(a => a.OpenedBy)
            .OnDelete(DeleteBehavior.NoAction);

        mb.Entity<Order>()
            .HasOne(o => o.CreatedByUser)
            .WithMany(u => u.Orders)
            .HasForeignKey(o => o.CreatedBy)
            .OnDelete(DeleteBehavior.NoAction);

        mb.Entity<Order>()
            .HasOne(o => o.Apertura)
            .WithMany(a => a.Orders)
            .HasForeignKey(o => o.AperturaId)
            .OnDelete(DeleteBehavior.NoAction);

        mb.Entity<Corte>()
            .HasOne(c => c.Apertura)
            .WithOne(a => a.Corte)
            .HasForeignKey<Corte>(c => c.AperturaId)
            .OnDelete(DeleteBehavior.NoAction);

        mb.Entity<OrderItem>()
            .HasOne(i => i.Order)
            .WithMany(o => o.Items)
            .HasForeignKey(i => i.OrderId)
            .OnDelete(DeleteBehavior.Cascade);

        // Unique: only one active apertura per department
        mb.Entity<Apertura>()
            .HasIndex(a => new { a.Status })
            .HasFilter("[Status] = 'open'")
            .IsUnique();

        // ── Seed data ──────────────────────────────────────────────────────
        mb.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Username = "admin",
                // Password: admin123
                PasswordHash = "$2a$11$Jvy3l91RFVq5528881is0upgH6fhMVb4Q4Ogq1Jx8U9Y51RkLiaq2",
                Role = UserRole.admin,
                Department = Department.creperia
            },
            new User
            {
                Id = 2,
                Username = "seller",
                // Password: seller123
                PasswordHash = "$2a$11$Ty4.UhT3RQJW1i.pOGFmCORnOTCi4allN94lww/DjmsO3p45ATKTa",
                Role = UserRole.seller,
                Department = Department.creperia
            }
        );

        mb.Entity<Product>().HasData(
            // Crepería — Dulces
            new Product { Id = 1, Name = "Crepa Nutella", Price = 75, Category = Category.dulces, Department = Department.creperia, Available = true },
            new Product { Id = 2, Name = "Crepa Cajeta", Price = 70, Category = Category.dulces, Department = Department.creperia, Available = true },
            new Product { Id = 3, Name = "Crepa Fresa", Price = 70, Category = Category.dulces, Department = Department.creperia, Available = true },
            new Product { Id = 4, Name = "Crepa Mango", Price = 70, Category = Category.dulces, Department = Department.creperia, Available = true },
            new Product { Id = 5, Name = "Crepa Mixta", Price = 85, Category = Category.dulces, Department = Department.creperia, Available = true },
            // Crepería — Salados
            new Product { Id = 6, Name = "Crepa Jamón y Queso", Price = 80, Category = Category.salados, Department = Department.creperia, Available = true },
            new Product { Id = 7, Name = "Crepa Pollo", Price = 90, Category = Category.salados, Department = Department.creperia, Available = true },
            new Product { Id = 8, Name = "Crepa Espinaca", Price = 85, Category = Category.salados, Department = Department.creperia, Available = true },
            // Crepería — Bebidas frías
            new Product { Id = 9, Name = "Limonada", Price = 40, Category = Category.bebidas_frias, Department = Department.creperia, Available = true },
            new Product { Id = 10, Name = "Agua Fresca", Price = 35, Category = Category.bebidas_frias, Department = Department.creperia, Available = true },
            new Product { Id = 11, Name = "Malteada", Price = 65, Category = Category.bebidas_frias, Department = Department.creperia, Available = true },
            // Crepería — Bebidas calientes
            new Product { Id = 12, Name = "Café Americano", Price = 35, Category = Category.bebidas_calientes, Department = Department.creperia, Available = true },
            new Product { Id = 13, Name = "Cappuccino", Price = 50, Category = Category.bebidas_calientes, Department = Department.creperia, Available = true },
            new Product { Id = 14, Name = "Chocolate Caliente", Price = 45, Category = Category.bebidas_calientes, Department = Department.creperia, Available = true },
            // Crepería — Extras
            new Product { Id = 15, Name = "Extra Nutella", Price = 15, Category = Category.extras, Department = Department.creperia, Available = true },
            new Product { Id = 16, Name = "Extra Fruta", Price = 20, Category = Category.extras, Department = Department.creperia, Available = true },
            // Tienda — precio variable, lo establece el vendedor en cada venta
            new Product { Id = 17, Name = "Tienda", Price = 0, Category = Category.extras, Department = Department.tienda, Available = true }
        );
    }
}
