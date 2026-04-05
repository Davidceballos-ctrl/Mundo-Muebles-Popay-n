import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import { EMPRESA_DEFAULT } from "../data/initialData.js";
import Icon from "../components/Icons.jsx";
import Logo from "../components/Logo.jsx";

export default function SettingsPage() {
  const { empresa, setEmpresa, toast, currentUser } = useApp();
  const { isAdmin } = usePermissions(currentUser);
  const [form, setForm] = useState({ ...empresa });
  const [saved, setSaved] = useState(false);

  const f = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!form.nombre?.trim()) { toast("El nombre de la empresa es obligatorio", false); return; }
    setEmpresa(form);
    setSaved(true);
    toast("Configuración guardada exitosamente");
    setTimeout(() => setSaved(false), 3000);
  };

  const handleReset = () => {
    if (!window.confirm("¿Restaurar configuración predeterminada?")) return;
    setForm({ ...EMPRESA_DEFAULT });
    setSaved(false);
  };

  if (!isAdmin) {
    return (
      <div className="denied">
        <Icon n="shield" s={40} />
        <h3>Acceso restringido</h3>
        <p>Solo los administradores pueden editar la configuración de la empresa.</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto" }}>

      {/* Preview visual */}
      <div className="card" style={{ marginBottom: 20, padding: "20px 24px" }}>
        <div style={{ fontSize: ".72rem", fontWeight: 700, color: "var(--out)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 12 }}>
          Vista previa — encabezado de recibo
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ background: "var(--p)", borderRadius: 12, padding: "12px 16px", flexShrink: 0 }}>
            <Logo variant="full" size={32} white />
          </div>
          <div>
            <div style={{ fontFamily: "'Playfair Display',serif", fontWeight: 700, color: "var(--p)", fontSize: "1rem" }}>
              {form.nombre || "Nombre empresa"}
            </div>
            <div style={{ fontSize: ".76rem", color: "var(--out)", marginTop: 2 }}>
              NIT: {form.nit || "—"} &nbsp;·&nbsp; Tel: {form.telefono || "—"}
            </div>
            <div style={{ fontSize: ".76rem", color: "var(--out)" }}>{form.email || "—"}</div>
            <div style={{ fontSize: ".76rem", color: "var(--out)" }}>{form.direccion || "—"}</div>
          </div>
        </div>
        <div style={{ marginTop: 12, fontSize: ".73rem", color: "var(--out)", padding: "8px 12px", background: "var(--p-fix)", borderRadius: 8, border: "1px solid var(--p-fix-dim)" }}>
          💡 Esta información aparecerá en todos los recibos de venta.
        </div>
      </div>

      <div className="card" style={{ padding: "24px" }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.05rem", color: "var(--p)", marginBottom: 4 }}>
            Datos de la empresa
          </h3>
          <p style={{ fontSize: ".8rem", color: "var(--out)" }}>
            Aparecen en todos los recibos y comprobantes de venta generados por el sistema.
          </p>
        </div>

        <div className="f2" style={{ gap: 14, marginBottom: 14 }}>
          <div className="fg" style={{ gridColumn: "1/-1" }}>
            <label>Nombre de la empresa *</label>
            <input className="inp" value={form.nombre || ""} onChange={f("nombre")}
              placeholder="Ej: Mundo Muebles Popayan" />
          </div>
          <div className="fg">
            <label>Eslogan</label>
            <input className="inp" value={form.subtit || ""} onChange={f("subtit")}
              placeholder="Ej: Moda en el hogar" />
          </div>
          <div className="fg">
            <label>NIT</label>
            <input className="inp" value={form.nit || ""} onChange={f("nit")}
              placeholder="Ej: 4616882-9" />
          </div>
          <div className="fg">
            <label>Teléfono de contacto</label>
            <input className="inp" value={form.telefono || ""} onChange={f("telefono")}
              placeholder="Ej: 316 7145208" />
          </div>
          <div className="fg">
            <label>Correo electrónico</label>
            <input className="inp" type="email" value={form.email || ""} onChange={f("email")}
              placeholder="correo@empresa.com" />
          </div>
          <div className="fg" style={{ gridColumn: "1/-1" }}>
            <label>Dirección física</label>
            <input className="inp" value={form.direccion || ""} onChange={f("direccion")}
              placeholder="Ej: Cra 4 # 13-08, Popayán, Cauca" />
          </div>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 14, borderTop: "1px solid var(--border)" }}>
          <button className="btn btn-outline" onClick={handleReset}>
            <Icon n="refresh" s={14} />Restaurar predeterminados
          </button>
          <button className={`btn ${saved ? "btn-brand" : "btn-amber"}`} onClick={handleSave} style={{ minWidth: 150 }}>
            {saved
              ? <><Icon n="check" s={14} />¡Guardado!</>
              : <><Icon n="save"  s={14} />Guardar cambios</>
            }
          </button>
        </div>
      </div>


      {/* ════════════════════════════════════════
          SECCIÓN LEGAL — Información Legal
          ════════════════════════════════════════ */}
      <div style={{ marginTop: 24 }}>

        {/* Encabezado de sección */}
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
          <div style={{ flex:1, height:1, background:"var(--s-high)" }}/>
          <span style={{ fontSize:".68rem", fontWeight:800, color:"var(--out)", textTransform:"uppercase", letterSpacing:".12em", whiteSpace:"nowrap" }}>
            Marco Legal · Colombia
          </span>
          <div style={{ flex:1, height:1, background:"var(--s-high)" }}/>
        </div>

        {/* Cards legales */}
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

          {/* Ley 1581 — Habeas Data */}
          <div className="card" style={{ padding:"22px 24px", display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:"linear-gradient(135deg,#dbe1ff,#b5c4ff)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.4rem", flexShrink:0,
              boxShadow:"0 2px 8px rgba(0,63,177,.12)",
            }}>🔒</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:".95rem", color:"var(--on-s)" }}>
                  Ley 1581 — Habeas Data
                </span>
                <span style={{ fontSize:".68rem", fontWeight:700, padding:"2px 9px", borderRadius:99, background:"var(--info-bg)", color:"var(--info-t)", textTransform:"uppercase", letterSpacing:".06em" }}>
                  Protección de datos
                </span>
              </div>
              <p style={{ fontSize:".81rem", color:"var(--on-sv)", lineHeight:1.72, marginBottom:10 }}>
                El sistema almacena datos personales de clientes exclusivamente para la gestión de ventas, garantías y facturación.
                Los datos se guardan localmente (localStorage) y no se transmiten a terceros sin autorización expresa.
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:7, fontSize:".77rem", color:"var(--p)", fontWeight:600 }}>
                <span>✉</span>
                <span>Solicitudes de acceso, rectificación o supresión:</span>
                <a href="mailto:gerencia@mundomuebles.com" style={{ color:"var(--p-ctr)", textDecoration:"none", fontWeight:700 }}>
                  gerencia@mundomuebles.com
                </a>
              </div>
            </div>
          </div>

          {/* Ley 1480 — Estatuto del Consumidor */}
          <div className="card" style={{ padding:"22px 24px", display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:"linear-gradient(135deg,#d1fae5,#a7f3d0)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.4rem", flexShrink:0,
              boxShadow:"0 2px 8px rgba(5,150,105,.1)",
            }}>⚖️</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:".95rem", color:"var(--on-s)" }}>
                  Ley 1480 — Estatuto del Consumidor
                </span>
                <span style={{ fontSize:".68rem", fontWeight:700, padding:"2px 9px", borderRadius:99, background:"var(--ok-bg)", color:"var(--ok-t)", textTransform:"uppercase", letterSpacing:".06em" }}>
                  Derechos del cliente
                </span>
              </div>
              <p style={{ fontSize:".81rem", color:"var(--on-sv)", lineHeight:1.72, marginBottom:10 }}>
                Mundo Muebles Popayán cumple con el Estatuto del Consumidor. Se otorga <strong style={{ color:"var(--on-s)" }}>garantía mínima de 1 año</strong> en
                defectos de fabricación. El cliente puede exigir reparación, cambio del bien o devolución del dinero.
              </p>
              <div style={{
                display:"inline-flex", alignItems:"center", gap:7,
                padding:"5px 12px", borderRadius:8,
                background:"var(--ok-bg)", fontSize:".76rem", color:"var(--ok-t)", fontWeight:600,
              }}>
                📅 Las cotizaciones tienen validez de 30 días desde su emisión
              </div>
            </div>
          </div>

          {/* DIAN — Facturación electrónica */}
          <div className="card" style={{ padding:"22px 24px", display:"flex", gap:18, alignItems:"flex-start" }}>
            <div style={{
              width:48, height:48, borderRadius:14,
              background:"linear-gradient(135deg,#fef3c7,#fde68a)",
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:"1.4rem", flexShrink:0,
              boxShadow:"0 2px 8px rgba(217,119,6,.1)",
            }}>🧾</div>
            <div style={{ flex:1 }}>
              <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:6 }}>
                <span style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:".95rem", color:"var(--on-s)" }}>
                  DIAN — Facturación Electrónica
                </span>
                <span style={{ fontSize:".68rem", fontWeight:700, padding:"2px 9px", borderRadius:99, background:"var(--warn-bg)", color:"var(--warn-t)", textTransform:"uppercase", letterSpacing:".06em" }}>
                  Res. 000042/2020
                </span>
              </div>
              <p style={{ fontSize:".81rem", color:"var(--on-sv)", lineHeight:1.72, marginBottom:10 }}>
                Este sistema genera <strong style={{ color:"var(--on-s)" }}>comprobantes internos de venta</strong>. Para facturación electrónica conforme
                a la DIAN (Res. 000042/2020), integre con un proveedor tecnológico autorizado.
              </p>
              <div style={{
                display:"flex", alignItems:"center", gap:8, padding:"10px 14px",
                background:"var(--p-fix)", borderRadius:9, border:"1px solid var(--p-fix-dim)",
                fontSize:".77rem", color:"var(--p)", fontWeight:500,
              }}>
                <span style={{ fontSize:"1rem" }}>ℹ️</span>
                <span>El NIT de la empresa debe estar configurado en <strong>Datos de la empresa</strong> para que aparezca correctamente en los recibos.</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer legal */}
        <div style={{ marginTop:16, padding:"12px 16px", borderRadius:10, background:"var(--s-low)", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <span style={{ fontSize:".72rem", color:"var(--out)", fontWeight:500 }}>
            © {new Date().getFullYear()} Mundo Muebles Popayán · Sistema ERP v10.0
          </span>
          <div style={{ display:"flex", gap:16 }}>
            {["Términos de uso", "Soporte técnico", "Privacidad"].map(t => (
              <span key={t} style={{ fontSize:".72rem", color:"var(--sec)", fontWeight:600, cursor:"pointer", letterSpacing:".02em" }}>{t}</span>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
