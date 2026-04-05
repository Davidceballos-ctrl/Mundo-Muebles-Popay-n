/**
 * QuotesPage.jsx — Módulo de Cotizaciones · v8.0
 * Generar cotizaciones formales A4, convertir a venta, gestionar estados
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/initialData.js";
import { fmt, fmtDate, today } from "../utils/format.js";
import { printCotizacionPDF } from "../utils/pdfCotizacion.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";

const ESTADOS = ["Borrador","Enviada","Aprobada","Rechazada","Convertida"];
const ESTADO_META = {
  "Borrador":   { color:"#64748B", bg:"#F1F5F9" },
  "Enviada":    { color:"#2563EB", bg:"#DBEAFE" },
  "Aprobada":   { color:"#059669", bg:"#D1FAE5" },
  "Rechazada":  { color:"#DC2626", bg:"#FEE2E2" },
  "Convertida": { color:"#7C3AED", bg:"#EDE9FE" },
};
const PG = 15;

function EstadoBadge({ estado }) {
  const m = ESTADO_META[estado]||{ color:"#64748B", bg:"#F1F5F9" };
  return (
    <span style={{ display:"inline-flex", alignItems:"center", background:m.bg, color:m.color, padding:"2px 9px", borderRadius:99, fontSize:".72rem", fontWeight:700, border:`1px solid ${m.color}33` }}>
      {estado}
    </span>
  );
}

const BLANK_ITEM = () => ({ id:uid(), nombre:"", medida:"", cant:1, precio:0 });

export default function QuotesPage() {
  const { cotizaciones, setCotizaciones, products, clients, currentUser, empresa, sales, setSales, toast } = useApp();
  const nav = useNavigate();

  const [search,     setSearch]     = useState("");
  const [filtEstado, setFiltEstado] = useState("");
  const [dateFrom,   setDateFrom]   = useState("");
  const [dateTo,     setDateTo]     = useState("");
  const [pg,         setPg]         = useState(1);

  const [showForm,   setShowForm]   = useState(false);
  const [editId,     setEditId]     = useState(null);
  const [detalle,    setDetalle]    = useState(null);

  // Formulario
  const [form, setForm] = useState({
    cliente:"", cedula:"", telefono:"", email:"", ciudad:"",
    fecha:today(), fechaVencimiento:"", validez:"30",
    notas:"", items:[BLANK_ITEM()],
    descuento:0, discType:"monto",
  });

  const setF = (k,v) => setForm(f=>({...f,[k]:v}));

  // Auto-completar cliente
  const aplicarCliente = (nombre) => {
    const cli = clients.find(c=>c.nombre===nombre);
    setF("cliente", nombre);
    if (cli) {
      setF("cedula",   cli.cedula||"");
      setF("telefono", cli.telefono||"");
      setF("email",    cli.email||"");
      setF("ciudad",   cli.ciudad||"Popayan");
    }
  };

  // Items
  const addItem  = ()  => setForm(f=>({...f, items:[...f.items, BLANK_ITEM()]}));
  const remItem  = (id) => setForm(f=>({...f, items:f.items.filter(it=>it.id!==id)}));
  const updItem  = (id,k,v) => setForm(f=>({
    ...f,
    items:f.items.map(it=>it.id===id ? {...it,[k]:k==="cant"||k==="precio" ? Math.max(0,Number(v)||0) : v} : it)
  }));

  // Sugerir precio al elegir nombre de producto
  const sugerirPrecio = (id, nombre) => {
    const prod = products.find(p => p.nombre===nombre);
    if (prod) {
      const precio = prod.variantes[0]?.precio || 0;
      const medida = prod.variantes[0]?.medida || "";
      setForm(f=>({...f, items:f.items.map(it=>it.id===id ? {...it,nombre,precio,medida} : it)}));
    } else {
      updItem(id,"nombre",nombre);
    }
  };

  // Calcular totales
  const calcular = (f) => {
    const subtotal = (f.items||[]).reduce((a,it)=>a+(it.precio||0)*(it.cant||1),0);
    const descMonto = f.discType==="pct"
      ? Math.round(subtotal*(Number(f.descuento)/100))
      : Math.min(Number(f.descuento)||0, subtotal);
    const total = Math.max(0, subtotal - descMonto);
    return { subtotal, descMonto, total };
  };
  const { subtotal, descMonto, total } = calcular(form);

  // Número correlativo
  const nextNum = () => {
    const nums = cotizaciones.map(c=>parseInt(c.numero?.replace(/\D/g,"")||"0")).filter(Boolean);
    const max  = nums.length ? Math.max(...nums) : 0;
    return String(max+1).padStart(4,"0");
  };

  // Guardar
  const handleGuardar = () => {
    if (!form.items.some(it=>it.nombre.trim())) { toast("Agrega al menos un producto.", false); return; }
    const { subtotal, descMonto, total } = calcular(form);
    const cotiz = {
      id:     editId || uid(),
      numero: editId ? cotizaciones.find(c=>c.id===editId)?.numero : nextNum(),
      fecha:  form.fecha,
      fechaVencimiento: form.fechaVencimiento || (() => { const d=new Date(form.fecha); d.setDate(d.getDate()+Number(form.validez||30)); return d.toISOString().slice(0,10); })(),
      cliente:  form.cliente||"Consumidor Final",
      cedula:   form.cedula,
      telefono: form.telefono,
      email:    form.email,
      ciudad:   form.ciudad,
      items:    form.items.filter(it=>it.nombre.trim()),
      subtotal, descuento:descMonto, impuesto:0, total,
      notas:    form.notas,
      vendedor: currentUser?.nombre||"Admin",
      estado:   editId ? cotizaciones.find(c=>c.id===editId)?.estado : "Borrador",
    };
    if (editId) {
      setCotizaciones(prev=>prev.map(c=>c.id===editId?cotiz:c));
      toast("Cotización actualizada.");
    } else {
      setCotizaciones(prev=>[...prev, cotiz]);
      toast(`Cotización #${cotiz.numero} creada.`);
    }
    resetForm();
  };

  const resetForm = () => {
    setShowForm(false); setEditId(null);
    setForm({ cliente:"", cedula:"", telefono:"", email:"", ciudad:"", fecha:today(), fechaVencimiento:"", validez:"30", notas:"", items:[BLANK_ITEM()], descuento:0, discType:"monto" });
  };

  const abrirEditar = (cotiz) => {
    setEditId(cotiz.id);
    setForm({
      cliente:cotiz.cliente, cedula:cotiz.cedula||"", telefono:cotiz.telefono||"",
      email:cotiz.email||"", ciudad:cotiz.ciudad||"",
      fecha:cotiz.fecha, fechaVencimiento:cotiz.fechaVencimiento||"", validez:"30",
      notas:cotiz.notas||"",
      items:cotiz.items.map(it=>({...it, id:it.id||uid()})),
      descuento:cotiz.descuento||0, discType:"monto",
    });
    setShowForm(true);
  };

  const cambiarEstado = (id, estado) => {
    setCotizaciones(prev=>prev.map(c=>c.id===id?{...c,estado}:c));
    if (detalle?.id===id) setDetalle(d=>({...d,estado}));
    toast(`Estado actualizado: ${estado}`);
  };

  // Convertir a venta → navegar a POS con cotización cargada
  const convertirVenta = (cotiz) => {
    cambiarEstado(cotiz.id, "Convertida");
    toast("Cotización marcada como convertida. Importa en el POS con el selector.");
    setDetalle(null);
  };

  // Compartir por WhatsApp
  const compartirWA = (cotiz, numWA) => {
    const msg = encodeURIComponent(
      `Hola ${cotiz.cliente}, le compartimos la cotización N° ${cotiz.numero||cotiz.id.slice(0,8)} de *Mundo Muebles Popayán*.\n\n` +
      (cotiz.items||[]).map(it=>`• ${it.nombre} (${it.medida}) x${it.cant}: ${new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(it.precio)}`).join("\n") +
      `\n\n*TOTAL: ${new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(cotiz.total)}*\n\nVálida hasta: ${cotiz.fechaVencimiento||"—"}\n\nTel: ${empresa.telefono||"316 7145208"}`
    );
    const num = numWA||"57"+((cotiz.telefono||"").replace(/\D/g,""));
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
  };

  // Filtrado
  const filtered = useMemo(()=>[...cotizaciones].reverse().filter(c=>{
    if (filtEstado && c.estado!==filtEstado) return false;
    if (dateFrom && c.fecha<dateFrom) return false;
    if (dateTo   && c.fecha>dateTo)   return false;
    if (search) {
      const q=search.toLowerCase();
      if (!c.cliente?.toLowerCase().includes(q) && !c.numero?.toLowerCase().includes(q) &&
          !c.id.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [cotizaciones, filtEstado, search, dateFrom, dateTo]);

  const pages = Math.ceil(filtered.length/PG);
  const paged = filtered.slice((pg-1)*PG, pg*PG);

  const kpis = useMemo(()=>({
    total:      cotizaciones.length,
    pendientes: cotizaciones.filter(c=>["Borrador","Enviada"].includes(c.estado)).length,
    aprobadas:  cotizaciones.filter(c=>c.estado==="Aprobada").length,
    convertidas:cotizaciones.filter(c=>c.estado==="Convertida").length,
    monto:      cotizaciones.filter(c=>c.estado!=="Rechazada").reduce((a,c)=>a+c.total,0),
  }),[cotizaciones]);

  // Lista de productos para autocomplete
  const prodNames = [...new Set(products.map(p=>p.nombre))];

  return (
    <div>
      {/* Header */}
      <div className="sec-head">
        <div>
          <h2 className="sec-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Icon n="quote" s={20}/>Cotizaciones
          </h2>
          <p className="sec-sub">{filtered.length} cotización(es) · {kpis.pendientes} pendiente(s)</p>
        </div>
        <button className="btn btn-brand" onClick={()=>{ resetForm(); setShowForm(true); }}>
          <Icon n="plus" s={15}/>Nueva cotización
        </button>
      </div>

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))", gap:12, marginBottom:20 }}>
        {[
          { label:"Total",       val:kpis.total,       col:"#2563EB", bg:"#DBEAFE" },
          { label:"Pendientes",  val:kpis.pendientes,  col:"#D97706", bg:"#FEF3C7" },
          { label:"Aprobadas",   val:kpis.aprobadas,   col:"#059669", bg:"#D1FAE5" },
          { label:"Convertidas", val:kpis.convertidas, col:"#7C3AED", bg:"#EDE9FE" },
          { label:"Monto total", val:fmt(kpis.monto),  col:"#003fb1", bg:"var(--p-fix)", big:true },
        ].map(k=>(
          <div key={k.label} style={{ background:k.bg, border:`1.5px solid ${k.col}22`, borderRadius:12, padding:"14px 16px", textAlign:"center" }}>
            <div style={{ fontSize:k.big?"1rem":"1.6rem", fontWeight:800, color:k.col, lineHeight:1 }}>{k.val}</div>
            <div style={{ fontSize:".7rem", color:k.col, marginTop:4, fontWeight:600 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla */}
      <div className="card">
        <div className="card-head" style={{ flexWrap:"wrap", gap:10 }}>
          <div className="search-box" style={{ flex:1, minWidth:200 }}>
            <span className="si"><Icon n="search"/></span>
            <input className="inp" placeholder="Buscar por cliente o número..." value={search} onChange={e=>{setSearch(e.target.value);setPg(1);}}/>
          </div>
          <select className="inp" style={{ width:155 }} value={filtEstado} onChange={e=>{setFiltEstado(e.target.value);setPg(1);}}>
            <option value="">Todos los estados</option>
            {ESTADOS.map(e=><option key={e}>{e}</option>)}
          </select>
          <input className="inp" type="date" style={{ width:135 }} value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPg(1);}}/>
          <span style={{ color:"var(--out)",fontSize:".8rem" }}>—</span>
          <input className="inp" type="date" style={{ width:135 }} value={dateTo} onChange={e=>{setDateTo(e.target.value);setPg(1);}}/>
          {(search||filtEstado||dateFrom||dateTo)&&(
            <button className="btn btn-outline btn-sm" onClick={()=>{setSearch("");setFiltEstado("");setDateFrom("");setDateTo("");setPg(1);}}>
              <Icon n="close" s={13}/>Limpiar
            </button>
          )}
        </div>

        <div className="tw">
          <table>
            <thead>
              <tr><th>N.°</th><th>Fecha</th><th>Válida hasta</th><th>Cliente</th><th>Items</th><th>Total</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paged.length===0
                ? <tr><td colSpan={8}><div className="empty"><Icon n="quote" s={40}/><p>Sin cotizaciones</p></div></td></tr>
                : paged.map(c=>(
                  <tr key={c.id}>
                    <td style={{ fontWeight:700, color:"var(--p-ctr)", fontSize:".82rem" }}>#{c.numero||c.id.slice(0,8).toUpperCase()}</td>
                    <td style={{ fontSize:".82rem", whiteSpace:"nowrap" }}>{fmtDate(c.fecha)}</td>
                    <td style={{ fontSize:".8rem", whiteSpace:"nowrap", color: c.fechaVencimiento<today()&&c.estado!=="Convertida"?"var(--err)":"var(--on-sv)" }}>
                      {c.fechaVencimiento ? fmtDate(c.fechaVencimiento) : "—"}
                    </td>
                    <td style={{ fontWeight:500 }}>{c.cliente}</td>
                    <td style={{ fontSize:".8rem", color:"var(--on-sv)" }}>{(c.items||[]).length} ítem(s)</td>
                    <td style={{ fontWeight:700, color:"var(--p)", fontVariantNumeric:"tabular-nums" }}>{fmt(c.total)}</td>
                    <td><EstadoBadge estado={c.estado}/></td>
                    <td>
                      <div style={{ display:"flex", gap:4 }}>
                        <button className="btn btn-outline btn-sm btn-icon" title="Ver detalle" onClick={()=>setDetalle(c)}>
                          <Icon n="eye"/>
                        </button>
                        {!["Convertida","Rechazada"].includes(c.estado) && (
                          <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={()=>abrirEditar(c)}>
                            <Icon n="edit"/>
                          </button>
                        )}
                        <button className="btn btn-outline btn-sm btn-icon" title="Descargar PDF"
                          onClick={()=>{ try{ printCotizacionPDF(c,empresa); } catch(e){ toast(e.message,false); } }}>
                          <Icon n="pdf"/>
                        </button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Compartir WhatsApp"
                          onClick={()=>compartirWA(c,"")}>
                          <Icon n="whatsapp"/>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {pages>1&&(
          <div className="pgn">
            <span className="pg-info">Pág. {pg}/{pages}</span>
            <button className="pg-btn" onClick={()=>setPg(p=>Math.max(1,p-1))} disabled={pg===1}>‹</button>
            {Array.from({length:Math.min(5,pages)},(_,i)=>{
              const n=Math.max(1,Math.min(pg-2,pages-4))+i;
              return <button key={n} className={`pg-btn ${pg===n?"on":""}`} onClick={()=>setPg(n)}>{n}</button>;
            })}
            <button className="pg-btn" onClick={()=>setPg(p=>Math.min(pages,p+1))} disabled={pg===pages}>›</button>
          </div>
        )}
      </div>

      {/* ════ MODAL CREAR / EDITAR ════ */}
      <Modal open={showForm} onClose={resetForm} title={editId?"Editar cotización":"Nueva cotización"} maxW={640} wide
        footer={<>
          <button className="btn btn-outline" onClick={resetForm}>Cancelar</button>
          <button className="btn btn-brand" onClick={handleGuardar}>
            <Icon n="save" s={14}/>Guardar cotización
          </button>
        </>}>

        <div className="f2" style={{ marginBottom:16 }}>
          {/* Cliente */}
          <div style={{ gridColumn:"1/-1" }}>
            <div className="flabel">Cliente</div>
            <input list="clienteList" className="inp" value={form.cliente}
              onChange={e=>aplicarCliente(e.target.value)} placeholder="Nombre del cliente"/>
            <datalist id="clienteList">
              {clients.map(c=><option key={c.id} value={c.nombre}/>)}
            </datalist>
          </div>
          <div>
            <div className="flabel">Cédula / NIT</div>
            <input className="inp" value={form.cedula} onChange={e=>setF("cedula",e.target.value)} placeholder="Documento"/>
          </div>
          <div>
            <div className="flabel">Teléfono</div>
            <input className="inp" value={form.telefono} onChange={e=>setF("telefono",e.target.value)} placeholder="Cel."/>
          </div>
          <div>
            <div className="flabel">Email</div>
            <input className="inp" type="email" value={form.email} onChange={e=>setF("email",e.target.value)} placeholder="email@..."/>
          </div>
          <div>
            <div className="flabel">Ciudad</div>
            <input className="inp" value={form.ciudad} onChange={e=>setF("ciudad",e.target.value)} placeholder="Ciudad"/>
          </div>
          <div>
            <div className="flabel">Fecha de cotización</div>
            <input className="inp" type="date" value={form.fecha} onChange={e=>setF("fecha",e.target.value)}/>
          </div>
          <div>
            <div className="flabel">Validez (días)</div>
            <input className="inp" type="number" min="1" value={form.validez} onChange={e=>setF("validez",e.target.value)} placeholder="30"/>
          </div>
        </div>

        {/* Tabla de items */}
        <div className="fdiv"/>
        <div style={{ fontWeight:700, fontSize:".83rem", color:"var(--p)", marginBottom:10, textTransform:"uppercase", letterSpacing:".05em" }}>Productos / Servicios</div>

        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {form.items.map((it,idx)=>(
            <div key={it.id} style={{ display:"grid", gridTemplateColumns:"1fr 100px 80px 100px 30px", gap:8, alignItems:"end" }}>
              <div>
                {idx===0&&<div className="flabel">Producto / Descripción</div>}
                <input list="prodList" className="inp" value={it.nombre} placeholder="Nombre del producto"
                  onChange={e=>sugerirPrecio(it.id,e.target.value)}/>
              </div>
              <div>
                {idx===0&&<div className="flabel">Medida</div>}
                <input className="inp" value={it.medida} placeholder="1.40 m"
                  onChange={e=>updItem(it.id,"medida",e.target.value)}/>
              </div>
              <div>
                {idx===0&&<div className="flabel">Cant.</div>}
                <input className="inp" type="number" min="1" value={it.cant}
                  onChange={e=>updItem(it.id,"cant",e.target.value)}/>
              </div>
              <div>
                {idx===0&&<div className="flabel">Precio unit. COP</div>}
                <input className="inp" type="number" min="0" step="1000" value={it.precio}
                  onChange={e=>updItem(it.id,"precio",e.target.value)}/>
              </div>
              <div style={{ paddingBottom:2 }}>
                {form.items.length>1&&(
                  <button className="btn btn-ghost-danger btn-sm btn-icon" onClick={()=>remItem(it.id)}><Icon n="trash" s={13}/></button>
                )}
              </div>
            </div>
          ))}
          <datalist id="prodList">
            {prodNames.map(n=><option key={n} value={n}/>)}
          </datalist>
          <button className="btn btn-outline btn-sm" style={{ alignSelf:"flex-start" }} onClick={addItem}>
            <Icon n="plus" s={13}/>Agregar ítem
          </button>
        </div>

        {/* Totales */}
        <div className="fdiv" style={{ marginTop:12 }}/>
        <div style={{ display:"flex", gap:8, alignItems:"center", marginBottom:8 }}>
          <select className="inp" style={{ width:130 }} value={form.discType} onChange={e=>setF("discType",e.target.value)}>
            <option value="monto">Descuento $</option>
            <option value="pct">Descuento %</option>
          </select>
          <input className="inp" type="number" min="0" style={{ width:100 }} value={form.descuento}
            onChange={e=>setF("descuento",e.target.value)} placeholder="0"/>
        </div>
        <div style={{ background:"var(--p-fix)", border:"1px solid var(--p-fix-dim)", borderRadius:9, padding:"10px 14px" }}>
          {[[" Subtotal",fmt(subtotal)], descMonto>0?["Descuento",`- ${fmt(descMonto)}`]:null].filter(Boolean).map(([l,v])=>(
            <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:".83rem", color:"var(--on-sv)", marginBottom:3 }}><span>{l}:</span><span>{v}</span></div>
          ))}
          <div style={{ display:"flex", justifyContent:"space-between", fontSize:"1rem", fontWeight:700, color:"var(--p)", marginTop:4 }}>
            <span>Total:</span><span>{fmt(total)}</span>
          </div>
        </div>

        {/* Notas */}
        <div style={{ marginTop:12 }}>
          <div className="flabel">Notas / Condiciones especiales</div>
          <textarea className="inp" rows={2} value={form.notas} onChange={e=>setF("notas",e.target.value)}
            placeholder="Términos de pago, plazo de entrega, condiciones especiales..." style={{ resize:"vertical" }}/>
        </div>
      </Modal>

      {/* ════ MODAL DETALLE ════ */}
      <Modal open={!!detalle} onClose={()=>setDetalle(null)} title={`Cotización #${detalle?.numero||detalle?.id?.slice(0,8).toUpperCase()}`} maxW={560}
        footer={<>
          <button className="btn btn-outline" onClick={()=>setDetalle(null)}>Cerrar</button>
          {!["Convertida","Rechazada"].includes(detalle?.estado)&&(
            <button className="btn btn-outline" onClick={()=>{ abrirEditar(detalle); setDetalle(null); }}>
              <Icon n="edit" s={14}/>Editar
            </button>
          )}
          <button className="btn btn-outline" onClick={()=>compartirWA(detalle,"")}>
            <Icon n="whatsapp" s={14}/>WhatsApp
          </button>
          <button className="btn btn-brand" onClick={()=>{ try{ printCotizacionPDF(detalle,empresa); } catch(e){ toast(e.message,false); } }}>
            <Icon n="pdf" s={14}/>PDF
          </button>
        </>}>

        {detalle&&(
          <div>
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
              <EstadoBadge estado={detalle.estado}/>
              <span style={{ fontSize:".78rem", color:"var(--out)" }}>{fmtDate(detalle.fecha)}</span>
              <span style={{ fontSize:".78rem", color:"var(--out)" }}>· Válida hasta: {fmtDate(detalle.fechaVencimiento)||"—"}</span>
            </div>

            {/* Cambiar estado */}
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginBottom:14 }}>
              {ESTADOS.filter(e=>e!==detalle.estado).map(e=>(
                <button key={e} className="btn btn-outline btn-sm" onClick={()=>cambiarEstado(detalle.id,e)}>
                  {e}
                </button>
              ))}
              {detalle.estado==="Aprobada"&&(
                <button className="btn btn-brand btn-sm" onClick={()=>convertirVenta(detalle)}>
                  <Icon n="convert" s={13}/>Marcar como convertida
                </button>
              )}
            </div>

            {/* Datos cliente */}
            <div className="f2" style={{ marginBottom:12 }}>
              {[["Cliente",detalle.cliente],["Cédula",detalle.cedula||"—"],["Teléfono",detalle.telefono||"—"],["Vendedor",detalle.vendedor||"—"]].map(([l,v])=>(
                <div key={l}>
                  <div style={{ fontSize:".7rem", color:"var(--out)", textTransform:"uppercase", letterSpacing:".06em", marginBottom:2 }}>{l}</div>
                  <div style={{ fontWeight:500, fontSize:".88rem" }}>{v}</div>
                </div>
              ))}
            </div>

            {/* Items */}
            <div className="fdiv"/>
            <div className="fsub">Productos</div>
            <table style={{ width:"100%", marginBottom:12 }}>
              <thead><tr><th>Producto</th><th>Med.</th><th>Cant.</th><th>Precio</th><th>Subtotal</th></tr></thead>
              <tbody>
                {(detalle.items||[]).map((it,i)=>(
                  <tr key={i}>
                    <td style={{ fontWeight:500 }}>{it.nombre}</td>
                    <td style={{ fontSize:".8rem" }}>{it.medida||"—"}</td>
                    <td style={{ textAlign:"center" }}>{it.cant}</td>
                    <td style={{ fontVariantNumeric:"tabular-nums" }}>{fmt(it.precio)}</td>
                    <td style={{ fontWeight:700, fontVariantNumeric:"tabular-nums" }}>{fmt((it.cant||1)*it.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ background:"var(--p-fix)", border:"1px solid var(--p-fix-dim)", borderRadius:9, padding:"10px 14px" }}>
              {[[" Subtotal",fmt(detalle.subtotal)], detalle.descuento>0?["Descuento",`- ${fmt(detalle.descuento)}`]:null, ["Total",fmt(detalle.total)]].filter(Boolean).map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", fontWeight:l==="Total"?700:400, fontSize:l==="Total"?".95rem":".83rem", marginTop:4, color:"var(--text-dk,#0F172A)" }}>
                  <span>{l}:</span><span>{v}</span>
                </div>
              ))}
            </div>

            {detalle.notas&&(
              <div style={{ marginTop:12, background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:8, padding:"10px 14px" }}>
                <div style={{ fontSize:".7rem", fontWeight:700, color:"#92400E", marginBottom:4, textTransform:"uppercase" }}>Notas</div>
                <p style={{ fontSize:".85rem", color:"#78350F" }}>{detalle.notas}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
