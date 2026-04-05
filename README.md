# 🪑 Mundo Muebles — Sistema POS v4.0

**Moda en el Hogar · Popayán, Cauca**

## Instalación y uso

```bash
npm install
npm run dev
```

## Cuentas de acceso (demo)

| Correo                         | Contraseña  | Rol           |
|--------------------------------|-------------|---------------|
| admin@mundomuebles.com         | admin123    | Administrador |
| ventas@mundomuebles.com        | ventas123   | Vendedor      |
| bodega@mundomuebles.com        | bodega123   | Bodeguero     |

## Permisos por rol

| Función                          | Admin | Vendedor | Bodeguero |
|----------------------------------|-------|----------|-----------|
| Dashboard                        | ✅    | ✅       | ✅        |
| Punto de Venta (POS)             | ✅    | ✅       | ❌        |
| Historial de Ventas              | ✅    | ✅       | ❌        |
| Lista de Productos               | ✅    | ✅       | ✅        |
| Registrar / Editar Productos     | ✅    | ❌       | ✅        |
| Eliminar Productos               | ✅    | ❌       | ❌        |
| Kardex / Ajuste de Stock         | ✅    | ❌       | ✅        |
| Proveedores                      | ✅    | ❌       | ✅        |
| Compras (editar / eliminar)      | ✅    | ❌       | ✅        |
| Clientes                         | ✅    | ✅       | ❌        |
| Reportes con rango de fechas     | ✅    | ❌       | ❌        |
| Usuarios                         | ✅    | ❌       | ❌        |
| Exportar / Respaldo              | ✅    | ❌       | ❌        |

## Mejoras incluidas en v4.0

1. **Paleta azul** — identidad de marca Mundo Muebles aplicada en toda la interfaz
2. **Roles funcionales** — Administrador, Vendedor y Bodeguero con rutas y acciones protegidas
3. **Sin Google OAuth** — autenticación 100% local basada en usuarios del sistema
4. **Dinero recibido y cambio** — calculado automáticamente en el POS y aparece en la factura PDF
5. **Cédula del cliente en factura** — el número de documento viaja al PDF para garantías
6. **Historial de Ventas** (`/ventas`) — búsqueda por cliente, fecha y producto + reimpresión de recibo
7. **Compras editables** — editar y eliminar compras con reversión automática de stock y kardex
8. **Reportes con rango de fechas** — filtros por período (Hoy, 7d, 30d, 3m, rango personalizado)
9. **Respaldo completo** — exporta/importa todo el sistema a JSON desde Exportar
10. **Archivos duplicados eliminados** — estructura limpia sin Login.jsx, OtherPages.jsx, Products.jsx

## Respaldo de datos

⚠️ Los datos se guardan en `localStorage`. Para no perderlos:
- Ve a **Exportar > Respaldo completo** y descarga el `.json` regularmente
- Al cambiar de equipo, restaura con el mismo botón

## Próximos pasos sugeridos

- Migrar a base de datos (Supabase, Firebase, o API propia)
- Módulo de garantías vinculado a ventas
- Notificaciones de stock bajo por WhatsApp
