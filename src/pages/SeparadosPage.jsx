/**
 * SeparadosPage.jsx — Módulo de Separados · v2.0 (simplificado)
 * ──────────────────────────────────────────────────────────────
 * Interfaz simple y rápida para uso en tienda.
 * Campos claros: cliente + producto + abono + saldo.
 * Pensado para empleados, no para técnicos.
 */
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/initialData.js";
import { fmt, fmtDate, today } from "../utils/format.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";

const ESTADOS = ["Pendiente", "Abonado", "Completado", "Cancelado"];
const ESTADO_COLOR = {
  "Pendiente":  { bg: "#DBEAFE", color: "#1d4ed8" },
  "Abonado":    { bg: "#FEF3C7", color: "#d97706" },
  "Completado": { bg: "#D1FAE5", color: "#059669" },
  "Cancelado":  { bg: "#FEE2E2", color: "#dc2626" },
};

const BLANK = () => ({
  cliente: "", cedula: "", telefono: "", direccion: "",
  producto: "", medida: "", color: "",
  valorProducto: "", abono: "",
  fecha: today(), notas: "", estado: "Pendiente",
});

function EstadoPill({ estado }) {
  const s = ESTADO_COLOR[estado] || ESTADO_COLOR["Pendiente"];
  return (
    <span style={{
      display: "inline-flex", alignItems: "center",
      padding: "3px 11px", borderRadius: 99,
      fontSize: ".72rem", fontWeight: 700,
      background: s.bg, color: s.color,
      border: `1px solid ${s.color}33`,
    }}>{estado}</span>
  );
}

