import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../hooks/usePermissions.js";
import { fmt, fmtN } from "../utils/format.js";
import { uid, LOW_STOCK_THRESHOLD, COLOR_HEX, CATEGORIAS } from "../data/initialData.js";
import Icon from "../components/Icons.jsx";
import EditProductModal from "../components/EditProductModal.jsx";
import Confirm from "../components/Confirm.jsx";

const PG_SIZE = 20;

export default function InventoryPage({ mode = "all" }) {
  const { products, setProducts, toast, currentUser } = useApp();
  const { isAdmin } = usePermissions(currentUser);
  const nav = useNavigate();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("Todas");
  const [editP, setEditP] = useState(null);
  const [delP, setDelP] = useState(null);
  const [pg, setPg] = useState(1);

  const flat = useMemo(() => {
    const rows = [];
    products.forEach(p => p.variantes.forEach(v =>
      rows.push({ ...v, pid: p.id, pnombre: p.nombre, pcategoria: p.categoria, pactivo: p.activo, _p: p })
    ));
    return rows;
  }, [products]);

  const filtered = useMemo(() => flat.filter(r => {
    if (mode === "low" && r.stock > LOW_STOCK_THRESHOLD) return false;
    if (cat !== "Todas" && r.pcategoria !== cat) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!r.pnombre.toLowerCase().includes(q) && !r.pcategoria.toLowerCase().includes(q) && !r.medida.toLowerCase().includes(q)) return false;
    }
    return true;
  }), [flat, cat, search, mode]);

  const pages    = Math.ceil(filtered.length / PG_SIZE);
  const paged    = filtered.slice((pg - 1) * PG_SIZE, pg * PG_SIZE);
  const totalVal = filtered.reduce((a, r) => a + r.precio * r.stock, 0);

  const handleSave    = p  => { setProducts(products.map(x => x.id === p.id ? p : x)); setEditP(null); toast("Producto actualizado"); };
  const handleDel     = pid => { setProducts(products.filter(p => p.id !== pid)); setDelP(null); toast("Producto eliminado"); };
  const toggleActive  = pid => setProducts(products.map(p => p.id === pid ? { ...p, activo: !p.activo } : p));

  const stockTag = s => {
    if (s === 0)               return <span className="stock-tag s-out"><span className="dot dot-danger" />Sin stock</span>;
    if (s <= LOW_STOCK_THRESHOLD) return <span className="stock-tag s-low"><span className="dot dot-warn" />{s} uds</span>;
    return                            <span className="stock-tag s-ok"><span className="dot dot-ok" />{s} uds</span>;
  };

  return (
    <div>
      <div className="sec-head">
        <div>
          <h2 className="sec-title">{mode === "low" ? "Stock Bajo / Baja Rotación" : "Lista de Productos"}</h2>
          <p className="sec-sub">{filtered.length} referencia(s)</p>
        </div>
        {(isAdmin || currentUser?.rol === "Bodeguero") && (
          <button className="btn btn-wood" onClick={() => nav("/productos/registrar")}><Icon n="plus" />Nuevo Producto</button>
        )}
      </div>

      <div className="card">
        <div className="card-head">
          <div className="search-box" style={{ flex: 1, maxWidth: 280 }}>
            <span className="si"><Icon n="search" /></span>
            <input className="inp" placeholder="Buscar producto, medida..." value={search}
              onChange={e => { setSearch(e.target.value); setPg(1); }} />
          </div>
          <select className="inp sel" style={{ width: 170 }} value={cat}
            onChange={e => { setCat(e.target.value); setPg(1); }}>
            <option value="Todas">Todas las categorías</option>
            {CATEGORIAS.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>

        <div className="tw">
          <table>
            <thead>
              <tr><th>Categoría</th><th>Producto</th><th>Medida</th><th>Precio</th><th>Stock</th><th>Colores</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {paged.length === 0
                ? <tr><td colSpan={8}><div className="empty"><Icon n="box" s={44} /><p>Sin resultados</p></div></td></tr>
                : paged.map(r => (
                  <tr key={`${r.pid}-${r.id}`} style={{ opacity: r.pactivo ? 1 : 0.5 }}>
                    <td><span className="cat-tag">{r.pcategoria}</span></td>
                    <td style={{ fontWeight: 600 }}>{r.pnombre}</td>
                    <td style={{ color: "var(--on-sv)" }}>{r.medida}</td>
                    <td style={{ fontWeight: 700, color: "var(--p)", fontVariantNumeric: "tabular-nums" }}>{fmt(r.precio)}</td>
                    <td>{stockTag(r.stock)}</td>
                    <td>
                      {(r.colores || []).length > 0
                        ? <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                            {r.colores.map(c => <span key={c} title={c} style={{ width: 13, height: 13, borderRadius: "50%", background: COLOR_HEX[c] || "#ccc", border: "1.5px solid rgba(0,0,0,.12)", display: "inline-block" }} />)}
                          </div>
                        : <span style={{ color: "var(--out)", fontSize: ".75rem" }}>—</span>}
                    </td>
                    <td>
                      <span style={{ cursor: "pointer" }} onClick={() => toggleActive(r.pid)}>
                        <span className={`bg ${r.pactivo ? "bg-ok" : "bg-gray"}`}>{r.pactivo ? "Activo" : "Inactivo"}</span>
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-outline btn-sm btn-icon" title="Ver Kardex" onClick={() => nav(`/kardex/${r.pid}/${r.id}`)}><Icon n="eye" /></button>
                        <button className="btn btn-outline btn-sm btn-icon" title="Editar" onClick={() => setEditP(r._p)}><Icon n="edit" /></button>
                        {isAdmin && <button className="btn btn-ghost-danger btn-sm btn-icon" title="Eliminar" onClick={() => setDelP(r.pid)}><Icon n="trash" /></button>}
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>

        {filtered.length > 0 && (
          <div className="card-sum">
            <span>Registros: <strong>{filtered.length}</strong></span>
            <span>Stock: <strong>{fmtN(filtered.reduce((a, r) => a + r.stock, 0))} uds</strong></span>
            <span>Valor total: <strong>{fmt(totalVal)}</strong></span>
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

      {editP && <EditProductModal product={editP} onClose={() => setEditP(null)} onSave={handleSave} />}
      <Confirm open={!!delP} msg="¿Eliminar este producto? Esta acción no se puede deshacer."
        onOk={() => handleDel(delP)} onCancel={() => setDelP(null)} />
    </div>
  );
}
