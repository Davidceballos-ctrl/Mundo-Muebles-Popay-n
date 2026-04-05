/**
 * storage.js — Persistencia con localStorage + sincronización Supabase
 * Mundo Muebles Popayán · v8.1-sec
 *
 * SEGURIDAD:
 * - Las credenciales de Supabase se leen EXCLUSIVAMENTE desde variables de entorno.
 * - Nunca hardcodear SUPABASE_URL ni SUPABASE_KEY en este archivo.
 * - Los datos se sanitizan antes de guardar.
 * - currentUser se guarda en sessionStorage (se borra al cerrar el navegador).
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY;

let supabase = null;
if (SUPABASE_URL && SUPABASE_KEY) {
  try { supabase = createClient(SUPABASE_URL, SUPABASE_KEY); }
  catch (e) { console.warn("[Supabase] No se pudo inicializar:", e.message); }
}

const LS_PREFIX   = "mm_";
const SYNC_KEYS   = ["products","sales","clients","purchases","garantias","cotizaciones"];
const SESSION_KEYS = ["currentUser"];

// ── Sanitizar datos antes de guardar ─────────────────────────────────────────
function sanitize(value) {
  if (value === null || value === undefined) return null;
  if (Array.isArray(value)) return value.map(sanitize).filter(v => v !== null);
  if (typeof value === "object") {
    const r = {};
    for (const [k,v] of Object.entries(value)) {
      if (v !== undefined) r[k] = sanitize(v);
    }
    return r;
  }
  return value;
}

// ── loadState ─────────────────────────────────────────────────────────────────
export function loadState(key, fallback) {
  try {
    const store = SESSION_KEYS.includes(key) ? sessionStorage : localStorage;
    const raw   = store.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

// ── saveState ─────────────────────────────────────────────────────────────────
export function saveState(key, value) {
  const clean = sanitize(value);
  try {
    const store = SESSION_KEYS.includes(key) ? sessionStorage : localStorage;
    store.setItem(LS_PREFIX + key, JSON.stringify(clean));
  } catch (e) { console.warn("[Storage] Error guardando:", key, e.message); }

  // Sincronizar con Supabase en segundo plano
  if (supabase && SYNC_KEYS.includes(key) && Array.isArray(clean) && clean.length > 0) {
    const rows = clean.map(item => ({ id: String(item.id || ""), data: item }));
    supabase.from("mm_" + key)
      .upsert(rows, { onConflict: "id" })
      .then(({ error }) => {
        if (error) console.warn("[Supabase sync error]", key, error.message);
      });
  }
}

// ── syncFromSupabase ──────────────────────────────────────────────────────────
export async function syncFromSupabase(key) {
  if (!supabase || !SYNC_KEYS.includes(key)) return null;
  try {
    const { data, error } = await supabase
      .from("mm_" + key).select("data").order("id");
    if (error || !data?.length) return null;
    const result = data.map(r => sanitize(r.data)).filter(Boolean);
    try { localStorage.setItem(LS_PREFIX + key, JSON.stringify(result)); } catch {}
    return result;
  } catch (e) { console.warn("[Supabase error]", key, e.message); return null; }
}

// ── deleteFromSupabase ────────────────────────────────────────────────────────
export async function deleteFromSupabase(key, id) {
  if (!supabase || !SYNC_KEYS.includes(key)) return;
  try {
    const { error } = await supabase.from("mm_" + key).delete().eq("id", String(id));
    if (error) console.warn("[Supabase delete error]", key, id, error.message);
  } catch (e) { console.warn("[Supabase delete error]", e.message); }
}

export function isSupabaseConfigured() { return !!supabase; }
