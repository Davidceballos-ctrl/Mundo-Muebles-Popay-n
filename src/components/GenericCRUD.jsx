import { useState } from "react";
import Icon from "./Icons.jsx";
import Modal from "./Modal.jsx";
import Confirm from "./Confirm.jsx";
import { uid } from "../data/initialData.js";

/**
 * Componente genérico CRUD reutilizable.
 * Props: title, subtitle, cols, items, setItems,
 *        emptyForm (fn), validateForm (fn->string|null),
 *        buildForm (form, setForm) -> JSX,
 *        rowCells  (item) -> JSX (td elements)
 */
export default function GenericCRUD({ title, subtitle, cols, items, setItems, emptyForm, validateForm, buildForm, rowCells }) {
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState(emptyForm());
  const [editId, setEditId] = useState(null);
  const [del,    setDel]    = useState(null);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState("");

  const filtered = items.filter(it =>
    Object.values(it).some(v => String(v).toLowerCase().includes(search.toLowerCase()))
  );

  const openAdd  = () => { setForm(emptyForm()); setEditId(null); setErrors(""); setModal(true); };
  const openEdit = it => { setForm({ ...it }); setEditId(it.id); setErrors(""); setModal(true); };

  const handleSave = () => {
    const err = validateForm ? validateForm(form) : null;
    if (err) { setErrors(err); return; }
    if (editId) setItems(ps => ps.map(p => p.id === editId ? { ...p, ...form } : p));
    else        setItems(ps => [...ps, { ...form, id: uid() }]);
    setModal(false);
  };

  return (
    <div>
      <div className="sec-head">
        <div>
          <h2 className="sec-title">{title}</h2>
          <p className="sec-sub">{subtitle} · {items.length} registros</p>
        </div>
        <button className="btn btn-wood" onClick={openAdd}><Icon n="plus" /> Nuevo registro</button>
      </div>

      <div className="card">
        <div className="card-head">
          <div className="search-box" style={{ maxWidth: 280 }}>
            <span className="si"><Icon n="search" /></span>
            <input className="inp" placeholder="Buscar..." value={search}
              onChange={e => setSearch(e.target.value)} aria-label="Buscar" />
          </div>
          <span style={{ fontSize: ".78rem", color: "var(--out)" }}>{filtered.length} resultado(s)</span>
        </div>
        <div className="tw">
          <table>
            <thead>
              <tr>
                {cols.map(c => <th key={c}>{c}</th>)}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0
                ? <tr><td colSpan={cols.length + 1}><div className="empty"><Icon n="users" s={40} /><p>Sin registros</p></div></td></tr>
                : filtered.map(it => (
                  <tr key={it.id}>
                    {rowCells(it)}
                    <td>
                      <div style={{ display: "flex", gap: 5 }}>
                        <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(it)} title="Editar"><Icon n="edit" /></button>
                        <button className="btn btn-ghost-danger btn-sm btn-icon" onClick={() => setDel(it.id)} title="Eliminar"><Icon n="trash" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)}
        title={editId ? "Editar registro" : "Nuevo registro"}
        footer={
          <>
            {errors && <span style={{ fontSize: ".78rem", color: "var(--err)", flex: 1 }}>{errors}</span>}
            <button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button>
            <button className="btn btn-wood" onClick={handleSave}><Icon n="save" /> Guardar</button>
          </>
        }>
        {buildForm(form, setForm)}
      </Modal>

      <Confirm
        open={!!del}
        msg="¿Eliminar este registro? Esta acción no se puede deshacer."
        onOk={() => { setItems(ps => ps.filter(p => p.id !== del)); setDel(null); }}
        onCancel={() => setDel(null)}
      />
    </div>
  );
}
