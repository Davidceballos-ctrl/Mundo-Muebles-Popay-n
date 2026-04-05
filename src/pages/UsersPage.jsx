import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { uid } from "../data/initialData.js";
import { hashPassword } from "../utils/crypto.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";
import Confirm from "../components/Confirm.jsx";

const ROLES = ["Administrador", "Vendedor", "Bodeguero"];
const EMPTY = () => ({ nombre: "", email: "", rol: "Vendedor", activo: true, password: "" });

const rolePill = { Administrador: "role-admin", Vendedor: "role-vendedor", Bodeguero: "role-bodeguero" };

// Validar fortaleza mínima de contraseña
function isPasswordStrong(p) {
  return p.length >= 8 && /[A-Z]/.test(p) && /[0-9]/.test(p);
}

export default function UsersPage() {
  const { users, setUsers, currentUser, toast } = useApp();
  const [modal, setModal]   = useState(false);
  const [form, setForm]     = useState(EMPTY());
  const [editId, setEditId] = useState(null);
  const [delId, setDelId]   = useState(null);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving]    = useState(false);
  const s = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const openAdd  = () => { setForm(EMPTY()); setEditId(null); setShowPass(false); setModal(true); };
  // Al editar: mostrar campo vacío — se rellena solo si se quiere cambiar la contraseña
  const openEdit = (u) => { setForm({ ...u, password: "" }); setEditId(u.id); setShowPass(false); setModal(true); };

  const save = async () => {
    if (!form.nombre.trim() || !form.email.trim()) { toast("Nombre y correo son requeridos", false); return; }
    if (!editId && !form.password) { toast("La contraseña es requerida para usuarios nuevos", false); return; }
    if (form.password && !isPasswordStrong(form.password)) {
      toast("La contraseña debe tener al menos 8 caracteres, una mayúscula y un número.", false); return;
    }
    if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase() && u.id !== editId)) {
      toast("Ya existe un usuario con ese correo", false); return;
    }

    setSaving(true);
    const saved = { ...form, id: editId || uid(), creadoEn: form.creadoEn || new Date().toISOString().slice(0,10) };

    // Hashear la contraseña si se proporcionó una nueva
    if (form.password) {
      saved.password = await hashPassword(form.password);
      saved.requiereCambio = false;
    } else if (editId) {
      // Mantener la contraseña existente si no se cambió
      const existing = users.find(u => u.id === editId);
      saved.password = existing?.password || "";
    }

    setUsers(editId ? users.map(u => u.id === editId ? saved : u) : [...users, saved]);
    setSaving(false);
    setModal(false);
    toast(editId ? "Usuario actualizado" : "Usuario creado correctamente");
  };

  const handleDel = (id) => {
    if (id === currentUser?.id) { toast("No puedes eliminar tu propio usuario", false); setDelId(null); return; }
    setUsers(users.filter(u => u.id !== id));
    setDelId(null);
    toast("Usuario eliminado");
  };

  const toggleActive = (id) => {
    if (id === currentUser?.id) { toast("No puedes desactivarte a ti mismo", false); return; }
    setUsers(users.map(u => u.id === id ? { ...u, activo: !u.activo } : u));
  };

  return (
    <div>
      <div className="sec-head">
        <div><h2 className="sec-title">Usuarios</h2><p className="sec-sub">{users.length} usuario(s) registrado(s)</p></div>
        <button className="btn btn-wood" onClick={openAdd}><Icon n="plus" />Nuevo usuario</button>
      </div>

      {/* Info de roles */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
        {[
          { rol: "Administrador", icon: "🔑", desc: "Acceso completo: usuarios, reportes, eliminar productos, exportar" },
          { rol: "Vendedor",      icon: "🛒", desc: "POS, historial de ventas, clientes, ver productos" },
          { rol: "Bodeguero",     icon: "📦", desc: "Compras, proveedores, registrar productos, ajustar inventario, kardex" },
        ].map(r => (
          <div key={r.rol} style={{ flex: 1, minWidth: 200, background: "#fff", border: "1px solid var(--border)", borderRadius: 10, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
              <span>{r.icon}</span>
              <span className={`role-pill ${rolePill[r.rol]}`}>{r.rol}</span>
            </div>
            <p style={{ fontSize: ".77rem", color: "var(--out)", lineHeight: 1.6 }}>{r.desc}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: "var(--p-fix)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--p-ctr)", fontWeight: 700, fontSize: ".74rem" }}>
                        {u.nombre.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      {u.nombre}
                      {u.id === currentUser?.id && <span style={{ fontSize: ".66rem", color: "var(--out)" }}>(yo)</span>}
                    </div>
                  </td>
                  <td style={{ color: "var(--on-sv)", fontSize: ".84rem" }}>{u.email}</td>
                  <td><span className={`role-pill ${rolePill[u.rol] || "bg-gray"}`}>{u.rol}</span></td>
                  <td>
                    <label className="tog">
                      <input type="checkbox" checked={u.activo} onChange={() => toggleActive(u.id)} />
                      <div className="tog-track"><div className="tog-thumb" /></div>
                      <span>{u.activo ? "Activo" : "Inactivo"}</span>
                    </label>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button className="btn btn-outline btn-sm btn-icon" onClick={() => openEdit(u)}><Icon n="edit" /></button>
                      <button className="btn btn-ghost-danger btn-sm btn-icon" onClick={() => setDelId(u.id)} disabled={u.id === currentUser?.id}><Icon n="trash" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editId ? "Editar usuario" : "Nuevo usuario"}
        footer={<><button className="btn btn-outline" onClick={() => setModal(false)}>Cancelar</button><button className="btn btn-wood" onClick={save} disabled={saving}><Icon n="save" />{saving ? "Guardando..." : editId ? "Guardar" : "Crear"}</button></>}>
        <div className="f2">
          <div className="fg" style={{ gridColumn: "1/-1" }}><label>Nombre completo *</label><input className="inp" value={form.nombre} onChange={e => s("nombre", e.target.value)} placeholder="Nombre del usuario" /></div>
          <div className="fg" style={{ gridColumn: "1/-1" }}><label>Correo electrónico *</label><input className="inp" type="email" value={form.email} onChange={e => s("email", e.target.value)} placeholder="correo@mundomuebles.com" /></div>
          <div className="fg"><label>Rol *</label>
            <select className="inp sel" value={form.rol} onChange={e => s("rol", e.target.value)}>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>
          <div className="fg"><label>{editId ? "Nueva contraseña (vacío = no cambiar)" : "Contraseña *"}</label>
            <div style={{ position: "relative" }}>
              <input className="inp" type={showPass ? "text" : "password"} style={{ paddingRight: 36 }} value={form.password} onChange={e => s("password", e.target.value)} placeholder={editId ? "Dejar vacío para no cambiar" : "Contraseña segura"} />
              {form.password && !isPasswordStrong(form.password) && (
                <div style={{ fontSize:".72rem", color:"var(--warn)", marginTop:4, display:"flex", alignItems:"center", gap:5 }}>
                  <Icon n="warning" s={11}/>Mínimo 8 caracteres, una mayúscula y un número
                </div>
              )}
              {form.password && isPasswordStrong(form.password) && (
                <div style={{ fontSize:".72rem", color:"var(--ok)", marginTop:4, display:"flex", alignItems:"center", gap:5 }}>
                  <Icon n="check" s={11}/>Contraseña segura
                </div>
              )}
              <button onClick={() => setShowPass(p => !p)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--out)" }}>
                <Icon n="eye" s={14} />
              </button>
            </div>
          </div>
          <div className="fg" style={{ gridColumn: "1/-1" }}>
            <label className="tog">
              <input type="checkbox" checked={form.activo} onChange={e => s("activo", e.target.checked)} />
              <div className="tog-track"><div className="tog-thumb" /></div>
              <span>Usuario activo</span>
            </label>
          </div>
        </div>
      </Modal>

      <Confirm open={!!delId} msg="¿Eliminar este usuario? Esta acción no se puede deshacer."
        onOk={() => handleDel(delId)} onCancel={() => setDelId(null)} />
    </div>
  );
}
