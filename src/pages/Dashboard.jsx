import { useMemo, useState, Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useApp } from "../context/AppContext.jsx";
import { fmt, fmtN, fmtDate } from "../utils/format.js";
import { LOW_STOCK_THRESHOLD } from "../data/initialData.js";
import { usePermissions } from "../hooks/usePermissions.js";
import Icon from "../components/Icons.jsx";
import Logo from "../components/Logo.jsx";

function KPI({ color, icon, label, value, sub, trend, trendDir }) {
  return (
    <div className={`kpi ${color}`}>
      <div className="kpi-top">
        <div className={`kpi-ico ${color}`}><Icon n={icon} s={22} /></div>
        {trend && (
          <span className={`kpi-trend ${trendDir || "neu"}`}>{trend}</span>
        )}
      </div>
      <div className="kpi-label">{label}</div>
      <div className={`kpi-val ${String(value).length > 9 ? "sm" : ""}`}>{value}</div>
      {sub && <div className="kpi-sub">{sub}</div>}
    </div>
  );
}

const PERIODS = [
  { label: "Hoy",      days: 1  },
  { label: "7 días",   days: 7  },
  { label: "30 días",  days: 30 },
  { label: "3 meses",  days: 90 },
];

export default function Dashboard() {
  const nav = useNavigate();
  const { products, sales, currentUser } = useApp();
  const { isAdmin, isVendedor, isBodeguero } = usePermissions(currentUser);
  const [period, setPeriod] = useState(30);

  const stats = useMemo(() => {
    let variants = 0, stockTotal = 0, lowStock = 0, totalValue = 0;
    const byCat = {};
    products.forEach(p => p.variantes.forEach(v => {
      variants++; stockTotal += v.stock;
      if (v.stock <= LOW_STOCK_THRESHOLD) lowStock++;
      totalValue += v.precio * v.stock;
      byCat[p.categoria] = (byCat[p.categoria] || 0) + v.stock;
    }));
    return { variants, stockTotal, lowStock, totalValue, byCat };
  }, [products]);

  const lowItems = useMemo(() => {
    const items = [];
    products.filter(p => p.activo).forEach(p => p.variantes.forEach(v => {
      if (v.stock <= LOW_STOCK_THRESHOLD)
        items.push({ nombre: p.nombre, medida: v.medida, stock: v.stock });
    }));
    return items.sort((a, b) => a.stock - b.stock).slice(0, 8);
  }, [products]);

  const chartData = useMemo(() => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period);
    const byDay = {};
    sales.filter(s => new Date(s.fecha) >= cutoff).forEach(s => {
      byDay[s.fecha] = (byDay[s.fecha] || 0) + s.total;
    });
    const days = [];
    for (let i = Math.min(period, 30); i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      const k = d.toISOString().slice(0, 10);
      days.push({ fecha: k, ventas: byDay[k] || 0, label: d.toLocaleDateString("es-CO", { month: "short", day: "numeric" }) });
    }
    return days;
  }, [sales, period]);

  const totalPeriod = chartData.reduce((a, d) => a + d.ventas, 0);
  const salesCount  = sales.filter(s => {
    const cutoff = new Date(); cutoff.setDate(cutoff.getDate() - period);
    return new Date(s.fecha) >= cutoff;
  }).length;
  const maxCat = Math.max(...Object.values(stats.byCat), 1);

  const CustomTip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{ background: "var(--s-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: ".79rem" }}>
        <p style={{ color: "var(--out)", marginBottom: 2 }}>{label}</p>
        <p style={{ fontWeight: 700, color: "var(--p-ctr)" }}>{fmt(payload[0]?.value || 0)}</p>
      </div>
    );
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "¡Buenos días";
    if (h < 18) return "¡Buenas tardes";
    return "¡Buenas noches";
  };

  return (
    <div>
      {/* ── Header con Logo oficial ── */}
      <div className="sec-head" style={{ alignItems: "flex-start", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          {/* Logo MM */}
          <div style={{
            background: "var(--p)", borderRadius: 14, padding: "10px 16px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 4px 16px rgba(13,45,142,.22)",
          }}>
            <Logo variant="full" size={34} white />
          </div>
          <div>
            <h2 className="sec-title" style={{ marginBottom: 2 }}>
              {greeting()}, {currentUser?.nombre?.split(" ")[0]}!
            </h2>
            <p className="sec-sub">
              {fmtDate(new Date().toISOString().slice(0, 10))} · Popayán, Cauca
            </p>
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          {(isAdmin || isVendedor) && (
            <button className="btn btn-amber" onClick={() => nav("/pos")}>
              <Icon n="cart" s={15} />Registrar Venta
            </button>
          )}
          {(isAdmin || isBodeguero) && (
            <button className="btn btn-brand" onClick={() => nav("/productos/registrar")}>
              <Icon n="plus" s={15} />Nuevo Producto
            </button>
          )}
        </div>
      </div>

      {/* ── Alerta de stock bajo (banner) ── */}
      {stats.lowStock > 0 && (
        <div style={{
          display: "flex", alignItems: "center", gap: 12,
          background: "linear-gradient(90deg,#FFF7ED,#FFF3E0)",
          border: "1.5px solid #FED7AA",
          borderLeft: "4px solid #F97316",
          borderRadius: 10, padding: "10px 16px", marginBottom: 16,
          cursor: "pointer",
        }} onClick={() => nav("/productos/stock-bajo")}>
          <Icon n="warning" s={18} style={{ color: "#C2410C" }} />
          <span style={{ flex: 1, fontSize: ".84rem", color: "#7C2D12", fontWeight: 500 }}>
            <strong>{stats.lowStock} variante{stats.lowStock !== 1 ? "s" : ""}</strong> con stock bajo (≤ {LOW_STOCK_THRESHOLD} unidades). Considera realizar un pedido pronto.
          </span>
          <span style={{ fontSize: ".75rem", color: "#C2410C", fontWeight: 600 }}>Ver →</span>
        </div>
      )}

      {/* ── KPIs ── */}
      <div className="kpi-grid">
        <KPI color="b" icon="box"   label="Variantes"        value={fmtN(stats.variants)}   sub={`${products.length} productos activos`} trend="Catálogo" trendDir="neu" />
        <KPI color="g" icon="list"  label="Stock Total"      value={fmtN(stats.stockTotal)} sub="unidades en bodega"    trend="En bodega" trendDir="up" />
        <KPI color="r" icon="alert" label="Stock Bajo"       value={stats.lowStock}         sub={`≤ ${LOW_STOCK_THRESHOLD} unidades`} trend={stats.lowStock > 0 ? "Revisar" : "OK"} trendDir={stats.lowStock > 0 ? "dn" : "up"} />
        <KPI color="a" icon="chart" label="Valor Inventario" value={fmt(stats.totalValue)}  trend="Inventario" trendDir="up" />
      </div>

      {/* ── Gráfico de ventas ── */}
      {(isAdmin || isVendedor) && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-head" style={{ flexWrap: "wrap", gap: 8 }}>
            <div>
              <span className="card-title">Ventas del período</span>
              <span style={{ marginLeft: 10, fontWeight: 700, color: "var(--p-ctr)", fontSize: ".9rem" }}>{fmt(totalPeriod)}</span>
              <span style={{ marginLeft: 8, fontSize: ".75rem", color: "var(--out)" }}>{salesCount} ventas</span>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              {PERIODS.map(p => (
                <button key={p.days}
                  style={{ height: 28, padding: "0 10px", borderRadius: 7, border: "1.5px solid", cursor: "pointer", fontFamily: "DM Sans,sans-serif", fontSize: ".76rem", fontWeight: 600, transition: "all .15s", borderColor: period === p.days ? "var(--p-ctr)" : "var(--border)", background: period === p.days ? "var(--p-fix)" : "var(--s-card)", color: period === p.days ? "var(--p)" : "var(--on-sv)" }}
                  onClick={() => setPeriod(p.days)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: "18px 20px 8px" }}>
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="var(--p-ctr)" stopOpacity={0.18} />
                    <stop offset="95%" stopColor="var(--p-ctr)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: "var(--out)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
                <YAxis tick={{ fontSize: 10, fill: "var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000000 ? `${(v/1000000).toFixed(1)}M` : v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} width={52} />
                <Tooltip content={<CustomTip />} cursor={{ stroke: "#4a72f8", strokeWidth: 1.5, strokeDasharray: "4 2" }} />
                <Area type="monotone" dataKey="ventas" stroke="var(--p-ctr)" strokeWidth={3} fill="url(#gArea)" dot={false} activeDot={{ r: 6, fill: "var(--p-ctr)", stroke: "#fff", strokeWidth: 2.5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Stock por categoría */}
        <div className="card">
          <div className="card-head"><span className="card-title">Stock por categoría</span></div>
          <div style={{ padding: "12px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(stats.byCat).sort((a, b) => b[1] - a[1]).map(([cat, stock]) => (
              <div key={cat}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                  <span style={{ fontSize: ".8rem", color: "var(--on-sv)", fontWeight: 500 }}>{cat}</span>
                  <span style={{ fontSize: ".78rem", fontWeight: 700, color: "var(--p)" }}>{fmtN(stock)} uds</span>
                </div>
                <div style={{ height: 6, background: "var(--border)", borderRadius: 99, overflow: "hidden" }}>
                  <div style={{ width: `${(stock / maxCat) * 100}%`, height: "100%", background: "var(--p-ctr)", borderRadius: 99, transition: "width .5s" }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Alertas de stock bajo */}
        <div className="card">
          <div className="card-head">
            <span className="card-title">
              {lowItems.length > 0 ? "⚠️ Stock bajo — acción requerida" : "✅ Stock en niveles normales"}
            </span>
            {lowItems.length > 0 && (
              <button className="btn btn-outline btn-sm" onClick={() => nav("/productos/stock-bajo")}>Ver todos</button>
            )}
          </div>
          <div style={{ padding: "8px 0" }}>
            {lowItems.length === 0
              ? <div className="empty" style={{ padding: "24px 0" }}><p>Todos los productos tienen stock suficiente</p></div>
              : lowItems.map((it, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 16px", borderBottom: i < lowItems.length - 1 ? "1px solid var(--s-low)" : "none" }}>
                  <div>
                    <div style={{ fontSize: ".84rem", fontWeight: 500, color: "var(--p)" }}>{it.nombre}</div>
                    <div style={{ fontSize: ".72rem", color: "var(--out)" }}>{it.medida}</div>
                  </div>
                  <span className={`stock-tag ${it.stock === 0 ? "s-out" : "s-low"}`}>
                    <span className={`dot ${it.stock === 0 ? "dot-danger" : "dot-warn"}`} />
                    {it.stock === 0 ? "Sin stock" : `${it.stock} uds`}
                  </span>
                </div>
              ))
            }
          </div>
        </div>
      </div>

      {/* ══ ÚLTIMAS VENTAS — componente enriquecido ══ */}
      {(isAdmin || isVendedor) && (
        <UltimasVentas sales={sales} nav={nav} fmt={fmt} fmtDate={fmtDate} />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────
   Componente: UltimasVentas
   Muestra las últimas N ventas con detalle de
   productos, método de pago y acceso rápido.
───────────────────────────────────────────── */
function UltimasVentas({ sales, nav, fmt, fmtDate }) {
  const [expanded, setExpanded] = useState(null);
  const recientes = [...sales].reverse().slice(0, 8);

  // KPIs rápidos del día actual
  const hoy = new Date().toISOString().slice(0, 10);
  const ventasHoy   = sales.filter(s => s.fecha === hoy);
  const totalHoy    = ventasHoy.reduce((a, s) => a + s.total, 0);
  const ticketProm  = ventasHoy.length ? Math.round(totalHoy / ventasHoy.length) : 0;

  return (
    <div className="card" style={{ marginTop: 16 }}>
      {/* Cabecera */}
      <div className="card-head" style={{ alignItems: "flex-start", gap: 16 }}>
        <div>
          <span className="card-title">Últimas ventas</span>
          {ventasHoy.length > 0 && (
            <span style={{
              marginLeft: 12, fontSize: ".72rem", fontWeight: 700,
              padding: "2px 10px", borderRadius: 99,
              background: "var(--ok-bg)", color: "var(--ok-t)",
            }}>
              Hoy: {ventasHoy.length} venta{ventasHoy.length !== 1 ? "s" : ""} · {fmt(totalHoy)}
            </span>
          )}
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => nav("/ventas")}>
          Ver historial completo →
        </button>
      </div>

      {/* Resumen del día si hay ventas hoy */}
      {ventasHoy.length > 0 && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3,1fr)",
          gap: 0, borderBottom: "1px solid var(--s-low)",
        }}>
          {[
            ["Ventas hoy", ventasHoy.length, "transacciones"],
            ["Total del día", fmt(totalHoy), "ingresos"],
            ["Ticket promedio", fmt(ticketProm), "por venta"],
          ].map(([lbl, val, sub], i) => (
            <div key={i} style={{
              padding: "14px 20px",
              borderRight: i < 2 ? "1px solid var(--s-low)" : "none",
              textAlign: "center",
            }}>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "var(--p)" }}>{val}</div>
              <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--out)", textTransform: "uppercase", letterSpacing: ".06em" }}>{lbl}</div>
              <div style={{ fontSize: ".68rem", color: "var(--out)", marginTop: 1 }}>{sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabla de ventas */}
      <div className="tw">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Método pago</th>
              <th>Vendedor</th>
              <th style={{ textAlign: "right" }}>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {recientes.length === 0 ? (
              <tr>
                <td colSpan={8}>
                  <div className="empty" style={{ padding: "40px 20px" }}>
                    <Icon n="list" s={36} />
                    <p>Las ventas registradas aparecerán aquí automáticamente</p>
                  </div>
                </td>
              </tr>
            ) : recientes.map((s, idx) => {
              const isOpen = expanded === s.id;
              const metodoPago = s.pagos?.map(p => p.metodo).join(" + ") || "Efectivo";
              const itemsResumen = (s.items || []).slice(0, 2).map(it => it.nombre).join(", ") + (s.items?.length > 2 ? ` +${s.items.length - 2}` : "");
              return (
                <Fragment key={s.id}>
                  <tr style={{ cursor: "pointer" }} onClick={() => setExpanded(isOpen ? null : s.id)}>
                    <td style={{ fontSize: ".72rem", color: "var(--out)", fontWeight: 700 }}>
                      #{s.id.slice(0, 6).toUpperCase()}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "var(--out)" }}>{fmtDate(s.fecha)}</td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: ".85rem", color: "var(--on-s)" }}>{s.cliente}</div>
                      {s.cedula && <div style={{ fontSize: ".7rem", color: "var(--out)" }}>CC {s.cedula}</div>}
                    </td>
                    <td style={{ fontSize: ".79rem", color: "var(--on-sv)", maxWidth: 180 }}>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {itemsResumen || "—"}
                      </span>
                    </td>
                    <td>
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        fontSize: ".72rem", fontWeight: 600, padding: "2px 9px",
                        borderRadius: 99, background: "var(--s-low)", color: "var(--sec)",
                      }}>
                        {metodoPago}
                      </span>
                    </td>
                    <td style={{ fontSize: ".8rem", color: "var(--on-sv)" }}>{s.vendedor}</td>
                    <td style={{ textAlign: "right", fontFamily: "'Manrope',sans-serif", fontWeight: 800, color: "var(--p)", fontSize: ".95rem" }}>
                      {fmt(s.total)}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{ fontSize: ".72rem", color: "var(--out)", transition: "transform .2s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "" }}>▾</span>
                    </td>
                  </tr>
                  {/* Fila detalle expandible */}
                  {isOpen && (
                    <tr>
                      <td colSpan={8} style={{ padding: 0, background: "var(--s-low)" }}>
                        <div style={{ padding: "12px 20px" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, alignItems: "start" }}>
                            {/* Productos */}
                            <div>
                              <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--out)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                                Detalle de productos
                              </div>
                              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                                {(s.items || []).map((it, i) => (
                                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "var(--s-card)", borderRadius: 8 }}>
                                    <div>
                                      <span style={{ fontSize: ".82rem", fontWeight: 600, color: "var(--on-s)" }}>{it.nombre}</span>
                                      <span style={{ fontSize: ".72rem", color: "var(--out)", marginLeft: 8 }}>{it.medida}</span>
                                      {it.color && <span style={{ fontSize: ".72rem", color: "var(--sec)", marginLeft: 6 }}>· {it.color}</span>}
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                      <div style={{ fontSize: ".8rem", fontWeight: 700, color: "var(--p)" }}>{fmt(it.precio * it.cant)}</div>
                                      <div style={{ fontSize: ".69rem", color: "var(--out)" }}>{it.cant} × {fmt(it.precio)}</div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                            {/* Resumen cobro */}
                            <div style={{ minWidth: 180, background: "var(--s-card)", borderRadius: 10, padding: "12px 16px" }}>
                              <div style={{ fontSize: ".7rem", fontWeight: 700, color: "var(--out)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Cobro</div>
                              {[
                                ["Subtotal", fmt(s.subtotal)],
                                s.descuento > 0 ? ["Descuento", `- ${fmt(s.descuento)}`] : null,
                                s.impuesto > 0 ? ["IVA", fmt(s.impuesto)] : null,
                                ["Total", fmt(s.total)],
                                ["Recibido", fmt(s.entregado)],
                                s.cambio > 0 ? ["Cambio", fmt(s.cambio)] : null,
                              ].filter(Boolean).map(([l, v]) => (
                                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: l === "Total" ? ".88rem" : ".78rem", fontWeight: l === "Total" ? 800 : 400, color: l === "Total" ? "var(--p)" : "var(--on-sv)", marginBottom: 3, paddingTop: l === "Total" ? 6 : 0, borderTop: l === "Total" ? "1px solid var(--s-mid)" : "none" }}>
                                  <span>{l}</span><span>{v}</span>
                                </div>
                              ))}
                              <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid var(--s-low)", fontSize: ".72rem", color: "var(--ok-t)", fontWeight: 600 }}>
                                ✓ {s.pagos?.map(p => `${p.metodo}: ${fmt(p.monto)}`).join(" + ") || "Pagada"}
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            }) }
          </tbody>
        </table>
      </div>
    </div>
  );
}
