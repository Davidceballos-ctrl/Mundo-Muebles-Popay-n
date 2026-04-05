import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { uid, COLORS_LIST, COLOR_HEX, CATEGORIAS } from "../data/initialData.js";
import Icon from "../components/Icons.jsx";

export default function AddProductPage() {
  const nav = useNavigate();
  const { products, setProducts, toast } = useApp();
  const blank = () => ({ nombre:"", categoria:CATEGORIAS[0], activo:true, variantes:[{id:uid(),medida:"",precio:"",stock:"",colores:[],kardex:[]}] });
  const [f, setF] = useState(blank());

  const upV=(i,k,v)=>{const vs=[...f.variantes];vs[i]={...vs[i],[k]:v};setF({...f,variantes:vs});};
  const togColor=(i,c)=>{
    const vs=[...f.variantes];const cols=vs[i].colores||[];
    vs[i]={...vs[i],colores:cols.includes(c)?cols.filter(x=>x!==c):[...cols,c]};setF({...f,variantes:vs});
  };
  const addV=()=>setF({...f,variantes:[...f.variantes,{id:uid(),medida:"",precio:"",stock:"",colores:[],kardex:[]}]});
  const remV=i=>{const vs=[...f.variantes];vs.splice(i,1);setF({...f,variantes:vs});};

  const submit=()=>{
    if(!f.nombre.trim()){toast("Ingresa el nombre del producto",false);return;}
    if(f.variantes.some(v=>!v.medida.trim())){toast("Todas las variantes necesitan medida/tipo",false);return;}
    const p={...f,id:uid(),variantes:f.variantes.map(v=>({...v,precio:Number(v.precio)||0,stock:Number(v.stock)||0,
      kardex:[{id:uid(),fecha:new Date().toISOString().slice(0,10),tipo:"Entrada",cantidad:Number(v.stock)||0,obs:"Stock inicial"}]
    }))};
    setProducts([...products,p]);
    toast(`"${p.nombre}" registrado`);
    nav("/productos/lista");
  };

  return (
    <div style={{maxWidth:700}}>
      <div className="sec-head">
        <div><h2 className="sec-title">Registrar Producto</h2><p className="sec-sub">Completa la información del mueble</p></div>
      </div>
      <div className="card">
        <div style={{padding:"22px 24px"}}>
          <div className="f2">
            <div className="fg"><label>Nombre *</label><input className="inp" placeholder="Ej: Base Cama Sencilla" value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})}/></div>
            <div className="fg"><label>Categoría *</label>
              <select className="inp sel" value={f.categoria} onChange={e=>setF({...f,categoria:e.target.value})}>
                {CATEGORIAS.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
          <div className="fdiv"/>
          <div className="fsub">Variantes del producto</div>
          <p style={{fontSize:".8rem",color:"var(--out)",marginBottom:14}}>Una fila por cada medida, densidad o tipo diferente.</p>
          {f.variantes.map((v,i)=>(
            <div key={v.id}>
              <div className="vr">
                <div className="fg mb0"><label>Medida/Tipo</label><input className="inp" placeholder="Ej: 1.40 m" value={v.medida} onChange={e=>upV(i,"medida",e.target.value)}/></div>
                <div className="fg mb0"><label>Precio (COP)</label><input className="inp" type="number" min="0" placeholder="0" value={v.precio} onChange={e=>upV(i,"precio",e.target.value)}/></div>
                <div className="fg mb0"><label>Stock inicial</label><input className="inp" type="number" min="0" placeholder="0" value={v.stock} onChange={e=>upV(i,"stock",e.target.value)}/></div>
                <button className="btn btn-ghost-danger btn-sm btn-icon" style={{marginTop:20}} onClick={()=>remV(i)} disabled={f.variantes.length===1}><Icon n="trash"/></button>
              </div>
              <div className="vr-foot">
                <div style={{fontSize:".73rem",color:"var(--out)",marginBottom:7}}>Colores (opcional):</div>
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
          <div className="fdiv"/>
          <div style={{display:"flex",justifyContent:"flex-end",gap:8}}>
            <button className="btn btn-outline" onClick={()=>setF(blank())}>Limpiar</button>
            <button className="btn btn-wood" onClick={submit}><Icon n="save"/>Registrar producto</button>
          </div>
        </div>
      </div>
    </div>
  );
}
