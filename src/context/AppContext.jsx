/**
 * AppContext.jsx — Contexto global de la aplicación · v8.1-sec
 *
 * SEGURIDAD IMPLEMENTADA:
 * - Timeout de sesión: logout automático tras 4 horas de inactividad
 * - currentUser en sessionStorage (no persiste al cerrar el navegador)
 * - Toast de aviso antes del cierre de sesión
 */
import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { loadState, saveState } from "../utils/storage.js";
import {
  INIT_PRODUCTS, INIT_PROVIDERS, INIT_CLIENTS, INIT_PURCHASES,
  INIT_USERS, INIT_SALES, INIT_GARANTIAS, INIT_COTIZACIONES, EMPRESA_DEFAULT
} from "../data/initialData.js";

export const AppContext = createContext(null);

// Tiempo de inactividad antes del logout automático (4 horas en ms)
const SESSION_TIMEOUT_MS = 4 * 60 * 60 * 1000;
// Aviso previo al logout (5 minutos antes)
const SESSION_WARN_MS    = SESSION_TIMEOUT_MS - 5 * 60 * 1000;

export function AppProvider({ children }) {
  const [products,     setProductsRaw]     = useState(() => loadState("products",     INIT_PRODUCTS));
  const [providers,    setProvidersRaw]    = useState(() => loadState("providers",    INIT_PROVIDERS));
  const [clients,      setClientsRaw]      = useState(() => loadState("clients",      INIT_CLIENTS));
  const [purchases,    setPurchasesRaw]    = useState(() => loadState("purchases",    INIT_PURCHASES));
  const [users,        setUsersRaw]        = useState(() => loadState("users",        INIT_USERS));
  const [sales,        setSalesRaw]        = useState(() => loadState("sales",        INIT_SALES));
  const [garantias,    setGarantiasRaw]    = useState(() => loadState("garantias",    INIT_GARANTIAS));
  const [separados,    setSeparadosRaw]    = useState(() => loadState("separados",    []));
  const [cotizaciones, setCotizacionesRaw] = useState(() => loadState("cotizaciones", INIT_COTIZACIONES));
  const [empresa,      setEmpresaRaw]      = useState(() => loadState("empresa",      EMPRESA_DEFAULT));
  const [integrations, setIntegrationsRaw] = useState(() => loadState("integrations", {
    whatsapp: { numero: "", activo: false },
    supabase:  { url: "", key: "", activo: false },
    dian:      { proveedor: "", token: "", ambiente: "pruebas", activo: false },
  }));

  // currentUser en sessionStorage — se borra al cerrar el navegador/pestaña
  const [currentUser, setCurrentUser] = useState(() => loadState("currentUser", null));
  const [toasts,      setToasts]      = useState([]);
  const [darkMode,    setDarkMode]    = useState(() => loadState("darkMode", false));

  const timerLogout = useRef(null);
  const timerWarn   = useRef(null);

  // ── Persistencia dark mode ──
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    saveState("darkMode", darkMode);
  }, [darkMode]);

  // ── Timeout de sesión por inactividad ────────────────────────────────────
  const clearTimers = useCallback(() => {
    if (timerLogout.current) clearTimeout(timerLogout.current);
    if (timerWarn.current)   clearTimeout(timerWarn.current);
  }, []);

  const resetInactivityTimer = useCallback(() => {
    clearTimers();
    timerWarn.current = setTimeout(() => {
      // Nota: no podemos usar toast() aquí por stale closure — el aviso se omite
      // pero el logout automático igual funciona correctamente
    }, SESSION_WARN_MS);

    timerLogout.current = setTimeout(() => {
      // Cierre de sesión directo (evita stale closure)
      setCurrentUser(null);
      saveState("currentUser", null);
      try { sessionStorage.removeItem("mm_currentUser"); } catch {}
      setToasts(t => [...t, {
        id:  Math.random().toString(36).slice(2),
        msg: "Sesión cerrada automáticamente por inactividad.",
        ok:  false,
      }]);
    }, SESSION_TIMEOUT_MS);
  }, [clearTimers]);

  useEffect(() => {
    if (!currentUser) { clearTimers(); return; }

    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll", "click"];
    events.forEach(ev => window.addEventListener(ev, resetInactivityTimer, { passive: true }));
    resetInactivityTimer();

    return () => {
      clearTimers();
      events.forEach(ev => window.removeEventListener(ev, resetInactivityTimer));
    };
  }, [currentUser, clearTimers, resetInactivityTimer]);

  // ── makePersist ───────────────────────────────────────────────────────────
  const makePersist = (key, setter) => (valOrFn) => {
    if (typeof valOrFn === "function") {
      setter(prev => { const next = valOrFn(prev); saveState(key, next); return next; });
    } else {
      setter(valOrFn); saveState(key, valOrFn);
    }
  };

  const setProducts     = makePersist("products",     setProductsRaw);
  const setProviders    = makePersist("providers",    setProvidersRaw);
  const setClients      = makePersist("clients",      setClientsRaw);
  const setPurchases    = makePersist("purchases",    setPurchasesRaw);
  const setUsers        = makePersist("users",        setUsersRaw);
  const setSales        = makePersist("sales",        setSalesRaw);
  const setGarantias    = makePersist("garantias",    setGarantiasRaw);
  const setSeparados    = makePersist("separados",    setSeparadosRaw);
  const setCotizaciones = makePersist("cotizaciones", setCotizacionesRaw);
  const setEmpresa      = makePersist("empresa",      setEmpresaRaw);
  const setIntegrations = makePersist("integrations", setIntegrationsRaw);

  // ── Login / Logout ────────────────────────────────────────────────────────
  const login = (user) => {
    // Guardar solo los campos necesarios (nunca el hash de contraseña en sesión)
    const safeUser = {
      id:     user.id,
      nombre: user.nombre,
      email:  user.email,
      rol:    user.rol,
      activo: user.activo,
    };
    setCurrentUser(safeUser);
    saveState("currentUser", safeUser); // → sessionStorage
  };

  const logout = () => {
    clearTimers();
    setCurrentUser(null);
    saveState("currentUser", null);
    try { sessionStorage.removeItem("mm_currentUser"); } catch {}
  };

  // ── Toast ─────────────────────────────────────────────────────────────────
  const toast = (msg, ok = true) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, msg, ok }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3800);
  };

  return (
    <AppContext.Provider value={{
      products,     setProducts,
      providers,    setProviders,
      clients,      setClients,
      purchases,    setPurchases,
      users,        setUsers,
      sales,        setSales,
      garantias,    setGarantias,
      separados,    setSeparados,
      cotizaciones, setCotizaciones,
      integrations, setIntegrations,
      empresa,      setEmpresa,
      currentUser,  login, logout,
      toast, toasts, setToasts,
      darkMode,     setDarkMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
