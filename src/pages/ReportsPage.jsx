import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LineChart, Line } from "recharts";
import { useApp } from "../context/AppContext.jsx";
import { fmt, fmtN } from "../utils/format.js";
import { CATEGORIAS } from "../data/initialData.js";
import Icon from "../components/Icons.jsx";

const COLORS = ["#003fb1","#1a56db","#4a72f8","#E09A3F","#F5D49A","#16A34A","#DC2626","#DDA0B0"];

function daysAgo(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); }

export default function ReportsPage() {
  const { products, sales } = useApp();
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo, setDateTo]     = useState(new Date().toISOString().slice(0, 10));

  const salesInRange = useMemo(() =>
    sales.filter(s => s.fecha >= dateFrom && s.fecha <= dateTo),
    [sales, dateFrom, dateTo]
  );

  const byCat = useMemo(() => CATEGORIAS.map(cat => {
    const ps = products.filter(p => p.categoria === cat);
    const stock = ps.reduce((a, p) => a + p.variantes.reduce((b, v) => b + v.stock, 0), 0);
    const value = ps.reduce((a, p) => a + p.variantes.reduce((b, v) => b + v.stock * v.precio, 0), 0);
    return { cat, prods: ps.length, stock, value };
  }).filter(r => r.prods > 0), [products]);

  const totalValue  = byCat.reduce((a, r) => a + r.value, 0);
  const totalSales  = salesInRange.reduce((a, s) => a + s.total, 0);
  const totalAllSales = sales.reduce((a, s) => a + s.total, 0);

  const top10 = useMemo(() => {
    const rows = [];
    products.forEach(p => p.variantes.forEach(v => rows.push({ nombre: p.nombre, medida: v.medida, precio: v.precio, stock: v.stock, value: v.precio * v.stock })));
    return rows.sort((a, b) => b.value - a.value).slice(0, 10);
  }, [products]);

  const salesByCat = useMemo(() => {
    const map = {};
    salesInRange.forEach(s => (s.items || []).forEach(it => {
      const cat = products.find(p => p.nombre === it.nombre)?.categoria || "Otros";
      map[cat] = (map[cat] || 0) + it.cant * it.precio;
    }));
    return Object.entries(map).map(([cat, ventas]) => ({ cat, ventas })).sort((a, b) => b.ventas - a.ventas);
  }, [salesInRange, products]);

  const dailyChart = useMemo(() => {
    const map = {};
    salesInRange.forEach(s => { map[s.fecha] = (map[s.fecha] || 0) + s.total; });
    const days = [];
    const from = new Date(dateFrom), to = new Date(dateTo);
    for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
      const k = d.toISOString().slice(0, 10);
      days.push({ fecha: k, ventas: map[k] || 0, label: d.toLocaleDateString("es-CO", { month: "short", day: "numeric" }) });
    }
    return days.slice(-60);  // max 60 puntos
  }, [salesInRange, dateFrom, dateTo]);

  const Tip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return <div style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: 8, padding: "8px 12px", fontSize: ".79rem" }}>
      <p style={{ color: "var(--out)", marginBottom: 2 }}>{label}</p>
      <p style={{ fontWeight: 700, color: "var(--p-ctr)" }}>{fmt(payload[0]?.value || 0)}</p>
    </div>;
  };

  const presets = [
    { label: "Hoy",       from: daysAgo(0),  to: new Date().toISOString().slice(0, 10) },
    { label: "7 días",    from: daysAgo(7),  to: new Date().toISOString().slice(0, 10) },
    { label: "30 días",   from: daysAgo(30), to: new Date().toISOString().slice(0, 10) },
    { label: "3 meses",   from: daysAgo(90), to: new Date().toISOString().slice(0, 10) },
  ];

  return (
    <div>
      <div className="sec-head"><div><h2 className="sec-title">Reportes</h2><p className="sec-sub">Análisis de ventas e inventario</p></div></div>

      {/* Selector de rango */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head">
          <span className="card-title">Rango de fechas</span>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            {presets.map(p => (
              <button key={p.label} className="btn btn-outline btn-sm"
                style={{ borderColor: dateFrom === p.from && dateTo === p.to ? "var(--p-ctr)" : undefined, background: dateFrom === p.from && dateTo === p.to ? "var(--p-fix)" : undefined, color: dateFrom === p.from && dateTo === p.to ? "var(--p)" : undefined }}
                onClick={() => { setDateFrom(p.from); setDateTo(p.to); }}>
                {p.label}
              </button>
            ))}
            <input className="inp" type="date" style={{ width: 135, height: 30 }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
            <span style={{ color: "var(--out)" }}>—</span>
            <input className="inp" type="date" style={{ width: 135, height: 30 }} value={dateTo}   onChange={e => setDateTo(e.target.value)} />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid" style={{ marginBottom: 16 }}>
        <div className="kpi g"><div className="kpi-ico g"><Icon n="chart" s={20} /></div><div className="kpi-label">Valor Inventario</div><div className="kpi-val sm">{fmt(totalValue)}</div></div>
        <div className="kpi a"><div className="kpi-ico a"><Icon n="money" s={20} /></div><div className="kpi-label">Ventas en rango</div><div className="kpi-val sm">{fmt(totalSales)}</div></div>
        <div className="kpi b"><div className="kpi-ico b"><Icon n="cart" s={20} /></div><div className="kpi-label">N.° ventas</div><div className="kpi-val">{salesInRange.length}</div></div>
        <div className="kpi r"><div className="kpi-ico r"><Icon n="users" s={20} /></div><div className="kpi-label">Ticket promedio</div><div className="kpi-val sm">{fmt(salesInRange.length ? totalSales / salesInRange.length : 0)}</div></div>
      </div>

      {/* Ventas diarias */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><span className="card-title">Ventas diarias — {fmt(totalSales)}</span></div>
        <div style={{ padding: "14px 18px" }}>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={dailyChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: "var(--out)" }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: "var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v} />
              <Tooltip content={<Tip />} cursor={{ stroke: "#4a72f8", strokeWidth: 1, strokeDasharray: "4 2" }} />
              <Line type="monotone" dataKey="ventas" stroke="var(--p-ctr)" strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: "var(--p-ctr)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
        {/* Inventario por cat */}
        <div className="card">
          <div className="card-head"><span className="card-title">Valor en stock por categoría</span></div>
          <div style={{ padding: "12px 16px" }}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={byCat} layout="vertical" barCategoryGap="25%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 9, fill: "var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000000).toFixed(1)}M`} />
                <YAxis type="category" dataKey="cat" tick={{ fontSize: 9, fill: "var(--on-sv)" }} axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={v => [fmt(v), "Valor"]} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>{byCat.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ventas por cat */}
        <div className="card">
          <div className="card-head"><span className="card-title">Ventas por categoría (rango)</span></div>
          <div style={{ padding: "12px 16px" }}>
            {salesByCat.length === 0
              ? <div className="empty" style={{ padding: "30px 0" }}><p>Sin ventas en este rango</p></div>
              : <ResponsiveContainer width="100%" height={200}>
                <BarChart data={salesByCat} layout="vertical" barCategoryGap="25%">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="cat" tick={{ fontSize: 9, fill: "var(--on-sv)" }} axisLine={false} tickLine={false} width={120} />
                  <Tooltip formatter={v => [fmt(v), "Ventas"]} />
                  <Bar dataKey="ventas" fill="var(--amber)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            }
          </div>
        </div>
      </div>

      {/* Resumen por categoría */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><span className="card-title">Resumen por categoría</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>Categoría</th><th>Productos</th><th>Stock</th><th>Valor Total</th><th>% del inventario</th></tr></thead>
            <tbody>
              {byCat.map(r => (
                <tr key={r.cat}>
                  <td style={{ fontWeight: 600 }}>{r.cat}</td>
                  <td>{r.prods}</td>
                  <td>{fmtN(r.stock)} uds</td>
                  <td style={{ fontWeight: 700, color: "var(--p)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.value)}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ flex: 1, height: 7, background: "var(--border)", borderRadius: 99, overflow: "hidden", minWidth: 80 }}>
                        <div style={{ width: `${totalValue > 0 ? (r.value / totalValue * 100) : 0}%`, height: "100%", background: "var(--p-ctr)", borderRadius: 99 }} />
                      </div>
                      <span style={{ fontSize: ".74rem", minWidth: 38, textAlign: "right" }}>{totalValue > 0 ? (r.value / totalValue * 100).toFixed(1) : 0}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-sum"><span>Valor total: <strong>{fmt(totalValue)}</strong></span><span>Total vendido (histórico): <strong>{fmt(totalAllSales)}</strong></span></div>
      </div>

      {/* Top 10 */}
      <div className="card">
        <div className="card-head"><span className="card-title">Top 10 — Mayor valor en stock</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>#</th><th>Producto</th><th>Medida</th><th>Precio</th><th>Stock</th><th>Valor</th></tr></thead>
            <tbody>
              {top10.map((r, i) => (
                <tr key={i}>
                  <td style={{ color: "var(--out)", fontWeight: 700 }}>#{i + 1}</td>
                  <td style={{ fontWeight: 600 }}>{r.nombre}</td>
                  <td style={{ color: "var(--on-sv)" }}>{r.medida}</td>
                  <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(r.precio)}</td>
                  <td>{r.stock}</td>
                  <td style={{ fontWeight: 700, color: "var(--p)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
