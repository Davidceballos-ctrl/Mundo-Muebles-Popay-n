/**
 * whatsappService.js — Servicio de reportes WhatsApp · v1.0
 * ──────────────────────────────────────────────────────────
 * Genera mensajes de WhatsApp con datos reales del sistema.
 * Usa wa.me (WhatsApp Web) — sin API key, sin backend.
 *
 * USO:
 *   import { enviarReporteDiario, enviarAlertaStock, enviarResumenVentas } from "../utils/whatsappService.js";
 *   enviarReporteDiario({ sales, products, numero, LOW_STOCK_THRESHOLD });
 */

import { LOW_STOCK_THRESHOLD } from "../data/initialData.js";

/* ── Utilidades internas ── */
const COP = n => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
const HOY = () => new Date().toISOString().slice(0, 10);
const HORA = () => new Date().toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
const FECHA_LARGA = () => new Date().toLocaleDateString("es-CO", { weekday: "long", year: "numeric", month: "long", day: "numeric" });

/**
 * Abre WhatsApp Web con un mensaje prellenado.
 * @param {string} numero - Número sin +57, sin espacios (ej: "3167145208")
 * @param {string} mensaje - Texto del mensaje
 */
function abrirWhatsApp(numero, mensaje) {
  if (!numero) {
    alert("Configura el número de WhatsApp en la sección Integraciones antes de enviar.");
    return;
  }
  const url = `https://wa.me/57${numero.replace(/\D/g, "")}?text=${encodeURIComponent(mensaje)}`;
  window.open(url, "_blank", "noopener,noreferrer");
}

