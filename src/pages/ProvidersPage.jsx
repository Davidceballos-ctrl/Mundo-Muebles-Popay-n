import { useApp } from "../context/AppContext.jsx";
import GenericCRUD from "../components/GenericCRUD.jsx";

export default function ProvidersPage() {
  const { providers, setProviders } = useApp();
  return (
    <GenericCRUD
      title="Proveedores"
      subtitle="Empresas y personas que suministran productos"
      cols={["Nombre","NIT","Ciudad","Teléfono","Email","Estado"]}
      items={providers}
      setItems={setProviders}
      emptyForm={() => ({ nombre:"", nit:"", ciudad:"", telefono:"", email:"", activo:true })}
      validateForm={f => !f.nombre.trim() ? "El nombre es requerido" : null}
      buildForm={(f, s) => (
        <div className="f2">
          <div className="fg" style={{gridColumn:"1/-1"}}><label>Nombre *</label><input className="inp" value={f.nombre} onChange={e=>s({...f,nombre:e.target.value})} /></div>
          <div className="fg"><label>NIT</label><input className="inp" value={f.nit} onChange={e=>s({...f,nit:e.target.value})} /></div>
          <div className="fg"><label>Ciudad</label><input className="inp" value={f.ciudad} onChange={e=>s({...f,ciudad:e.target.value})} /></div>
          <div className="fg"><label>Teléfono</label><input className="inp" value={f.telefono} onChange={e=>s({...f,telefono:e.target.value})} /></div>
          <div className="fg"><label>Email</label><input className="inp" type="email" value={f.email} onChange={e=>s({...f,email:e.target.value})} /></div>
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
        <td style={{fontSize:".8rem",fontVariantNumeric:"tabular-nums"}}>{it.nit}</td>
        <td>{it.ciudad}</td>
        <td style={{fontSize:".8rem"}}>{it.telefono}</td>
        <td style={{fontSize:".8rem",color:"var(--on-sv)"}}>{it.email}</td>
        <td><span className={`bg ${it.activo?"bg-ok":"bg-gray"}`}>{it.activo?"Activo":"Inactivo"}</span></td>
      </>}
    />
  );
}
