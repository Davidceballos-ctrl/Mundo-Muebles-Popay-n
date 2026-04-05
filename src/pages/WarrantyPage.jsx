/**
 * WarrantyPage.jsx — Módulo de Garantías y Devoluciones
 * Mundo Muebles Popayán · v7.0
 *
 * Flujo de estados:
 *   Recibido → En revisión → Aprobado → Resuelto
 *                          → Rechazado
 */
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/initialData.js";
import { fmt, fmtDate, today } from "../utils/format.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";
import { printComprobante, printComprobanteWindow } from "../utils/pdfGarantia.js";

// ─── Constantes ────────────────────────────────────────────────────────────
const TIPOS   = ["Fabricacion", "Uso indebido", "Estetico", "Otro"];
const ESTADOS = ["Recibido", "En revision", "Aprobado", "Rechazado", "Resuelto"];
const RESOLUCIONES = ["Reparacion", "Reemplazo", "Devolucion de dinero"];

const ESTADO_META = {
  "Recibido":    { color: "#2563EB", bg: "#DBEAFE", label: "Recibido"    },
  "En revision": { color: "#D97706", bg: "#FEF3C7", label: "En revisión" },
  "Aprobado":    { color: "#059669", bg: "#D1FAE5", label: "Aprobado"    },
  "Rechazado":   { color: "#DC2626", bg: "#FEE2E2", label: "Rechazado"   },
  "Resuelto":    { color: "#7C3AED", bg: "#EDE9FE", label: "Resuelto"    },
};

const BLANK_FORM = {
  facturaSearch: "",
  ventaId:       "",
  facturaNum:    "",
  fecha:         today(),
  cliente:       "",
  cedula:        "",
  telefono:      "",
  productoNombre:"",
  defecto:       "",
  tipo:          "Fabricacion",
  recibidoPor:   "",
  obs:           "",
};

const PG = 15;

// ─── Badge de estado ────────────────────────────────────────────────────────
function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado] || { color: "#64748B", bg: "#F1F5F9", label: estado };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: m.bg, color: m.color,
      padding: "2px 9px", borderRadius: 99,
      fontSize: ".72rem", fontWeight: 700,
      border: `1px solid ${m.color}33`,
    }}>{m.label}</span>
  );
}

