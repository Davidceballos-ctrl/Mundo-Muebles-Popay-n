/**
 * IntegrationsPage.jsx — Hub de integraciones · v8.1
 * Supabase, DIAN, WhatsApp, PWA, Contabilidad
 */
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmt } from "../utils/format.js";
import { exportarSiigo, exportarWorldOffice, exportarCSVContable, exportarResumenDIAN } from "../utils/contabilidad.js";
import { enviarReporteDiario, enviarAlertaStock, enviarResumenVentas } from "../utils/whatsappService.js";
import Icon from "../components/Icons.jsx";

// ── Sección genérica ──────────────────────────────────────────────────────────
function Section({ icon, title, subtitle, color, bg, children, badge }) {
  const [open, setOpen] = useState(true);
  return (
    <div style={{ background:"var(--white,#fff)", border:"1.5px solid var(--border)", borderRadius:14, overflow:"hidden", marginBottom:16, boxShadow:"var(--sh)" }}>
      <button
        onClick={()=>setOpen(o=>!o)}
        style={{ width:"100%", display:"flex", alignItems:"center", gap:14, padding:"16px 20px", background:bg, border:"none", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif" }}>
        <div style={{ width:40,height:40,borderRadius:10,background:color,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",flexShrink:0 }}>
          <Icon n={icon} s={20}/>
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:700,fontSize:"1rem",color:"var(--p)" }}>{title}</div>
          <div style={{ fontSize:".8rem",color:"var(--on-sv)",marginTop:2 }}>{subtitle}</div>
        </div>
        {badge&&<span style={{ background:badge.bg,color:badge.col,padding:"3px 10px",borderRadius:99,fontSize:".74rem",fontWeight:700,border:`1px solid ${badge.col}33` }}>{badge.label}</span>}
        <Icon n={open?"chevD":"chevR"} s={14} className="" style={{ color:"var(--out)" }}/>
      </button>
      {open&&<div style={{ padding:"0 20px 20px" }}>{children}</div>}
    </div>
  );
}

function InfoBox({ type, children }) {
  const styles = {
    info:    { bg:"#EFF6FF", border:"#BFDBFE", color:"#1D4ED8", icon:"shield" },
    warn:    { bg:"#FEF3C7", border:"#FDE68A", color:"#92400E", icon:"warning" },
    success: { bg:"#D1FAE5", border:"#A7F3D0", color:"#065F46", icon:"check" },
  }[type]||{ bg:"#F1F5F9", border:"#CBD5E1", color:"#334155", icon:"list" };
  return (
    <div style={{ background:styles.bg,border:`1.5px solid ${styles.border}`,borderRadius:9,padding:"10px 14px",marginBottom:12,display:"flex",gap:10 }}>
      <div style={{ flexShrink:0,color:styles.color,marginTop:2 }}><Icon n={styles.icon} s={16}/></div>
      <div style={{ fontSize:".84rem",color:styles.color,lineHeight:1.55 }}>{children}</div>
    </div>
  );
}

export default function IntegrationsPage() {
  const { integrations, setIntegrations, sales, purchases, empresa, products, toast } = useApp();

  // ── WhatsApp (usa whatsappService.js) ──
  const [waNumero, setWaNumero] = useState(integrations.whatsapp?.numero || "");
  const [preview,  setPreview]  = useState(null);

  const lowStock = useMemo(() =>
    products.flatMap(p => p.variantes.filter(v => v.stock <= 3).map(v => ({ nombre: p.nombre, medida: v.medida, stock: v.stock })))
  , [products]);

  const compartirAlertaWA = () => {
    enviarAlertaStock({ products, numero: waNumero, empresa });
  };

  const compartirResumenVentas = () => {
    enviarResumenVentas({ sales, numero: waNumero, empresa });
  };

  const compartirReporteDiario = () => {
    enviarReporteDiario({ sales, products, numero: waNumero, empresa });
  };

  const previsualizarReporte = () => {
    const hoy = new Date().toISOString().slice(0, 10);
    const ventasHoy = sales.filter(s => s.fecha === hoy);
    const totalHoy  = ventasHoy.reduce((a, s) => a + s.total, 0);
    const stockBajoList = products.flatMap(p =>
      p.variantes.filter(v => v.stock <= 3).map(v => `- ${p.nombre} (${v.stock} unidades)`)
    );
    const vendidosMap = {};
    ventasHoy.forEach(v => (v.items || []).forEach(it => {
      vendidosMap[it.nombre] = (vendidosMap[it.nombre] || 0) + (it.cant || 1);
    }));
    const COP = n => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n || 0);
    let msg = `📊 Reporte Diario - ${empresa.nombre || "Mundo Muebles"}\n\n`;
    msg += `📦 Stock Bajo:\n${stockBajoList.slice(0,10).join("\n") || "- Sin alertas"}\n\n`;
    msg += `💰 Ventas del día:\n- Total: ${COP(totalHoy)}\n- Número de ventas: ${ventasHoy.length}\n\n`;
    msg += `🛒 Productos vendidos:\n`;
    Object.entries(vendidosMap).sort((a,b)=>b[1]-a[1]).slice(0,8).forEach(([n,c]) => { msg += `- ${n} (${c})\n`; });
    if (!Object.keys(vendidosMap).length) msg += "- Sin ventas hoy\n";
    setPreview(msg);
  };

  const guardarWA = () => {
    setIntegrations(prev => ({ ...prev, whatsapp: { numero: waNumero, activo: true } }));
    toast("Número WhatsApp guardado.");
  };


  // ── Supabase ──
  const [sbUrl,  setSbUrl]  = useState(integrations.supabase?.url||"");
  const [sbKey,  setSbKey]  = useState(integrations.supabase?.key||"");
  const [sbGuardado, setSbGuardado] = useState(false);

  const guardarSupabase = () => {
    if (!sbUrl.includes("supabase.co")) { toast("URL de Supabase no válida.", false); return; }
    if (!sbKey) { toast("Ingresa la API key de Supabase.", false); return; }
    setIntegrations(prev=>({...prev, supabase:{ url:sbUrl, key:sbKey, activo:true }}));
    setSbGuardado(true);
    toast("Configuración Supabase guardada. Activa la sincronización en el código.");
  };

  // ── DIAN ──
  const [dianProveedor, setDianProveedor] = useState(integrations.dian?.proveedor||"");
  const [dianToken,     setDianToken]     = useState(integrations.dian?.token||"");
  const [dianAmbiente,  setDianAmbiente]  = useState(integrations.dian?.ambiente||"pruebas");

  const guardarDIAN = () => {
    if (!dianProveedor) { toast("Selecciona un proveedor autorizado.", false); return; }
    setIntegrations(prev=>({...prev, dian:{ proveedor:dianProveedor, token:dianToken, ambiente:dianAmbiente, activo:!!dianToken }}));
    toast("Configuración DIAN guardada.");
  };

  // ── Contabilidad ──
  const [rangeDesde, setRangeDesde] = useState("");
  const [rangeHasta, setRangeHasta] = useState("");

  const salesParaExportar = useMemo(()=>{
    return sales.filter(s=>{
      if (rangeDesde && s.fecha < rangeDesde) return false;
      if (rangeHasta && s.fecha > rangeHasta) return false;
      return true;
    });
  },[sales, rangeDesde, rangeHasta]);

  const comprasParaExportar = useMemo(()=>{
    return (purchases||[]).filter(c=>{
      if (rangeDesde && c.fecha < rangeDesde) return false;
      if (rangeHasta && c.fecha > rangeHasta) return false;
      return true;
    });
  },[purchases, rangeDesde, rangeHasta]);

  const handleExportar = (tipo) => {
    if (!salesParaExportar.length) { toast("No hay ventas en ese rango.", false); return; }
    let ok = false;
    if (tipo==="siigo")    ok = exportarSiigo(salesParaExportar, empresa);
    if (tipo==="wo")       ok = exportarWorldOffice(salesParaExportar, empresa);
    if (tipo==="csv")      ok = exportarCSVContable(salesParaExportar, comprasParaExportar, empresa);
    if (tipo==="dian")     ok = exportarResumenDIAN(salesParaExportar, empresa);
    if (ok) toast(`Exportado correctamente (${salesParaExportar.length} ventas).`);
    else toast("Error al exportar.", false);
  };

  // ── PWA ──
  const [pwaInstructions, setPwaInstructions] = useState(false);

  return (
    <div>
      <div className="sec-head">
        <div>
          <h2 className="sec-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Icon n="integration" s={20}/>Integraciones y Extensiones
          </h2>
          <p className="sec-sub">WhatsApp · Supabase · DIAN · Contabilidad · PWA</p>
        </div>
      </div>

      {/* ── WHATSAPP ── */}
      <Section icon="whatsapp" title="WhatsApp Business" color="#25D366"
        bg="linear-gradient(135deg,#f0fdf4,#dcfce7)"
        subtitle="Reportes automáticos diarios y alertas de inventario por WhatsApp"
        badge={{ label:"Compartir enlace", bg:"#D1FAE5", col:"#065F46" }}>

        <InfoBox type="success">
          Usa <strong>WhatsApp Web (wa.me)</strong> — sin API key. Al hacer clic se abre WhatsApp con el mensaje ya redactado y listo para enviar al número configurado.
        </InfoBox>

        {/* Número destinatario */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr auto", gap:8, marginBottom:16, alignItems:"end" }}>
          <div>
            <div className="flabel">Número del destinatario (sin +57, sin espacios)</div>
            <input className="inp" value={waNumero} onChange={e=>setWaNumero(e.target.value)}
              placeholder="Ej: 3167145208"/>
            <div style={{ fontSize:".72rem", color:"var(--out)", marginTop:4 }}>
              Dueño, gerente o encargado de compras
            </div>
          </div>
          <button className="btn btn-ok" onClick={guardarWA}><Icon n="save" s={14}/>Guardar</button>
        </div>

        {/* Botones de reporte */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr", gap:10, marginBottom:16 }}>

          {/* REPORTE DIARIO — acción principal */}
          <div style={{
            display:"flex", alignItems:"center", justifyContent:"space-between",
            padding:"14px 18px", borderRadius:12,
            background:"linear-gradient(135deg,#128C7E,#25D366)",
            boxShadow:"0 4px 14px rgba(18,140,126,.3)",
          }}>
            <div>
              <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:".9rem", color:"#fff" }}>
                📊 Reporte Diario Completo
              </div>
              <div style={{ fontSize:".74rem", color:"rgba(255,255,255,.8)", marginTop:2 }}>
                Stock bajo + ventas del día + productos vendidos
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button onClick={previsualizarReporte}
                style={{ background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.35)", borderRadius:9, padding:"7px 14px", color:"#fff", fontSize:".78rem", fontWeight:700, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                👁 Vista previa
              </button>
              <button onClick={compartirReporteDiario}
                style={{ background:"#fff", border:"none", borderRadius:9, padding:"7px 14px", color:"#128C7E", fontSize:".78rem", fontWeight:800, cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                📤 Enviar
              </button>
            </div>
          </div>

          {/* Botones secundarios */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
            <button className="btn btn-outline" onClick={compartirAlertaWA} style={{ borderColor:"#25D366", color:"#15803D", flex:1 }}>
              <Icon n="whatsapp" s={16}/>Alerta stock bajo
              {lowStock.length > 0 && (
                <span style={{ background:"#DC2626", color:"#fff", borderRadius:99, padding:"1px 7px", fontSize:".68rem", fontWeight:700, marginLeft:6 }}>
                  {lowStock.length}
                </span>
              )}
            </button>
            <button className="btn btn-outline" onClick={compartirResumenVentas} style={{ borderColor:"#25D366", color:"#15803D", flex:1 }}>
              <Icon n="whatsapp" s={16}/>Resumen ventas hoy
            </button>
          </div>
        </div>

        {/* Stock bajo visible */}
        {lowStock.length > 0 && (
          <div style={{ background:"#FEF2F2", border:"1px solid #FCA5A5", borderRadius:9, padding:"10px 14px" }}>
            <div style={{ fontSize:".8rem", fontWeight:700, color:"#991B1B", marginBottom:6 }}>
              ⚠️ {lowStock.length} variante(s) con stock ≤ 3 unidades
            </div>
            {lowStock.slice(0, 5).map((p, i) => (
              <div key={i} style={{ fontSize:".78rem", color:"#7F1D1D" }}>• {p.nombre} ({p.medida}): <strong>{p.stock} uds</strong></div>
            ))}
            {lowStock.length > 5 && (
              <div style={{ fontSize:".75rem", color:"#B91C1C", marginTop:4 }}>...y {lowStock.length - 5} más</div>
            )}
          </div>
        )}

        {/* Modal: vista previa del reporte */}
        {preview && (
          <div style={{ position:"fixed", inset:0, background:"rgba(25,28,30,.5)", zIndex:300, display:"flex", alignItems:"center", justifyContent:"center", padding:20, backdropFilter:"blur(6px)" }}>
            <div style={{ background:"var(--s-card)", borderRadius:18, width:"100%", maxWidth:520, boxShadow:"0 25px 50px rgba(25,28,30,.2)", overflow:"hidden" }}>
              <div style={{ padding:"18px 22px 14px", borderBottom:"1px solid var(--s-mid)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:"1rem", color:"var(--on-s)" }}>
                  📊 Vista previa del reporte
                </div>
                <button onClick={() => setPreview(null)} style={{ background:"var(--s-low)", border:"none", borderRadius:99, width:28, height:28, cursor:"pointer", fontSize:".9rem", color:"var(--out)", display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
              </div>
              <div style={{ padding:"16px 22px" }}>
                <div style={{
                  background:"#1a1d2e", borderRadius:12, padding:"16px 18px",
                  fontFamily:"'Courier New', monospace", fontSize:".78rem",
                  color:"#e2e8f0", lineHeight:1.75, whiteSpace:"pre-wrap",
                  maxHeight:380, overflowY:"auto",
                }}>
                  {preview}
                </div>
              </div>
              <div style={{ padding:"10px 22px 18px", display:"flex", gap:10, justifyContent:"flex-end" }}>
                <button className="btn btn-outline" onClick={() => setPreview(null)}>Cerrar</button>
                <button onClick={() => { compartirReporteDiario(); setPreview(null); }}
                  style={{ background:"#25D366", color:"#fff", border:"none", borderRadius:99, padding:"0 20px", height:38, fontWeight:700, fontSize:".82rem", cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
                  📤 Enviar por WhatsApp
                </button>
              </div>
            </div>
          </div>
        )}
      </Section>

      {/* ── SUPABASE ── */}
      <Section icon="cloud" title="Sincronización Supabase" color="#3ECF8E"
        bg="linear-gradient(135deg,#f0fdf9,#d1fae5)"
        subtitle="Sincronizar datos entre dispositivos en tiempo real (requiere cuenta Supabase)"
        badge={integrations.supabase?.activo ? { label:"Configurado", bg:"#D1FAE5", col:"#065F46" } : { label:"Sin configurar", bg:"#FEF3C7", col:"#92400E" }}>

        <InfoBox type="info">
          <strong>Supabase</strong> es una base de datos PostgreSQL gratuita en la nube. Una vez configurado, los datos se sincronizarán automáticamente entre todos los dispositivos que usen este sistema.
        </InfoBox>

        <div style={{ display:"grid", gap:10, marginBottom:16 }}>
          <div>
            <div className="flabel">URL del proyecto Supabase</div>
            <input className="inp" value={sbUrl} onChange={e=>setSbUrl(e.target.value)}
              placeholder="https://xyzabc.supabase.co"/>
          </div>
          <div>
            <div className="flabel">API Key (anon public)</div>
            <input className="inp" type="password" value={sbKey} onChange={e=>setSbKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."/>
          </div>
        </div>

        <button className="btn btn-ok" onClick={guardarSupabase}><Icon n="save" s={14}/>Guardar configuración</button>

        <div style={{ marginTop:16, background:"#F8FAFC", border:"1px solid var(--border)", borderRadius:9, padding:"14px 16px" }}>
          <div style={{ fontWeight:700, fontSize:".85rem", color:"var(--p)", marginBottom:10 }}>📋 Pasos para activar:</div>
          {[
            "1. Crea una cuenta gratuita en supabase.com",
            "2. Crea un nuevo proyecto y copia la URL y la anon key",
            "3. Pégalas arriba y haz clic en Guardar",
            "4. Instala: npm install @supabase/supabase-js",
            "5. Reemplaza el utils/storage.js con la versión Supabase (solicitar al desarrollador)",
            "6. Ejecuta las migraciones SQL del esquema (ver docs del proyecto)",
          ].map((s,i)=>(
            <div key={i} style={{ fontSize:".82rem", color:"var(--on-sv)", marginBottom:4 }}>{s}</div>
          ))}
        </div>

        {sbGuardado&&(
          <InfoBox type="success">
            Configuración guardada. El próximo paso es instalar @supabase/supabase-js y reemplazar storage.js con la versión de sincronización.
          </InfoBox>
        )}
      </Section>

      {/* ── DIAN ── */}
      <Section icon="accounting" title="Facturación Electrónica DIAN" color="#DC2626"
        bg="linear-gradient(135deg,#fff5f5,#fee2e2)"
        subtitle="Configurar proveedor de facturación electrónica autorizado por la DIAN"
        badge={integrations.dian?.activo ? { label:"Activo", bg:"#D1FAE5", col:"#065F46" } : { label:"No activo", bg:"#FEE2E2", col:"#991B1B" }}>

        <InfoBox type="warn">
          La facturación electrónica en Colombia requiere contratar un <strong>Proveedor Autorizado DIAN (PAD)</strong>. El sistema prepara los datos — el PAD los envía a la DIAN y devuelve el CUFE.
        </InfoBox>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10, marginBottom:16 }}>
          <div style={{ gridColumn:"1/-1" }}>
            <div className="flabel">Proveedor Autorizado (PAD)</div>
            <select className="inp" value={dianProveedor} onChange={e=>setDianProveedor(e.target.value)}>
              <option value="">Selecciona un proveedor...</option>
              <option value="siigo">Siigo (siigo.com)</option>
              <option value="alegra">Alegra (alegra.com)</option>
              <option value="helisa">Helisa (helisa.com)</option>
              <option value="factura1">Factura1 (factura1.com)</option>
              <option value="nominasoft">Nominasoft</option>
              <option value="otro">Otro proveedor</option>
            </select>
          </div>
          <div>
            <div className="flabel">Token / API Key del proveedor</div>
            <input className="inp" type="password" value={dianToken} onChange={e=>setDianToken(e.target.value)}
              placeholder="Token de autenticación"/>
          </div>
          <div>
            <div className="flabel">Ambiente</div>
            <select className="inp" value={dianAmbiente} onChange={e=>setDianAmbiente(e.target.value)}>
              <option value="pruebas">Pruebas / Habilitación</option>
              <option value="produccion">Producción</option>
            </select>
          </div>
        </div>

        <button className="btn btn-brand" onClick={guardarDIAN}><Icon n="save" s={14}/>Guardar configuración DIAN</button>

        <div style={{ marginTop:16, background:"#FFF5F5", border:"1px solid #FCA5A5", borderRadius:9, padding:"14px 16px" }}>
          <div style={{ fontWeight:700, fontSize:".85rem", color:"#991B1B", marginBottom:10 }}>⚠️ Requisitos previos DIAN:</div>
          {[
            "• RUT activo con actividad económica 4752 (comercio de muebles)",
            "• Contrato vigente con el PAD seleccionado",
            "• Certificado digital de firma electrónica (si el PAD lo requiere)",
            "• Prefijo y rango de numeración autorizado por la DIAN",
            "• Resolución de facturación electrónica activa",
          ].map((s,i)=><div key={i} style={{ fontSize:".82rem", color:"#7F1D1D", marginBottom:3 }}>{s}</div>)}
        </div>
      </Section>

      {/* ── CONTABILIDAD ── */}
      <Section icon="accounting" title="Integración Contable" color="#7C3AED"
        bg="linear-gradient(135deg,#faf5ff,#ede9fe)"
        subtitle="Exportar movimientos a Siigo, World Office, Helisa u otro software contable">

        <InfoBox type="info">
          Los archivos se generan en el formato estándar de cada software. Solo debes importarlos desde el módulo de <strong>Cuentas por pagar / Ventas</strong> de tu software contable.
        </InfoBox>

        <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
          <div>
            <div className="flabel">Desde</div>
            <input className="inp" type="date" value={rangeDesde} onChange={e=>setRangeDesde(e.target.value)} style={{ width:145 }}/>
          </div>
          <div>
            <div className="flabel">Hasta</div>
            <input className="inp" type="date" value={rangeHasta} onChange={e=>setRangeHasta(e.target.value)} style={{ width:145 }}/>
          </div>
          <div style={{ alignSelf:"flex-end" }}>
            <div style={{ fontSize:".78rem", color:"var(--on-sv)", padding:"6px 0" }}>
              {salesParaExportar.length} venta(s) seleccionadas
            </div>
          </div>
        </div>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:10 }}>
          {[
            { id:"siigo", label:"Exportar para Siigo",       icon:"accounting", color:"#2563EB", desc:"Formato TXT comprobante diario" },
            { id:"wo",    label:"Exportar para World Office", icon:"accounting", color:"#16A34A", desc:"Formato CSV interface ventas"   },
            { id:"csv",   label:"CSV Genérico / Helisa",      icon:"excel",      color:"#7C3AED", desc:"Compatible Alegra, Helisa, otros" },
            { id:"dian",  label:"Resumen DIAN (JSON)",         icon:"accounting", color:"#DC2626", desc:"Para reporte a proveedor FE"    },
          ].map(b=>(
            <button key={b.id} onClick={()=>handleExportar(b.id)}
              style={{ background:"#fff", border:`1.5px solid ${b.color}33`, borderRadius:10, padding:"14px", cursor:"pointer", textAlign:"left", fontFamily:"'DM Sans',sans-serif", transition:"all .15s" }}
              onMouseOver={e=>{ e.currentTarget.style.borderColor=b.color; e.currentTarget.style.transform="translateY(-1px)"; }}
              onMouseOut={e=>{ e.currentTarget.style.borderColor=`${b.color}33`; e.currentTarget.style.transform=""; }}>
              <div style={{ color:b.color, marginBottom:6 }}><Icon n={b.icon} s={22}/></div>
              <div style={{ fontWeight:700, fontSize:".88rem", color:"var(--p)", marginBottom:3 }}>{b.label}</div>
              <div style={{ fontSize:".74rem", color:"var(--out)" }}>{b.desc}</div>
            </button>
          ))}
        </div>
      </Section>

      {/* ── PWA ── */}
      <Section icon="pwa" title="App Móvil / PWA para Bodega" color="#0D9488"
        bg="linear-gradient(135deg,#f0fdfa,#ccfbf1)"
        subtitle="Instalar el sistema como aplicación en celulares y tablets para bodega">

        <InfoBox type="success">
          Este sistema ya es una <strong>Progressive Web App (PWA)</strong>. Puedes instalarlo directamente desde el navegador en cualquier dispositivo móvil — sin necesidad de tiendas de aplicaciones.
        </InfoBox>

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14, marginBottom:16 }}>
          {[
            { titulo:"📱 Android (Chrome)", pasos:["1. Abre Chrome en tu celular","2. Ve a la URL del sistema","3. Toca los 3 puntos (⋮) del menú","4. Selecciona 'Agregar a pantalla de inicio'","5. Confirma la instalación"] },
            { titulo:"🍎 iPhone (Safari)",  pasos:["1. Abre Safari en tu iPhone","2. Ve a la URL del sistema","3. Toca el botón Compartir (□↑)","4. Selecciona 'Agregar a pantalla de inicio'","5. Confirma la instalación"] },
          ].map(item=>(
            <div key={item.titulo} style={{ background:"#F0FDF4", border:"1px solid #A7F3D0", borderRadius:10, padding:"14px 16px" }}>
              <div style={{ fontWeight:700, fontSize:".88rem", color:"#065F46", marginBottom:10 }}>{item.titulo}</div>
              {item.pasos.map((p,i)=><div key={i} style={{ fontSize:".81rem", color:"#047857", marginBottom:4 }}>{p}</div>)}
            </div>
          ))}
        </div>

        <div style={{ background:"#F8FAFC", border:"1px solid var(--border)", borderRadius:9, padding:"14px 16px" }}>
          <div style={{ fontWeight:700, fontSize:".85rem", color:"var(--p)", marginBottom:10 }}>🔧 Para el desarrollador — Activar PWA completa:</div>
          {[
            "1. El manifest.json ya está en /public/ con íconos y configuración",
            "2. El service worker (sw.js) está registrado — permite uso offline",
            "3. Para notificaciones push: integrar con Firebase Cloud Messaging (FCM)",
            "4. Para sincronización offline avanzada: usar Workbox o idb (IndexedDB)",
            "5. Subir el build a Vercel/Netlify con HTTPS (requerido para PWA)",
          ].map((s,i)=><div key={i} style={{ fontSize:".82rem", color:"var(--on-sv)", marginBottom:4 }}>{s}</div>)}
        </div>

        <div style={{ marginTop:12, display:"flex", gap:10 }}>
          <div style={{ background:"var(--p-fix)", border:"1px solid var(--p-fix-dim)", borderRadius:9, padding:"10px 14px", flex:1 }}>
            <div style={{ fontSize:".82rem", color:"var(--p)" }}>
              <strong>Rol Bodeguero</strong> — acceso óptimo para bodega:<br/>
              ✓ Inventario · ✓ Kardex · ✓ Compras · ✓ Proveedores · ✓ Garantías<br/>
              <span style={{ fontSize:".76rem", color:"var(--out)" }}>Email: bodega@mundomuebles.com · Pass: bodega123</span>
            </div>
          </div>
        </div>
      </Section>

      {/* ── FIREBASE (alternativo a Supabase) ── */}
      <Section icon="cloud" title="Firebase (alternativa a Supabase)" color="#F5820D"
        bg="linear-gradient(135deg,#fff7ed,#fed7aa)"
        subtitle="Google Firebase como alternativa de sincronización en la nube">

        <InfoBox type="info">
          Firebase es la alternativa de Google a Supabase. Ofrece Firestore (base de datos NoSQL), Auth y Storage. El proceso de integración es similar al de Supabase.
        </InfoBox>

        <div style={{ background:"#FFF7ED", border:"1px solid #FED7AA", borderRadius:9, padding:"14px 16px" }}>
          {[
            "1. Crea un proyecto en firebase.google.com",
            "2. Habilita Firestore Database en modo 'production'",
            "3. Copia la configuración (apiKey, projectId, etc.) de Configuración del proyecto",
            "4. Instala: npm install firebase",
            "5. Crea src/utils/firebase.js con tu configuración",
            "6. Reemplaza las funciones de storage.js con las equivalentes de Firestore",
            "7. Configura las reglas de seguridad de Firestore",
          ].map((s,i)=><div key={i} style={{ fontSize:".82rem", color:"#78350F", marginBottom:4 }}>{s}</div>)}
        </div>
      </Section>
    </div>
  );
}
