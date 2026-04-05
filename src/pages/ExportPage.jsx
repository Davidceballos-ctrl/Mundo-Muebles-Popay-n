import { useRef, useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmt, fmtN } from "../utils/format.js";
import { exportInventory, exportSales } from "../utils/xlsxExport.js";
import { exportBackup, importBackup } from "../utils/backup.js";
import Icon from "../components/Icons.jsx";

export default function ExportPage() {
  const { products, sales, toast } = useApp();
  const fileRef = useRef();
  const [importing, setImporting] = useState(false);

  const totalValue  = products.reduce((a, p) => a + p.variantes.reduce((b, v) => b + v.stock * v.precio, 0), 0);
  const totalStock  = products.reduce((a, p) => a + p.variantes.reduce((b, v) => b + v.stock, 0), 0);
  const variants    = products.reduce((a, p) => a + p.variantes.length, 0);
  const totalSales  = sales.reduce((a, s) => a + s.total, 0);

  const doImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImporting(true);
    try {
      const fecha = await importBackup(file);
      toast(`Respaldo restaurado (exportado el ${new Date(fecha).toLocaleDateString("es-CO")}). Recarga la página.`);
      setTimeout(() => window.location.reload(), 2200);
    } catch (err) {
      toast(err.message, false);
    } finally {
      setImporting(false);
      e.target.value = "";
    }
  };

  const ExCard = ({ icon, title, desc, stats, onAction, label, danger }) => (
    <div className="card" style={{ maxWidth: 440 }}>
      <div style={{ padding: "28px 26px" }}>
        <div style={{ width: 52, height: 52, borderRadius: 13, background: danger ? "var(--danger-bg)" : "var(--p-fix)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: danger ? "var(--err)" : "var(--p-ctr)" }}>
          <Icon n={icon} s={26} />
        </div>
        <h2 style={{ fontSize: "1.1rem", color: "var(--p)", marginBottom: 6 }}>{title}</h2>
        <p style={{ fontSize: ".82rem", color: "var(--out)", maxWidth: 320, lineHeight: 1.65, marginBottom: 20 }}>{desc}</p>
        {stats && (
          <div style={{ display: "flex", gap: 16, justifyContent: "flex-start", marginBottom: 20, padding: "14px 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
            {stats.map(({ v, l }) => (
              <div key={l} style={{ textAlign: "left" }}>
                <div style={{ fontSize: "1.3rem", fontFamily: "Playfair Display,serif", fontWeight: 700, color: "var(--p)" }}>{v}</div>
                <div style={{ fontSize: ".7rem", color: "var(--out)", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        )}
        <button className={`btn ${danger ? "btn-ghost-danger" : "btn-brand"}`} style={{ height: 40, padding: "0 20px" }} onClick={onAction} disabled={importing}>
          <Icon n="download" s={15} />{label}
        </button>
      </div>
    </div>
  );

  return (
    <div>
      <div className="sec-head"><div><h2 className="sec-title">Exportar y Respaldo</h2><p className="sec-sub">Descarga datos o respalda el sistema completo</p></div></div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, marginBottom: 16 }}>
        <ExCard icon="excel" title="Exportar Inventario" desc="Genera un archivo Excel con todos los productos, variantes, precios, colores y stock actual."
          stats={[{ v: products.length, l: "Productos" }, { v: variants, l: "Variantes" }, { v: fmtN(totalStock), l: "Unidades" }, { v: fmt(totalValue), l: "Valor total" }]}
          onAction={() => { exportInventory(products).then(() => toast("Inventario exportado a Excel")).catch(() => toast("Error al exportar", false)); }} label="Descargar Inventario .xlsx" />

        <ExCard icon="money" title="Exportar Ventas" desc="Exporta el historial completo de ventas, montos, clientes y métodos de pago."
          stats={[{ v: sales.length, l: "Ventas" }, { v: fmt(totalSales), l: "Total facturado" }]}
          onAction={() => { exportSales(sales).then(() => toast("Ventas exportadas a Excel")).catch(() => toast("Error al exportar", false)); }} label="Descargar Ventas .xlsx" />
      </div>

      {/* Respaldo */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
        <div className="card" style={{ maxWidth: 440 }}>
          <div style={{ padding: "28px 26px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: "#F0FDF4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: "var(--ok)" }}>
              <Icon n="save" s={26} />
            </div>
            <h2 style={{ fontSize: "1.1rem", color: "var(--p)", marginBottom: 6 }}>Respaldo completo</h2>
            <p style={{ fontSize: ".82rem", color: "var(--out)", lineHeight: 1.65, marginBottom: 20 }}>
              Exporta todos los datos del sistema (productos, ventas, compras, clientes, proveedores) a un archivo JSON.
              Guárdalo en un lugar seguro como copia de seguridad.
            </p>
            <div style={{ background: "var(--warn-bg)", border: "1px solid var(--warn-border)", borderRadius: 8, padding: "10px 12px", marginBottom: 18, fontSize: ".78rem", color: "var(--warn)" }}>
              ⚠️ Si el navegador se limpia o cambias de equipo, sin este respaldo perderás todos los datos.
            </div>
            <button className="btn btn-ok" style={{ height: 40, padding: "0 20px" }} onClick={() => { exportBackup(); toast("Respaldo generado exitosamente"); }}>
              <Icon n="download" s={15} />Descargar respaldo .json
            </button>
          </div>
        </div>

        <div className="card" style={{ maxWidth: 440 }}>
          <div style={{ padding: "28px 26px" }}>
            <div style={{ width: 52, height: 52, borderRadius: 13, background: "var(--danger-bg)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14, color: "var(--err)" }}>
              <Icon n="refresh" s={26} />
            </div>
            <h2 style={{ fontSize: "1.1rem", color: "var(--p)", marginBottom: 6 }}>Restaurar respaldo</h2>
            <p style={{ fontSize: ".82rem", color: "var(--out)", lineHeight: 1.65, marginBottom: 20 }}>
              Sube un archivo de respaldo JSON generado anteriormente para restaurar todos los datos del sistema.
            </p>
            <div style={{ background: "var(--danger-bg)", border: "1px solid var(--danger-border)", borderRadius: 8, padding: "10px 12px", marginBottom: 18, fontSize: ".78rem", color: "var(--err)" }}>
              🔴 Esta acción reemplaza todos los datos actuales. No es reversible.
            </div>
            <input type="file" accept=".json" ref={fileRef} style={{ display: "none" }} onChange={doImport} />
            <button className="btn btn-ghost-danger" style={{ height: 40, padding: "0 20px" }} onClick={() => fileRef.current.click()} disabled={importing}>
              <Icon n="refresh" s={15} />{importing ? "Restaurando..." : "Seleccionar archivo .json"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
