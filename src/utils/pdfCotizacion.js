/**
 * pdfCotizacion.js — Cotización formal A4
 * Mundo Muebles Popayán · v8.0
 * Genera un PDF formal con logo, tabla de items, términos y condiciones
 */
import { jsPDF } from "jspdf";

const fmtCOP = n =>
  new Intl.NumberFormat("es-CO", { style:"currency", currency:"COP", maximumFractionDigits:0 }).format(n||0);

function safe(v) {
  return String(v||"")
    .replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i")
    .replace(/ó/g,"o").replace(/ú/g,"u").replace(/ñ/g,"n")
    .replace(/Á/g,"A").replace(/É/g,"E").replace(/Í/g,"I")
    .replace(/Ó/g,"O").replace(/Ú/g,"U").replace(/Ñ/g,"N")
    .replace(/[^\x00-\x7F]/g,"");
}

export function printCotizacionPDF(cotizacion, empresa = {}) {
  const E = {
    nombre:    empresa.nombre    || "MUNDO MUEBLES POPAYAN",
    subtit:    empresa.subtit    || "MODA EN EL HOGAR",
    nit:       empresa.nit       || "4616882-9",
    tel:       empresa.telefono  || "316 7145208",
    email:     empresa.email     || "mundomueblespopayan1@gmail.com",
    dir:       empresa.direccion || "Cra 4 # 13-08, Popayan, Cauca",
  };

  const doc = new jsPDF({ unit:"mm", format:"a4" });
  const PW = 210, PH = 297, ML = 18, MR = 18, CW = PW - ML - MR;
  let y = 0;

  // ── HEADER — franja azul ──────────────────────────────────────────────
  doc.setFillColor(13, 45, 142);
  doc.rect(0, 0, PW, 38, "F");

  // Logo MM
  doc.setFont("Helvetica","bold"); doc.setFontSize(22); doc.setTextColor(255,255,255);
  doc.text("MM", ML, 16);

  // Nombre empresa
  doc.setFontSize(15); doc.setFont("Helvetica","bold");
  doc.text(safe(E.nombre), ML + 16, 15);
  doc.setFontSize(8); doc.setFont("Helvetica","normal"); doc.setTextColor(180,200,255);
  doc.text(safe(E.subtit), ML + 16, 21);

  // Datos empresa (derecha)
  doc.setFontSize(7.5); doc.setTextColor(200,220,255);
  const rightX = PW - MR;
  [
    `NIT: ${E.nit}`,
    `Tel: ${E.tel}`,
    safe(E.email),
    safe(E.dir),
  ].forEach((line, i) => {
    const w = doc.getStringUnitWidth(line)*7.5/(72/25.4);
    doc.text(line, rightX - w, 12 + i*5);
  });

  // ── TÍTULO COTIZACIÓN ──
  y = 50;
  doc.setTextColor(13,45,142); doc.setFont("Helvetica","bold"); doc.setFontSize(20);
  doc.text("COTIZACION", ML, y);

  // Número y estado (chip)
  const numTxt = `N.deg ${safe(cotizacion.numero||cotizacion.id.slice(0,8).toUpperCase())}`;
  doc.setFontSize(11); doc.setFont("Helvetica","normal"); doc.setTextColor(80,80,80);
  doc.text(numTxt, ML, y + 8);

  // Estado chip
  const estadoCol = {
    "Borrador":   [148,163,184],
    "Enviada":    [59,130,246],
    "Aprobada":   [34,197,94],
    "Rechazada":  [239,68,68],
    "Convertida": [168,85,247],
  }[cotizacion.estado] || [148,163,184];
  doc.setFillColor(...estadoCol);
  doc.roundedRect(PW - MR - 35, y - 8, 35, 10, 3, 3, "F");
  doc.setTextColor(255,255,255); doc.setFontSize(8); doc.setFont("Helvetica","bold");
  const est = safe(cotizacion.estado||"Borrador");
  const estW = doc.getStringUnitWidth(est)*8/(72/25.4);
  doc.text(est, PW - MR - 35 + (35-estW)/2, y - 1);

  // ── FECHAS (derecha) ──
  y = 50;
  doc.setFontSize(8); doc.setFont("Helvetica","normal"); doc.setTextColor(100,100,100);
  const fechas = [
    ["Fecha de emision:", cotizacion.fecha||""],
    ["Valida hasta:",     cotizacion.fechaVencimiento||"—"],
    ["Vendedor:",         safe(cotizacion.vendedor||"—")],
  ];
  fechas.forEach(([label, val], i) => {
    doc.setFont("Helvetica","bold"); doc.text(label, PW - MR - 70, y + i*6);
    doc.setFont("Helvetica","normal"); doc.text(safe(val), PW - MR - 5 - doc.getStringUnitWidth(safe(val))*8/(72/25.4), y + i*6);
  });

  // ── SEPARADOR ──
  y = 74;
  doc.setDrawColor(200,210,240); doc.setLineWidth(0.5);
  doc.line(ML, y, PW - MR, y);

  // ── DATOS CLIENTE (izquierda) + NOTA CLIENTE (derecha) ──
  y = 80;
  doc.setFillColor(240,245,255);
  doc.roundedRect(ML, y, CW/2 - 4, 34, 3, 3, "F");
  doc.setFont("Helvetica","bold"); doc.setFontSize(7); doc.setTextColor(13,45,142);
  doc.text("COTIZAR A:", ML+4, y+7);
  doc.setFont("Helvetica","bold"); doc.setFontSize(9); doc.setTextColor(30,30,30);
  doc.text(safe(cotizacion.cliente||"Consumidor Final"), ML+4, y+15);
  doc.setFont("Helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(80,80,80);
  if (cotizacion.cedula) doc.text(`Cedula: ${safe(cotizacion.cedula)}`, ML+4, y+22);
  if (cotizacion.telefono) doc.text(`Tel: ${safe(cotizacion.telefono)}`, ML+4, y+27);
  if (cotizacion.email) doc.text(`Email: ${safe(cotizacion.email)}`, ML+4, y+32);

  // Notas (derecha)
  if (cotizacion.notas) {
    doc.setFillColor(255,249,235);
    doc.roundedRect(ML + CW/2 + 4, y, CW/2 - 4, 34, 3, 3, "F");
    doc.setFont("Helvetica","bold"); doc.setFontSize(7); doc.setTextColor(180,100,0);
    doc.text("NOTAS:", ML + CW/2 + 8, y+7);
    doc.setFont("Helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(80,60,0);
    const notaLines = doc.splitTextToSize(safe(cotizacion.notas), CW/2 - 12);
    notaLines.slice(0,4).forEach((l, i) => doc.text(l, ML + CW/2 + 8, y+15 + i*5));
  }

  // ── TABLA DE ITEMS ──
  y = 122;
  // Encabezado tabla
  doc.setFillColor(13,45,142);
  doc.rect(ML, y, CW, 9, "F");
  doc.setFont("Helvetica","bold"); doc.setFontSize(8); doc.setTextColor(255,255,255);
  const cols = [
    { label:"#",            x: ML+2,       w:8  },
    { label:"Descripcion",  x: ML+12,      w:74 },
    { label:"Medida",       x: ML+88,      w:22 },
    { label:"Cant.",        x: ML+112,     w:14 },
    { label:"Precio Unit.", x: ML+128,     w:28 },
    { label:"Subtotal",     x: ML+158,     w:CW-160 },
  ];
  cols.forEach(c => doc.text(c.label, c.x, y+6));
  y += 9;

  // Filas
  const items = cotizacion.items||[];
  items.forEach((it, idx) => {
    const rowH = 10;
    doc.setFillColor(idx%2===0 ? 248:255, idx%2===0 ? 250:255, idx%2===0 ? 255:255);
    doc.rect(ML, y, CW, rowH, "F");
    doc.setDrawColor(220,228,245); doc.setLineWidth(0.3);
    doc.line(ML, y+rowH, ML+CW, y+rowH);

    doc.setFont("Helvetica","normal"); doc.setFontSize(8); doc.setTextColor(40,40,40);
    doc.text(String(idx+1), ML+2, y+7);
    const nombreLines = doc.splitTextToSize(safe(it.nombre||""), 70);
    doc.text(nombreLines[0], ML+12, y+7);
    doc.text(safe(it.medida||"—"), ML+88, y+7);
    doc.text(String(it.cant||1), ML+116, y+7);
    doc.setFont("Helvetica","normal");
    const priceStr = fmtCOP(it.precio);
    const pw2 = doc.getStringUnitWidth(priceStr)*8/(72/25.4);
    doc.text(priceStr, ML+156-pw2, y+7);
    const subStr = fmtCOP((it.cant||1)*(it.precio||0));
    const sw = doc.getStringUnitWidth(subStr)*8/(72/25.4);
    doc.text(subStr, ML+CW-2-sw, y+7);
    y += rowH;
  });

  // ── TOTALES ──
  y += 4;
  doc.setDrawColor(180,200,240); doc.setLineWidth(0.4);
  doc.line(ML+CW*0.55, y, ML+CW, y);

  const totRows = [
    ["Subtotal:", fmtCOP(cotizacion.subtotal)],
    cotizacion.descuento>0 ? ["Descuento:", `- ${fmtCOP(cotizacion.descuento)}`] : null,
    cotizacion.impuesto>0  ? ["IVA:",       fmtCOP(cotizacion.impuesto)]         : null,
  ].filter(Boolean);

  totRows.forEach(([l,v]) => {
    y += 7;
    doc.setFont("Helvetica","normal"); doc.setFontSize(8.5); doc.setTextColor(80,80,80);
    doc.text(safe(l), ML+CW*0.58, y);
    const vw = doc.getStringUnitWidth(safe(v))*8.5/(72/25.4);
    doc.text(safe(v), ML+CW-vw, y);
  });

  // Total grande
  y += 4;
  doc.setFillColor(13,45,142);
  doc.rect(ML + CW*0.55, y, CW*0.45, 12, "F");
  doc.setFont("Helvetica","bold"); doc.setFontSize(10); doc.setTextColor(255,255,255);
  const totalLabel = "TOTAL:";
  const totalVal   = safe(fmtCOP(cotizacion.total));
  doc.text(totalLabel, ML+CW*0.57, y+8);
  const tvw = doc.getStringUnitWidth(totalVal)*10/(72/25.4);
  doc.text(totalVal, ML+CW-tvw-1, y+8);
  y += 16;

  // ── TÉRMINOS Y CONDICIONES ──
  y += 4;
  doc.setDrawColor(200,210,240); doc.line(ML, y, PW-MR, y); y += 6;
  doc.setFont("Helvetica","bold"); doc.setFontSize(8); doc.setTextColor(13,45,142);
  doc.text("TERMINOS Y CONDICIONES:", ML, y); y += 5;
  doc.setFont("Helvetica","normal"); doc.setFontSize(7.5); doc.setTextColor(80,80,80);
  const terminos = [
    `1. Esta cotizacion tiene validez hasta: ${safe(cotizacion.fechaVencimiento||"—")}`,
    "2. Los precios estan expresados en pesos colombianos (COP) e incluyen IVA cuando aplica.",
    "3. El plazo de entrega sera acordado al momento de confirmar el pedido.",
    "4. Esta cotizacion no constituye un contrato de compraventa.",
    "5. Para confirmar el pedido, comuniquese con nosotros al "+safe(E.tel)+".",
  ];
  terminos.forEach(t => { doc.text(safe(t), ML, y); y += 5; });

  // ── FOOTER ──
  y = PH - 18;
  doc.setFillColor(240,245,255);
  doc.rect(0, y, PW, 18, "F");
  doc.setFont("Helvetica","bold"); doc.setFontSize(8); doc.setTextColor(13,45,142);
  const footerTxt = `${safe(E.nombre)} | NIT: ${safe(E.nit)} | Tel: ${safe(E.tel)} | ${safe(E.email)}`;
  const ftw = doc.getStringUnitWidth(footerTxt)*8/(72/25.4);
  doc.text(footerTxt, (PW-ftw)/2, y+8);
  doc.setFont("Helvetica","normal"); doc.setFontSize(7); doc.setTextColor(100,120,180);
  const foot2 = safe(E.dir);
  const f2w = doc.getStringUnitWidth(foot2)*7/(72/25.4);
  doc.text(foot2, (PW-f2w)/2, y+14);

  const filename = `Cotizacion_MM_${(cotizacion.numero||cotizacion.id.slice(0,8)).toUpperCase()}.pdf`;
  doc.save(filename);
}
