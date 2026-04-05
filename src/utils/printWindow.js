const fmtCOP = n =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0
  }).format(n || 0);

function safeText(v) {
  return String(v || "")
    .replace(/á/g, "a").replace(/é/g, "e").replace(/í/g, "i")
    .replace(/ó/g, "o").replace(/ú/g, "u").replace(/ñ/g, "n")
    .replace(/[^\x00-\x7F]/g, "");
}

export function printFacturaWindow(sale, empresa = {}) {
  try {
    const E = {
      nombre: empresa.nombre || "MUNDO MUEBLES POPAYAN",
      subtit: empresa.subtit || "MODA EN EL HOGAR",
      nit: empresa.nit || "4616882-9",
      telefono: empresa.telefono || "316 7145208",
      email: empresa.email || "mundomueblespopayan1@gmail.com",
      direccion: empresa.direccion || "Cra 4 # 13-08, Popayan, Cauca",
    };

    const items = sale.items || [];
    const pagos = sale.pagos || [];
    const cambio = sale.cambio || 0;
    const entregado = sale.entregado || sale.total;

    const line = "----------------------------------------";
    const solid = "========================================";

    const itemsHTML = items.map(it => `
      <div class="item">
        <div class="bold">${safeText(it.nombre)}</div>
        ${it.medida ? `<div>  Medida: ${safeText(it.medida)}</div>` : ""}
        ${it.color ? `<div>  Color : ${safeText(it.color)}</div>` : ""}
        <div>  ${it.cant} x ${fmtCOP(it.precio)} = ${fmtCOP(it.cant * it.precio)}</div>
      </div>
    `).join("");

    const pagosHTML = pagos.map(p =>
      `<div>${safeText(p.metodo)}: ${fmtCOP(p.monto)}</div>`
    ).join("");

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @page { size: 58mm auto; margin: 2mm; }

  body {
    font-family: Courier, monospace;
    font-size: 10px;
    width: 56mm;
    color: #000;
  }

  .center { text-align: center; }
  .bold { font-weight: bold; }
  .big { font-size: 12px; font-weight: bold; }
  .line { margin: 3px 0; }
  .item { margin-bottom: 5px; }

  /* 🔥 GARANTÍA MÁS PEQUEÑA */
  .garantia {
    font-size: 6.5px;
    line-height: 1.4;
  }

  .garantia strong {
    font-size: 6.8px;
  }

  @media print {
    body {
      width: 58mm;
    }
  }
</style>
</head>
<body>

<div class="center bold" style="font-size:16px;">MM</div>

<div class="center bold">${E.nombre}</div>
<div class="center">${E.subtit}</div>
<div class="center">NIT: ${E.nit}</div>
<div class="center">Tel: ${E.telefono}</div>
<div class="center">${E.email}</div>
<div class="center">${E.direccion}</div>

<div class="line">${line}</div>

<div>REM No. ${(sale.id || "").slice(0, 8).toUpperCase()} &nbsp;&nbsp;&nbsp; ${sale.fecha || ""}</div>

<div class="line">${line}</div>

<div class="bold">REMISION A:</div>
<div>Cliente : ${sale.cliente || "Consumidor Final"}</div>
${sale.cedula ? `<div>Cedula  : ${sale.cedula}</div>` : ""}
${sale.telefono ? `<div>Telefono: ${sale.telefono}</div>` : ""}
${sale.direccion ? `<div>Direccion: ${sale.direccion}</div>` : ""}
<div>Vendedor: ${sale.vendedor || "-"}</div>

<div class="line">${line}</div>

<div class="bold">DETALLE DE PRODUCTOS</div>
${itemsHTML}

<div class="line">${solid}</div>

${sale.subtotal !== sale.total ? `<div>Subtotal: ${fmtCOP(sale.subtotal)}</div>` : ""}
${sale.descuento > 0 ? `<div>Descuento: -${fmtCOP(sale.descuento)}</div>` : ""}
${sale.impuesto > 0 ? `<div>IVA: ${fmtCOP(sale.impuesto)}</div>` : ""}

<div class="line">${solid}</div>

<div class="center big">TOTAL: ${fmtCOP(sale.total)}</div>

<div>Recibido: ${fmtCOP(entregado)}</div>
${cambio > 0 ? `<div>Su cambio: ${fmtCOP(cambio)}</div>` : ""}
${sale.metodoCambio ? `<div>Devuelto por: ${sale.metodoCambio}</div>` : ""}

<div class="line">${solid}</div>

<div class="bold">FORMA DE PAGO:</div>
${pagosHTML}

<div class="line">${line}</div>

<!-- 🔥 GARANTÍA OPTIMIZADA -->
<div class="garantia">
  <strong>GARANTIA Y DEVOLUCIONES</strong><br/>
  Cubre defectos de fabricacion y fallas internas del producto.<br/><br/>

  <strong>LA GARANTIA NO CUBRE:</strong><br/>
  * Mal uso o maltrato del producto.<br/>
  * Daños causados de forma intencional.<br/>
  * Deterioro de telas, manchas o derrames.<br/>
  * Deformidad de colchones por uso irregular<br/>
    o exceso de peso en un solo punto.<br/>
  * Daños esteticos por desgaste natural.<br/><br/>

  <strong>NOTA SOBRE TRANSPORTE:</strong><br/>
  El traslado del producto para garantia es responsabilidad del cliente.<br/><br/>

  <strong>Despues de salir el producto del almacen no se devuelve el dinero.</strong><br/><br/>

  <em>Conserve este recibo como soporte de su garantia.</em>
</div>

<div class="line">${line}</div>

<div style="font-size:8px;">
Documento equivalente a remision. No valido como factura electronica ante la DIAN.
</div>

<div class="line">${line}</div>

<div class="center bold">¡GRACIAS POR SU COMPRA!</div>
<div class="center">Mundo Muebles Popayan</div>

<script>
  window.onload = () => window.print();
</script>

</body>
</html>
`;

    const w = window.open("", "_blank", "width=400,height=600");

    if (!w) {
      alert("Activa las ventanas emergentes para imprimir");
      return;
    }

    w.document.open();
    w.document.write(html);
    w.document.close();

  } catch (e) {
    console.error(e);
    alert("Error al imprimir");
  }
}