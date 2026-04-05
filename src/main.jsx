/**
 * main.jsx — Punto de entrada · v8.1-sec
 *
 * Al iniciar: sincroniza los datos desde Supabase antes de montar la app.
 * Esto garantiza que todos los dispositivos trabajen con la misma información.
 * Si Supabase no está configurado o falla, la app inicia con localStorage normalmente.
 */
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { syncFromSupabase } from "./utils/storage.js";

const SYNC_KEYS = ["products","sales","clients","purchases","garantias","cotizaciones"];

async function init() {
  // Sincronizar desde Supabase en paralelo (falla silenciosamente si no está configurado)
  try {
    await Promise.allSettled(SYNC_KEYS.map(k => syncFromSupabase(k)));
  } catch {
    // Continúa con localStorage si Supabase falla
  }
}

init().finally(() => {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
});
