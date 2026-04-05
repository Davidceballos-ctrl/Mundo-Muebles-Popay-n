/**
 * crypto.js — Utilidades de criptografía segura
 * Mundo Muebles Popayán · v8.1-sec
 *
 * Usa exclusivamente la Web Crypto API nativa del navegador.
 * NO requiere librerías externas.
 *
 * Estrategia:
 *  - hashPassword(password)  → SHA-256(sal + password) en hex
 *  - verifyPassword(plain, hash) → compara sin timing attack
 *  - generateSalt()  → 16 bytes aleatorios en hex (para futuros usuarios)
 */

// Sal base del negocio — se combina con la sal individual de cada usuario.
// En producción este valor debe venir de import.meta.env.VITE_APP_SALT
const BASE_SALT = import.meta.env.VITE_APP_SALT || "MundoMueblesPopayan2025#Sec";

/**
 * Convierte un ArrayBuffer a string hexadecimal
 */
function bufToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * hashPassword(password, userSalt?)
 * Calcula SHA-256(BASE_SALT + userSalt + password)
 * Devuelve string hex de 64 caracteres.
 *
 * @param {string} password   - contraseña en texto plano
 * @param {string} userSalt   - sal individual del usuario (opcional)
 * @returns {Promise<string>} - hash hex
 */
export async function hashPassword(password, userSalt = "") {
  const data = new TextEncoder().encode(BASE_SALT + userSalt + password);
  const hashBuf = await crypto.subtle.digest("SHA-256", data);
  return bufToHex(hashBuf);
}

/**
 * verifyPassword(plain, storedHash, userSalt?)
 * Compara la contraseña ingresada contra el hash almacenado.
 * Usa comparación de longitud fija para evitar timing attacks.
 *
 * @param {string} plain        - contraseña en texto plano ingresada por el usuario
 * @param {string} storedHash   - hash almacenado en la base de datos
 * @param {string} userSalt     - sal individual del usuario (debe coincidir con la usada al crear)
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(plain, storedHash, userSalt = "") {
  // Compatibilidad: si el hash almacenado tiene < 60 chars,
  // es una contraseña legada en texto plano → comparar directamente
  if (storedHash.length < 60) {
    return plain === storedHash;
  }
  const computed = await hashPassword(plain, userSalt);
  // Comparación de longitud constante para evitar timing attacks
  if (computed.length !== storedHash.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ storedHash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * generateSalt()
 * Genera una sal aleatoria de 16 bytes en formato hex.
 * Úsala al crear nuevos usuarios para aumentar la seguridad.
 *
 * @returns {string} - 32 caracteres hex
 */
export function generateSalt() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return bufToHex(arr.buffer);
}

/**
 * hashPasswordSync(password)
 * Versión síncrona simplificada — solo para inicialización de datos.
 * NO usar en producción para validar contraseñas de usuarios.
 * Retorna un marcador especial que el sistema reconoce como "requiere migración".
 *
 * @param {string} password
 * @returns {string} - prefijo "PLAIN:" + password (se migra al primer login)
 */
export function markPlainPassword(password) {
  return "PLAIN:" + password;
}

/**
 * isPlainPassword(storedHash)
 * Detecta si una contraseña almacenada aún no ha sido hasheada.
 */
export function isPlainPassword(storedHash) {
  return typeof storedHash === "string" && storedHash.startsWith("PLAIN:");
}

/**
 * extractPlain(storedHash)
 * Extrae la contraseña en texto plano del marcador PLAIN:.
 */
export function extractPlain(storedHash) {
  return storedHash.replace(/^PLAIN:/, "");
}
