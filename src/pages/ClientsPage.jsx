import { useApp } from "../context/AppContext.jsx";
import GenericCRUD from "../components/GenericCRUD.jsx";

export default function ClientsPage() {
  const { clients, setClients } = useApp();
  return (
    <GenericCRUD
      title="Clientes"
      subtitle="Base de clientes registrados"
      cols={["Nombre","Cédula","Teléfono","Email","Ciudad","Estado"]}
      items={clients}
      setItems={setClients}
      emptyForm={() => ({ nombre:"", cedula:"", telefono:"", email:"", ciudad:"Popayán", activo:true })}
      validateForm={f => !f.nombre.trim() ? "El nombre es requerido" : null}
      buildForm={(f, s) => (
        <div className="f2">
          <div className="fg" style={{gridColumn:"1/-1"}}><label>Nombre completo *</label><input className="inp" value={f.nombre} onChange={e=>s({...f,nombre:e.target.value})} /></div>
          <div className="fg"><label>Cédula / ID</label><input className="inp" value={f.cedula} onChange={e=>s({...f,cedula:e.target.value})} /></div>
          <div className="fg"><label>Teléfono</label><input className="inp" value={f.telefono} onChange={e=>s({...f,telefono:e.target.value})} /></div>
          <div className="fg"><label>Email</label><input className="inp" type="email" value={f.email} onChange={e=>s({...f,email:e.target.value})} /></div>
          <div className="fg"><label>Ciudad</label><input className="inp" value={f.ciudad} onChange={e=>s({...f,ciudad:e.target.value})} /></div>
          <div className="fg">
            <label className="tog">
              <input type="checkbox" checked={f.activo} onChange={e=>s({...f,activo:e.target.checked})} />
              <div className="tog-track"><div className="tog-thumb"/></div>
              <span>{f.activo ? "Activo" : "Inactivo"}</span>
            </label>
          </div>
        </div>
      )}
      rowCells={it => <>
        <td style={{fontWeight:600}}>{it.nombre}</td>
        <td style={{fontSize:".8rem"}}>{it.cedula}</td>
        <td style={{fontSize:".8rem"}}>{it.telefono}</td>
        <td style={{fontSize:".8rem",color:"var(--on-sv)"}}>{it.email}</td>
        <td>{it.ciudad}</td>
        <td><span className={`bg ${it.activo?"bg-ok":"bg-gray"}`}>{it.activo?"Activo":"Inactivo"}</span></td>
      </>}
    />
  );
}
