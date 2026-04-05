/**
 * pdf.js — Recibo térmico 58mm · Mundo Muebles Popayán
 * ─────────────────────────────────────────────────────
 * Datos reales: NIT 4616882-9 | Tel 316 7145208
 * Incluye: logo textual MM, cambio, metodoCambio, garantía
 * Estabilidad: manejo de errores, sin crash si jsPDF falla
 */
import { jsPDF } from "jspdf";

const W = 55; // ancho de impresión 55mm

// ── Helpers de dibujo ──────────────────────────────────────────────────────
const fmtCOP = n =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);

function safeText(v) {
  // Reemplaza caracteres especiales que jsPDF no renderiza bien
  return String(v || "")
    .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n")
    .replace(/Á/g, "A").replace(/É/g, "E").replace(/Í/g, "I")
    .replace(/Ó/g, "O").replace(/Ú/g, "U").replace(/Ñ/g, "N")
    .replace(/[^\x00-\x7F]/g, "");
}

function line(doc, y, char = "-") {
  doc.setFontSize(7); doc.setFont("Courier", "normal");
  doc.text(char.repeat(40), 2, y);
  return y + 4;
}
function solid(doc, y) { return line(doc, y, "="); }

function center(doc, text, y, size = 8, bold = false) {
  doc.setFontSize(size);
  doc.setFont("Courier", bold ? "bold" : "normal");
  const safe = safeText(text);
  const tw = (doc.getStringUnitWidth(safe) * size) / (72 / 25.4);
  doc.text(safe, Math.max(2, (W - tw) / 2), y);
  return y + size * 0.42 + 2.5;
}

function row(doc, label, value, y, bold = false) {
  doc.setFontSize(7.5);
  doc.setFont("Courier", bold ? "bold" : "normal");
  const sl = safeText(label);
  const sv = safeText(value);
  doc.text(sl, 2, y);
  const vw = (doc.getStringUnitWidth(sv) * 7.5) / (72 / 25.4);
  doc.text(sv, Math.max(2, W - vw - 1), y);
  return y + 4.5;
}

function txt(doc, text, y, size = 7.5, bold = false) {
  doc.setFontSize(size);
  doc.setFont("Courier", bold ? "bold" : "normal");
  const safe = safeText(text);
  const lines = doc.splitTextToSize(safe, W - 4);
  doc.text(lines, 2, y);
  return y + lines.length * (size * 0.42 + 1.8);
}

