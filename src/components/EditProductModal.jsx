import { useState } from "react";
import Modal from "./Modal.jsx";
import Icon from "./Icons.jsx";
import { uid, COLORS_LIST, COLOR_HEX, CATEGORIAS } from "../data/initialData.js";

export default function EditProductModal({ product, onClose, onSave }) {
  const [d, setD] = useState(JSON.parse(JSON.stringify(product)));

  const upV = (i,k,v) => {
    const vs=[...d.variantes];
    vs[i]={...vs[i],[k]:(k==="precio"||k==="stock")?Number(v):v};
    setD({...d,variantes:vs});
  };
  const togColor=(i,c)=>{
    const vs=[...d.variantes];
    const cols=vs[i].colores||[];
    vs[i]={...vs[i],colores:cols.includes(c)?cols.filter(x=>x!==c):[...cols,c]};
    setD({...d,variantes:vs});
  };
  const addV=()=>setD({...d,variantes:[...d.variantes,{id:uid(),medida:"",precio:0,stock:0,colores:[],kardex:[]}]});
  const remV=i=>{const vs=[...d.variantes];vs.splice(i,1);setD({...d,variantes:vs});};

  const footer = <>
    <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
    <button className="btn btn-wood" onClick={()=>onSave(d)}><Icon n="save"/>Guardar cambios</button>
  </>;

  return (
    <Modal open title={`Editar: ${product.nombre}`} onClose={onClose} footer={footer} wide>
      <div className="f2">
        <div className="fg"><label>Nombre del producto</label><input className="inp" value={d.nombre} onChange={e=>setD({...d,nombre:e.target.value})}/></div>
        <div className="fg"><label>Categoría</label>
          <select className="inp sel" value={d.categoria} onChange={e=>setD({...d,categoria:e.target.value})}>
            {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="fg" style={{marginBottom:14}}>
        <label className="tog">
          <input type="checkbox" checked={d.activo} onChange={e=>setD({...d,activo:e.target.checked})}/>
          <div className="tog-track"><div className="tog-thumb"/></div>
          <span>{d.activo?"Producto activo":"Producto inactivo"}</span>
        </label>
      </div>
      <div className="fdiv"/>
      <div className="fsub">Variantes</div>
      {d.variantes.map((v,i)=>(
        <div key={v.id}>
          <div className="vr">
            <div className="fg mb0"><label>Medida/Tipo</label><input className="inp" value={v.medida} onChange={e=>upV(i,"medida",e.target.value)}/></div>
            <div className="fg mb0"><label>Precio (COP)</label><input className="inp" type="number" value={v.precio} onChange={e=>upV(i,"precio",e.target.value)}/></div>
            <div className="fg mb0"><label>Stock</label><input className="inp" type="number" min="0" value={v.stock} onChange={e=>upV(i,"stock",e.target.value)}/></div>
            <button className="btn btn-ghost-danger btn-sm btn-icon" style={{marginTop:20}} onClick={()=>remV(i)} disabled={d.variantes.length===1}><Icon n="trash"/></button>
          </div>
          <div className="vr-foot">
            <div style={{fontSize:".73rem",color:"var(--out)",marginBottom:7}}>Colores disponibles:</div>
            <div className="color-opts">
              {COLORS_LIST.map(c=>(
                <div key={c} className={`color-chip ${(v.colores||[]).includes(c)?"on":""}`} onClick={()=>togColor(i,c)}>
                  <div className="color-swatch" style={{background:COLOR_HEX[c]}}/>
                  {c}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <button className="btn btn-outline btn-sm" onClick={addV}><Icon n="plus"/>Agregar variante</button>
    </Modal>
  );
}
