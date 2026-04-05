/**
 * contabilidad.js — Exportación contable para Siigo, World Office y similares
 * Genera CSV en formato compatible con los principales softwares contables colombianos
 * Mundo Muebles Popayán · v8.0
 */

const fmtCOP = n => (n||0).toFixed(2);
const today  = () => new Date().toISOString().slice(0,10);

// ─── Descarga de archivo ──────────────────────────────────────────────────────
function downloadCSV(content, filename) {
  const BOM = "\uFEFF"; // BOM UTF-8 para compatibilidad con Excel
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadTXT(content, filename) {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ─── SIIGO — Formato de importación de comprobantes ─────────────────────────
// Siigo usa TXT delimitado por | en formato de diario
export function exportarSiigo(sales, empresa = {}) {
  if (!sales?.length) return false;

  const NIT  = (empresa.nit||"4616882-9").replace(/-/g,"");
  const NOMBRE = empresa.nombre || "MUNDO MUEBLES POPAYAN";

  // Encabezado del archivo Siigo TXT
  let lines = [];

  // Fila de cabecera de empresa
  lines.push(`EMPRESA|${NIT}|${NOMBRE}`);
  lines.push(`GENERADO|${today()}`);
  lines.push("---");

  // Tipo de comprobante: VT = Venta al contado
  sales.forEach(sale => {
    const docNum = (sale.id||"").slice(0,8).toUpperCase();
    const fecha  = (sale.fecha||today()).replace(/-/g,"");

    // Encabezado del comprobante
    lines.push(`CO|VT|${docNum}|${fecha}|${sale.cliente||"CONSUMIDOR FINAL"}|${(sale.cedula||"222222222")}|${fmtCOP(sale.total)}`);

    // Movimiento débito — cuenta de caja/banco 11
    lines.push(`MO|D|1105|${fmtCOP(sale.total)}|Venta contado #${docNum}|${sale.vendedor||""}`);

    // Movimiento crédito — cuenta de ingresos 41
    lines.push(`MO|C|4135|${fmtCOP(sale.subtotal)}|Ingresos venta #${docNum}|${sale.vendedor||""}`);

    // Descuento si existe — cuenta 53
    if (sale.descuento > 0) {
      lines.push(`MO|D|5305|${fmtCOP(sale.descuento)}|Descuento venta #${docNum}|`);
      lines.push(`MO|C|4135|${fmtCOP(sale.descuento)}|Descuento venta #${docNum}|`);
    }

    // IVA si existe — cuenta 2408
    if (sale.impuesto > 0) {
      lines.push(`MO|C|2408|${fmtCOP(sale.impuesto)}|IVA venta #${docNum}|`);
    }

    lines.push(""); // línea en blanco entre comprobantes
  });

  const content = lines.join("\r\n");
  downloadTXT(content, `Siigo_Ventas_${today()}.txt`);
  return true;
}

// ─── WORLD OFFICE — Formato CSV de interfaz de ventas ────────────────────────
// World Office acepta CSV con estructura de movimientos contables
export function exportarWorldOffice(sales, empresa = {}) {
  if (!sales?.length) return false;

  const rows = [];

  // Encabezado columnas World Office
  rows.push([
    "Tipo","Numero","Fecha","Cuenta_Debe","Cuenta_Haber",
    "Tercero","Documento","Concepto","Valor","Centro_Costo",
    "Vendedor","Bodega"
  ].join(";"));

  sales.forEach(sale => {
    const docNum = (sale.id||"").slice(0,8).toUpperCase();
    const fecha  = sale.fecha || today();

    // Línea de venta
    rows.push([
      "VT",
      docNum,
      fecha,
      "11050501",   // Caja general
      "41350101",   // Ingresos por ventas
      (sale.cedula||"222222222"),
      sale.cliente||"CONSUMIDOR FINAL",
      `Venta al contado #${docNum}`,
      fmtCOP(sale.total),
      "001",
      sale.vendedor||"",
      "001",
    ].map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(";"));

    // Línea de descuento
    if (sale.descuento > 0) {
      rows.push([
        "VT",docNum,fecha,"53050101","41350101",
        (sale.cedula||"222222222"),
        `Descuento #${docNum}`,
        `Descuento en venta #${docNum}`,
        fmtCOP(sale.descuento),
        "001",sale.vendedor||"","001",
      ].map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(";"));
    }
  });

  downloadCSV(rows.join("\r\n"), `WorldOffice_Ventas_${today()}.csv`);
  return true;
}

// ─── CSV GENÉRICO de movimientos ──────────────────────────────────────────────
// Compatible con cualquier software que acepte CSV estándar (Alegra, Helisa, etc.)
export function exportarCSVContable(sales, compras = [], empresa = {}) {
  if (!sales?.length && !compras?.length) return false;

  const rows = [];

  rows.push([
    "Fecha","Tipo","Numero_Doc","Cuenta","Descripcion",
    "Debe","Haber","Cliente_Proveedor","Vendedor","Notas"
  ].join(","));

  // Ventas
  sales.forEach(sale => {
    const docNum = (sale.id||"").slice(0,8).toUpperCase();
    const fecha  = sale.fecha || today();
    const desc   = `Venta #${docNum} - ${sale.cliente||"CF"}`;

    rows.push([fecha,"VENTA",docNum,"1105",desc,fmtCOP(sale.total),"",sale.cliente||"CF",sale.vendedor||"",""].join(","));
    rows.push([fecha,"VENTA",docNum,"4135",desc,"",fmtCOP(sale.subtotal),sale.cliente||"CF",sale.vendedor||"",""].join(","));
    if (sale.descuento > 0)
      rows.push([fecha,"VENTA",docNum,"5305",`Descuento #${docNum}`,fmtCOP(sale.descuento),"",sale.cliente||"CF",sale.vendedor||"",""].join(","));
    if (sale.impuesto > 0)
      rows.push([fecha,"VENTA",docNum,"2408",`IVA #${docNum}`,"",fmtCOP(sale.impuesto),sale.cliente||"CF",sale.vendedor||"",""].join(","));
  });

  // Compras
  compras.forEach(compra => {
    const docNum = (compra.id||"").slice(0,8).toUpperCase();
    const fecha  = compra.fecha || today();
    const desc   = `Compra #${docNum} - ${compra.proveedor||""}`;

    rows.push([fecha,"COMPRA",docNum,"6205",desc,fmtCOP(compra.total),"",compra.proveedor||"","",""].join(","));
    rows.push([fecha,"COMPRA",docNum,"2205",desc,"",fmtCOP(compra.total),compra.proveedor||"","",""].join(","));
  });

  downloadCSV(rows.join("\r\n"), `Movimientos_Contables_${today()}.csv`);
  return true;
}

// ─── Resumen de ventas para DIAN ─────────────────────────────────────────────
// Genera el JSON de resumen de operaciones que algunos proveedores de FE solicitan
export function exportarResumenDIAN(sales, empresa = {}) {
  if (!sales?.length) return false;

  const resumen = {
    empresa: {
      nit:      empresa.nit || "4616882-9",
      nombre:   empresa.nombre || "MUNDO MUEBLES POPAYAN",
      direccion:empresa.direccion || "",
      telefono: empresa.telefono || "",
    },
    periodo:     today(),
    totalVentas: sales.reduce((a,s) => a + s.total, 0),
    totalIVA:    sales.reduce((a,s) => a + (s.impuesto||0), 0),
    numFacturas: sales.length,
    facturas: sales.map(s => ({
      numero:   (s.id||"").slice(0,8).toUpperCase(),
      fecha:    s.fecha,
      cliente:  s.cliente||"Consumidor Final",
      cedula:   s.cedula||"222222222",
      subtotal: s.subtotal,
      descuento:s.descuento||0,
      iva:      s.impuesto||0,
      total:    s.total,
    })),
  };

  const blob = new Blob([JSON.stringify(resumen, null, 2)], { type:"application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = `Resumen_DIAN_${today()}.json`; a.click();
  URL.revokeObjectURL(url);
  return true;
}