// ── Función principal ──────────────────────────────────────────────────────
export function printFactura(sale, empresa = {}) {
  const E = {
    nombre: empresa.nombre || "MUNDO MUEBLES POPAYAN",
    subtit: empresa.subtit || "MODA EN EL HOGAR",
    nit: empresa.nit || "4616882-9",
    tel: empresa.telefono || "316 7145208",
    email: empresa.email || "mundomueblespopayan1@gmail.com",
    dir: empresa.direccion || "Cra 4 # 13-08, Popayan, Cauca",
  };

  const items = sale.items || [];
  const pagos = sale.pagos || [];
  const cambio = sale.cambio || 0;
  const entregado = sale.entregado || sale.total;
  const metodoCambio = sale.metodoCambio || "";

  // Altura dinámica para que no se corte
  const extraLines = (sale.cedula ? 1 : 0) + (sale.telefono ? 1 : 0) + (sale.direccion ? 1 : 0);
  const pageH = Math.max(200,
    62 +                          // header empresa
    4 * (extraLines + 2) +        // cliente
    items.length * 22 +           // productos
    pagos.length * 5 +            // pagos
    (cambio > 0 ? 14 : 0) +       // caja cambio
    100                           // garantia + nota DIAN + footer
  );

  let doc;
  try {
    doc = new jsPDF({ unit: "mm", format: [W + 3, pageH] });
  } catch (e) {
    throw new Error("No se pudo inicializar el generador de PDF: " + e.message);
  }

  doc.setFont("Courier", "normal");
  let y = 6;

  // ── Logo textual MM ──
  doc.setFontSize(18); doc.setFont("Courier", "bold");
  const logoTxt = "MM";
  const lw = (doc.getStringUnitWidth(logoTxt) * 18) / (72 / 25.4);
  doc.text(logoTxt, Math.max(2, (W - lw) / 2), y);
  y += 10;

  // Línea decorativa bajo MM
  doc.setFillColor(26, 61, 200);
  doc.rect((W - 14) / 2, y - 3.5, 14, 1.2, "F");
  y += 2;

  // ── Nombre empresa ──
  doc.setFontSize(11); doc.setFont("Courier", "bold");
  const nw = (doc.getStringUnitWidth(E.nombre) * 11) / (72 / 25.4);
  doc.text(E.nombre, Math.max(2, (W - nw) / 2), y); y += 7;

  y = center(doc, E.subtit, y, 7.5);
  y = center(doc, `NIT: ${E.nit}`, y, 7);
  y = center(doc, `Tel: ${E.tel}`, y, 6.5);
  y = center(doc, E.email, y, 6.3);
  y = center(doc, E.dir, y, 6.3);
  y += 1;

  // ── N° factura y fecha ──
  y = line(doc, y);
  doc.setFontSize(6.8); doc.setFont("Courier", "normal");
  const numTxt = `REM No. ${(sale.id || "").slice(0, 8).toUpperCase()}`;
  const fechaTxt = safeText(sale.fecha || "");
  doc.text(numTxt, 2, y);
  const fw = (doc.getStringUnitWidth(fechaTxt) * 6.8) / (72 / 25.4);
  doc.text(fechaTxt, Math.max(2, W - fw - 1), y);
  y += 5;

  // ── Cliente ──
  y = line(doc, y);
  doc.setFontSize(7); doc.setFont("Courier", "bold");
  doc.text("REMISION A:", 2, y); y += 4;
  doc.setFont("Courier", "normal");
  y = txt(doc, `Cliente  : ${sale.cliente || "Consumidor Final"}`, y);
  if (sale.cedula) y = txt(doc, `Cedula   : ${sale.cedula}`, y);
  if (sale.telefono) y = txt(doc, `Telefono : ${sale.telefono}`, y);
  if (sale.direccion) y = txt(doc, `Direccion: ${sale.direccion}`, y);
  y = txt(doc, `Vendedor : ${sale.vendedor || "—"}`, y);

  // ── Productos ──
  y = line(doc, y);
  doc.setFontSize(7); doc.setFont("Courier", "bold");
  doc.text("DETALLE DE PRODUCTOS", 2, y); y += 4.5;

  items.forEach(it => {
    doc.setFont("Courier", "bold"); doc.setFontSize(7.5);
    const pLines = doc.splitTextToSize(safeText(it.nombre), W - 4);
    doc.text(pLines, 2, y); y += pLines.length * 4.2;

    doc.setFont("Courier", "normal"); doc.setFontSize(7);
    if (it.medida) { doc.text(`  Medida: ${safeText(it.medida)}`, 2, y); y += 3.8; }
    if (it.color) { doc.text(`  Color : ${safeText(it.color)}`, 2, y); y += 3.8; }
    const subStr = `  ${it.cant} x ${fmtCOP(it.precio)} = ${fmtCOP(it.cant * it.precio)}`;
    doc.text(safeText(subStr), 2, y); y += 5;
  });

  y = solid(doc, y);

  // ── Totales ──
  if (sale.subtotal !== sale.total || sale.descuento > 0) {
    y = row(doc, "Subtotal:", fmtCOP(sale.subtotal), y);
  }
  if (sale.descuento > 0) y = row(doc, "Descuento:", `- ${fmtCOP(sale.descuento)}`, y);
  if (sale.impuesto > 0) y = row(doc, "IVA:", fmtCOP(sale.impuesto), y);

  y = solid(doc, y);

  // TOTAL grande
  doc.setFontSize(11); doc.setFont("Courier", "bold");
  const totalStr = `TOTAL: ${fmtCOP(sale.total)}`;
  const tw2 = (doc.getStringUnitWidth(totalStr) * 11) / (72 / 25.4);
  doc.text(totalStr, Math.max(2, (W - tw2) / 2), y); y += 7;

  // Recibido y cambio
  y = row(doc, "Recibido:", fmtCOP(entregado), y, true);
  if (cambio > 0) {
    y = row(doc, "Su cambio:", fmtCOP(cambio), y, true);
    if (metodoCambio) {
      doc.setFontSize(7); doc.setFont("Courier", "normal");
      doc.text(`  Devuelto por: ${safeText(metodoCambio)}`, 2, y); y += 4;
    }
  }
  y += 1;
  y = solid(doc, y);

  // ── Forma de pago ──
  doc.setFontSize(7); doc.setFont("Courier", "bold");
  doc.text("FORMA DE PAGO:", 2, y); y += 4;
  pagos.forEach(p => { y = row(doc, `  ${safeText(p.metodo)}:`, fmtCOP(p.monto), y); });
  y += 1;
  y = line(doc, y);

  // ── Garantía ──
  y = line(doc, y);

  // Título principal garantía
  doc.setFontSize(7); doc.setFont("Courier", "bold");
  doc.text("GARANTIA Y DEVOLUCIONES", 2, y); y += 4;

  // Cobertura
  doc.setFontSize(5.8); doc.setFont("Courier", "normal");
  const coverageLines = doc.splitTextToSize(
    "Cubre defectos de fabricacion y fallas internas del producto.", W - 4
  );
  doc.text(coverageLines, 2, y); y += coverageLines.length * 3.2 + 1;

  // LA GARANTIA NO CUBRE
  doc.setFont("Courier", "bold"); doc.setFontSize(5.8);
  doc.text("LA GARANTIA NO CUBRE:", 2, y); y += 3.5;
  doc.setFont("Courier", "normal");
  const noCubre = [
    "* Mal uso o maltrato del producto.",
    "* Danos causados de forma intencional.",
    "* Deterioro de telas, manchas o derrames.",
    "* Deformidad de colchones por uso irregular",
    "  o exceso de peso en un solo punto.",
    "* Danos esteticos por desgaste natural.",
  ];
  noCubre.forEach(l => {
    const ls = doc.splitTextToSize(l, W - 4);
    doc.text(ls, 2, y); y += ls.length * 3.1;
  });
  y += 1;

  // NOTA SOBRE TRANSPORTE
  doc.setFont("Courier", "bold"); doc.setFontSize(5.8);
  doc.text("NOTA SOBRE TRANSPORTE:", 2, y); y += 3.5;
  doc.setFont("Courier", "normal");
  const transporteLines = doc.splitTextToSize(
    "El traslado del producto para hacer efectiva la garantia es responsabilidad del cliente. El almacen no asume costos de flete ni envio.",
    W - 4
  );
  doc.text(transporteLines, 2, y); y += transporteLines.length * 3.1 + 1;

  // 🔥 NUEVA FRASE (lo que pediste)
  doc.setFont("Courier", "bold"); doc.setFontSize(5.8);
  const notaExtra = doc.splitTextToSize(
    "Despues de salir el producto del almacen no se devuelve el dinero.",
    W - 4
  );
  doc.text(notaExtra, 2, y); y += notaExtra.length * 3.2 + 1;

  // Soporte garantía
  doc.setFont("Courier", "italic"); doc.setFontSize(5.6);
  const soporteLines = doc.splitTextToSize("Conserve este recibo como soporte de su garantia.", W - 4);
  doc.text(soporteLines, 2, y); y += soporteLines.length * 3.1 + 1.5;

  y = line(doc, y);

  // ── Nota legal DIAN ──
  doc.setFont("Courier", "normal"); doc.setFontSize(6);
  const dianLines = doc.splitTextToSize(
    "Documento equivalente a factura de venta. No valido como factura electronica ante la DIAN.",
    W - 4
  );
  doc.text(dianLines, 2, y); y += dianLines.length * 3.4 + 1;

  y = line(doc, y);

  // ── Pie ──
  y = center(doc, "!GRACIAS POR SU COMPRA!", y, 9, true);
  y = center(doc, "Mundo Muebles Popayan · Tel: " + E.tel, y, 6.3);

  // ── Guardar ──
  const filename = `Factura_MM_${(sale.id || "nueva").slice(0, 8).toUpperCase()}.pdf`;
  doc.save(filename);
}
