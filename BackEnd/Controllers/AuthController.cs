using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using CafeCreperiaApi.Data;
using CafeCreperiaApi.DTOs;
using CafeCreperiaApi.Services;

namespace CafeCreperiaApi.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, ITokenService tokenService) : ControllerBase
{
    // POST /api/auth/login
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest req)
    {
        var user = await db.Users
            .FirstOrDefaultAsync(u => u.Username == req.Username);

        if (user is null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { message = "Credenciales incorrectas" });

        var token = tokenService.GenerateToken(user);
        var dto = new UserDto(user.Id, user.Username, user.Role.ToString());

        return Ok(new LoginResponse(dto, token));
    }

    // POST /api/auth/logout  (el cliente simplemente descarta el token)
    [HttpPost("logout")]
    [Authorize]
    public IActionResult Logout() => Ok();

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<ActionResult<UserDto>> Me()
    {
        var userId = int.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
                     ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value
                     ?? "0");

        var user = await db.Users.FindAsync(userId);
        if (user is null) return NotFound();

        return Ok(new UserDto(user.Id, user.Username, user.Role.ToString()));
    }
}
