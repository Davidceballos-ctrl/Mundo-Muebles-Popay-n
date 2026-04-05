import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/initialData.js";
import { today, fmt, fmtN } from "../utils/format.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";
import Confirm from "../components/Confirm.jsx";

const EMPTY = () => ({ fecha: today(), proveedor: "", productoNombre: "", productoId: "", varianteId: "", cantidad: "", precioUnit: "" });

export default function PurchasesPage() {
  const { purchases, setPurchases, providers, products, setProducts, toast } = useApp();
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY());
  const [editId, setEditId] = useState(null);
  const [delId, setDelId]   = useState(null);

  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const total       = (Number(form.cantidad) || 0) * (Number(form.precioUnit) || 0);
  const grandTotal  = purchases.reduce((a, p) => a + p.cantidad * p.precioUnit, 0);
  const selProd     = products.find(p => p.id === form.productoId);

  const openAdd  = () => { setForm(EMPTY()); setEditId(null); setModal(true); };
  const openEdit = (p) => {
    setForm({ ...p, productoId: "", productoNombre: p.productoNombre || p.producto || "", varianteId: p.varianteId || "" });
    setEditId(p.id);
    setModal(true);
  };

  const save = () => {
    if (!form.proveedor || !form.productoNombre || !form.cantidad) { toast("Completa los campos requeridos", false); return; }
    const qty     = Number(form.cantidad);
    const oldQty  = editId ? (purchases.find(p => p.id === editId)?.cantidad || 0) : 0;
    const delta   = qty - oldQty;  // diferencia neta de stock

    const newP = { ...form, id: editId || uid(), cantidad: qty, precioUnit: Number(form.precioUnit) };
    setPurchases(editId ? purchases.map(p => p.id === editId ? newP : p) : [...purchases, newP]);

    // Ajustar stock en kardex si hay variante vinculada
    if (form.productoId && form.varianteId) {
      setProducts(products.map(p => p.id !== form.productoId ? p : {
        ...p,
        variantes: p.variantes.map(v => v.id !== form.varianteId ? v : {
          ...v,
          stock:  Math.max(0, v.stock + delta),
          kardex: [...(v.kardex || []), {
            id: uid(), fecha: today(),
            tipo: "Entrada",
            cantidad: delta,
            obs: `${editId ? "Corrección" : "Compra"} — ${form.proveedor}`,
          }],
        }),
      }));
    }
    setModal(false);
    toast(editId ? "Compra actualizada y stock ajustado" : "Compra registrada y stock actualizado");
  };

  const handleDel = (id) => {
    const p = purchases.find(x => x.id === id);
    // Revertir stock si tenía variante
    if (p?.productoId && p?.varianteId) {
      setProducts(products.map(prod => prod.id !== p.productoId ? prod : {
        ...prod,
        variantes: prod.variantes.map(v => v.id !== p.varianteId ? v : {
          ...v,
          stock:  Math.max(0, v.stock - p.cantidad),
          kardex: [...(v.kardex || []), { id: uid(), fecha: today(), tipo: "Salida", cantidad: p.cantidad, obs: `Anulación compra — ${p.proveedor}` }],
        }),
      }));
    }
    setPurchases(purchases.filter(x => x.id !== id));
    setDelId(null);
    toast("Compra eliminada y stock revertido");
  };

  return (
    <div>
      <div className="sec-head">
        <div><h2 className="sec-title">Compras</h2><p className="sec-sub">Órdenes de compra · {purchases.length} registros</p></div>
        <button className="btn btn-wood" onClick={openAdd}><Icon n="plus" />Nueva compra</button>
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Fecha</th><th>Proveedor</th><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Total</th><th>Acciones</th></tr></thead>
            <tbody>
              {purchases.length === 0
                ? <tr><td colSpan={7}><div className="empty"><Icon n="tag" s={40} /><p>Sin compras registradas</p></div></td></tr>
                : purchases.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontSize: ".81rem", fontVariantNumeric: "tabular-nums" }}>{p.fecha}</td>
                    <td style={{ fontWeight: 500 }}>{p.proveedor}</td>
                    <td>{p.productoNombre || p.producto}</td>
                    <td>{fmtN(p.cantidad)} uds</td>
                    <td style={{ fontVariantNumeric: "tabular-nums" }}>{fmt(p.precioUnit)}</td>
                    <td style={{ fontWeight: 700, color: "var(--p)", fontVariantNumeric: "tabular-nums" }}>{fmt(p.cantidad * p.precioUnit)}</td>
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(p)}><Icon n="edit" /></button>
                        <button className="btn btn-ghost-danger btn-sm btn-icon" onClick={() => setDelId(p.id)}><Icon n="trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {purchases.length > 0 && <div className="card-sum"><span>Total comprado: <strong>{fmt(grandTotal)}</strong></span></div>}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Editar compra" : "Registrar compra"}
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-wood" onClick={save}><Icon n="save" />Guardar</button></>}>
        <div className="f2">
          <div className="fg"><label>Fecha *</label><input className="inp" type="date" value={form.fecha} onChange={e => s("fecha", e.target.value)} /></div>
          <div className="fg"><label>Proveedor *</label>
            <select className="inp sel" value={form.proveedor} onChange={e => s("proveedor", e.target.value)}>
              <option value="">Seleccionar...</option>
              {providers.map(p => <option key={p.id}>{p.nombre}</option>)}
            </select>
          </div>
          <div className="fg" style={{ gridColumn: "1/-1" }}><label>Producto *</label>
            <select className="inp sel" value={form.productoId}
              onChange={e => { const p = products.find(x => x.id === e.target.value); s("productoId", e.target.value); s("productoNombre", p?.nombre || ""); s("varianteId", ""); }}>
              <option value="">Seleccionar producto...</option>
              {products.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.categoria})</option>)}
            </select>
          </div>
          {selProd && (
            <div className="fg" style={{ gridColumn: "1/-1" }}><label>Variante / Medida</label>
              <select className="inp sel" value={form.varianteId} onChange={e => s("varianteId", e.target.value)}>
                <option value="">Sin variante específica</option>
                {selProd.variantes.map(v => <option key={v.id} value={v.id}>{v.medida} (Stock actual: {v.stock})</option>)}
              </select>
            </div>
          )}
          <div className="fg"><label>Cantidad *</label><input className="inp" type="number" min="1" value={form.cantidad} onChange={e => s("cantidad", e.target.value)} /></div>
          <div className="fg"><label>Precio unitario (COP)</label><input className="inp" type="number" min="0" value={form.precioUnit} onChange={e => s("precioUnit", e.target.value)} /></div>
        </div>
        <div style={{ textAlign: "right", marginTop: 4, fontSize: "1rem", fontWeight: 700, color: "var(--p)" }}>Total: {fmt(total)}</div>
      </Modal>

      <Confirm open={!!delId}
        msg="¿Eliminar esta compra? El stock de la variante vinculada será revertido automáticamente."
        onOk={() => handleDel(delId)} onCancel={() => setDelId(null)} />
    </div>
  );
}