export default function SeparadosPage() {
  const { separados = [], setSeparados, currentUser, toast } = useApp();

  const [search,     setSearch]     = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [detalle,    setDetalle]    = useState(null);
  const [form,       setForm]       = useState(BLANK());

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }));

  /* Cálculos en tiempo real */
  const valor  = Number(form.valorProducto) || 0;
  const abono  = Number(form.abono)         || 0;
  const saldo  = Math.max(0, valor - abono);

  /* Abrir formulario */
  const openNew = () => {
    setEditId(null);
    setForm(BLANK());
    setShowForm(true);
  };

  const openEdit = (sep) => {
    setEditId(sep.id);
    setForm({ ...sep });
    setShowForm(true);
  };

  /* Guardar */
  const handleGuardar = () => {
    if (!form.cliente.trim())  { toast("Ingresa el nombre del cliente", false); return; }
    if (!form.producto.trim()) { toast("Ingresa el producto separado", false);  return; }
    if (!valor)                { toast("Ingresa el valor del producto", false);  return; }

    const numero = editId
      ? (separados.find(s => s.id === editId)?.numero || `SEP-${String((separados.length) + 1).padStart(4,"0")}`)
      : `SEP-${String((separados.length) + 1).padStart(4,"0")}`;

    const sep = {
      ...form,
      id:            editId || uid(),
      numero,
      valorProducto: valor,
      abono,
      saldo,
      vendedor:      currentUser?.nombre || "Admin",
      createdAt:     editId ? (separados.find(s => s.id === editId)?.createdAt || today()) : today(),
      updatedAt:     today(),
    };

    if (editId) {
      setSeparados(prev => prev.map(s => s.id === editId ? sep : s));
      toast("Separado actualizado");
    } else {
      setSeparados(prev => [...prev, sep]);
      toast("Separado registrado exitosamente");
    }
    setShowForm(false);
    setEditId(null);
  };

  /* Cambiar estado */
  const cambiarEstado = (id, estado) => {
    setSeparados(prev => prev.map(s => s.id === id ? { ...s, estado, updatedAt: today() } : s));
  };

  /* Eliminar */
  const eliminar = (id) => {
    if (!window.confirm("¿Eliminar este separado?")) return;
    setSeparados(prev => prev.filter(s => s.id !== id));
    toast("Separado eliminado");
  };

  /* Filtrado */
  const filtrados = useMemo(() => {
    let rows = [...(separados || [])].reverse();
    if (filtEstado) rows = rows.filter(s => s.estado === filtEstado);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter(s =>
        s.cliente?.toLowerCase().includes(q) ||
        s.producto?.toLowerCase().includes(q) ||
        s.cedula?.includes(q) ||
        s.numero?.toLowerCase().includes(q)
      );
    }
    return rows;
  }, [separados, search, filtEstado]);

  /* KPIs */
  const kpis = useMemo(() => {
    const todos = separados || [];
    const activos = todos.filter(s => s.estado === "Pendiente" || s.estado === "Abonado");
    return {
      total:     todos.length,
      activos:   activos.length,
      porCobrar: activos.reduce((a, s) => a + (s.saldo || 0), 0),
      abonos:    todos.reduce((a, s) => a + (Number(s.abono) || 0), 0),
    };
  }, [separados]);

  /* ── RENDER ── */
  return (
    <div>
      {/* Encabezado */}
      <div className="sec-head">
        <div>
          <h2 className="sec-title">Separados</h2>
          <p className="sec-sub">Productos apartados por clientes con abono</p>
        </div>
        <button className="btn btn-brand" onClick={openNew}>
          <Icon n="plus" s={15} />Nuevo separado
        </button>
      </div>

      {/* KPIs compactos */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 12, marginBottom: 20 }}>
        {[
          { label: "Total separados", value: kpis.total,         icon: "list",  color: "#003fb1", bg: "#dbe1ff" },
          { label: "Activos",         value: kpis.activos,       icon: "alert", color: "#d97706", bg: "#fef3c7" },
          { label: "Por cobrar",      value: fmt(kpis.porCobrar),icon: "cash",  color: "#dc2626", bg: "#ffdad6" },
          { label: "Total abonado",   value: fmt(kpis.abonos),   icon: "check", color: "#059669", bg: "#d1fae5" },
        ].map(k => (
          <div key={k.label} style={{
            background: "#fff", borderRadius: 14, padding: "16px 18px",
            display: "flex", alignItems: "center", gap: 14,
            boxShadow: "0 2px 8px rgba(25,28,30,.06)",
            border: "1px solid rgba(203,213,225,.2)",
          }}>
            <div style={{ width: 42, height: 42, borderRadius: 11, background: k.bg, display: "flex", alignItems: "center", justifyContent: "center", color: k.color, flexShrink: 0 }}>
              <Icon n={k.icon} s={20} />
            </div>
            <div>
              <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.2rem", color: "#191c1e", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 3 }}>{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
          <span className="si"><Icon n="search" /></span>
          <input className="inp" placeholder="Buscar por cliente, producto, cédula..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="inp sel" style={{ width: 170 }}
          value={filtEstado} onChange={e => setFiltEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e}>{e}</option>)}
        </select>
        {(search || filtEstado) && (
          <button className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setFiltEstado(""); }}>
            Limpiar
          </button>
        )}
        <span style={{ fontSize: ".74rem", color: "var(--out)", marginLeft: "auto" }}>
          {filtrados.length} registro{filtrados.length !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Tabla de separados */}
      <div className="card">
        {filtrados.length === 0 ? (
          <div className="empty">
            <Icon n="list" s={40} />
            <p>{(separados || []).length === 0 ? "Aún no hay separados. Crea el primero." : "Sin resultados."}</p>
            {(separados || []).length === 0 && (
              <button className="btn btn-brand" onClick={openNew} style={{ marginTop: 12 }}>
                <Icon n="plus" s={14} />Registrar primer separado
              </button>
            )}
          </div>
        ) : (
          <div className="tw">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Producto</th>
                  <th>Fecha</th>
                  <th style={{ textAlign: "right" }}>Valor</th>
                  <th style={{ textAlign: "right" }}>Abono</th>
                  <th style={{ textAlign: "right" }}>Saldo</th>
                  <th>Estado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--out)" }}>
                      {s.numero || s.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, fontSize: ".86rem" }}>{s.cliente}</div>
                      {s.cedula    && <div style={{ fontSize: ".7rem", color: "var(--out)" }}>CC {s.cedula}</div>}
                      {s.telefono  && <div style={{ fontSize: ".7rem", color: "var(--out)" }}>📞 {s.telefono}</div>}
                    </td>
                    <td>
                      <div style={{ fontWeight: 500, fontSize: ".84rem" }}>{s.producto}</div>
                      {s.medida && <div style={{ fontSize: ".72rem", color: "var(--out)" }}>{s.medida}{s.color ? ` · ${s.color}` : ""}</div>}
                    </td>
                    <td style={{ fontSize: ".78rem", color: "var(--out)" }}>{fmtDate(s.fecha)}</td>
                    <td style={{ textAlign: "right", fontWeight: 700, fontFamily: "'Manrope',sans-serif", color: "var(--on-s)" }}>
                      {fmt(s.valorProducto || 0)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--ok-t)" }}>
                      {fmt(Number(s.abono) || 0)}
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700, color: (s.saldo || 0) > 0 ? "var(--warn)" : "var(--ok-t)" }}>
                      {fmt(s.saldo || 0)}
                    </td>
                    <td>
                      <select className="inp sel"
                        style={{ height: 30, fontSize: ".73rem", width: 122, padding: "0 8px" }}
                        value={s.estado}
                        onChange={e => cambiarEstado(s.id, e.target.value)}>
                        {ESTADOS.map(e => <option key={e}>{e}</option>)}
                      </select>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button className="btn btn-outline btn-sm btn-icon" title="Ver detalle"
                          onClick={() => setDetalle(s)}>
                          <Icon n="search" s={13} />
                        </button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar"
                          onClick={() => openEdit(s)}>
                          <Icon n="edit" s={13} />
                        </button>
                        <button className="btn btn-ghost-danger btn-sm btn-icon" title="Eliminar"
                          onClick={() => eliminar(s.id)}>
                          <Icon n="trash" s={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          MODAL: FORMULARIO — SIMPLE Y CLARO
      ══════════════════════════════════════════ */}
      <Modal open={showForm} onClose={() => setShowForm(false)}
        title={editId ? "Editar separado" : "Nuevo separado"} maxW={640}>

        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* ── DATOS DEL CLIENTE ── */}
          <div style={{ background: "var(--s-low)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: "1.1rem" }}>👤</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: ".95rem", color: "var(--on-s)" }}>
                Datos del cliente
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="fg" style={{ gridColumn: "1/-1", marginBottom: 0 }}>
                <label>Nombre completo *</label>
                <input className="inp" placeholder="Ej: María García López"
                  value={form.cliente} onChange={e => setF("cliente", e.target.value)} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Cédula / NIT</label>
                <input className="inp" placeholder="Ej: 1234567890"
                  value={form.cedula} onChange={e => setF("cedula", e.target.value)} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Teléfono</label>
                <input className="inp" placeholder="Ej: 316 714 5208"
                  value={form.telefono} onChange={e => setF("telefono", e.target.value)} />
              </div>
              <div className="fg" style={{ gridColumn: "1/-1", marginBottom: 0 }}>
                <label>Dirección</label>
                <input className="inp" placeholder="Ej: Cra 4 # 13-08, Popayán"
                  value={form.direccion} onChange={e => setF("direccion", e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── PRODUCTO SEPARADO ── */}
          <div style={{ background: "var(--s-low)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: "1.1rem" }}>🛋</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: ".95rem", color: "var(--on-s)" }}>
                Producto separado
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div className="fg" style={{ gridColumn: "1/-1", marginBottom: 0 }}>
                <label>Nombre del producto *</label>
                <input className="inp" placeholder="Ej: Sofá esquinero 3 puestos"
                  value={form.producto} onChange={e => setF("producto", e.target.value)} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Medidas / Referencia</label>
                <input className="inp" placeholder="Ej: 2.40m × 1.60m"
                  value={form.medida} onChange={e => setF("medida", e.target.value)} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Color</label>
                <input className="inp" placeholder="Ej: Gris marengo"
                  value={form.color} onChange={e => setF("color", e.target.value)} />
              </div>
            </div>
          </div>

          {/* ── VALORES ── */}
          <div style={{ background: "var(--s-low)", borderRadius: 12, padding: "18px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: "1.1rem" }}>💰</span>
              <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: ".95rem", color: "var(--on-s)" }}>
                Valores
              </span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Valor del producto * (COP)</label>
                <input className="inp" type="number" min="0" step="1000"
                  placeholder="Ej: 1200000"
                  value={form.valorProducto || ""}
                  onChange={e => setF("valorProducto", e.target.value)} />
              </div>
              <div className="fg" style={{ marginBottom: 0 }}>
                <label>Cuánto separó / Abono (COP)</label>
                <input className="inp" type="number" min="0" step="1000"
                  placeholder="Ej: 200000"
                  value={form.abono || ""}
                  onChange={e => setF("abono", e.target.value)} />
              </div>
            </div>

            {/* Resumen visual en tiempo real */}
            {valor > 0 && (
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
                gap: 10, padding: "12px 14px",
                background: "#1a1d2e", borderRadius: 10,
              }}>
                {[
                  ["Valor producto", fmt(valor),  "#94a3b8"],
                  ["Abono recibido", fmt(abono),  "#6ee7b7"],
                  ["Saldo pendiente",fmt(saldo),  saldo > 0 ? "#fbbf24" : "#6ee7b7"],
                ].map(([l, v, c]) => (
                  <div key={l} style={{ textAlign: "center" }}>
                    <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: c }}>{v}</div>
                    <div style={{ fontSize: "10px", color: "rgba(255,255,255,.4)", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 3 }}>{l}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── FECHA, ESTADO Y NOTAS ── */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Fecha del separado</label>
              <input className="inp" type="date" value={form.fecha}
                onChange={e => setF("fecha", e.target.value)} />
            </div>
            <div className="fg" style={{ marginBottom: 0 }}>
              <label>Estado</label>
              <select className="inp sel" value={form.estado}
                onChange={e => setF("estado", e.target.value)}>
                {ESTADOS.map(e => <option key={e}>{e}</option>)}
              </select>
            </div>
            <div className="fg" style={{ gridColumn: "1/-1", marginBottom: 0 }}>
              <label>Notas adicionales</label>
              <textarea className="inp" rows={2}
                placeholder="Fecha de entrega, color específico, condiciones..."
                style={{ height: 64, resize: "vertical", lineHeight: 1.5 }}
                value={form.notas} onChange={e => setF("notas", e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--s-mid)" }}>
          <button className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
          <button className="btn btn-brand" style={{ minWidth: 180 }} onClick={handleGuardar}>
            <Icon n="check" s={15} />{editId ? "Guardar cambios" : "Registrar separado"}
          </button>
        </div>
      </Modal>

      {/* ══ MODAL DETALLE ══ */}
      {detalle && (
        <Modal open={!!detalle} onClose={() => setDetalle(null)}
          title={`Separado ${detalle.numero || detalle.id.slice(0, 8)}`} maxW={480}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

            {/* Cliente */}
            <div style={{ padding: "14px 16px", background: "var(--p-fix)", borderRadius: 10, border: "1px solid var(--p-fix-dim)" }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--out)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>👤 Cliente</div>
              <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--on-s)" }}>{detalle.cliente}</div>
              <div style={{ fontSize: ".78rem", color: "var(--out)", marginTop: 4, display: "flex", flexWrap: "wrap", gap: 10 }}>
                {detalle.cedula    && <span>CC {detalle.cedula}</span>}
                {detalle.telefono  && <span>📞 {detalle.telefono}</span>}
                {detalle.direccion && <span>📍 {detalle.direccion}</span>}
              </div>
            </div>

            {/* Producto */}
            <div style={{ padding: "14px 16px", background: "var(--s-low)", borderRadius: 10 }}>
              <div style={{ fontSize: ".68rem", fontWeight: 700, color: "var(--out)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>🛋 Producto</div>
              <div style={{ fontWeight: 700, fontSize: ".92rem", color: "var(--on-s)" }}>{detalle.producto}</div>
              <div style={{ fontSize: ".78rem", color: "var(--out)", marginTop: 3 }}>
                {detalle.medida && <span>{detalle.medida}</span>}
                {detalle.medida && detalle.color && <span style={{ margin: "0 6px" }}>·</span>}
                {detalle.color  && <span>Color: {detalle.color}</span>}
              </div>
            </div>

            {/* Valores */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              {[
                ["Valor", fmt(detalle.valorProducto || 0), "var(--on-s)"],
                ["Abono", fmt(Number(detalle.abono) || 0), "var(--ok-t)"],
                ["Saldo", fmt(detalle.saldo || 0), (detalle.saldo || 0) > 0 ? "var(--warn)" : "var(--ok-t)"],
              ].map(([l, v, c]) => (
                <div key={l} style={{ textAlign: "center", padding: "10px 8px", background: "var(--s-low)", borderRadius: 10 }}>
                  <div style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: "1.1rem", color: c }}>{v}</div>
                  <div style={{ fontSize: "10px", color: "var(--out)", textTransform: "uppercase", letterSpacing: ".07em", marginTop: 3 }}>{l}</div>
                </div>
              ))}
            </div>

            {/* Meta */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <EstadoPill estado={detalle.estado} />
              <span style={{ fontSize: ".73rem", color: "var(--out)" }}>
                {fmtDate(detalle.fecha)} · {detalle.vendedor}
              </span>
            </div>

            {detalle.notas && (
              <div style={{ padding: "10px 14px", background: "var(--s)", borderRadius: 9, fontSize: ".8rem", color: "var(--on-sv)", fontStyle: "italic" }}>
                📝 {detalle.notas}
              </div>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
            <button className="btn btn-outline" onClick={() => setDetalle(null)}>Cerrar</button>
            <button className="btn btn-brand" onClick={() => { openEdit(detalle); setDetalle(null); }}>
              <Icon n="edit" s={14} />Editar
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
