/**
 * POS.jsx — Registro de Ventas · v8.0
 * NUEVO: precio editable por ítem en el carrito
 */
import { useState, useMemo } from "react";
import { useApp } from "../context/AppContext.jsx";
import { fmt, today } from "../utils/format.js";
import { uid, PAYMENT_METHODS, TAX_RATE } from "../data/initialData.js";
import { printFactura } from "../utils/pdf.js";
import { printFacturaWindow } from "../utils/printWindow.js";
import Icon from "../components/Icons.jsx";
import Modal from "../components/Modal.jsx";

const EMPTY_CF     = () => ({ nombre:"", cedula:"", direccion:"", telefono:"" });
const METODOS_CAMBIO = ["Efectivo","Transferencia","Nequi","Daviplata","Otro"];

const CATEGORIAS = [
  { label: "Todas",     icon: "⊞" },
  { label: "Colchones", icon: "🛏" },
  { label: "Bases",     icon: "🔲" },
  { label: "Sofás",     icon: "🛋" },
  { label: "Salas",     icon: "🪑" },
  { label: "Comedores", icon: "🍽" },
  { label: "Alcobas",   icon: "🚪" },
];

export default function POS() {
  const {
    products, setProducts, clients, setClients,
    sales, setSales, cotizaciones, currentUser, empresa, toast,
  } = useApp();

  const [search,        setSearch]        = useState("");
  const [catFilter,     setCatFilter]     = useState("Todas");
  const [cart,          setCart]          = useState([]);
  const [discount,      setDiscount]      = useState("");
  const [discType,      setDiscType]      = useState("monto");
  const [selClient,     setSelClient]     = useState("");
  const [cfData,        setCfData]        = useState(EMPTY_CF());
  const [cfExpanded,    setCfExpanded]    = useState(false);
  const [saveClient,    setSaveClient]    = useState(false);
  const [payModal,      setPayModal]      = useState(false);
  const [payments,      setPayments]      = useState([{ metodo:"Efectivo", monto:"" }]);
  const [entregado,     setEntregado]     = useState("");
  const [metodoCambio,  setMetodoCambio]  = useState("Efectivo");
  const [lastSale,      setLastSale]      = useState(null);
  const [receiptModal,  setReceiptModal]  = useState(false);
  const [fromCotizacion,setFromCotizacion]= useState(null); // importar cotización

  // ── Catálogo plano ──
  const flatProducts = useMemo(() => {
    const rows = [];
    products.filter(p => p.activo).forEach(p =>
      p.variantes.forEach(v => {
        if (v.stock > 0)
          rows.push({
            key:`${p.id}_${v.id}`, pid:p.id, vid:v.id,
            nombre:p.nombre, categoria:p.categoria,
            medida:v.medida, colores:v.colores,
            precio:v.precio, stock:v.stock,
          });
      })
    );
    return rows;
  }, [products]);

  const filtered = useMemo(() => {
    let rows = flatProducts;
    if (catFilter !== "Todas") {
      rows = rows.filter(r =>
        r.categoria.toLowerCase().includes(catFilter.toLowerCase()) ||
        catFilter.toLowerCase().includes(r.categoria.toLowerCase())
      );
    }
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter(r =>
      r.nombre.toLowerCase().includes(q) ||
      r.categoria.toLowerCase().includes(q) ||
      r.medida.toLowerCase().includes(q)
    );
  }, [flatProducts, search, catFilter]);

  // ── Carrito ──
  const addToCart = (item) => {
    setCart(c => {
      const ex = c.find(x => x.key === item.key);
      if (ex) {
        if (ex.cant >= item.stock) { toast("Stock insuficiente", false); return c; }
        return c.map(x => x.key === item.key ? { ...x, cant: x.cant + 1 } : x);
      }
      return [...c, { ...item, cant:1, colorSel:item.colores[0]||"", precioEdit:item.precio }];
    });
  };

  const updCart = (key, field, val) =>
    setCart(c => c.map(x => x.key === key ? {
      ...x,
      [field]: field === "cant"
        ? Math.max(1, Math.min(Number(val), x.stock))
        : field === "precioEdit"
          ? Math.max(0, Number(val)||0)
          : val,
    } : x));

  const remCart = (key) => setCart(c => c.filter(x => x.key !== key));

  // ── ✅ Cálculos usando precioEdit por ítem ──
  const subtotal  = cart.reduce((a,x) => a + (x.precioEdit??x.precio) * x.cant, 0);
  const discMonto = discType === "pct"
    ? Math.round(subtotal * (Number(discount)/100))
    : Math.min(Number(discount)||0, subtotal);
  const taxable   = subtotal - discMonto;
  const impuesto  = Math.round(taxable * TAX_RATE);
  const total     = taxable + impuesto;

  const totalPaid  = payments.reduce((a,p) => a + Number(p.monto||0), 0);
  const entregadoN = Number(entregado) || 0;
  const cambio     = entregadoN > total ? entregadoN - total : 0;
  const falta      = entregadoN > 0
    ? Math.max(0, total - entregadoN)
    : Math.max(0, total - totalPaid);

  const openPay = () => {
    setPayments([{ metodo:"Efectivo", monto:String(total) }]);
    setEntregado(String(total));
    setPayModal(true);
  };

  // ── Importar cotización ──
  const importarCotizacion = (cotiz) => {
    const items = (cotiz.items||[]).map(it => {
      const prod = flatProducts.find(p => p.nombre === it.nombre);
      return {
        key: prod ? prod.key : `cot_${uid()}`,
        pid: prod?.pid || "",
        vid: prod?.vid || "",
        nombre:    it.nombre,
        categoria: prod?.categoria || "",
        medida:    it.medida||"—",
        colores:   prod?.colores||[],
        precio:    it.precio,
        precioEdit:it.precio,
        stock:     prod?.stock ?? 99,
        cant:      it.cant||1,
        colorSel:  prod?.colores?.[0]||"",
      };
    });
    setCart(items);
    if (cotiz.cliente) setSelClient(cotiz.cliente);
    setFromCotizacion(cotiz);
    setDiscount("");
    toast(`Cotización #${(cotiz.numero||cotiz.id.slice(0,8)).toUpperCase()} importada`);
  };

  // ── Confirmar venta ──
  const confirmSale = () => {
    if (cart.length === 0) { toast("El carrito está vacío", false); return; }
    const pagoEfectivo = entregadoN > 0 ? entregadoN : totalPaid;
    if (pagoEfectivo < total - 1) {
      toast(`Faltan ${fmt(total - pagoEfectivo)} por cubrir`, false);
      return;
    }

    let clienteNombre="Consumidor Final", clienteCedula="", clienteTelefono="", clienteDireccion="";
    if (selClient) {
      const obj = clients.find(c => c.nombre === selClient);
      clienteNombre=selClient; clienteCedula=obj?.cedula||"";
      clienteTelefono=obj?.telefono||""; clienteDireccion=obj?.ciudad||"";
    } else {
      clienteNombre=cfData.nombre||"Consumidor Final"; clienteCedula=cfData.cedula;
      clienteTelefono=cfData.telefono; clienteDireccion=cfData.direccion;
      if (saveClient && cfData.nombre.trim()) {
        const exists = clients.some(c =>
          c.nombre.toLowerCase()===cfData.nombre.toLowerCase()||
          (cfData.cedula && c.cedula===cfData.cedula)
        );
        if (!exists) {
          setClients(prev => [...prev, {
            id:uid(), nombre:cfData.nombre.trim(), cedula:cfData.cedula,
            telefono:cfData.telefono, email:"", ciudad:cfData.direccion||"Popayan", activo:true,
          }]);
          toast(`Cliente "${cfData.nombre}" guardado`);
        }
      }
    }

    const saleId = uid();
    const sale = {
      id:saleId, fecha:today(),
      cliente:clienteNombre, cedula:clienteCedula,
      telefono:clienteTelefono, direccion:clienteDireccion,
      items: cart.map(x => ({
        nombre:x.nombre, medida:x.medida, color:x.colorSel,
        cant:x.cant,
        precio:x.precioEdit??x.precio,          // ← precio editado
        precioOriginal:x.precio,                 // ← precio original guardado
      })),
      subtotal, descuento:discMonto, impuesto, total,
      entregado:entregadoN||totalPaid, cambio,
      metodoCambio:cambio>0?metodoCambio:"",
      pagos:payments.map(p=>({metodo:p.metodo,monto:Number(p.monto)})),
      vendedor:currentUser?.nombre||"Admin",
      cotizacionId:fromCotizacion?.id||null,
    };

    try { setSales(prev => [...prev, sale]); }
    catch(e) { toast("Error guardando venta.", false); return; }

    // Actualizar stock
    try {
      setProducts(products.map(p => ({
        ...p,
        variantes: p.variantes.map(v => {
          const item = cart.find(x => x.pid===p.id && x.vid===v.id);
          if (!item) return v;
          return {
            ...v, stock:Math.max(0, v.stock-item.cant),
            kardex:[...(v.kardex||[]), {
              id:uid(), fecha:today(), tipo:"Salida",
              cantidad:item.cant, obs:`Venta #${saleId.slice(0,8)}`,
            }],
          };
        }),
      })));
    } catch(e) { console.error("Stock update error:", e); }

    setCart([]); setDiscount(""); setSelClient(""); setCfData(EMPTY_CF());
    setCfExpanded(false); setSaveClient(false); setPayModal(false);
    setEntregado(""); setMetodoCambio("Efectivo"); setFromCotizacion(null);
    setLastSale(sale); setReceiptModal(true);
    toast("¡Venta registrada exitosamente!");
  };

  const inputSm = { height:32, fontSize:".8rem" };

  // Cotizaciones aprobadas para importar
  const cotizAprobadas = (cotizaciones||[]).filter(c =>
    ["Enviada","Aprobada","Borrador"].includes(c.estado)
  );

  return (
    <div className="pos-layout">

      {/* ══ CATÁLOGO ══ */}
      <div style={{ display:"flex", flexDirection:"column", gap:12, overflow:"hidden", minHeight:0 }}>

        {/* Barra superior: search + importar cotización */}
        <div style={{ display:"flex", gap:10 }}>
          <div className="search-box" style={{ flex:1 }}>
            <span className="si"><Icon n="search"/></span>
            <input className="inp inp-lg" style={{ fontSize:"1rem" }}
              placeholder="Buscar producto por nombre, categoría o medida..."
              value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          {cotizAprobadas.length > 0 && (
            <div style={{ position:"relative" }}>
              <select className="inp" style={{ height:42, paddingRight:28 }}
                value="" onChange={e => {
                  const cot = cotizAprobadas.find(c => c.id === e.target.value);
                  if (cot) importarCotizacion(cot);
                }}>
                <option value="">📋 Importar cotización...</option>
                {cotizAprobadas.map(c => (
                  <option key={c.id} value={c.id}>
                    #{(c.numero||c.id.slice(0,8)).toUpperCase()} — {c.cliente} ({fmt(c.total)})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* ── Barra de categorías — chips pill estilo Stitch ── */}
        <div style={{
          display:"flex", alignItems:"center", gap:8,
          overflowX:"auto", paddingBottom:4,
          scrollbarWidth:"none",
        }}>
          {CATEGORIAS.map(cat => {
            const active = catFilter === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setCatFilter(cat.label)}
                style={{
                  display:"inline-flex", alignItems:"center", gap:6,
                  padding:"7px 18px",
                  borderRadius:"9999px",
                  border:"none",
                  cursor:"pointer",
                  fontFamily:"'Inter',sans-serif",
                  fontSize:".8rem", fontWeight: active ? 700 : 500,
                  whiteSpace:"nowrap",
                  transition:"all .18s ease",
                  background: active ? "var(--grad)" : "var(--s-card)",
                  color: active ? "#fff" : "var(--sec)",
                  boxShadow: active
                    ? "0 4px 14px rgba(0,63,177,.28)"
                    : "0 1px 3px rgba(25,28,30,.06)",
                  transform: active ? "scale(1.02)" : "scale(1)",
                }}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {fromCotizacion && (
          <div style={{ background:"#EDE9FE", border:"1.5px solid #C4B5FD", borderRadius:9, padding:"8px 14px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
            <span style={{ fontSize:".83rem", color:"#5B21B6", fontWeight:600 }}>
              <Icon n="quote" s={13}/> Cotización #{(fromCotizacion.numero||fromCotizacion.id.slice(0,8)).toUpperCase()} importada
            </span>
            <button onClick={() => { setCart([]); setFromCotizacion(null); }}
              style={{ background:"none", border:"none", cursor:"pointer", color:"#7C3AED" }}>
              <Icon n="close" s={13}/>
            </button>
          </div>
        )}

        {/* Tarjetas de productos */}
        <div className="pos-product-grid" style={{ flex:1, overflowY:"auto", display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(175px,1fr))", gap:10, alignContent:"start" }}>
          {filtered.map(item => (
            <button key={item.key} onClick={() => addToCart(item)}
              style={{
                background:"var(--s-card)",
                border:"1.5px solid transparent",
                borderRadius:12,
                padding:14,
                cursor:"pointer",
                textAlign:"left",
                transition:"all .2s cubic-bezier(.4,0,.2,1)",
                fontFamily:"'Inter',sans-serif",
                boxShadow:"0 1px 4px rgba(25,28,30,.06)",
              }}
              onMouseOver={e=>{
                e.currentTarget.style.borderColor = "var(--p-fix-dim)";
                e.currentTarget.style.transform = "scale(1.02)";
                e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,63,177,.12)";
              }}
              onMouseOut={e=>{
                e.currentTarget.style.borderColor = "transparent";
                e.currentTarget.style.transform = "";
                e.currentTarget.style.boxShadow = "0 1px 4px rgba(25,28,30,.06)";
              }}>
              <div style={{ fontSize:".65rem", fontWeight:700, color:"var(--out)", textTransform:"uppercase", letterSpacing:".08em", marginBottom:4 }}>{item.categoria}</div>
              <div style={{ fontWeight:700, fontSize:".88rem", color:"var(--on-s)", marginBottom:3, lineHeight:1.3 }}>{item.nombre}</div>
              <div style={{ fontSize:".79rem", color:"var(--on-sv)", marginBottom:10 }}>{item.medida}</div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontWeight:800, color:"var(--p)", fontSize:".94rem", fontFamily:"'Manrope',sans-serif" }}>{fmt(item.precio)}</div>
                <div style={{
                  width:28, height:28, borderRadius:"50%",
                  background:"var(--s-low)",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:"1rem", color:"var(--sec)", fontWeight:700,
                  transition:"background .15s",
                }}>+</div>
              </div>
              <div style={{ marginTop:6, fontSize:".7rem", fontWeight:600, color:item.stock<=3?"var(--warn)":item.stock<=8?"var(--amb)":"var(--ok)" }}>
                {item.stock <= 3 ? "⚠ " : ""}Stock: {item.stock} uds
              </div>
            </button>
          ))}
          {filtered.length===0 && (
            <div className="empty" style={{ gridColumn:"1/-1" }}><Icon n="search" s={40}/><p>Sin resultados</p></div>
          )}
        </div>
      </div>

      {/* ══ CARRITO ══ */}
      <div style={{ display:"flex", flexDirection:"column", background:"var(--s-card)", borderRadius:20, border:"1px solid rgba(195,197,215,.15)", overflow:"hidden", boxShadow:"0 20px 40px rgba(25,28,30,.08)" }}>

        <div style={{ padding:"15px 18px", borderBottom:"1px solid var(--s-mid)", display:"flex", alignItems:"center", justifyContent:"space-between", background:"var(--grad)" }}>
          <span style={{ fontFamily:"'Manrope',sans-serif", fontSize:"1rem", fontWeight:800, color:"#fff", letterSpacing:"-.02em" }}>
            Venta Actual
          </span>
          <span style={{ fontSize:".72rem", fontWeight:700, color:"rgba(255,255,255,.75)", background:"rgba(255,255,255,.15)", padding:"3px 10px", borderRadius:99, letterSpacing:".04em", textTransform:"uppercase" }}>
            {cart.length} ítem{cart.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Selector de cliente */}
        <div style={{ padding:"10px 14px", borderBottom:"1px solid var(--s-low)" }}>
          <label style={{ fontSize:".71rem", fontWeight:700, color:"var(--out)", textTransform:"uppercase", letterSpacing:".07em", display:"block", marginBottom:5 }}>Cliente</label>
          <select className="inp sel" style={inputSm} value={selClient}
            onChange={e=>{ setSelClient(e.target.value); setCfExpanded(e.target.value===""); if(e.target.value!=="") setCfData(EMPTY_CF()); }}>
            <option value="">Consumidor Final</option>
            {clients.map(c=><option key={c.id}>{c.nombre}</option>)}
          </select>
          {selClient==="" && (
            <div style={{ marginTop:8 }}>
              <button onClick={()=>setCfExpanded(o=>!o)}
                style={{ background:"none", border:"none", cursor:"pointer", fontSize:".75rem", color:"var(--p-ctr)", fontWeight:600, display:"flex", alignItems:"center", gap:5, padding:"3px 0", fontFamily:"'DM Sans',sans-serif" }}>
                <Icon n={cfExpanded?"chevD":"chevR"} s={11}/>
                {cfExpanded ? "Ocultar datos del cliente" : "+ Agregar datos del cliente"}
              </button>
              {cfExpanded && (
                <div style={{ marginTop:8, padding:"12px 12px 10px", background:"var(--p-fix)", borderRadius:8, border:"1px solid var(--p-fix-dim)" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:7 }}>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:".69rem", fontWeight:600, color:"var(--on-sv)", display:"block", marginBottom:3 }}>Nombre completo</label>
                      <input className="inp" style={inputSm} placeholder="Nombre del cliente" value={cfData.nombre} onChange={e=>setCfData(d=>({...d,nombre:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={{ fontSize:".69rem", fontWeight:600, color:"var(--on-sv)", display:"block", marginBottom:3 }}>Cédula / Doc.</label>
                      <input className="inp" style={inputSm} placeholder="N.° doc." value={cfData.cedula} onChange={e=>setCfData(d=>({...d,cedula:e.target.value}))}/>
                    </div>
                    <div>
                      <label style={{ fontSize:".69rem", fontWeight:600, color:"var(--on-sv)", display:"block", marginBottom:3 }}>Teléfono</label>
                      <input className="inp" style={inputSm} placeholder="Cel." value={cfData.telefono} onChange={e=>setCfData(d=>({...d,telefono:e.target.value}))}/>
                    </div>
                    <div style={{ gridColumn:"1/-1" }}>
                      <label style={{ fontSize:".69rem", fontWeight:600, color:"var(--on-sv)", display:"block", marginBottom:3 }}>Dirección</label>
                      <input className="inp" style={inputSm} placeholder="Dirección" value={cfData.direccion} onChange={e=>setCfData(d=>({...d,direccion:e.target.value}))}/>
                    </div>
                  </div>
                  <label className="tog" style={{ marginTop:8, cursor:"pointer", display:"flex", alignItems:"center", gap:7, fontSize:".73rem" }}>
                    <input type="checkbox" checked={saveClient} onChange={e=>setSaveClient(e.target.checked)}/>
                    <div className="tog-track" style={{ transform:"scale(.85)" }}><div className="tog-thumb"/></div>
                    <span style={{ color:"var(--on-sv)" }}>Guardar en base de clientes</span>
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Items carrito con PRECIO EDITABLE */}
        <div style={{ flex:1, overflowY:"auto", padding:"10px 14px", display:"flex", flexDirection:"column", gap:8 }}>
          {cart.length===0
            ? (
              <div style={{ textAlign:"center", padding:"48px 20px", color:"var(--out)" }}>
                <div style={{ fontSize:"2rem", marginBottom:12, opacity:.4 }}>🛒</div>
                <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:700, fontSize:".85rem", color:"var(--sec)" }}>
                  Carrito vacío
                </div>
                <div style={{ fontSize:".75rem", color:"var(--out)", marginTop:4 }}>
                  Haz clic en un producto para agregarlo
                </div>
              </div>
            )
            : cart.map(x => (
              <div key={x.key} style={{
                padding:"12px 14px",
                background:"var(--s)",
                borderRadius:12,
                border:"1.5px solid var(--s-high)",
                transition:"border-color .15s",
              }}>
                {/* Fila título + quitar */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:".85rem", fontWeight:700, color:"var(--on-s)", lineHeight:1.3 }}>{x.nombre}</div>
                    <div style={{ fontSize:".72rem", color:"var(--out)", marginTop:2 }}>{x.medida}</div>
                  </div>
                  <button onClick={()=>remCart(x.key)} style={{
                    background:"var(--err-bg)", border:"none", cursor:"pointer",
                    color:"var(--err)", padding:"3px 6px", borderRadius:6, marginLeft:8,
                    fontSize:".7rem", fontWeight:700, transition:"all .15s",
                  }}>✕</button>
                </div>

                <div style={{ display:"flex", alignItems:"center", gap:6, flexWrap:"wrap" }}>
                  {/* Color */}
                  {x.colores?.length>0 && (
                    <select style={{
                      fontSize:".73rem", border:"1px solid var(--s-high)",
                      borderRadius:8, padding:"3px 6px", height:28,
                      background:"var(--s-card)", flex:"0 0 auto",
                      color:"var(--on-sv)", fontFamily:"'Inter',sans-serif",
                    }}
                      value={x.colorSel} onChange={e=>updCart(x.key,"colorSel",e.target.value)}>
                      {x.colores.map(c=><option key={c}>{c}</option>)}
                    </select>
                  )}

                  {/* Cantidad */}
                  <div style={{
                    display:"flex", alignItems:"center",
                    border:"1px solid var(--s-high)", borderRadius:9,
                    overflow:"hidden", background:"var(--s-card)",
                  }}>
                    <button onClick={()=>updCart(x.key,"cant",x.cant-1)} style={{ width:28, height:28, border:"none", background:"transparent", cursor:"pointer", fontSize:".95rem", color:"var(--sec)", fontWeight:700 }}>−</button>
                    <input type="number" min="1" max={x.stock} value={x.cant}
                      onChange={e=>updCart(x.key,"cant",e.target.value)}
                      style={{ width:32, border:"none", textAlign:"center", fontFamily:"'Manrope',sans-serif", fontWeight:700, fontSize:".83rem", height:28, background:"transparent", color:"var(--on-s)" }}/>
                    <button onClick={()=>updCart(x.key,"cant",x.cant+1)} style={{ width:28, height:28, border:"none", background:"transparent", cursor:"pointer", fontSize:".95rem", color:"var(--sec)", fontWeight:700 }}>+</button>
                  </div>

                  {/* PRECIO EDITABLE */}
                  <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:90 }}>
                    <label style={{ fontSize:".63rem", color:"var(--out)", fontWeight:600, textTransform:"uppercase", letterSpacing:".05em", marginBottom:2 }}>
                      Precio COP {x.precioEdit !== x.precio && <span style={{ color:"var(--warn)", fontWeight:700 }}>✎</span>}
                    </label>
                    <input
                      type="number" min="0" step="1000"
                      value={x.precioEdit??x.precio}
                      onChange={e=>updCart(x.key,"precioEdit",e.target.value)}
                      style={{
                        border: x.precioEdit!==x.precio ? "1.5px solid var(--warn)" : "1px solid var(--s-high)",
                        borderRadius:8, padding:"3px 8px",
                        fontFamily:"'Manrope',sans-serif",
                        fontSize:".83rem", fontWeight:700, height:28,
                        background:"var(--s-card)",
                        color: x.precioEdit!==x.precio ? "var(--warn)" : "var(--on-s)",
                        width:"100%",
                      }}/>
                  </div>

                  {/* Subtotal ítem */}
                  <div style={{ marginLeft:"auto", fontWeight:800, fontSize:".9rem", color:"var(--p)", whiteSpace:"nowrap", fontFamily:"'Manrope',sans-serif" }}>
                    {fmt((x.precioEdit??x.precio)*x.cant)}
                  </div>
                </div>

                {x.precioEdit !== x.precio && (
                  <div style={{ marginTop:6, fontSize:".68rem", color:"var(--out)", display:"flex", alignItems:"center", gap:6 }}>
                    <span>Original: <span style={{ textDecoration:"line-through" }}>{fmt(x.precio)}</span></span>
                    <button onClick={()=>updCart(x.key,"precioEdit",x.precio)}
                      style={{ background:"none", border:"none", cursor:"pointer", color:"var(--p)", fontSize:".68rem", fontWeight:700, padding:0, textDecoration:"underline" }}>
                      Restaurar
                    </button>
                  </div>
                )}
              </div>
            ))
          }
        </div>

        {/* Totales y cobro */}
        <div style={{ padding:"14px 16px", borderTop:"1px solid var(--s-mid)", background:"var(--s-low)" }}>

          {/* Descuento */}
          <div style={{ display:"flex", gap:6, marginBottom:10, alignItems:"center" }}>
            <select style={{
              fontSize:".75rem", border:"1px solid var(--s-high)",
              borderRadius:8, padding:"5px 8px", background:"var(--s-card)",
              height:32, fontFamily:"'Inter',sans-serif", color:"var(--on-sv)",
              fontWeight:500,
            }}
              value={discType} onChange={e=>setDiscType(e.target.value)}>
              <option value="monto">Descuento $</option>
              <option value="pct">Descuento %</option>
            </select>
            <input type="number" min="0" placeholder="0" value={discount}
              onChange={e=>setDiscount(e.target.value)}
              style={{
                flex:1, border:"1px solid var(--s-high)", borderRadius:8,
                padding:"5px 10px", fontFamily:"'Inter',sans-serif",
                fontSize:".83rem", height:32, background:"var(--s-card)",
                color:"var(--on-s)",
              }}/>
          </div>

          {/* Líneas de totales */}
          <div style={{ background:"var(--s-card)", borderRadius:10, padding:"10px 14px", marginBottom:10 }}>
            {[[" Subtotal", fmt(subtotal)], discMonto>0 ? ["Descuento",`- ${fmt(discMonto)}`] : null, TAX_RATE>0 ? ["IVA",fmt(impuesto)] : null].filter(Boolean).map(([l,v])=>(
              <div key={l} style={{ display:"flex", justifyContent:"space-between", fontSize:".78rem", color:"var(--on-sv)", marginBottom:4 }}>
                <span>{l}:</span><span style={{ fontWeight:500 }}>{v}</span>
              </div>
            ))}
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:"1.05rem", fontWeight:800, color:"var(--p)", paddingTop:8, borderTop:"1px solid var(--s-mid)", marginTop:4, fontFamily:"'Manrope',sans-serif" }}>
              <span>Total:</span><span>{fmt(total)}</span>
            </div>
          </div>

          <button className="btn btn-brand" style={{ width:"100%", height:48, justifyContent:"center", fontSize:".95rem", fontWeight:800, borderRadius:12, letterSpacing:"-.01em" }}
            onClick={openPay} disabled={cart.length===0}>
            <Icon n="cash" s={18}/>Cobrar · {fmt(total)}
          </button>
        </div>
      </div>

      {/* ══ MODAL DE PAGO ══ */}
      <Modal open={payModal} onClose={()=>setPayModal(false)} title="Registrar pago" maxW={500}
        footer={<>
          <button className="btn btn-outline" onClick={()=>setPayModal(false)}>Cancelar</button>
          <button className="btn btn-brand" onClick={confirmSale} style={{ minWidth:160 }}>
            <Icon n="check"/>Confirmar venta
          </button>
        </>}>

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"var(--p-fix)", border:"1px solid var(--p-fix-dim)", borderRadius:10, padding:"12px 18px", marginBottom:18 }}>
          <span style={{ fontSize:".85rem", color:"var(--on-sv)", fontWeight:500 }}>Total a cobrar:</span>
          <strong style={{ fontSize:"1.7rem", fontFamily:"'Playfair Display',serif", color:"var(--p)" }}>{fmt(total)}</strong>
        </div>

        <div className="fg">
          <label style={{ fontWeight:700, display:"flex", alignItems:"center", gap:6 }}>
            <Icon n="cash" s={14}/> Dinero recibido del cliente (COP)
          </label>
          <input className="inp" type="number" min="0" step="1000"
            placeholder={String(total)} value={entregado}
            style={{ fontSize:"1.05rem", height:44, fontWeight:600 }}
            onChange={e=>{ const val=e.target.value; setEntregado(val); setPayments([{ metodo:payments[0]?.metodo||"Efectivo", monto:val }]); }}/>
        </div>

        {entregadoN>total && (
          <div style={{ background:"#DCFCE7", border:"2px solid #16A34A", borderRadius:12, padding:"14px 18px", marginBottom:14, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:".8rem", fontWeight:700, color:"#14532D", textTransform:"uppercase" }}>💵 Cambio a devolver</div>
              <div style={{ fontSize:".73rem", color:"#16A34A", marginTop:3 }}>Recibido: {fmt(entregadoN)} — Total: {fmt(total)}</div>
              <div style={{ marginTop:8, display:"flex", alignItems:"center", gap:8 }}>
                <span style={{ fontSize:".72rem", color:"#14532D", fontWeight:600 }}>Devolver por:</span>
                <select value={metodoCambio} onChange={e=>setMetodoCambio(e.target.value)}
                  style={{ fontSize:".78rem", border:"1px solid #16A34A", borderRadius:6, padding:"3px 8px", background:"#F0FDF4", color:"#14532D", fontFamily:"'DM Sans',sans-serif" }}>
                  {METODOS_CAMBIO.map(m=><option key={m}>{m}</option>)}
                </select>
              </div>
            </div>
            <span style={{ fontSize:"2rem", fontFamily:"'Playfair Display',serif", fontWeight:700, color:"#14532D" }}>{fmt(cambio)}</span>
          </div>
        )}

        {entregadoN>0 && entregadoN<total && (
          <div style={{ background:"var(--danger-bg)", border:"1px solid var(--danger-border)", borderRadius:8, padding:"10px 14px", marginBottom:14 }}>
            <span style={{ fontSize:".82rem", color:"var(--err)", fontWeight:600 }}>
              <Icon n="warning" s={13}/> Faltan {fmt(total-entregadoN)} por cubrir
            </span>
          </div>
        )}

        <div className="fdiv"/>
        <div className="fsub">Métodos de pago registrados</div>
        {payments.map((p,i)=>(
          <div key={i} style={{ display:"flex", gap:8, marginBottom:8, alignItems:"center" }}>
            <select className="inp sel" style={{ flex:1 }} value={p.metodo}
              onChange={e=>{ const ps=[...payments]; ps[i]={...ps[i],metodo:e.target.value}; setPayments(ps); }}>
              {PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}
            </select>
            <input className="inp" type="number" style={{ width:130 }} placeholder="Monto COP" value={p.monto}
              onChange={e=>{ const ps=[...payments]; ps[i]={...ps[i],monto:e.target.value}; setPayments(ps); }}/>
            {payments.length>1 && (
              <button className="btn btn-ghost-danger btn-sm btn-icon" onClick={()=>setPayments(payments.filter((_,j)=>j!==i))}><Icon n="close"/></button>
            )}
          </div>
        ))}
        <button className="btn btn-outline btn-sm" onClick={()=>setPayments([...payments,{metodo:"Efectivo",monto:""}])}>
          <Icon n="plus"/>Agregar método
        </button>
      </Modal>

      {/* ══ MODAL RECIBO ══ */}
      <Modal open={receiptModal} onClose={()=>setReceiptModal(false)} title="✓ Venta completada" maxW={460}
        footer={<>
          <button className="btn btn-outline" onClick={()=>setReceiptModal(false)}>Cerrar</button>
          <button className="btn btn-outline" onClick={()=>lastSale&&printFacturaWindow(lastSale,empresa)}>
            <Icon n="print"/>Imprimir
          </button>
          <button className="btn btn-brand" onClick={()=>{ if(lastSale){ try{ printFactura(lastSale,empresa); } catch(e){ toast("Error PDF: "+e.message,false); }} }}>
            <Icon n="pdf"/>PDF
          </button>
        </>}>
        {lastSale && (
          <div>
            <div style={{ textAlign:"center", marginBottom:16 }}>
              <div style={{ width:60, height:60, borderRadius:"50%", background:"var(--ok-bg)", display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", color:"var(--ok)" }}>
                <Icon n="check" s={30}/>
              </div>
              <div style={{ fontSize:"1.5rem", fontFamily:"'Playfair Display',serif", color:"var(--p)" }}>{fmt(lastSale.total)}</div>
              <div style={{ fontSize:".77rem", color:"var(--out)", marginTop:2 }}>Venta #{lastSale.id.slice(0,8).toUpperCase()}</div>
              <div style={{ fontSize:".82rem", color:"var(--on-sv)", marginTop:3 }}>
                <strong>Cliente:</strong> {lastSale.cliente}
                {lastSale.cedula && <span style={{ marginLeft:8, color:"var(--out)" }}>· CC {lastSale.cedula}</span>}
              </div>
            </div>
            <table style={{ width:"100%" }}>
              <thead><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th>Total</th></tr></thead>
              <tbody>
                {lastSale.items.map((it,i)=>(
                  <tr key={i}>
                    <td>{it.nombre} <span style={{ color:"var(--out)", fontSize:".74rem" }}>{it.medida}</span></td>
                    <td style={{ textAlign:"center" }}>{it.cant}</td>
                    <td style={{ textAlign:"right", fontSize:".8rem" }}>
                      {fmt(it.precio)}
                      {it.precioOriginal && it.precio!==it.precioOriginal && (
                        <span style={{ marginLeft:5, color:"var(--amber)", fontSize:".7rem" }}>✎</span>
                      )}
                    </td>
                    <td style={{ fontWeight:600, textAlign:"right" }}>{fmt(it.cant*it.precio)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ marginTop:12, padding:"12px 14px", background:"var(--p-fix)", borderRadius:8, border:"1px solid var(--p-fix-dim)" }}>
              {[[" Subtotal",fmt(lastSale.subtotal)], lastSale.descuento>0?["Descuento",`- ${fmt(lastSale.descuento)}`]:null, ["Total",fmt(lastSale.total)], ["Recibido",fmt(lastSale.entregado)], lastSale.cambio>0?["Cambio",fmt(lastSale.cambio)]:null].filter(Boolean).map(([l,v])=>(
                <div key={l} style={{ display:"flex", justifyContent:"space-between", fontWeight:l==="Total"?700:400, fontSize:l==="Total"?".95rem":".82rem", marginTop:4, color:l==="Cambio"?"var(--ok)":"var(--text-dk,#0F172A)" }}>
                  <span>{l}:</span><span>{v}</span>
                </div>
              ))}
              <div style={{ marginTop:8, paddingTop:8, borderTop:"1px solid var(--border)", fontSize:".78rem", color:"var(--on-sv)" }}>
                <strong>Pago:</strong> {lastSale.pagos?.map(p=>`${p.metodo}: ${fmt(p.monto)}`).join(" + ")}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
