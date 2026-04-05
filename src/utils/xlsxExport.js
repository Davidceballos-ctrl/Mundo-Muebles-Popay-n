/**
 * xlsxExport.js — Exportación a Excel
 * Mundo Muebles Popayán · v8.1.2
 *
 * Usa write-excel-file: librería 100% browser-native, sin dependencias Node.js,
 * sin vulnerabilidades conocidas, bundle de solo ~35KB vs ~380KB de exceljs.
 *
 * Docs: https://gitlab.com/catamphetamine/write-excel-file
 */
import writeXlsxFile from "write-excel-file";

const fecha = () => new Date().toLocaleDateString("es-CO").replace(/\//g, "-");

// ── Estilos reutilizables ─────────────────────────────────────────────────────
const HDR = {
  backgroundColor: "#1A3DC8",
  color:           "#FFFFFF",
  fontWeight:      "bold",
  fontSize:        11,
  align:           "center",
  borderColor:     "#C7D3F8",
};
const CELL_EVEN = { backgroundColor: "#F9FAFB", fontSize: 10, borderColor: "#E5E7EB" };
const CELL_ODD  = { backgroundColor: "#FFFFFF",  fontSize: 10, borderColor: "#E5E7EB" };
const TOTAL = {
  backgroundColor: "#0D2D8E",
  color:           "#FFFFFF",
  fontWeight:      "bold",
  fontSize:        11,
};

const cell = (value, idx, type, extra = {}) => ({
  value,
  type:  type || (typeof value === "number" ? Number : String),
  ...(idx % 2 === 0 ? CELL_EVEN : CELL_ODD),
  ...extra,
});

const cop = (value, idx) => ({
  value,
  type:   Number,
  format: '#,##0',
  ...(idx % 2 === 0 ? CELL_EVEN : CELL_ODD),
});

// ── Inventario ────────────────────────────────────────────────────────────────
export async function exportInventory(products) {
  const COLUMNS = [
    { width: 20 }, { width: 28 }, { width: 14 }, { width: 22 },
    { width: 16 }, { width: 10 }, { width: 18 }, { width: 12 },
  ];

  const HEADER = [
    { value: "Categoría",       ...HDR },
    { value: "Producto",        ...HDR },
    { value: "Medida",          ...HDR },
    { value: "Colores",         ...HDR },
    { value: "Precio (COP)",    ...HDR },
    { value: "Stock",           ...HDR },
    { value: "Valor Total COP", ...HDR },
    { value: "Estado",          ...HDR },
  ];

  const rows = [HEADER];
  let i = 0;
  products.forEach(p =>
    p.variantes.forEach(v => {
      rows.push([
        cell(p.categoria,  i),
        cell(p.nombre,     i),
        cell(v.medida,     i),
        cell((v.colores||[]).join(", ") || "N/A", i),
        cop(v.precio,      i),
        cop(v.stock,       i),
        cop(v.precio * v.stock, i),
        cell(p.activo ? "Activo" : "Inactivo", i),
      ]);
      i++;
    })
  );

  // Fila de totales
  const totalStock = products.reduce((s,p)=>s+p.variantes.reduce((a,v)=>a+v.stock,0),0);
  const totalValor = products.reduce((s,p)=>s+p.variantes.reduce((a,v)=>a+v.precio*v.stock,0),0);
  rows.push([
    { value: "TOTAL", ...TOTAL },
    { value: "",      ...TOTAL }, { value: "", ...TOTAL }, { value: "", ...TOTAL }, { value: "", ...TOTAL },
    { value: totalStock, type: Number, format: "#,##0", ...TOTAL },
    { value: totalValor, type: Number, format: "#,##0", ...TOTAL },
    { value: "",      ...TOTAL },
  ]);

  await writeXlsxFile(rows, {
    columns:  COLUMNS,
    fileName: `inventario_${fecha()}.xlsx`,
    sheet:    "Inventario",
  });
}

// ── Ventas ────────────────────────────────────────────────────────────────────
export async function exportSales(sales) {
  const COLUMNS = [
    {width:14},{width:24},{width:36},{width:15},{width:14},{width:16},{width:18},{width:20}
  ];

  const HEADER = [
    { value:"Fecha",       ...HDR },
    { value:"Cliente",     ...HDR },
    { value:"Productos",   ...HDR },
    { value:"Subtotal",    ...HDR },
    { value:"Descuento",   ...HDR },
    { value:"Total (COP)", ...HDR },
    { value:"Método Pago", ...HDR },
    { value:"Vendedor",    ...HDR },
  ];

  const rows = [HEADER];
  sales.forEach((s,i) => {
    rows.push([
      cell(s.fecha,    i),
      cell(s.cliente,  i),
      cell((s.items||[]).map(x=>`${x.nombre} x${x.cant}`).join(" | "), i),
      cop(s.subtotal,  i),
      cop(s.descuento||0, i),
      cop(s.total,     i),
      cell((s.pagos||[]).map(p=>p.metodo).join(", "), i),
      cell(s.vendedor||"", i),
    ]);
  });

  const totalVentas = sales.reduce((s,v)=>s+(v.total||0),0);
  rows.push([
    { value:"TOTAL", ...TOTAL },
    { value:"", ...TOTAL },{ value:"", ...TOTAL },{ value:"", ...TOTAL },{ value:"", ...TOTAL },
    { value:totalVentas, type:Number, format:"#,##0", ...TOTAL },
    { value:"", ...TOTAL },{ value:"", ...TOTAL },
  ]);

  await writeXlsxFile(rows, {
    columns:  COLUMNS,
    fileName: `ventas_${fecha()}.xlsx`,
    sheet:    "Ventas",
  });
}

// ── Clientes ──────────────────────────────────────────────────────────────────
export async function exportClients(clients) {
  const COLUMNS = [{width:26},{width:16},{width:16},{width:28},{width:18},{width:32}];

  const HEADER = [
    { value:"Nombre",    ...HDR },
    { value:"Cédula",    ...HDR },
    { value:"Teléfono",  ...HDR },
    { value:"Email",     ...HDR },
    { value:"Ciudad",    ...HDR },
    { value:"Dirección", ...HDR },
  ];

  const rows = [HEADER, ...clients.map((cl,i) => [
    cell(cl.nombre||"",    i),
    cell(cl.cedula||"",    i),
    cell(cl.telefono||"",  i),
    cell(cl.email||"",     i),
    cell(cl.ciudad||"",    i),
    cell(cl.direccion||"", i),
  ])];

  await writeXlsxFile(rows, {
    columns:  COLUMNS,
    fileName: `clientes_${fecha()}.xlsx`,
    sheet:    "Clientes",
  });
}

// ── Compras ───────────────────────────────────────────────────────────────────
export async function exportPurchases(purchases) {
  const COLUMNS = [{width:14},{width:24},{width:36},{width:16},{width:14}];

  const HEADER = [
    { value:"Fecha",      ...HDR },
    { value:"Proveedor",  ...HDR },
    { value:"Productos",  ...HDR },
    { value:"Total COP",  ...HDR },
    { value:"Estado",     ...HDR },
  ];

  const rows = [HEADER, ...purchases.map((p,i) => [
    cell(p.fecha,     i),
    cell(p.proveedor, i),
    cell((p.items||[]).map(x=>`${x.nombre} x${x.cant}`).join(" | "), i),
    cop(p.total,      i),
    cell(p.estado||"Completada", i),
  ])];

  await writeXlsxFile(rows, {
    columns:  COLUMNS,
    fileName: `compras_${fecha()}.xlsx`,
    sheet:    "Compras",
  });
}