// ─── Stepper de estados ─────────────────────────────────────────────────────
function Stepper({ estado }) {
  const steps = ["Recibido", "En revision", "Aprobado/Rechazado", "Resuelto"];
  const curIdx = estado === "Rechazado" ? 2
    : estado === "Aprobado"    ? 2
    : estado === "En revision" ? 1
    : estado === "Resuelto"    ? 3
    : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 0, margin: "12px 0 16px", overflowX: "auto" }}>
      {steps.map((s, i) => {
        const done    = i < curIdx;
        const active  = i === curIdx;
        const isLast  = i === steps.length - 1;
        const rejected = estado === "Rechazado" && i === 2;
        const col = rejected ? "#DC2626"
          : done   ? "#059669"
          : active ? "#2563EB"
          : "#CBD5E1";
        return (
          <div key={s} style={{ display: "flex", alignItems: "center", flex: isLast ? "0 0 auto" : 1 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", minWidth: 56 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: done || active || rejected ? col : "transparent",
                border: `2px solid ${col}`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active || rejected ? "#fff" : col,
                fontSize: ".75rem", fontWeight: 700,
                transition: "all .2s",
              }}>
                {done ? <Icon n="check" s={13}/> : i + 1}
              </div>
              <div style={{
                fontSize: ".62rem", marginTop: 3, textAlign: "center",
                color: active || done ? col : "#94A3B8",
                fontWeight: active ? 700 : 400,
                whiteSpace: "nowrap",
              }}>
                {rejected && i === 2 ? "Rechazado" : s.replace("En revision","En revisión").replace("Aprobado/Rechazado", active ? (estado === "Rechazado" ? "Rechazado" : "Aprobado") : "Evaluación")}
              </div>
            </div>
            {!isLast && (
              <div style={{
                flex: 1, height: 2, margin: "-12px 2px 0",
                background: done ? "#059669" : "#E2E8F0",
                transition: "all .2s",
              }}/>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ───────────────────────────────────────────────────
export default function WarrantyPage() {
  const { garantias, setGarantias, sales, products, setProducts, currentUser, empresa, toast } = useApp();

  // ── List / filter state ──
  const [search,    setSearch]    = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [dateFrom,  setDateFrom]  = useState("");
  const [dateTo,    setDateTo]    = useState("");
  const [pg,        setPg]        = useState(1);

  // ── Modal state ──
  const [showNew,    setShowNew]    = useState(false);
  const [detalle,    setDetalle]    = useState(null);  // garantia en detalle

  // ── New form state ──
  const [form,       setForm]       = useState(BLANK_FORM);
  const [ventaEncontrada, setVentaEncontrada] = useState(null);
  const [searchErr,  setSearchErr]  = useState("");

  // ── Workflow state (dentro del detalle) ──
  const [wfObs,      setWfObs]      = useState("");
  const [wfResolucion, setWfResolucion] = useState("");
  const [wfMonto,    setWfMonto]    = useState("");
  const [wfMotivo,   setWfMotivo]   = useState("");   // motivo rechazo
  const [showResolveForm, setShowResolveForm] = useState(false);
  const [showRejectForm,  setShowRejectForm]  = useState(false);

  // ─── Filtrado / paginado ────────────────────────────────────────────────
  const filtered = useMemo(() => {
    return [...garantias].reverse().filter(g => {
      if (filtEstado && g.estado !== filtEstado) return false;
      if (dateFrom && g.fecha < dateFrom) return false;
      if (dateTo   && g.fecha > dateTo)   return false;
      if (search) {
        const q = search.toLowerCase();
        if (!g.cliente?.toLowerCase().includes(q) &&
            !g.facturaNum?.toLowerCase().includes(q) &&
            !g.productoNombre?.toLowerCase().includes(q) &&
            !g.id?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [garantias, filtEstado, search, dateFrom, dateTo]);

  const pages = Math.ceil(filtered.length / PG);
  const paged = filtered.slice((pg-1)*PG, pg*PG);

  // ─── KPIs ───────────────────────────────────────────────────────────────
  const kpis = useMemo(() => ({
    total:      garantias.length,
    pendientes: garantias.filter(g => ["Recibido","En revision"].includes(g.estado)).length,
    aprobadas:  garantias.filter(g => g.estado === "Aprobado").length,
    resueltas:  garantias.filter(g => g.estado === "Resuelto").length,
    rechazadas: garantias.filter(g => g.estado === "Rechazado").length,
  }), [garantias]);

  // ─── Buscar venta por número de factura ────────────────────────────────
  function buscarVenta() {
    const q = form.facturaSearch.trim().toUpperCase();
    if (!q) { setSearchErr("Ingresa un número de factura."); return; }
    const venta = sales.find(s => s.id.slice(0,8).toUpperCase() === q || s.id.toUpperCase() === q);
    if (!venta) {
      setSearchErr("No se encontró ninguna venta con ese número.");
      setVentaEncontrada(null);
      return;
    }
    setSearchErr("");
    setVentaEncontrada(venta);
    const prod = venta.items?.[0]?.nombre || "";
    setForm(f => ({
      ...f,
      ventaId:        venta.id,
      facturaNum:     venta.id.slice(0,8).toUpperCase(),
      cliente:        venta.cliente || "",
      telefono:       venta.telefono || "",
      cedula:         venta.cedula || "",
      productoNombre: prod,
      recibidoPor:    currentUser?.nombre || "",
    }));
  }

  // ─── Guardar nueva garantía ─────────────────────────────────────────────
  function handleGuardar() {
    if (!form.productoNombre.trim()) { toast("Indica el producto.", false); return; }
    if (!form.defecto.trim())        { toast("Describe el defecto.", false); return; }
    if (!form.cliente.trim())        { toast("El nombre del cliente es requerido.", false); return; }

    const nueva = {
      id:             uid(),
      ventaId:        form.ventaId,
      facturaNum:     form.facturaNum,
      fecha:          form.fecha,
      cliente:        form.cliente,
      cedula:         form.cedula,
      telefono:       form.telefono,
      productoNombre: form.productoNombre,
      defecto:        form.defecto,
      tipo:           form.tipo,
      estado:         "Recibido",
      resolucion:     null,
      montoDevuelto:  0,
      fechaResolucion:null,
      obs:            form.obs,
      recibidoPor:    form.recibidoPor || currentUser?.nombre || "",
      historial:      [{
        fecha:    today(),
        estado:   "Recibido",
        obs:      "Caso registrado.",
        usuario:  currentUser?.nombre || "",
      }],
    };

    setGarantias(prev => [...prev, nueva]);
    toast("Garantía registrada correctamente.");

    // Generar comprobante PDF
    try { printComprobante(nueva, empresa); } catch(e) { /* silenciar */ }

    setForm(BLANK_FORM);
    setVentaEncontrada(null);
    setShowNew(false);
  }

  // ─── Cambiar estado (workflow) ──────────────────────────────────────────
  function cambiarEstado(garantia, nuevoEstado, extra = {}) {
    const entrada = {
      fecha:   today(),
      estado:  nuevoEstado,
      obs:     extra.obs || "",
      usuario: currentUser?.nombre || "",
    };
    const updated = {
      ...garantia,
      estado:    nuevoEstado,
      historial: [...(garantia.historial||[]), entrada],
      ...extra,
    };
    setGarantias(prev => prev.map(g => g.id === garantia.id ? updated : g));
    setDetalle(updated);
    toast(`Estado actualizado: ${nuevoEstado}`);
  }

  // ─── Aprobar garantía ───────────────────────────────────────────────────
  function handleAprobar(g) {
    cambiarEstado(g, "Aprobado", { obs: wfObs || "Garantía aprobada." });
    setWfObs("");
    setShowRejectForm(false);
  }

  // ─── Rechazar garantía ──────────────────────────────────────────────────
  function handleRechazar(g) {
    if (!wfMotivo.trim()) { toast("Indica el motivo del rechazo.", false); return; }
    cambiarEstado(g, "Rechazado", {
      obs:    wfMotivo,
      motivoRechazo: wfMotivo,
    });
    setWfMotivo("");
    setShowRejectForm(false);
  }

  // ─── Resolver garantía ──────────────────────────────────────────────────
  function handleResolver(g) {
    if (!wfResolucion) { toast("Selecciona el tipo de resolución.", false); return; }

    const montoNum = parseFloat(String(wfMonto).replace(/[^0-9.]/g,"")) || 0;
    const extra = {
      resolucion:     wfResolucion,
      fechaResolucion:today(),
      obs:            wfObs || "",
    };

    if (wfResolucion === "Devolucion de dinero") {
      if (montoNum <= 0) { toast("Ingresa el monto a devolver.", false); return; }
      extra.montoDevuelto = montoNum;
      // Marcar en la venta si existe
      if (g.ventaId) {
        // Añadir ajuste a la venta (campo ajusteGarantia)
        // No alteramos el total histórico, solo registramos el ajuste
        /* sales are immutable for history — the garantia record holds the truth */
      }
    }

    if (wfResolucion === "Reemplazo") {
      // Añadir entrada de kardex al primer producto que coincida
      const nombreBuscar = g.productoNombre?.toLowerCase() || "";
      const prod = products.find(p => p.nombre.toLowerCase().includes(nombreBuscar.split(" ")[0]));
      if (prod) {
        const updProds = products.map(p => {
          if (p.id !== prod.id) return p;
          return {
            ...p,
            variantes: p.variantes.map((v, idx) => {
              if (idx !== 0) return v;
              const newKardex = [...(v.kardex||[]), {
                fecha:  today(),
                tipo:   "Salida",
                cant:   1,
                obs:    `Reemplazo garantia #${g.id.slice(0,8).toUpperCase()} — ${g.cliente}`,
              }];
              return { ...v, stock: Math.max(0, v.stock - 1), kardex: newKardex };
            }),
          };
        });
        setProducts(updProds);
        toast("Kardex actualizado por reemplazo.");
      }
    }

    cambiarEstado(g, "Resuelto", extra);
    setWfResolucion("");
    setWfMonto("");
    setWfObs("");
    setShowResolveForm(false);
  }

  // ─── Abrir detalle ──────────────────────────────────────────────────────
  function abrirDetalle(g) {
    setDetalle(g);
    setWfObs(""); setWfResolucion(""); setWfMonto(""); setWfMotivo("");
    setShowResolveForm(false); setShowRejectForm(false);
  }

  // ─── Venta relacionada ──────────────────────────────────────────────────
  const ventaDetalle = useMemo(() => {
    if (!detalle?.ventaId) return null;
    return sales.find(s => s.id === detalle.ventaId) || null;
  }, [detalle, sales]);

  // ════════════════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ── Header ── */}
      <div className="sec-head">
        <div>
          <h2 className="sec-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Icon n="warranty" s={20}/>
            Garantías y Devoluciones
          </h2>
          <p className="sec-sub">{filtered.length} caso(s) · {kpis.pendientes} pendiente(s)</p>
        </div>
        <button className="btn btn-brand" onClick={() => { setForm({...BLANK_FORM, recibidoPor: currentUser?.nombre||"", fecha: today()}); setVentaEncontrada(null); setSearchErr(""); setShowNew(true); }}>
          <Icon n="plus" s={15}/>Nueva garantía
        </button>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Total casos",   val: kpis.total,      col:"#2563EB", bg:"#DBEAFE" },
          { label:"Pendientes",    val: kpis.pendientes, col:"#D97706", bg:"#FEF3C7" },
          { label:"Aprobadas",     val: kpis.aprobadas,  col:"#059669", bg:"#D1FAE5" },
          { label:"Resueltas",     val: kpis.resueltas,  col:"#7C3AED", bg:"#EDE9FE" },
          { label:"Rechazadas",    val: kpis.rechazadas, col:"#DC2626", bg:"#FEE2E2" },
        ].map(k => (
          <div key={k.label} style={{
            background: k.bg, border:`1.5px solid ${k.col}22`,
            borderRadius:12, padding:"14px 16px", textAlign:"center",
          }}>
            <div style={{ fontSize:"1.6rem", fontWeight:800, color:k.col, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:".7rem", color:k.col, marginTop:4, fontWeight:600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabla ── */}
      <div className="card">
        {/* Filtros */}
        <div className="card-head" style={{ flexWrap:"wrap", gap:10 }}>
          <div className="search-box" style={{ flex:1, minWidth:200 }}>
            <span className="si"><Icon n="search"/></span>
            <input className="inp" placeholder="Buscar por cliente, factura, producto..."
              value={search} onChange={e => { setSearch(e.target.value); setPg(1); }}/>
          </div>
          <select className="inp" style={{ width:160 }} value={filtEstado} onChange={e => { setFiltEstado(e.target.value); setPg(1); }}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_META[e]?.label||e}</option>)}
          </select>
          <input className="inp" type="date" style={{ width:140 }} value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPg(1); }}/>
          <span style={{ color:"var(--out)", fontSize:".8rem" }}>—</span>
          <input className="inp" type="date" style={{ width:140 }} value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPg(1); }}/>
          {(search||filtEstado||dateFrom||dateTo) && (
            <button className="btn btn-outline btn-sm" onClick={() => { setSearch(""); setFiltEstado(""); setDateFrom(""); setDateTo(""); setPg(1); }}>
              <Icon n="close" s={13}/>Limpiar
            </button>
          )}
        </div>

        {/* Tabla */}
        <div className="tw">
          <table>
            <thead>
              <tr>
                <th>N.° Caso</th>
                <th>Fecha</th>
                <th>Factura</th>
                <th>Cliente</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Resolución</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? (
                  <tr><td colSpan={9}>
                    <div className="empty">
                      <Icon n="warranty" s={40}/>
                      <p>Sin garantías registradas</p>
                    </div>
                  </td></tr>
                )
                : paged.map(g => (
                  <tr key={g.id}>
                    <td style={{ fontWeight:600, color:"var(--p-ctr)", fontSize:".8rem", whiteSpace:"nowrap" }}>
                      #{g.id.slice(0,8).toUpperCase()}
                    </td>
                    <td style={{ fontSize:".82rem", whiteSpace:"nowrap" }}>{fmtDate(g.fecha)}</td>
                    <td style={{ fontSize:".8rem" }}>
                      {g.facturaNum ? <span style={{ color:"var(--p-ctr)", fontWeight:600 }}>#{g.facturaNum}</span> : <span style={{ color:"var(--out)" }}>—</span>}
                    </td>
                    <td style={{ fontWeight:500 }}>{g.cliente}</td>
                    <td style={{ fontSize:".82rem", color:"var(--on-sv)", maxWidth:160, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                      {g.productoNombre}
                    </td>
                    <td style={{ fontSize:".77rem" }}>
                      <span style={{ background:"#EFF6FF", color:"#1D4ED8", padding:"2px 7px", borderRadius:99, fontSize:".7rem", fontWeight:600 }}>
                        {g.tipo}
                      </span>
                    </td>
                    <td><EstadoBadge estado={g.estado}/></td>
                    <td style={{ fontSize:".78rem", color:"var(--on-sv)" }}>
                      {g.resolucion
                        ? <span style={{ fontWeight:600, color:"#7C3AED" }}>{g.resolucion}</span>
                        : <span style={{ color:"var(--out)" }}>—</span>
                      }
                    </td>
                    <td>
                      <div style={{ display:"flex", gap:5 }}>
                        <button className="btn btn-outline btn-sm btn-icon" title="Ver detalle" onClick={() => abrirDetalle(g)}>
                          <Icon n="eye"/>
                        </button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Imprimir comprobante"
                          onClick={() => printComprobanteWindow(g, empresa)}>
                          <Icon n="print"/>
                        </button>
                        <button className="btn btn-outline btn-sm btn-icon" title="PDF comprobante"
                          onClick={() => { try { printComprobante(g, empresa); } catch(e){ toast(e.message,false); } }}>
                          <Icon n="pdf"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        {pages > 1 && (
          <div className="pgn">
            <span className="pg-info">Pág. {pg}/{pages}</span>
            <button className="pg-btn" onClick={() => setPg(p=>Math.max(1,p-1))} disabled={pg===1}>‹</button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{
              const n=Math.max(1,Math.min(pg-2,pages-4))+i;
              return <button key={n} className={`pg-btn ${pg===n?"on":""}`} onClick={()=>setPg(n)}>{n}</button>;
            })}
            <button className="pg-btn" onClick={() => setPg(p=>Math.min(pages,p+1))} disabled={pg===pages}>›</button>
          </div>
        )}
      </div>

      {/* ════════ MODAL NUEVA GARANTÍA ════════ */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Registrar nueva garantía" maxW={540}
        footer={<>
          <button className="btn btn-outline" onClick={() => setShowNew(false)}>Cancelar</button>
          <button className="btn btn-brand" onClick={handleGuardar}>
            <Icon n="save" s={15}/>Guardar y generar comprobante
          </button>
        </>}>

        {/* Buscar por factura */}
        <div style={{ background:"var(--p-fix)", border:"1.5px solid var(--p-fix-dim)", borderRadius:10, padding:"14px 16px", marginBottom:16 }}>
          <div className="flabel" style={{ marginBottom:6 }}>Buscar venta por N.° de factura</div>
          <div style={{ display:"flex", gap:8 }}>
            <input className="inp" placeholder="Ej: A1B2C3D4"
              value={form.facturaSearch}
              onChange={e => setForm(f=>({...f, facturaSearch: e.target.value.toUpperCase()}))}
              onKeyDown={e => e.key==="Enter" && buscarVenta()}
              style={{ flex:1, fontFamily:"monospace", letterSpacing:1 }}/>
            <button className="btn btn-brand btn-sm" onClick={buscarVenta}>
              <Icon n="search" s={14}/>Buscar
            </button>
          </div>
          {searchErr && <p style={{ color:"var(--err)", fontSize:".78rem", marginTop:6 }}>{searchErr}</p>}
          {ventaEncontrada && (
            <div style={{ marginTop:10, background:"#D1FAE5", border:"1px solid #6EE7B7", borderRadius:8, padding:"8px 12px", fontSize:".8rem", color:"#065F46" }}>
              <strong>✓ Venta encontrada</strong><br/>
              Cliente: <strong>{ventaEncontrada.cliente}</strong> · Fecha: {fmtDate(ventaEncontrada.fecha)}<br/>
              {ventaEncontrada.items?.map(it=>it.nombre).join(", ")} · Total: <strong>{fmt(ventaEncontrada.total)}</strong>
            </div>
          )}
        </div>

        {/* Campos manuales */}
        <div className="f2">
          <div>
            <div className="flabel">Cliente *</div>
            <input className="inp" value={form.cliente} onChange={e=>setForm(f=>({...f,cliente:e.target.value}))} placeholder="Nombre del cliente"/>
          </div>
          <div>
            <div className="flabel">Cédula / NIT</div>
            <input className="inp" value={form.cedula} onChange={e=>setForm(f=>({...f,cedula:e.target.value}))} placeholder="Opcional"/>
          </div>
          <div>
            <div className="flabel">Teléfono</div>
            <input className="inp" value={form.telefono} onChange={e=>setForm(f=>({...f,telefono:e.target.value}))} placeholder="Opcional"/>
          </div>
          <div>
            <div className="flabel">Fecha de reporte</div>
            <input className="inp" type="date" value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div className="flabel">Producto en garantía *</div>
            {ventaEncontrada && ventaEncontrada.items?.length > 1 ? (
              <select className="inp" value={form.productoNombre} onChange={e=>setForm(f=>({...f,productoNombre:e.target.value}))}>
                {ventaEncontrada.items.map(it=><option key={it.nombre} value={it.nombre}>{it.nombre}</option>)}
              </select>
            ) : (
              <input className="inp" value={form.productoNombre} onChange={e=>setForm(f=>({...f,productoNombre:e.target.value}))} placeholder="Nombre del producto"/>
            )}
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div className="flabel">Descripción del defecto *</div>
            <textarea className="inp" rows={3} value={form.defecto} onChange={e=>setForm(f=>({...f,defecto:e.target.value}))}
              placeholder="Describe el problema que presenta el producto..."
              style={{ resize:"vertical" }}/>
          </div>
          <div>
            <div className="flabel">Tipo de defecto</div>
            <select className="inp" value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))}>
              {TIPOS.map(t=><option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <div className="flabel">Recibido por</div>
            <input className="inp" value={form.recibidoPor} onChange={e=>setForm(f=>({...f,recibidoPor:e.target.value}))}
              placeholder={currentUser?.nombre||"Nombre del vendedor"}/>
          </div>
          <div style={{ gridColumn:"1/-1" }}>
            <div className="flabel">Observaciones adicionales</div>
            <textarea className="inp" rows={2} value={form.obs} onChange={e=>setForm(f=>({...f,obs:e.target.value}))}
              placeholder="Notas adicionales (opcional)" style={{ resize:"vertical" }}/>
          </div>
        </div>
      </Modal>

      {/* ════════ MODAL DETALLE / GESTIÓN ════════ */}
      <Modal open={!!detalle} onClose={() => { setDetalle(null); setShowResolveForm(false); setShowRejectForm(false); }}
        title={`Garantía #${detalle?.id?.slice(0,8).toUpperCase()}`} maxW={580} wide
        footer={<>
          <button className="btn btn-outline" onClick={() => { setDetalle(null); setShowResolveForm(false); setShowRejectForm(false); }}>
            Cerrar
          </button>
          <button className="btn btn-outline" onClick={() => detalle && printComprobanteWindow(detalle, empresa)}>
            <Icon n="print" s={14}/>Imprimir
          </button>
          <button className="btn btn-brand" onClick={() => { try{ printComprobante(detalle, empresa); }catch(e){ toast(e.message,false); } }}>
            <Icon n="pdf" s={14}/>PDF
          </button>
        </>}>

        {detalle && (
          <div>
            {/* Estado badge + stepper */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <EstadoBadge estado={detalle.estado}/>
              <span style={{ fontSize:".78rem", color:"var(--out)" }}>
                Registrada el {fmtDate(detalle.fecha)}
              </span>
            </div>
            <Stepper estado={detalle.estado}/>

            {/* Datos principales */}
            <div className="f2" style={{ marginBottom:14 }}>
              {[
                ["Cliente",   detalle.cliente],
                ["Cédula",    detalle.cedula||"—"],
                ["Teléfono",  detalle.telefono||"—"],
                ["Factura",   detalle.facturaNum ? "#"+detalle.facturaNum : "—"],
                ["Producto",  detalle.productoNombre],
                ["Tipo",      detalle.tipo],
                ["Recibido por", detalle.recibidoPor||"—"],
              ].map(([l,v]) => (
                <div key={l}>
                  <div style={{ fontSize:".7rem", color:"var(--out)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:500, fontSize:".88rem" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Descripción defecto */}
            <div style={{ background:"#FFF7ED", border:"1.5px solid #FED7AA", borderRadius:9, padding:"10px 14px", marginBottom:14 }}>
              <div style={{ fontSize:".7rem", color:"#92400E", textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>
                Descripción del defecto
              </div>
              <p style={{ fontSize:".88rem", color:"#78350F", lineHeight:1.55 }}>{detalle.defecto}</p>
            </div>

            {/* Venta relacionada */}
            {ventaDetalle && (
              <div style={{ background:"var(--p-fix)", border:"1px solid var(--p-fix-dim)", borderRadius:9, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:".7rem", color:"var(--p)", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                  Venta relacionada
                </div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"4px 12px", fontSize:".82rem" }}>
                  <span>Fecha compra: <strong>{fmtDate(ventaDetalle.fecha)}</strong></span>
                  <span>Total: <strong>{fmt(ventaDetalle.total)}</strong></span>
                  <span>Vendedor: <strong>{ventaDetalle.vendedor||"—"}</strong></span>
                  <span>Items: <strong>{ventaDetalle.items?.length||0}</strong></span>
                </div>
              </div>
            )}

            {/* Resolución (si existe) */}
            {detalle.resolucion && (
              <div style={{ background:"#EDE9FE", border:"1.5px solid #C4B5FD", borderRadius:9, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:".7rem", color:"#5B21B6", textTransform:"uppercase", fontWeight:700, marginBottom:6 }}>
                  Resolución aplicada
                </div>
                <div style={{ fontSize:".88rem", color:"#4C1D95" }}>
                  <strong>{detalle.resolucion}</strong>
                  {detalle.montoDevuelto > 0 && <span> · Monto devuelto: <strong>{fmt(detalle.montoDevuelto)}</strong></span>}
                  {detalle.fechaResolucion && <span> · Fecha: {fmtDate(detalle.fechaResolucion)}</span>}
                </div>
                {detalle.obs && <p style={{ fontSize:".8rem", color:"#6D28D9", marginTop:4 }}>{detalle.obs}</p>}
              </div>
            )}

            {/* Motivo rechazo */}
            {detalle.estado === "Rechazado" && detalle.motivoRechazo && (
              <div style={{ background:"#FEE2E2", border:"1.5px solid #FCA5A5", borderRadius:9, padding:"10px 14px", marginBottom:14 }}>
                <div style={{ fontSize:".7rem", color:"#991B1B", textTransform:"uppercase", fontWeight:700, marginBottom:4 }}>
                  Motivo del rechazo
                </div>
                <p style={{ fontSize:".88rem", color:"#7F1D1D" }}>{detalle.motivoRechazo}</p>
              </div>
            )}

            {/* ── Acciones de workflow ── */}
            <div className="fdiv"/>
            <div style={{ fontWeight:700, fontSize:".8rem", color:"var(--p)", marginBottom:10, textTransform:"uppercase", letterSpacing:".05em" }}>
              Acciones
            </div>

            {/* Recibido → En revisión */}
            {detalle.estado === "Recibido" && (
              <div style={{ display:"flex", gap:8 }}>
                <button className="btn btn-amber" onClick={() => cambiarEstado(detalle, "En revision", { obs:"Enviado a revisión." })}>
                  <Icon n="search" s={14}/>Enviar a revisión
                </button>
              </div>
            )}

            {/* En revisión → Aprobar / Rechazar */}
            {detalle.estado === "En revision" && !showRejectForm && (
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                {!showResolveForm && (
                  <button className="btn btn-ok" onClick={() => handleAprobar(detalle)}>
                    <Icon n="check" s={14}/>Aprobar garantía
                  </button>
                )}
                <button className="btn btn-ghost-danger" onClick={() => { setShowRejectForm(true); setShowResolveForm(false); }}>
                  <Icon n="close" s={14}/>Rechazar
                </button>
              </div>
            )}

            {/* Formulario de rechazo */}
            {detalle.estado === "En revision" && showRejectForm && (
              <div style={{ background:"#FEF2F2", border:"1.5px solid #FCA5A5", borderRadius:10, padding:"14px 16px" }}>
                <div className="flabel" style={{ marginBottom:6, color:"#991B1B" }}>Motivo del rechazo *</div>
                <textarea className="inp" rows={2} value={wfMotivo} onChange={e=>setWfMotivo(e.target.value)}
                  placeholder="Ej: El defecto es por mal uso del cliente, no cubre garantía..."
                  style={{ resize:"vertical", borderColor:"#FCA5A5" }}/>
                <div style={{ display:"flex", gap:8, marginTop:10 }}>
                  <button className="btn btn-ghost-danger" onClick={() => handleRechazar(detalle)}>
                    <Icon n="close" s={14}/>Confirmar rechazo
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowRejectForm(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {/* Aprobado → Registrar resolución */}
            {detalle.estado === "Aprobado" && !showResolveForm && (
              <button className="btn btn-brand" onClick={() => setShowResolveForm(true)}>
                <Icon n="check" s={14}/>Registrar resolución y cerrar caso
              </button>
            )}

            {detalle.estado === "Aprobado" && showResolveForm && (
              <div style={{ background:"#F0FDF4", border:"1.5px solid #86EFAC", borderRadius:10, padding:"14px 16px" }}>
                <div className="flabel" style={{ marginBottom:6 }}>Tipo de resolución *</div>
                <div style={{ display:"flex", gap:8, flexWrap:"wrap", marginBottom:12 }}>
                  {RESOLUCIONES.map(r => (
                    <button key={r}
                      className={`btn btn-sm ${wfResolucion===r ? "btn-ok" : "btn-outline"}`}
                      onClick={() => setWfResolucion(r)}>
                      {r}
                    </button>
                  ))}
                </div>

                {wfResolucion === "Devolucion de dinero" && (
                  <div style={{ marginBottom:10 }}>
                    <div className="flabel" style={{ marginBottom:4 }}>Monto a devolver (COP) *</div>
                    <input className="inp" type="number" min="0" value={wfMonto}
                      onChange={e=>setWfMonto(e.target.value)} placeholder="0"/>
                  </div>
                )}

                {wfResolucion === "Reemplazo" && (
                  <div style={{ background:"#FFFBEB", border:"1px solid #FDE68A", borderRadius:8, padding:"8px 12px", marginBottom:10, fontSize:".8rem", color:"#78350F" }}>
                    <Icon n="alert" s={13}/> Se descontará 1 unidad del primer producto coincidente en inventario y se registrará en el Kardex.
                  </div>
                )}

                <div className="flabel" style={{ marginBottom:4 }}>Observaciones</div>
                <textarea className="inp" rows={2} value={wfObs} onChange={e=>setWfObs(e.target.value)}
                  placeholder="Detalles de la resolución..." style={{ resize:"vertical", marginBottom:10 }}/>

                <div style={{ display:"flex", gap:8 }}>
                  <button className="btn btn-ok" onClick={() => handleResolver(detalle)}>
                    <Icon n="check" s={14}/>Confirmar y cerrar caso
                  </button>
                  <button className="btn btn-outline btn-sm" onClick={() => setShowResolveForm(false)}>Cancelar</button>
                </div>
              </div>
            )}

            {/* ── Historial de cambios ── */}
            {detalle.historial?.length > 0 && (
              <>
                <div className="fdiv" style={{ marginTop:16 }}/>
                <div style={{ fontWeight:700, fontSize:".8rem", color:"var(--p)", marginBottom:10, textTransform:"uppercase", letterSpacing:".05em", display:"flex", alignItems:"center", gap:6 }}>
                  <Icon n="clock" s={14}/>Historial de estados
                </div>
                <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                  {[...detalle.historial].reverse().map((h, i) => (
                    <div key={i} style={{ display:"flex", gap:10, alignItems:"flex-start", padding:"8px 12px", background: i===0 ? "var(--p-fix)" : "var(--bg)", borderRadius:8, border:"1px solid var(--border)" }}>
                      <div style={{ flexShrink:0, marginTop:2 }}>
                        <EstadoBadge estado={h.estado}/>
                      </div>
                      <div style={{ flex:1 }}>
                        {h.obs && <div style={{ fontSize:".82rem", color:"var(--on-sv)" }}>{h.obs}</div>}
                        <div style={{ fontSize:".72rem", color:"var(--out)", marginTop:2 }}>
                          {fmtDate(h.fecha)}{h.usuario ? ` · ${h.usuario}` : ""}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
