/**
 * VendedorDashboard.jsx — Dashboard avanzado por vendedor · v8.0
 * Métricas de rendimiento con Recharts
 */
import { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Legend,
} from "recharts";
import { useApp } from "../context/AppContext.jsx";
import { fmt, fmtDate } from "../utils/format.js";
import Icon from "../components/Icons.jsx";

const COLORS = ["#1a56db","#E09A3F","#16A34A","#DC2626","#7C3AED","#0D9488","#DB2777"];
function daysAgo(n) { const d=new Date(); d.setDate(d.getDate()-n); return d.toISOString().slice(0,10); }

export default function VendedorDashboard() {
  const { sales, users, products } = useApp();
  const [dateFrom, setDateFrom] = useState(daysAgo(30));
  const [dateTo,   setDateTo]   = useState(new Date().toISOString().slice(0,10));
  const [selVendedor, setSelVendedor] = useState("Todos");

  const presets = [
    { label:"7 días",  from:daysAgo(7),  to:new Date().toISOString().slice(0,10) },
    { label:"30 días", from:daysAgo(30), to:new Date().toISOString().slice(0,10) },
    { label:"3 meses", from:daysAgo(90), to:new Date().toISOString().slice(0,10) },
    { label:"1 año",   from:daysAgo(365),to:new Date().toISOString().slice(0,10) },
  ];

  const vendedores = useMemo(()=>{
    const names = [...new Set(sales.map(s=>s.vendedor).filter(Boolean))];
    return names;
  },[sales]);

  const salesInRange = useMemo(()=>
    sales.filter(s=>s.fecha>=dateFrom && s.fecha<=dateTo),
    [sales,dateFrom,dateTo]
  );

  const salesFiltradas = useMemo(()=>
    selVendedor==="Todos" ? salesInRange : salesInRange.filter(s=>s.vendedor===selVendedor),
    [salesInRange,selVendedor]
  );

  // ── KPIs por vendedor ──
  const byVendedor = useMemo(()=>{
    const map = {};
    salesInRange.forEach(s=>{
      const v = s.vendedor||"Sin vendedor";
      if (!map[v]) map[v] = { nombre:v, ventas:0, monto:0, items:0, clientes:new Set(), tickets:[] };
      map[v].ventas++;
      map[v].monto  += s.total;
      map[v].items  += (s.items||[]).reduce((a,it)=>a+it.cant,0);
      map[v].clientes.add(s.cliente);
      map[v].tickets.push(s.total);
    });
    return Object.values(map).map(v=>({
      ...v,
      clientes:    v.clientes.size,
      ticketProm:  v.ventas ? Math.round(v.monto/v.ventas) : 0,
      ticketMax:   v.tickets.length ? Math.max(...v.tickets) : 0,
    })).sort((a,b)=>b.monto-a.monto);
  },[salesInRange]);

  // ── Ventas diarias del vendedor seleccionado ──
  const dailyChart = useMemo(()=>{
    const map={};
    salesFiltradas.forEach(s=>{ map[s.fecha]=(map[s.fecha]||0)+s.total; });
    const days=[];
    const from=new Date(dateFrom), to=new Date(dateTo);
    for(let d=new Date(from);d<=to;d.setDate(d.getDate()+1)) {
      const k=d.toISOString().slice(0,10);
      days.push({ fecha:k, ventas:map[k]||0, label:d.toLocaleDateString("es-CO",{month:"short",day:"numeric"}) });
    }
    return days.slice(-60);
  },[salesFiltradas,dateFrom,dateTo]);

  // ── Productos más vendidos ──
  const topProductos = useMemo(()=>{
    const map={};
    salesFiltradas.forEach(s=>(s.items||[]).forEach(it=>{
      const k=it.nombre;
      if (!map[k]) map[k]={nombre:k,cant:0,monto:0};
      map[k].cant  += it.cant;
      map[k].monto += it.cant*it.precio;
    }));
    return Object.values(map).sort((a,b)=>b.monto-a.monto).slice(0,8);
  },[salesFiltradas]);

  // ── Distribución de métodos de pago ──
  const metodosPago = useMemo(()=>{
    const map={};
    salesFiltradas.forEach(s=>(s.pagos||[]).forEach(p=>{
      map[p.metodo]=(map[p.metodo]||0)+p.monto;
    }));
    return Object.entries(map).map(([name,value])=>({name,value}));
  },[salesFiltradas]);

  // ── Ventas por día de la semana ──
  const diasSemana = useMemo(()=>{
    const dias=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
    const map={}; dias.forEach(d=>{ map[d]={dia:d,ventas:0,monto:0}; });
    salesFiltradas.forEach(s=>{
      const d=dias[new Date(s.fecha+"T00:00:00").getDay()];
      map[d].ventas++; map[d].monto+=s.total;
    });
    return Object.values(map);
  },[salesFiltradas]);

  const totalMonto  = salesFiltradas.reduce((a,s)=>a+s.total,0);
  const totalVentas = salesFiltradas.length;
  const ticketProm  = totalVentas ? Math.round(totalMonto/totalVentas) : 0;
  const clientesUnicos = new Set(salesFiltradas.map(s=>s.cliente)).size;

  const Tip = ({active,payload,label})=>{
    if (!active||!payload?.length) return null;
    return <div style={{ background:"#fff",border:"1px solid var(--border)",borderRadius:8,padding:"8px 12px",fontSize:".79rem" }}>
      <p style={{ color:"var(--out)",marginBottom:2 }}>{label}</p>
      <p style={{ fontWeight:700,color:"var(--p-ctr)" }}>{fmt(payload[0]?.value||0)}</p>
    </div>;
  };

  return (
    <div>
      <div className="sec-head">
        <div>
          <h2 className="sec-title" style={{ display:"flex", alignItems:"center", gap:8 }}>
            <Icon n="vendor" s={20}/>Dashboard por Vendedor
          </h2>
          <p className="sec-sub">Métricas de rendimiento · {totalVentas} ventas</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-head" style={{ flexWrap:"wrap", gap:10 }}>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", flex:1 }}>
            {presets.map(p=>(
              <button key={p.label} className="btn btn-outline btn-sm"
                style={{ borderColor:dateFrom===p.from&&dateTo===p.to?"var(--p-ctr)":undefined, background:dateFrom===p.from&&dateTo===p.to?"var(--p-fix)":undefined, color:dateFrom===p.from&&dateTo===p.to?"var(--p)":undefined }}
                onClick={()=>{ setDateFrom(p.from); setDateTo(p.to); }}>
                {p.label}
              </button>
            ))}
            <input className="inp" type="date" style={{ width:135,height:30 }} value={dateFrom} onChange={e=>setDateFrom(e.target.value)}/>
            <span style={{ color:"var(--out)" }}>—</span>
            <input className="inp" type="date" style={{ width:135,height:30 }} value={dateTo} onChange={e=>setDateTo(e.target.value)}/>
          </div>
          <select className="inp" style={{ width:180 }} value={selVendedor} onChange={e=>setSelVendedor(e.target.value)}>
            <option value="Todos">Todos los vendedores</option>
            {vendedores.map(v=><option key={v}>{v}</option>)}
          </select>
        </div>
      </div>

      {/* KPIs globales */}
      <div className="kpi-grid" style={{ marginBottom:16 }}>
        <div className="kpi b"><div className="kpi-ico b"><Icon n="money" s={20}/></div><div className="kpi-label">Total vendido</div><div className="kpi-val sm">{fmt(totalMonto)}</div></div>
        <div className="kpi g"><div className="kpi-ico g"><Icon n="cart"  s={20}/></div><div className="kpi-label">N.° ventas</div><div className="kpi-val">{totalVentas}</div></div>
        <div className="kpi a"><div className="kpi-ico a"><Icon n="chart" s={20}/></div><div className="kpi-label">Ticket promedio</div><div className="kpi-val sm">{fmt(ticketProm)}</div></div>
        <div className="kpi r"><div className="kpi-ico r"><Icon n="users" s={20}/></div><div className="kpi-label">Clientes únicos</div><div className="kpi-val">{clientesUnicos}</div></div>
      </div>

      {/* Ranking de vendedores */}
      <div className="card" style={{ marginBottom:16 }}>
        <div className="card-head"><span className="card-title">🏆 Ranking de vendedores</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>#</th><th>Vendedor</th><th>Ventas</th><th>Monto total</th><th>Ticket prom.</th><th>Ticket máx.</th><th>Clientes</th><th>Ítems</th></tr></thead>
            <tbody>
              {byVendedor.length===0
                ? <tr><td colSpan={8}><div className="empty"><p>Sin datos en este período</p></div></td></tr>
                : byVendedor.map((v,i)=>(
                  <tr key={v.nombre} style={{ background:i===0?"var(--p-fix)":undefined }}>
                    <td style={{ fontWeight:800, color:i===0?"#D97706":i===1?"#64748B":i===2?"#92400E":"var(--out)", fontSize:"1rem" }}>
                      {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
                    </td>
                    <td style={{ fontWeight:600, color:"var(--p)" }}>{v.nombre}</td>
                    <td>{v.ventas}</td>
                    <td style={{ fontWeight:700, color:"var(--p)", fontVariantNumeric:"tabular-nums" }}>{fmt(v.monto)}</td>
                    <td style={{ fontVariantNumeric:"tabular-nums" }}>{fmt(v.ticketProm)}</td>
                    <td style={{ fontVariantNumeric:"tabular-nums", color:"var(--ok)", fontWeight:600 }}>{fmt(v.ticketMax)}</td>
                    <td>{v.clientes}</td>
                    <td>{v.items}</td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      {/* Ventas diarias + día de semana */}
      <div style={{ display:"grid", gridTemplateColumns:"1.6fr 1fr", gap:16, marginBottom:16 }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Evolución de ventas — {selVendedor}</span></div>
          <div style={{ padding:"14px 18px" }}>
            <ResponsiveContainer width="100%" height={170}>
              <LineChart data={dailyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="label" tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                <YAxis tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v=>v>=1000?`${(v/1000).toFixed(0)}k`:v}/>
                <Tooltip content={<Tip/>}/>
                <Line type="monotone" dataKey="ventas" stroke="var(--p-ctr)" strokeWidth={2.5} dot={false} activeDot={{ r:5,fill:"var(--p-ctr)" }}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Ventas por día de semana</span></div>
          <div style={{ padding:"14px 18px" }}>
            <ResponsiveContainer width="100%" height={170}>
              <BarChart data={diasSemana}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="dia" tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false}/>
                <Tooltip formatter={v=>[fmt(v),"Monto"]}/>
                <Bar dataKey="monto" radius={[4,4,0,0]}>
                  {diasSemana.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Top productos + métodos de pago */}
      <div style={{ display:"grid", gridTemplateColumns:"1.4fr 1fr", gap:16, marginBottom:16 }}>
        <div className="card">
          <div className="card-head"><span className="card-title">Top productos — {selVendedor}</span></div>
          <div style={{ padding:"12px 16px" }}>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={topProductos} layout="vertical" barCategoryGap="22%">
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false}/>
                <XAxis type="number" tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <YAxis type="category" dataKey="nombre" tick={{ fontSize:8,fill:"var(--on-sv)" }} axisLine={false} tickLine={false} width={120}/>
                <Tooltip formatter={v=>[fmt(v),"Monto"]}/>
                <Bar dataKey="monto" radius={[0,4,4,0]}>
                  {topProductos.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-head"><span className="card-title">Métodos de pago</span></div>
          <div style={{ padding:"12px 8px" }}>
            {metodosPago.length===0
              ? <div className="empty" style={{ padding:"30px 0" }}><p>Sin datos</p></div>
              : <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={metodosPago} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {metodosPago.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip formatter={v=>[fmt(v),"Monto"]}/>
                  <Legend iconSize={10} wrapperStyle={{ fontSize:".75rem" }}/>
                </PieChart>
              </ResponsiveContainer>
            }
          </div>
        </div>
      </div>

      {/* Comparativa de vendedores */}
      {byVendedor.length>1&&(
        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-head"><span className="card-title">Comparativa — Monto total por vendedor</span></div>
          <div style={{ padding:"14px 18px" }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={byVendedor.slice(0,6)}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false}/>
                <XAxis dataKey="nombre" tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize:9,fill:"var(--out)" }} axisLine={false} tickLine={false} tickFormatter={v=>`${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v=>[fmt(v),"Ventas"]}/>
                <Bar dataKey="monto" radius={[4,4,0,0]}>
                  {byVendedor.slice(0,6).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Últimas ventas */}
      <div className="card">
        <div className="card-head"><span className="card-title">Últimas ventas — {selVendedor}</span></div>
        <div className="tw">
          <table>
            <thead><tr><th>N.° Venta</th><th>Fecha</th><th>Cliente</th><th>Productos</th><th>Total</th><th>Vendedor</th></tr></thead>
            <tbody>
              {salesFiltradas.slice(-20).reverse().map(s=>(
                <tr key={s.id}>
                  <td style={{ fontWeight:600, color:"var(--p-ctr)", fontSize:".8rem" }}>#{s.id.slice(0,8).toUpperCase()}</td>
                  <td style={{ fontSize:".82rem", whiteSpace:"nowrap" }}>{fmtDate(s.fecha)}</td>
                  <td style={{ fontWeight:500 }}>{s.cliente}</td>
                  <td style={{ fontSize:".8rem", color:"var(--on-sv)" }}>{(s.items||[]).map(it=>`${it.nombre} ×${it.cant}`).join(", ")}</td>
                  <td style={{ fontWeight:700, color:"var(--p)", fontVariantNumeric:"tabular-nums" }}>{fmt(s.total)}</td>
                  <td style={{ fontSize:".8rem" }}>{s.vendedor}</td>
                </tr>
              ))}
              {salesFiltradas.length===0&&(
                <tr><td colSpan={6}><div className="empty"><p>Sin ventas en este período</p></div></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
