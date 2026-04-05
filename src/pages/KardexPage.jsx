import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/initialData.js";
import { today, fmt } from "../utils/format.js";
import Icon from "../components/Icons.jsx";

export default function KardexPage() {
  const { pid, vid } = useParams();
  const nav = useNavigate();
  const { products, setProducts } = useApp();
  const [entry, setEntry] = useState({ tipo: "Entrada", cantidad: "", obs: "" });

  const prod = products.find(p => p.id === pid);
  const vari = prod?.variantes.find(v => v.id === vid);

  if (!prod || !vari) return <div className="empty"><p>Producto no encontrado</p></div>;

  const add = () => {
    if (!entry.cantidad) return;
    const delta    = entry.tipo === "Entrada" ? Number(entry.cantidad) : -Number(entry.cantidad);
    const newStock = Math.max(0, vari.stock + delta);
    const newKardex = [...(vari.kardex || []), {
      id: uid(), fecha: today(), tipo: entry.tipo,
      cantidad: Number(entry.cantidad), obs: entry.obs, stockResult: newStock
    }];
    setProducts(products.map(p => p.id === pid ? {
      ...p,
      variantes: p.variantes.map(v => v.id === vid ? { ...v, stock: newStock, kardex: newKardex } : v)
    } : p));
    setEntry({ tipo: "Entrada", cantidad: "", obs: "" });
  };

  const kardex = [...(vari.kardex || [])].reverse();

  return (
    <div style={{ maxWidth: 820 }}>
      <div className="sec-head">
        <div>
          <h2 className="sec-title">Kardex: {prod.nombre}</h2>
          <p className="sec-sub">{vari.medida} · {prod.categoria}</p>
        </div>
        <button className="btn btn-outline" onClick={() => nav(-1)}>
          <Icon n="chevD" style={{ transform: "rotate(90deg)" }} />Volver
        </button>
      </div>

      {/* Info tarjeta */}
      <div className="card" style={{ padding: "16px 20px", display: "flex", gap: 24, alignItems: "center", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: ".72rem", color: "var(--out)", textTransform: "uppercase", letterSpacing: ".07em" }}>Stock actual</div>
          <div style={{ fontSize: "2rem", fontFamily: "Playfair Display,serif", color: "var(--p)", lineHeight: 1 }}>{vari.stock}</div>
        </div>
        <div style={{ width: 1, height: 40, background: "var(--border)" }} />
        <div>
          <div style={{ fontSize: ".72rem", color: "var(--out)", textTransform: "uppercase", letterSpacing: ".07em" }}>Precio</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--amber)" }}>{fmt(vari.precio)}</div>
        </div>
        <div style={{ width: 1, height: 40, background: "var(--border)" }} />
        <div>
          <div style={{ fontSize: ".72rem", color: "var(--out)", textTransform: "uppercase", letterSpacing: ".07em" }}>Valor en stock</div>
          <div style={{ fontSize: "1.1rem", fontWeight: 700, color: "var(--p)" }}>{fmt(vari.precio * vari.stock)}</div>
        </div>
      </div>

      {/* Registrar movimiento */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-head"><span className="card-title">Registrar movimiento</span></div>
        <div style={{ padding: "14px 18px", display: "flex", gap: 10, flexWrap: "wrap", alignItems: "flex-end" }}>
          <div className="fg mb0">
            <label>Tipo</label>
            <select className="inp sel" style={{ width: 130 }} value={entry.tipo} onChange={e => setEntry({ ...entry, tipo: e.target.value })}>
              <option>Entrada</option>
              <option>Salida</option>
              <option>Ajuste</option>
            </select>
          </div>
          <div className="fg mb0">
            <label>Cantidad</label>
            <input className="inp" type="number" style={{ width: 90 }} min="1" placeholder="0"
              value={entry.cantidad} onChange={e => setEntry({ ...entry, cantidad: e.target.value })} />
          </div>
          <div className="fg mb0" style={{ flex: 1, minWidth: 180 }}>
            <label>Observación</label>
            <input className="inp" placeholder="Motivo del movimiento..."
              value={entry.obs} onChange={e => setEntry({ ...entry, obs: e.target.value })} />
          </div>
          <button className="btn btn-wood" onClick={add}><Icon n="plus" />Registrar</button>
        </div>
      </div>

      {/* Historial */}
      <div className="card">
        <div className="card-head"><span className="card-title">Historial de movimientos</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>Fecha</th><th>Tipo</th><th>Cantidad</th><th>Stock Resultante</th><th>Observación</th></tr></thead>
            <tbody>
              {kardex.length === 0
                ? <tr><td colSpan={5}><div className="empty"><p>Sin movimientos registrados</p></div></td></tr>
                : kardex.map((k, i) => (
                  <tr key={k.id || i}>
                    <td style={{ fontVariantNumeric: "tabular-nums", fontSize: ".82rem" }}>{k.fecha}</td>
                    <td>
                      <span className={`bg ${k.tipo === "Entrada" ? "bg-ok" : k.tipo === "Salida" ? "bg-danger" : "bg-blue"}`}>
                        {k.tipo}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700 }}>{k.tipo === "Salida" ? "- " : ""}{k.cantidad}</td>
                    <td>{k.stockResult != null ? k.stockResult : "—"}</td>
                    <td style={{ color: "var(--on-sv)", fontSize: ".82rem" }}>{k.obs || "—"}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
