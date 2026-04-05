import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Icon from "./Icons.jsx";
import { useApp } from "../context/AppContext.jsx";
import { usePermissions } from "../hooks/usePermissions.js";
import { LOW_STOCK_THRESHOLD } from "../data/initialData.js";

export default function Sidebar({ open, onClose }) {
  const nav = useNavigate();
  const loc = useLocation();
  const { products, garantias, cotizaciones, separados, logout, currentUser } = useApp();
  const { can, isAdmin, isVendedor, isBodeguero } = usePermissions(currentUser);
  const [prodOpen,   setProdOpen]   = useState(true);
  const [reportOpen, setReportOpen] = useState(false);

  const lowCount     = products.reduce((a,p) => a + p.variantes.filter(v=>v.stock<=LOW_STOCK_THRESHOLD).length, 0);
  const garantiaPend  = (garantias||[]).filter(g=>["Recibido","En revision"].includes(g.estado)).length;
  const cotizPend     = (cotizaciones||[]).filter(c=>["Borrador","Enviada"].includes(c.estado)).length;
  const separadosPend = (separados||[]).filter(s=>["Pendiente","Abonado"].includes(s.estado)).length;

  const path = loc.pathname;
  const go   = (p) => { nav(p); onClose && onClose(); };
  const on   = (p) => path===p || (p!=="/" && path.startsWith(p));

  const initials = (currentUser?.nombre||"AD").split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase();
  const rolePillStyle = {
    Administrador: { bg: "#003fb1", color: "#fff" },
    Vendedor:      { bg: "#d1fae5", color: "#065f46" },
    Bodeguero:     { bg: "#fef3c7", color: "#92400e" },
  }[currentUser?.rol] || { bg: "#f3f4f6", color: "#6b7280" };

  const Item = ({ path: p, icon, label, badge, indent, perm }) => {
    if (perm && !can(perm) && !isAdmin) return null;
    return (
      <button
        className={`sb-item ${on(p) ? "on" : ""}`}
        style={indent ? { paddingLeft: 36, fontSize: ".83rem" } : {}}
        onClick={() => go(p)}>
        <Icon n={icon} s={15} />
        {label}
        {badge > 0 && <span className="sb-badge">{badge}</span>}
      </button>
    );
  };

  const Chevron = ({ open: o }) => (
    <span style={{ marginLeft: "auto", display: "flex", transition: "transform .2s", transform: o ? "rotate(180deg)" : "" }}>
      <Icon n="chevD" s={12} />
    </span>
  );

  return (
    <>
      {open && (
        <div onClick={onClose} style={{
          position: "fixed", inset: 0,
          background: "rgba(25,28,30,.32)",
          backdropFilter: "blur(4px)",
          zIndex: 99,
        }} />
      )}
      <aside className={`sb ${open ? "open" : ""}`}>

        {/* ── Brand ── */}
        <div className="sb-brand">
          <div className="sb-brand-icon" style={{ background: "var(--grad)", boxShadow: "0 4px 12px rgba(0,63,177,.3)" }}>MM</div>
          <div className="sb-brand-text">
            <h1>Mundo Muebles</h1>
            <p>Popayán · ERP v10</p>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sb-nav">
          <div className="sb-section">General</div>
          <Item path="/" icon="home" label="Inicio" />

          <div className="sb-section" style={{ marginTop: 4 }}>Ventas</div>
          {(isAdmin||isVendedor) && <Item path="/pos"          icon="cart"    label="Registro de Ventas" />}
          {(isAdmin||isVendedor) && <Item path="/ventas"       icon="list"    label="Historial de Ventas" />}
          {(isAdmin||isVendedor) && <Item path="/cotizaciones" icon="quote"    label="Cotizaciones"  badge={cotizPend} />}
          {(isAdmin||isVendedor) && <Item path="/separados"    icon="tag"      label="Separados"     badge={separadosPend} />}
          {(isAdmin||isVendedor||isBodeguero) && <Item path="/garantias" icon="warranty" label="Garantías" badge={garantiaPend} />}

          <div className="sb-section" style={{ marginTop: 4 }}>Inventario</div>
          <button className={`sb-item ${on("/productos") ? "on" : ""}`} onClick={() => setProdOpen(o => !o)}>
            <Icon n="box" s={15} />Productos<Chevron open={prodOpen} />
          </button>
          {prodOpen && <>
            {(isAdmin||isBodeguero) && <Item path="/productos/registrar" icon="plus"  label="Registrar producto" indent />}
            <Item path="/productos/lista"      icon="list"  label="Lista de productos" indent />
            <Item path="/productos/stock-bajo" icon="alert" label="Stock bajo" badge={lowCount} indent />
          </>}

          <div className="sb-section" style={{ marginTop: 4 }}>Operaciones</div>
          {(isAdmin||isBodeguero) && <Item path="/proveedores" icon="truck" label="Proveedores" />}
          {(isAdmin||isBodeguero) && <Item path="/compras"     icon="tag"   label="Compras" />}
          {(isAdmin||isVendedor)  && <Item path="/clientes"    icon="users" label="Clientes" />}

          {isAdmin && <>
            <div className="sb-section" style={{ marginTop: 4 }}>Análisis</div>
            <button className={`sb-item ${on("/reportes")||on("/dashboard-vendedor") ? "on" : ""}`} onClick={() => setReportOpen(o => !o)}>
              <Icon n="chart" s={15} />Reportes<Chevron open={reportOpen} />
            </button>
            {reportOpen && <>
              <Item path="/reportes"           icon="chart"  label="Reportes generales" indent />
              <Item path="/dashboard-vendedor" icon="vendor" label="Dashboard vendedor"  indent />
            </>}

            <div className="sb-section" style={{ marginTop: 4 }}>Sistema</div>
            <Item path="/usuarios"      icon="user"        label="Usuarios" />
            <Item path="/exportar"      icon="excel"       label="Exportar / Respaldo" />
            <Item path="/integraciones" icon="integration" label="Integraciones" />
            <Item path="/configuracion" icon="settings"    label="Configuración" />
          </>}
        </nav>

        {/* ── Footer ── */}
        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-av">{initials}</div>
            <div style={{ flex: 1, overflow: "hidden" }}>
              <div className="sb-uname">{currentUser?.nombre}</div>
              <span style={{
                display: "inline-flex", alignItems: "center",
                marginTop: 2, padding: "1px 8px",
                borderRadius: 999, fontSize: 10, fontWeight: 700,
                letterSpacing: ".04em", textTransform: "uppercase",
                background: rolePillStyle.bg, color: rolePillStyle.color,
              }}>
                {currentUser?.rol}
              </span>
            </div>
            <button onClick={logout} title="Cerrar sesión" style={{
              background: "none", border: "none", cursor: "pointer",
              color: "#94a3b8", padding: "6px", borderRadius: 8,
              display: "flex", transition: "color .15s",
            }}
              onMouseOver={e => e.currentTarget.style.color = "#dc2626"}
              onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}>
              <Icon n="logout" s={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
