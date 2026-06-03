using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeCreperiaApi.Data;
using CafeCreperiaApi.DTOs;
using CafeCreperiaApi.Models;

namespace CafeCreperiaApi.Controllers;

[ApiController]
[Route("api/products")]
[Authorize]
public class ProductsController(AppDbContext db) : ControllerBase
{
    // GET /api/products?department=creperia&category=dulces&search=nutella
    [HttpGet]
    public async Task<ActionResult<List<ProductDto>>> GetProducts(
        [FromQuery] string? category,
        [FromQuery] string? search)
    {
        var query = db.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category) && Enum.TryParse<Category>(category, out var cat))
            query = query.Where(p => p.Category == cat);

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(p => p.Name.ToLower().Contains(search.ToLower()));

        //Just Creperia 
        query = query.Where(p => p.Department == Department.creperia);

        var products = await query
            .OrderBy(p => p.Category)
            .ThenBy(p => p.Name)
            .ToListAsync();

        return Ok(products.Select(Map).ToList());
    }

    // GET /api/products/5
    [HttpGet("{id}")]
    public async Task<ActionResult<ProductDto>> GetProduct(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();
        return Ok(Map(product));
    }

    // POST /api/products
    [HttpPost]
    public async Task<ActionResult<ProductDto>> CreateProduct([FromBody] ProductRequest req)
    {
        if (!Enum.TryParse<Category>(req.Category, out var cat))
            return BadRequest("Categoría inválida");
        if (!Enum.TryParse<Department>(req.Department, out var dept))
            return BadRequest("Departamento inválido");

        var product = new Product
        {
            Name       = req.Name,
            Price      = req.Price,
            Category   = cat,
            Department = dept,
            Available  = req.Available
        };

        db.Products.Add(product);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, Map(product));
    }

    // PUT /api/products/5
    [HttpPut("{id}")]
    public async Task<ActionResult<ProductDto>> UpdateProduct(int id, [FromBody] ProductRequest req)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        if (!Enum.TryParse<Category>(req.Category, out var cat))
            return BadRequest("Categoría inválida");
        if (!Enum.TryParse<Department>(req.Department, out var dept))
            return BadRequest("Departamento inválido");

        product.Name       = req.Name;
        product.Price      = req.Price;
        product.Category   = cat;
        product.Department = dept;
        product.Available  = req.Available;

        await db.SaveChangesAsync();
        return Ok(Map(product));
    }

    // DELETE /api/products/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteProduct(int id)
    {
        var product = await db.Products.FindAsync(id);
        if (product is null) return NotFound();

        db.Products.Remove(product);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ProductDto Map(Product p) => new(
        p.Id, p.Name, p.Price,
        p.Category.ToString(), p.Department.ToString(),
        p.Available, p.ImageUrl
    );
}
