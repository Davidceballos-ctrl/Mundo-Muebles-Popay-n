/**
 * LoginPage — The Digital Curator · v10.1
 * Panel izquierdo: formulario limpio
 * Panel derecho: imagen de mueblería + marca sobria (sin lista de features)
 * Seguridad: 5 intentos → bloqueo 15 min con countdown
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { hashPassword, verifyPassword, isPlainPassword, extractPlain } from "../utils/crypto.js";
import Icon from "../components/Icons.jsx";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS   = 15 * 60 * 1000;
const ATTEMPTS_KEY = "mm_login_attempts";

const getAD  = () => { try { const r = localStorage.getItem(ATTEMPTS_KEY); return r ? JSON.parse(r) : { count:0, lockedAt:null }; } catch { return {count:0,lockedAt:null}; } };
const saveAD = d => { try { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(d)); } catch {} };
const clrAD  = () => { try { localStorage.removeItem(ATTEMPTS_KEY); } catch {} };
const remMs  = la => la ? Math.max(0, LOCKOUT_MS - (Date.now() - la)) : 0;
const fmtCD  = ms => { const s = Math.ceil(ms/1000); return `${Math.floor(s/60)}:${String(s%60).padStart(2,"0")}`; };

const INP = {
  width: "100%", height: 48, padding: "0 16px",
  border: "1.5px solid rgba(203,213,225,.5)",
  borderRadius: 12,
  fontFamily: "'Inter', sans-serif", fontSize: ".9rem", color: "#191c1e",
  background: "#f8f9fb", outline: "none", transition: "all .18s",
};

export default function LoginPage() {
  const nav = useNavigate();
  const { users, setUsers, login, toast } = useApp();

  const [form,       setForm]       = useState({ email: "", password: "" });
  const [showPass,   setShowPass]   = useState(false);
  const [err,        setErr]        = useState("");
  const [loading,    setLoading]    = useState(false);
  const [attempts,   setAttempts]   = useState(getAD);
  const [countdown,  setCountdown]  = useState(0);
  const [showForgot, setShowForgot] = useState(false);

  const s = (k, v) => { setForm(f => ({...f,[k]:v})); setErr(""); };

  useEffect(() => {
    if (!attempts.lockedAt) { setCountdown(0); return; }
    const rem = remMs(attempts.lockedAt);
    if (rem <= 0) { const r={count:0,lockedAt:null}; setAttempts(r); saveAD(r); setCountdown(0); return; }
    setCountdown(rem);
    const iv = setInterval(() => {
      setCountdown(p => {
        const n = p - 1000;
        if (n <= 0) { clearInterval(iv); const r={count:0,lockedAt:null}; setAttempts(r); saveAD(r); setErr(""); return 0; }
        return n;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [attempts.lockedAt]);

  const isLocked = () => !!attempts.lockedAt && remMs(attempts.lockedAt) > 0;

  const registerFail = () => {
    const cur = getAD(); const n = cur.count + 1;
    if (n >= MAX_ATTEMPTS) {
      const d = {count:n,lockedAt:Date.now()}; setAttempts(d); saveAD(d);
      setErr("Demasiados intentos. Bloqueado por 15 minutos.");
    } else {
      const left = MAX_ATTEMPTS - n;
      const d = {count:n,lockedAt:null}; setAttempts(d); saveAD(d);
      setErr(`Correo o contraseña incorrectos. ${left} intento${left!==1?"s":""} restante${left!==1?"s":""}.`);
    }
  };

  const handleLogin = async () => {
    if (!form.email.trim() || !form.password) { setErr("Completa todos los campos."); return; }
    if (isLocked()) { setErr(`Bloqueado. Espera ${fmtCD(remMs(attempts.lockedAt))}.`); return; }
    setLoading(true); setErr("");
    await new Promise(r => setTimeout(r, 400));
    try {
      const u = users.find(x => x.email.toLowerCase() === form.email.toLowerCase().trim() && x.activo);
      if (!u) { registerFail(); setLoading(false); return; }
      const sp = u.password || ""; let match = false;
      if (isPlainPassword(sp)) {
        match = form.password === extractPlain(sp);
        if (match) { const h = await hashPassword(form.password); setUsers(prev => prev.map(x => x.id===u.id ? {...x,password:h} : x)); }
      } else { match = await verifyPassword(form.password, sp); }
      if (!match) { registerFail(); setLoading(false); return; }
      clrAD(); setAttempts({count:0,lockedAt:null}); login(u);
      toast(`Bienvenido, ${u.nombre} · ${u.rol}`); nav("/");
    } catch { setErr("Error interno. Intenta de nuevo."); }
    setLoading(false);
  };

  const locked = isLocked();
  const focusIn  = e => { e.target.style.background="#fff"; e.target.style.borderColor="#003fb1"; e.target.style.boxShadow="0 0 0 3px rgba(0,63,177,.12)"; };
  const focusOut = e => { e.target.style.background="#f8f9fb"; e.target.style.borderColor="rgba(203,213,225,.5)"; e.target.style.boxShadow="none"; };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"'Inter',sans-serif" }}>
      <style>{`
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @media(max-width:700px){
          .login-right{ display:none !important; }
          .login-left { flex:1 !important; max-width:100% !important; }
        }
      `}</style>

      {/* ── Panel izquierdo — Formulario ── */}
      <div className="login-left" style={{
        flex:"0 0 460px", maxWidth:460, background:"#fff",
        display:"flex", flexDirection:"column", justifyContent:"center",
        padding:"52px 48px", position:"relative",
      }}>

        {/* Brand */}
        <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
          <div style={{
            width:44, height:44,
            background:"linear-gradient(135deg,#003fb1,#1a56db)",
            borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:16,
            color:"#fff", letterSpacing:"-1px",
            boxShadow:"0 4px 14px rgba(0,63,177,.28)", flexShrink:0,
          }}>MM</div>
          <div>
            <div style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:"1.05rem", color:"#0f172a", lineHeight:1 }}>
              Mundo Muebles
            </div>
            <div style={{ fontSize:10, textTransform:"uppercase", letterSpacing:".12em", color:"#94a3b8", fontWeight:600, marginTop:3 }}>
              Popayán ERP
            </div>
          </div>
        </div>

        {!showForgot ? (
          <>
            <h1 style={{ fontFamily:"'Manrope',sans-serif", fontWeight:800, fontSize:"2rem", color:"#0f172a", marginBottom:6, letterSpacing:"-.04em" }}>
              Iniciar sesión
            </h1>
            <p style={{ fontSize:".875rem", color:"#64748b", marginBottom:32, lineHeight:1.55 }}>
              Gestiona tu showroom con eficiencia editorial.
            </p>

            {/* Aviso intentos */}
            {attempts.count > 0 && !locked && (
              <div style={{ background:"#fff7ed", border:"1px solid #fed7aa", borderRadius:10, padding:"10px 14px", marginBottom:16, display:"flex", alignItems:"center", gap:8, fontSize:".8rem", color:"#9a3412" }}>
                <Icon n="warning" s={14} />
                <span><strong>{MAX_ATTEMPTS - attempts.count} intento{MAX_ATTEMPTS-attempts.count!==1?"s":""} restante{MAX_ATTEMPTS-attempts.count!==1?"s":""}</strong> antes del bloqueo.</span>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:".72rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>
                Correo electrónico
              </label>
              <input type="email" placeholder="gerencia@mundomuebles.com"
                value={form.email} onChange={e => s("email", e.target.value)}
                onKeyDown={e => e.key==="Enter" && handleLogin()}
                onFocus={focusIn} onBlur={focusOut}
                autoComplete="email" disabled={locked}
                style={{ ...INP, opacity: locked ? .5 : 1 }} />
            </div>

            {/* Password */}
            <div style={{ marginBottom:12 }}>
              <label style={{ display:"block", fontSize:".72rem", fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:".08em", marginBottom:8 }}>
                Contraseña
              </label>
              <div style={{ position:"relative" }}>
                <input type={showPass ? "text" : "password"} placeholder="••••••••••••"
                  value={form.password} onChange={e => s("password", e.target.value)}
                  onKeyDown={e => e.key==="Enter" && handleLogin()}
                  onFocus={focusIn} onBlur={focusOut}
                  autoComplete="current-password" disabled={locked}
                  style={{ ...INP, paddingRight:46, opacity: locked ? .5 : 1 }} />
                <button onClick={() => setShowPass(p => !p)} style={{
                  position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer",
                  color:"#94a3b8", display:"flex", padding:4,
                }}>
                  <Icon n="eye" s={16} />
                </button>
              </div>
            </div>

            {/* ¿Olvidaste? */}
            <div style={{ display:"flex", justifyContent:"flex-end", marginBottom:24 }}>
              <button onClick={() => { setShowForgot(true); setErr(""); }} style={{
                background:"none", border:"none", cursor:"pointer",
                color:"#003fb1", fontSize:".82rem", fontWeight:600,
                fontFamily:"'Inter',sans-serif",
              }}>¿No puedes acceder?</button>
            </div>

            {/* Error */}
            {err && (
              <div style={{
                background: locked ? "#ffdad6" : "#fff1f2",
                border: `1px solid ${locked ? "#ffb4ab" : "#fecdd3"}`,
                borderRadius:10, padding:"12px 14px", marginBottom:16,
              }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <Icon n={locked ? "shield" : "alert"} s={15}
                    style={{ color: locked ? "#ba1a1a" : "#e11d48", flexShrink:0 }} />
                  <span style={{ fontSize:".82rem", color: locked ? "#7f1d1d" : "#9f1239", fontWeight:600 }}>{err}</span>
                </div>
                {locked && countdown > 0 && (
                  <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:10, padding:"8px 12px", background:"rgba(0,0,0,.05)", borderRadius:8 }}>
                    <Icon n="clock" s={15} style={{ color:"#ba1a1a" }} />
                    <span style={{ fontSize:".9rem", fontWeight:800, color:"#7f1d1d", fontVariantNumeric:"tabular-nums", letterSpacing:".04em", fontFamily:"'Manrope',sans-serif" }}>
                      {fmtCD(countdown)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* CTA */}
            <button onClick={handleLogin} disabled={loading || locked} style={{
              width:"100%", height:52,
              background:"linear-gradient(135deg,#003fb1,#1a56db)",
              color:"#fff", border:"none",
              cursor: loading||locked ? "not-allowed" : "pointer",
              borderRadius:999,
              fontFamily:"'Manrope',sans-serif", fontWeight:700, fontSize:"1rem",
              display:"flex", alignItems:"center", justifyContent:"center", gap:10,
              opacity: loading||locked ? .65 : 1,
              boxShadow:"0 4px 14px rgba(0,63,177,.32)", marginBottom:22,
              transition:"all .18s",
            }}
              onMouseOver={e => { if (!loading&&!locked) { e.currentTarget.style.transform="scale(1.02)"; e.currentTarget.style.boxShadow="0 6px 20px rgba(0,63,177,.42)"; }}}
              onMouseOut={e => { e.currentTarget.style.transform="scale(1)"; e.currentTarget.style.boxShadow="0 4px 14px rgba(0,63,177,.32)"; }}>
              {loading ? (
                <><span style={{ width:18,height:18,border:"2px solid rgba(255,255,255,.3)",borderTopColor:"#fff",borderRadius:"50%",display:"inline-block",animation:"spin .7s linear infinite" }}/>Verificando...</>
              ) : locked ? (
                <><Icon n="shield" s={16}/>Bloqueado — {fmtCD(countdown)}</>
              ) : <>Iniciar sesión →</>}
            </button>

            {/* Security badge */}
            <div style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
              <div style={{ display:"flex", alignItems:"center", gap:7, background:"#f8fafc", borderRadius:999, padding:"6px 14px", fontSize:11, fontWeight:600, color:"#64748b", textTransform:"uppercase", letterSpacing:".06em" }}>
                <Icon n="shield" s={13}/>Acceso Seguro SSL
              </div>
            </div>
          </>
        ) : (
          <>
            <button onClick={() => { setShowForgot(false); setErr(""); }} style={{ background:"none",border:"none",cursor:"pointer",color:"#64748b",fontSize:".82rem",display:"flex",alignItems:"center",gap:6,marginBottom:28,fontFamily:"'Inter',sans-serif",padding:0 }}>
              ← Volver al inicio de sesión
            </button>
            <h1 style={{ fontFamily:"'Manrope',sans-serif",fontWeight:800,fontSize:"1.75rem",color:"#0f172a",marginBottom:8,letterSpacing:"-.04em" }}>Recuperar acceso</h1>
            <p style={{ fontSize:".875rem",color:"#64748b",lineHeight:1.65,marginBottom:24 }}>
              Contacta al administrador para restablecer tu contraseña desde <strong>Sistema → Usuarios</strong>.
            </p>
            <div style={{ background:"#eff6ff",border:"1px solid #bfdbfe",borderRadius:12,padding:"16px 18px",marginBottom:24 }}>
              <div style={{ display:"flex",alignItems:"center",gap:8,marginBottom:8 }}>
                <Icon n="shield" s={15} style={{ color:"#1d4ed8" }}/>
                <span style={{ fontWeight:700,fontSize:".85rem",color:"#1e3a8a",fontFamily:"'Manrope',sans-serif" }}>Instrucciones para el administrador</span>
              </div>
              <div style={{ fontSize:".82rem",color:"#1d4ed8",lineHeight:1.65,fontFamily:"'Inter',sans-serif" }}>
                1. Inicia sesión con tu cuenta de Administrador.<br/>
                2. Ve a <strong>Sistema → Usuarios</strong>.<br/>
                3. Edita el usuario y actualiza su contraseña.
              </div>
            </div>
            <button onClick={() => { setShowForgot(false); setErr(""); }} style={{ width:"100%",height:48,background:"#f3f4f6",color:"#374151",border:"1px solid rgba(203,213,225,.5)",borderRadius:999,cursor:"pointer",fontFamily:"'Inter',sans-serif",fontWeight:600,fontSize:".875rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8 }}>
              <Icon n="key" s={15}/>Volver al inicio de sesión
            </button>
          </>
        )}
      </div>

      {/* ── Panel derecho — imagen de mueblería + overlay limpio ── */}
      <div className="login-right" style={{
        flex:1,
        position:"relative",
        overflow:"hidden",
        backgroundImage:"url('/furniture-bg.jpg')",
        backgroundSize:"cover",
        backgroundPosition:"center 55%",
      }}>
        {/* Overlay gradiente que oscurece la parte inferior más que la superior */}
        <div style={{
          position:"absolute", inset:0,
          background:"linear-gradient(160deg, rgba(0,30,100,.55) 0%, rgba(0,20,75,.72) 60%, rgba(0,10,50,.88) 100%)",
        }}/>

        {/* Contenido centrado — solo marca, sin lista */}
        <div style={{
          position:"relative", zIndex:1,
          height:"100%",
          display:"flex", flexDirection:"column",
          alignItems:"center", justifyContent:"center",
          padding:"48px",
          textAlign:"center",
        }}>
          {/* Logo */}
          <div style={{
            width:80, height:80, borderRadius:22,
            background:"rgba(255,255,255,.12)",
            backdropFilter:"blur(12px)",
            border:"1.5px solid rgba(255,255,255,.25)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontFamily:"'Manrope',sans-serif", fontWeight:900, fontSize:28,
            color:"#fff", letterSpacing:"-2px",
            marginBottom:24,
            boxShadow:"0 8px 32px rgba(0,0,0,.25)",
          }}>MM</div>

          {/* Nombre */}
          <h2 style={{
            fontFamily:"'Manrope',sans-serif",
            fontSize:"clamp(1.8rem, 3vw, 2.6rem)",
            fontWeight:900, color:"#fff",
            lineHeight:1.1, letterSpacing:"-.04em",
            marginBottom:12,
            textShadow:"0 2px 16px rgba(0,0,0,.3)",
          }}>
            Mundo Muebles<br/>Popayán
          </h2>

          {/* Subtítulo */}
          <p style={{
            fontSize:"11px",
            color:"rgba(255,255,255,.6)",
            textTransform:"uppercase",
            letterSpacing:".18em",
            fontFamily:"'Inter',sans-serif",
            fontWeight:700,
            marginBottom:0,
          }}>
            Sistema de Gestión Empresarial
          </p>

          {/* Línea decorativa */}
          <div style={{
            width:48, height:2,
            background:"rgba(255,255,255,.35)",
            borderRadius:99,
            margin:"20px auto",
          }}/>

          {/* Tagline sutil */}
          <p style={{
            fontSize:".82rem",
            color:"rgba(255,255,255,.45)",
            fontFamily:"'Inter',sans-serif",
            fontStyle:"italic",
            maxWidth:260,
            lineHeight:1.65,
          }}>
            Moda en el hogar · Popayán, Cauca
          </p>
        </div>

        {/* Footer versión */}
        <div style={{
          position:"absolute", bottom:20, left:0, right:0,
          textAlign:"center",
          fontSize:"10px", color:"rgba(255,255,255,.25)",
          letterSpacing:".08em", fontFamily:"'Inter',sans-serif",
        }}>
          v8.1.3 · Mundo Muebles Popayán © {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
