import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmt, fmtDate } from "../utils/format.js";
import { printFactura } from "../utils/pdf.js";
import { printFacturaWindow } from "../utils/printWindow.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";

const PG = 20;

export default function SalesHistory() {
  const { sales, empresa } = useApp();
  const [search, setSearch]     = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo]     = useState("");
  const [detail, setDetail]     = useState(null);
  const [pg, setPg]             = useState(1);

  const filtered = useMemo(() => {
    return [...sales].reverse().filter(s => {
      if (dateFrom && s.fecha < dateFrom) return false;
      if (dateTo   && s.fecha > dateTo)   return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.cliente?.toLowerCase().includes(q) &&
            !s.id?.toLowerCase().includes(q) &&
            !s.vendedor?.toLowerCase().includes(q) &&
            !(s.items || []).some(it => it.nombre.toLowerCase().includes(q))) return false;
      }
      return true;
    });
  }, [sales, search, dateFrom, dateTo]);

  const pages = Math.ceil(filtered.length / PG);
  const paged = filtered.slice((pg - 1) * PG, pg * PG);
  const totalFiltrado = filtered.reduce((a, s) => a + s.total, 0);

  return (
    <div>
      <div className="sec-head">
        <div><h2 className="sec-title">Historial de Ventas</h2>
          <p className="sec-sub">{filtered.length} venta(s) · Total: {fmt(totalFiltrado)}</p>
        </div>
      </div>

      <div className="card">
        {/* Filtros */}
        <div className="card-head" style={{ flexWrap: "wrap", gap: 10 }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <span className="si"><Icon n="search" /></span>
            <input className="inp" placeholder="Buscar por cliente, vendedor, producto..."
              value={search} onChange={e => { setSearch(e.target.value); setPg(1); }} />
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input className="inp" type="date" style={{ width: 140 }} value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPg(1); }} />
            <span style={{ color: "var(--out)", fontSize: ".8rem" }}>—</span>
            <input className="inp" type="date" style={{ width: 140 }} value={dateTo}   onChange={e => { setDateTo(e.target.value);   setPg(1); }} />
            {(dateFrom || dateTo || search) && (
              <button className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setDateFrom(""); setDateTo(""); setPg(1); }}>
                <Icon n="close" s={13} />Limpiar
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="tw">
          <table>
            <thead>
              <tr><th>N.° Venta</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Pago</th><th>Vendedor</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={8}><div className="empty"><Icon n="list" s={40} /><p>Sin ventas registradas</p></div></td></tr>
                : paged.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontWeight: 600, color: "var(--p-ctr)", fontSize: ".8rem" }}>
                      #{s.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td style={{ fontSize: ".82rem", whiteSpace: "nowrap" }}>{fmtDate(s.fecha)}</td>
                    <td style={{ fontWeight: 500 }}>{s.cliente}</td>
                    <td style={{ fontSize: ".8rem", color: "var(--on-sv)", maxWidth: 200 }}>
                      {(s.items || []).map(it => `${it.nombre} ×${it.cant}`).join(", ")}
                    </td>
                    <td style={{ fontWeight: 700, color: "var(--p)", fontVariantNumeric: "tabular-nums" }}>{fmt(s.total)}</td>
                    <td style={{ fontSize: ".78rem" }}>
                      {(s.pagos || []).map(p => (
                        <span key={p.metodo} className="bg bg-blue" style={{ marginRight: 3, fontSize: ".68rem" }}>{p.metodo}</span>
                      ))}
                    </td>
                    <td style={{ fontSize: ".8rem", color: "var(--on-sv)" }}>{s.vendedor}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-outline btn-sm btn-icon" title="Ver detalle" onClick={() => setDetail(s)}>
                          <Icon n="eye" />
                        </button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Reimprimir recibo" onClick={() => printFactura(s, empresa)}>
                          <Icon n="pdf" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="card-sum">
            <span>Ventas: <strong>{filtered.length}</strong></span>
            <span>Total facturado: <strong>{fmt(totalFiltrado)}</strong></span>
            <span>Ticket promedio: <strong>{fmt(filtered.length ? totalFiltrado / filtered.length : 0)}</strong></span>
          </div>
        )}

        {pages > 1 && (
          <div className="pgn">
            <span className="pg-info">Pág. {pg}/{pages}</span>
            <button className="pg-btn" onClick={() => setPg(p => Math.max(1, p - 1))} disabled={pg === 1}>‹</button>
            {Array.from({ length: Math.min(5, pages) }, (_, i) => {
              const n = Math.max(1, Math.min(pg - 2, pages - 4)) + i;
              return <button key={n} className={`pg-btn ${pg === n ? "on" : ""}`} onClick={() => setPg(n)}>{n}</button>;
            })}
            <button className="pg-btn" onClick={() => setPg(p => Math.min(pages, p + 1))} disabled={pg === pages}>›</button>
          </div>
        )}
      </div>

      {/* Modal detalle de venta */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Venta #${detail?.id?.slice(0, 8).toUpperCase()}`} maxW={500}
        footer={<>
          <button className="btn btn-outline" onClick={() => setDetail(null)}>Cerrar</button>
          <button className="btn btn-outline" onClick={() => detail && printFacturaWindow(detail, empresa)}><Icon n="print" />Imprimir</button>
          <button className="btn btn-brand" onClick={() => detail && printFactura(detail, empresa)}><Icon n="pdf" />PDF</button>
        </>}>
        {detail && (
          <div>
            <div className="f2" style={{ marginBottom: 12 }}>
              {[["Fecha", fmtDate(detail.fecha)], ["Cliente", detail.cliente], ["Cédula/NIT", detail.cedula || "—"], ["Teléfono", detail.telefono || "—"], ["Dirección", detail.direccion || "—"], ["Vendedor", detail.vendedor]].map(([l, v]) => (
                <div key={l}>
                  <div style={{ fontSize: ".71rem", color: "var(--out)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{l}</div>
                  <div style={{ fontWeight: 500, fontSize: ".88rem" }}>{v}</div>
                </div>
              ))}
            </div>
            <div className="fdiv" />
            <div className="fsub">Productos</div>
            <table style={{ width: "100%", marginBottom: 12 }}>
              <thead><tr><th>Producto</th><th>Med.</th><th>Color</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detail.items?.map((it, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 500, fontSize: ".84rem" }}>{it.nombre}</td>
                    <td style={{ fontSize: ".8rem" }}>{it.medida}</td>
                    <td style={{ fontSize: ".8rem" }}>{it.color || "—"}</td>
                    <td>{it.cant}</td>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: ".82rem" }}>{fmt(it.precio)}</td>
                    <td style={{ fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{fmt(it.cant * it.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ background: "var(--p-fix)", border: "1px solid var(--p-fix-dim)", borderRadius: 9, padding: "12px 16px" }}>
              {[
                ["Subtotal",  fmt(detail.subtotal)],
                detail.descuento > 0 ? ["Descuento", `- ${fmt(detail.descuento)}`] : null,
                detail.impuesto > 0  ? ["IVA",       fmt(detail.impuesto)]         : null,
                ["Total",    fmt(detail.total)],
                ["Recibido", fmt(detail.entregado || detail.total)],
                (detail.cambio > 0)  ? ["Cambio",    fmt(detail.cambio)]            : null,
              ].filter(Boolean).map(([l, v]) => (
                <div key={l} style={{ display: "flex", justifyContent: "space-between", fontSize: l === "Total" ? ".95rem" : ".83rem", fontWeight: l === "Total" ? 700 : 400, marginTop: 4, color: l === "Cambio" ? "var(--ok)" : "var(--text-dk,#0F172A)" }}>
                  <span>{l}:</span><span>{v}</span>
                </div>
              ))}
              {detail.cambio > 0 && detail.metodoCambio && (
                <div style={{ fontSize: ".75rem", color: "var(--ok)", marginTop: 2 }}>
                  Cambio devuelto por: <strong>{detail.metodoCambio}</strong>
                </div>
              )}
              <div className="fdiv" style={{ margin: "8px 0" }} />
              <div style={{ fontSize: ".78rem", color: "var(--on-sv)" }}>
                <strong>Forma de pago:</strong> {detail.pagos?.map(p => `${p.metodo}: ${fmt(p.monto)}`).join(" + ")}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
