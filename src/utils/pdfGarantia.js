/**
 * pdfGarantia.js — Comprobante de recepción de garantía · 58mm
 * Mundo Muebles Popayán · NIT 4616882-9
 */
import { jsPDF } from "jspdf";

const W = 55;

function safeText(v) {
  return String(v || "")
    .replace(/á/g,"a").replace(/é/g,"e").replace(/í/g,"i")
    .replace(/ó/g,"o").replace(/ú/g,"u").replace(/ñ/g,"n")
    .replace(/Á/g,"A").replace(/É/g,"E").replace(/Í/g,"I")
    .replace(/Ó/g,"O").replace(/Ú/g,"U").replace(/Ñ/g,"N")
    .replace(/[^\x00-\x7F]/g,"");
}

function line(doc, y, char = "-") {
  doc.setFontSize(7); doc.setFont("Courier","normal");
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

function txt(doc, text, y, size = 7.5, bold = false) {
  doc.setFontSize(size);
  doc.setFont("Courier", bold ? "bold" : "normal");
  const safe = safeText(text);
  const lines = doc.splitTextToSize(safe, W - 4);
  doc.text(lines, 2, y);
  return y + lines.length * (size * 0.42 + 1.8);
}

export function printComprobante(garantia, empresa = {}) {
  const E = {
    nombre:    empresa.nombre    || "MUNDO MUEBLES POPAYAN",
    subtit:    empresa.subtit    || "MODA EN EL HOGAR",
    nit:       empresa.nit       || "4616882-9",
    tel:       empresa.telefono  || "316 7145208",
    email:     empresa.email     || "mundomueblespopayan1@gmail.com",
    dir:       empresa.direccion || "Cra 4 # 13-08, Popayan, Cauca",
  };

  const pageH = 200;
  let doc;
  try {
    doc = new jsPDF({ unit: "mm", format: [W + 3, pageH] });
  } catch (e) {
    throw new Error("No se pudo generar el PDF: " + e.message);
  }

  doc.setFont("Courier","normal");
  let y = 6;

  // ── Logo MM ──
  doc.setFontSize(16); doc.setFont("Courier","bold");
  const lw = (doc.getStringUnitWidth("MM") * 16) / (72 / 25.4);
  doc.text("MM", Math.max(2,(W - lw)/2), y); y += 8;
  doc.setFillColor(26,61,200);
  doc.rect((W-12)/2, y-3, 12, 1, "F"); y += 2;

  doc.setFontSize(10); doc.setFont("Courier","bold");
  const nw = (doc.getStringUnitWidth(E.nombre)*10)/(72/25.4);
  doc.text(E.nombre, Math.max(2,(W-nw)/2), y); y += 6;
  y = center(doc, E.subtit,  y, 7.5);
  y = center(doc, "NIT: "+E.nit, y, 6.5);
  y = center(doc, "Tel: "+E.tel, y, 6.5);
  y += 1;

  // ── Título documento ──
  y = solid(doc, y);
  y = center(doc, "COMPROBANTE DE", y, 8.5, true);
  y = center(doc, "RECEPCION DE GARANTIA", y, 8.5, true);
  y = solid(doc, y);

  // N° caso y fecha
  doc.setFontSize(6.8); doc.setFont("Courier","normal");
  const numTxt = "CASO No. " + (garantia.id||"").slice(0,8).toUpperCase();
  const fechaTxt = safeText(garantia.fecha||"");
  doc.text(numTxt, 2, y);
  const fw = (doc.getStringUnitWidth(fechaTxt)*6.8)/(72/25.4);
  doc.text(fechaTxt, Math.max(2, W-fw-1), y);
  y += 5;

  if (garantia.facturaNum) {
    y = txt(doc, "Factura ref.: #"+safeText(garantia.facturaNum), y);
  }
  y += 1;

  // ── Datos del cliente ──
  y = line(doc, y);
  doc.setFontSize(7); doc.setFont("Courier","bold");
  doc.text("DATOS DEL CLIENTE:", 2, y); y += 4;
  doc.setFont("Courier","normal");
  y = txt(doc, "Nombre   : "+safeText(garantia.cliente||"Consumidor Final"), y);
  if (garantia.cedula)    y = txt(doc, "Cedula   : "+safeText(garantia.cedula), y);
  if (garantia.telefono)  y = txt(doc, "Telefono : "+safeText(garantia.telefono), y);

  // ── Producto ──
  y = line(doc, y);
  doc.setFontSize(7); doc.setFont("Courier","bold");
  doc.text("PRODUCTO EN GARANTIA:", 2, y); y += 4;
  doc.setFont("Courier","normal");
  y = txt(doc, safeText(garantia.productoNombre||"—"), y, 7.5);
  y += 1;

  // ── Descripción del defecto ──
  y = line(doc, y);
  doc.setFontSize(7); doc.setFont("Courier","bold");
  doc.text("DESCRIPCION DEL DEFECTO:", 2, y); y += 4;
  doc.setFont("Courier","normal");
  doc.setFontSize(7);
  const defLines = doc.splitTextToSize(safeText(garantia.defecto||"—"), W-4);
  doc.text(defLines, 2, y); y += defLines.length * 3.8 + 1;
  y = txt(doc, "Tipo: "+safeText(garantia.tipo||"—"), y);
  y += 1;

  // ── Recibido por ──
  y = line(doc, y);
  y = txt(doc, "Recibido por: "+safeText(garantia.recibidoPor||"—"), y);
  y = txt(doc, "Estado inicial: "+safeText(garantia.estado||"Recibido"), y);
  y += 2;

  // ── Política ──
  y = solid(doc, y);
  doc.setFontSize(6.5); doc.setFont("Courier","bold");
  doc.text("POLITICA DE GARANTIA:", 2, y); y += 4;
  doc.setFont("Courier","normal");
  const polLines = doc.splitTextToSize(
    "Cubre defectos de fabricacion. No cubre mal uso, manchas, danos por desgaste o traslado. El flete es responsabilidad del cliente.",
    W-4
  );
  doc.text(polLines, 2, y); y += polLines.length * 3.5 + 2;

  // ── Firmas ──
  y = line(doc, y);
  doc.setFontSize(6.5); doc.setFont("Courier","normal");
  doc.text("Firma cliente:", 2, y);
  doc.text("Firma recibe:", W/2+2, y); y += 8;
  doc.text("________________________", 2, y);
  doc.text("________________________", W/2+2, y); y += 4;

  y = solid(doc, y);
  y = center(doc, "Conserve este documento", y, 7);
  y = center(doc, "como soporte de su reclamacion.", y, 7);
  y += 2;
  y = center(doc, E.nombre+" · Tel: "+E.tel, y, 6.3);

  const filename = "Garantia_MM_"+(garantia.id||"nueva").slice(0,8).toUpperCase()+".pdf";
  doc.save(filename);
}

export function printComprobanteWindow(garantia, empresa = {}) {
  try {
    const E = {
      nombre:    empresa.nombre    || "MUNDO MUEBLES POPAYAN",
      subtit:    empresa.subtit    || "MODA EN EL HOGAR",
      nit:       empresa.nit       || "4616882-9",
      telefono:  empresa.telefono  || "316 7145208",
      email:     empresa.email     || "mundomueblespopayan1@gmail.com",
      direccion: empresa.direccion || "Cra 4 # 13-08, Popayan, Cauca",
    };

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8"/>
<title>Garantia ${(garantia.id||"").slice(0,8).toUpperCase()}</title>
<style>
  @page { size: 58mm auto; margin: 2mm 1mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Courier New', Courier, monospace; font-size: 9px; color: #000; width: 56mm; background: #fff; }
  .center { text-align: center; }
  .bold   { font-weight: bold; }
  .sep    { border-top: 1px dashed #000; margin: 3mm 0; }
  .sep2   { border-top: 2px solid #000; margin: 3mm 0; }
  .header { text-align: center; margin-bottom: 3mm; }
  .header .biz-name { font-size: 12px; font-weight: bold; }
  .header .biz-sub  { font-size: 8px; margin-top: 0.5mm; }
  .doc-title { text-align: center; font-size: 11px; font-weight: bold; margin: 2mm 0; }
  .num-row   { display: flex; justify-content: space-between; font-size: 8px; margin-bottom: 2mm; }
  .section-title { font-weight: bold; font-size: 8px; text-transform: uppercase; margin: 1.5mm 0 1mm; }
  .data-row  { font-size: 8.5px; line-height: 1.65; }
  .defecto-box { background: #FFF7ED; border: 1px solid #FED7AA; border-radius: 1.5mm; padding: 2mm; margin: 1.5mm 0; font-size: 8px; }
  .tipo-chip { display: inline-block; background: #DBEAFE; color: #1E40AF; border-radius: 2mm; padding: 0.5mm 2mm; font-size: 7px; font-weight: bold; margin-top: 1mm; }
  .politica  { font-size: 7px; line-height: 1.55; background: #F9FAFB; padding: 1.5mm; margin: 1mm 0; }
  .firma-row { display: flex; justify-content: space-between; margin-top: 5mm; }
  .firma-box { width: 45%; }
  .firma-line{ border-bottom: 1px solid #000; height: 8mm; margin-bottom: 1mm; }
  .firma-label{ font-size: 7px; text-align: center; }
  .footer    { text-align: center; font-size: 7.5px; font-weight: bold; margin-top: 3mm; }
  @media print { .no-print { display: none; } }
</style>
</head>
<body>
<div class="header">
  <div style="font-size:16px;font-weight:bold;">MM</div>
  <div class="biz-name">${E.nombre}</div>
  <div class="biz-sub">${E.subtit}</div>
  <div class="biz-sub">NIT: ${E.nit} · Tel: ${E.telefono}</div>
</div>
<div class="sep2"></div>
<div class="doc-title">COMPROBANTE DE<br/>RECEPCIÓN DE GARANTÍA</div>
<div class="sep2"></div>
<div class="num-row">
  <span><strong>CASO N° ${(garantia.id||"").slice(0,8).toUpperCase()}</strong></span>
  <span>${garantia.fecha||""}</span>
</div>
${garantia.facturaNum ? `<div style="font-size:8px;margin-bottom:1.5mm;">Factura ref.: #${garantia.facturaNum}</div>` : ""}
<div class="sep"></div>
<div class="section-title">Datos del cliente</div>
<div class="data-row">
  <div><strong>Nombre:</strong> ${garantia.cliente||"Consumidor Final"}</div>
  ${garantia.cedula   ? `<div><strong>Cédula:</strong> ${garantia.cedula}</div>` : ""}
  ${garantia.telefono ? `<div><strong>Tel:</strong> ${garantia.telefono}</div>` : ""}
</div>
<div class="sep"></div>
<div class="section-title">Producto en garantía</div>
<div class="data-row"><strong>${garantia.productoNombre||"—"}</strong></div>
<div class="sep"></div>
<div class="section-title">Descripción del defecto</div>
<div class="defecto-box">
  ${garantia.defecto||"—"}
  <div><span class="tipo-chip">${garantia.tipo||"—"}</span></div>
</div>
<div class="data-row" style="margin-top:1.5mm;">
  <div><strong>Recibido por:</strong> ${garantia.recibidoPor||"—"}</div>
  <div><strong>Estado:</strong> ${garantia.estado||"Recibido"}</div>
</div>
<div class="sep"></div>
<div class="section-title">Política de garantía</div>
<div class="politica">
  Cubre defectos de fabricación. No cubre mal uso, manchas, daños por desgaste natural o traslado. El flete es responsabilidad del cliente.
</div>
<div class="sep"></div>
<div class="firma-row">
  <div class="firma-box"><div class="firma-line"></div><div class="firma-label">Firma cliente</div></div>
  <div class="firma-box"><div class="firma-line"></div><div class="firma-label">Firma recibe</div></div>
</div>
<div class="sep"></div>
<div class="footer">
  Conserve este documento<br/>
  <small>${E.nombre} · Tel: ${E.telefono}</small>
</div>
<script>window.onload=function(){ window.print(); };</script>
</body>
</html>`;

    const w = window.open("", "_blank", "width=400,height=700");
    if (!w) { alert("Permita las ventanas emergentes para imprimir el comprobante."); return; }
    w.document.open(); w.document.write(html); w.document.close();
  } catch (e) {
    alert("Error al imprimir: " + e.message);
  }
}
