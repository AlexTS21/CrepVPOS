# Crepería POS — .NET 8 Backend

API REST para el sistema de punto de venta. Usa **SQLite** (fácil de cambiar a SQL Server o PostgreSQL).

## Requisitos

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8)

## Levantar el proyecto

```bash
# 1. Restaurar paquetes
dotnet restore

# 2. Generar la migración inicial (solo la primera vez)
dotnet ef migrations add InitialCreate

# 3. Aplicar migraciones (crea creperia.db con tablas y seed)
dotnet ef database update

# 4. Correr
dotnet run
```

La API queda disponible en:
- HTTP : `http://localhost:5000`
- HTTPS: `https://localhost:7001`
- Swagger: `https://localhost:7001/swagger`

## Usuarios por defecto (seed)

| Usuario | Contraseña  | Rol    |
|---------|-------------|--------|
| admin   | admin123    | admin  |
| seller  | seller123   | seller |

## Cambiar a SQL Server

En `appsettings.json`:
```json
"ConnectionStrings": {
  "Default": "Server=.;Database=CafeCreperiaDb;Trusted_Connection=True;"
}
```

En `CafeCreperiaApi.csproj`, reemplazar:
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.Sqlite" Version="8.0.0" />
```
por:
```xml
<PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
```

En `Program.cs`:
```csharp
options.UseSqlServer(builder.Configuration.GetConnectionString("Default"))
```

Luego regenerar migraciones:
```bash
dotnet ef migrations add InitialCreate
dotnet ef database update
```

## Endpoints resumen

| Método | Ruta                              | Auth      | Descripción                        |
|--------|-----------------------------------|-----------|------------------------------------|
| POST   | /api/auth/login                   | —         | Login, retorna JWT                 |
| POST   | /api/auth/logout                  | Bearer    | Logout                             |
| GET    | /api/auth/me                      | Bearer    | Usuario actual                     |
| GET    | /api/caja/apertura/active         | Bearer    | Apertura activa por departamento   |
| POST   | /api/caja/apertura                | Bearer    | Abrir caja                         |
| POST   | /api/caja/corte                   | Bearer    | Cerrar caja (calcula diferencia)   |
| GET    | /api/caja/cortes                  | Bearer    | Corte por aperturaId               |
| GET    | /api/products                     | Bearer    | Lista productos (filtros opcionales)|
| GET    | /api/products/:id                 | Bearer    | Producto por id                    |
| POST   | /api/products                     | Bearer    | Crear producto                     |
| PUT    | /api/products/:id                 | Bearer    | Actualizar producto                |
| DELETE | /api/products/:id                 | Bearer    | Eliminar producto                  |
| GET    | /api/orders                       | Bearer    | Órdenes por aperturaId             |
| GET    | /api/orders/:id                   | Bearer    | Orden por id                       |
| POST   | /api/orders                       | Bearer    | Crear orden                        |
| PUT    | /api/orders/:id/status            | Bearer    | Cambiar estado (pending/delivered) |
| GET    | /api/reports/cycles               | Admin     | Ciclos completos                   |
| GET    | /api/reports/cycles/:id           | Admin     | Ciclo por id                       |

## Reglas de negocio implementadas

- Solo puede existir **una apertura activa** por departamento (índice único en BD).
- **No se puede crear una orden** sin apertura activa en ese departamento.
- El corte **calcula automáticamente** `expectedCash` y `difference`.
- El precio de **Tienda** es libre: se acepta `customPrice` en el item de la orden.
- Los reportes son **solo para admin** (`[Authorize(Roles = "admin")]`).