/* ─────────────────────────────────────────────────────────
   1. REPORTE DIARIO COMPLETO
   Incluye: ventas del día, productos vendidos, stock bajo.
───────────────────────────────────────────────────────── */
export function enviarReporteDiario({ sales = [], products = [], numero = "", empresa = {} }) {
  const hoy = HOY();

  // Ventas del día
  const ventasHoy    = sales.filter(s => s.fecha === hoy);
  const totalVentas  = ventasHoy.reduce((a, s) => a + s.total, 0);
  const numVentas    = ventasHoy.length;

  // Productos vendidos hoy (agregados)
  const vendidosMap = {};
  ventasHoy.forEach(v =>
    (v.items || []).forEach(it => {
      const k = it.nombre;
      vendidosMap[k] = (vendidosMap[k] || 0) + (it.cant || 1);
    })
  );
  const vendidosList = Object.entries(vendidosMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Stock bajo
  const stockBajo = [];
  products.filter(p => p.activo).forEach(p =>
    p.variantes.forEach(v => {
      if (v.stock <= LOW_STOCK_THRESHOLD)
        stockBajo.push({ nombre: p.nombre, medida: v.medida, stock: v.stock });
    })
  );
  const stockBajoSorted = stockBajo.sort((a, b) => a.stock - b.stock).slice(0, 10);

  // Armar mensaje
  let msg = "";
  msg += `📊 *Reporte Diario — ${empresa.nombre || "Mundo Muebles Popayán"}*\n`;
  msg += `📅 ${FECHA_LARGA()} · ${HORA()}\n`;
  msg += `${"─".repeat(35)}\n\n`;

  // Ventas del día
  msg += `💰 *Ventas del día:*\n`;
  if (numVentas === 0) {
    msg += `   Sin ventas registradas hoy.\n`;
  } else {
    msg += `   • Total: *${COP(totalVentas)}*\n`;
    msg += `   • Número de ventas: *${numVentas}*\n`;
    if (numVentas > 0) {
      const ticketProm = Math.round(totalVentas / numVentas);
      msg += `   • Ticket promedio: ${COP(ticketProm)}\n`;
    }
  }
  msg += "\n";

  // Productos vendidos
  msg += `🛒 *Productos vendidos hoy:*\n`;
  if (vendidosList.length === 0) {
    msg += `   Sin productos vendidos hoy.\n`;
  } else {
    vendidosList.forEach(([nombre, cant]) => {
      msg += `   • ${nombre} (${cant} uds)\n`;
    });
  }
  msg += "\n";

  // Stock bajo
  msg += `📦 *Stock bajo (≤ ${LOW_STOCK_THRESHOLD} uds):*\n`;
  if (stockBajoSorted.length === 0) {
    msg += `   ✅ Todos los productos tienen stock suficiente.\n`;
  } else {
    stockBajoSorted.forEach(p => {
      const emoji = p.stock === 0 ? "🔴" : "🟡";
      msg += `   ${emoji} ${p.nombre} ${p.medida ? `(${p.medida})` : ""} — *${p.stock} uds*\n`;
    });
    if (stockBajo.length > 10) {
      msg += `   ...y ${stockBajo.length - 10} más.\n`;
    }
    msg += `\n   ⚠️ Se recomienda gestionar pedido pronto.\n`;
  }

  msg += `\n${"─".repeat(35)}\n`;
  msg += `_Sistema ERP · ${empresa.nombre || "Mundo Muebles"}_`;

  abrirWhatsApp(numero, msg);
  return msg; // retorna para debugging/preview
}

/* ─────────────────────────────────────────────────────────
   2. ALERTA RÁPIDA DE STOCK BAJO
───────────────────────────────────────────────────────── */
export function enviarAlertaStock({ products = [], numero = "", empresa = {} }) {
  const stockBajo = [];
  products.filter(p => p.activo).forEach(p =>
    p.variantes.forEach(v => {
      if (v.stock <= LOW_STOCK_THRESHOLD)
        stockBajo.push({ nombre: p.nombre, medida: v.medida, stock: v.stock, categoria: p.categoria });
    })
  );

  if (stockBajo.length === 0) {
    alert("✅ Todos los productos tienen stock suficiente. No hay alertas que enviar.");
    return;
  }

  const sorted = stockBajo.sort((a, b) => a.stock - b.stock);

  let msg = `⚠️ *Alerta de Stock Bajo — ${empresa.nombre || "Mundo Muebles"}*\n`;
  msg += `📅 ${FECHA_LARGA()} · ${HORA()}\n\n`;
  msg += `Se detectaron *${stockBajo.length}* variante${stockBajo.length !== 1 ? "s" : ""} con stock ≤ ${LOW_STOCK_THRESHOLD} unidades:\n\n`;

  sorted.forEach(p => {
    const emoji = p.stock === 0 ? "🔴 AGOTADO" : `🟡 ${p.stock} uds`;
    msg += `• *${p.nombre}* ${p.medida ? `(${p.medida})` : ""}\n`;
    msg += `   ${emoji} · ${p.categoria}\n`;
  });

  msg += `\n_Por favor gestionar pedido lo antes posible._\n`;
  msg += `_ERP ${empresa.nombre || "Mundo Muebles"}_`;

  abrirWhatsApp(numero, msg);
  return msg;
}

/* ─────────────────────────────────────────────────────────
   3. RESUMEN DE VENTAS DEL DÍA
───────────────────────────────────────────────────────── */
export function enviarResumenVentas({ sales = [], numero = "", empresa = {} }) {
  const hoy = HOY();
  const ventasHoy = sales.filter(s => s.fecha === hoy);
  const total     = ventasHoy.reduce((a, s) => a + s.total, 0);

  // Agrupar por vendedor
  const porVendedor = {};
  ventasHoy.forEach(v => {
    const vend = v.vendedor || "Sin nombre";
    if (!porVendedor[vend]) porVendedor[vend] = { count: 0, total: 0 };
    porVendedor[vend].count++;
    porVendedor[vend].total += v.total;
  });

  // Método de pago más usado
  const metodos = {};
  ventasHoy.forEach(v =>
    (v.pagos || []).forEach(p => {
      metodos[p.metodo] = (metodos[p.metodo] || 0) + 1;
    })
  );
  const metodoPrincipal = Object.entries(metodos).sort((a, b) => b[1] - a[1])[0]?.[0];

  let msg = `💰 *Resumen de Ventas — ${empresa.nombre || "Mundo Muebles Popayán"}*\n`;
  msg += `📅 ${FECHA_LARGA()} · ${HORA()}\n`;
  msg += `${"─".repeat(35)}\n\n`;

  if (ventasHoy.length === 0) {
    msg += `Sin ventas registradas el día de hoy.\n`;
  } else {
    msg += `*Total del día:* ${COP(total)}\n`;
    msg += `*Número de ventas:* ${ventasHoy.length}\n`;
    msg += `*Ticket promedio:* ${COP(Math.round(total / ventasHoy.length))}\n`;
    if (metodoPrincipal) msg += `*Método más usado:* ${metodoPrincipal}\n`;
    msg += "\n";

    if (Object.keys(porVendedor).length > 1) {
      msg += `*Por vendedor:*\n`;
      Object.entries(porVendedor).forEach(([vend, d]) => {
        msg += `   • ${vend}: ${d.count} venta${d.count !== 1 ? "s" : ""} · ${COP(d.total)}\n`;
      });
      msg += "\n";
    }

    // Últimas 5 ventas
    msg += `*Últimas ventas:*\n`;
    [...ventasHoy].reverse().slice(0, 5).forEach(v => {
      msg += `   • ${v.cliente} — ${COP(v.total)}\n`;
    });
  }

  msg += `\n${"─".repeat(35)}\n`;
  msg += `_Sistema ERP · ${empresa.nombre || "Mundo Muebles"}_`;

  abrirWhatsApp(numero, msg);
  return msg;
}

/* ─────────────────────────────────────────────────────────
   4. PREVISUALIZAR MENSAJE (sin abrir WhatsApp)
   Útil para mostrar en UI antes de enviar.
───────────────────────────────────────────────────────── */
export function previsualizarReporteDiario({ sales = [], products = [], empresa = {} }) {
  return enviarReporteDiario({ sales, products, numero: "PREVIEW", empresa });
}
