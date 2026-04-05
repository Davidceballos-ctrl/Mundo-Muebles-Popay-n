/**
 * initialData.js — Datos iniciales del sistema · v8.1-sec
 * Mundo Muebles Popayán
 *
 * ⚠️  SEGURIDAD — LEER ANTES DE DESPLEGAR:
 *
 *  1. Las contraseñas iniciales usan el prefijo PLAIN: para que se migren
 *     automáticamente a SHA-256 en el primer login de cada usuario.
 *
 *  2. ACCIÓN REQUERIDA ANTES DE PUBLICAR:
 *     a) Inicia sesión con cada cuenta y cambia la contraseña desde Usuarios.
 *     b) O usa el módulo Usuarios → Editar → Nueva contraseña.
 *     c) Nunca dejes estas contraseñas iniciales en producción.
 *
 *  3. Contraseñas temporales (cambiar en el primer acceso):
 *     gerencia@mundomuebles.com  →  MM$Admin2025!
 *     vendedor@mundomuebles.com  →  MM$Venta2025!
 *     bodega@mundomuebles.com    →  MM$Bodeg2025!
 *
 *  4. NO hay cuentas de demostración (admin123, ventas123, bodega123).
 *     Esas cuentas fueron eliminadas por seguridad.
 */

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

// ── Categorías de productos ───────────────────────────────────────────────────
export const CATEGORIAS = [
  "Colchones","Bases de Cama","Espaldares","Salas","Comedores",
  "Alcobas","Muebles de Oficina","Tapizados","Accesorios","Otros",
];

export const PAYMENT_METHODS = [
  "Efectivo","Tarjeta Débito","Tarjeta Crédito","Transferencia","Nequi","Daviplata","Otro",
];

export const TAX_RATE = 0; // IVA: 0% (ajustar si aplica)
export const LOW_STOCK_THRESHOLD = 3;

// ── Colores disponibles para variantes de productos ───────────────────────────
export const COLORS_LIST = [
  "Beige","Negro","Gris","Gris Claro","Gris Oscuro",
  "Café","Blanco","Azul","Verde","Rojo","Naranja","Amarillo",
  "Morado","Rosa","Vinotinto","Terracota","Madera Natural",
];

export const COLOR_HEX = {
  "Beige":          "#D4B896",
  "Negro":          "#1C1C1C",
  "Gris":           "#9CA3AF",
  "Gris Claro":     "#D1D5DB",
  "Gris Oscuro":    "#4B5563",
  "Café":           "#7C4A1E",
  "Blanco":         "#F9FAFB",
  "Azul":           "#3B82F6",
  "Verde":          "#22C55E",
  "Rojo":           "#EF4444",
  "Naranja":        "#F97316",
  "Amarillo":       "#EAB308",
  "Morado":         "#8B5CF6",
  "Rosa":           "#EC4899",
  "Vinotinto":      "#7F1D1D",
  "Terracota":      "#C2714F",
  "Madera Natural": "#A0785A",
};

// ── Cuentas reales de la empresa ──────────────────────────────────────────────
// Hashes: SHA-256(email.toLowerCase() + ":" + password)
// Generados con: security.js → hashPassword(email, password)
//
// ⚠️ ACCIÓN REQUERIDA: Cambiar contraseñas en primer acceso desde el módulo Usuarios
//
// ── Cuentas iniciales ─────────────────────────────────────────────────────────
// Las contraseñas usan el prefijo PLAIN: — se migran automáticamente a
// SHA-256 en el primer login de cada usuario gracias a crypto.js.
// ⚠️  CAMBIAR INMEDIATAMENTE después del primer acceso.
//
export const INIT_USERS = [
  {
    id:       uid(),
    nombre:   "Gerente General",
    email:    "gerencia@mundomuebles.com",
    rol:      "Administrador",
    activo:   true,
    password: "PLAIN:MM$Admin2025!",   // se hashea automáticamente en el primer login
    requiereCambio: true,
    creadoEn: new Date().toISOString().slice(0, 10),
  },
  {
    id:       uid(),
    nombre:   "Vendedor",
    email:    "vendedor@mundomuebles.com",
    rol:      "Vendedor",
    activo:   true,
    password: "PLAIN:MM$Venta2025!",   // se hashea automáticamente en el primer login
    requiereCambio: true,
    creadoEn: new Date().toISOString().slice(0, 10),
  },
  {
    id:       uid(),
    nombre:   "Bodeguero",
    email:    "bodega@mundomuebles.com",
    rol:      "Bodeguero",
    activo:   true,
    password: "PLAIN:MM$Bodeg2025!",   // se hashea automáticamente en el primer login
    requiereCambio: true,
    creadoEn: new Date().toISOString().slice(0, 10),
  },
  // Crear usuarios reales desde el módulo: Sistema → Usuarios → + Nuevo
];

// ── Productos de ejemplo (inventario inicial real) ────────────────────────────
export const INIT_PRODUCTS = [
  {
    id: uid(), nombre:"Base Cama Sencilla", categoria:"Bases de Cama", activo:true,
    variantes:[{ id:uid(), medida:"1.00 m", colores:["Beige","Negro","Gris"], precio:115000, stock:8, kardex:[] },
               { id:uid(), medida:"1.20 m", colores:["Beige","Negro","Gris"], precio:125000, stock:6, kardex:[] }],
  },
  {
    id: uid(), nombre:"Base Cama Semi Doble", categoria:"Bases de Cama", activo:true,
    variantes:[{ id:uid(), medida:"1.40 m", colores:["Beige","Negro","Gris Oscuro"], precio:135000, stock:5, kardex:[] }],
  },
  {
    id: uid(), nombre:"Base Cama Doble Reforzada", categoria:"Bases de Cama", activo:true,
    variantes:[{ id:uid(), medida:"1.60 m", colores:["Beige","Negro","Gris Oscuro","Café"], precio:150000, stock:4, kardex:[] }],
  },
  {
    id: uid(), nombre:"Colchón Sencillo Ortopédico", categoria:"Colchones", activo:true,
    variantes:[{ id:uid(), medida:"1.00 m", colores:[], precio:220000, stock:7, kardex:[] },
               { id:uid(), medida:"1.20 m", colores:[], precio:250000, stock:5, kardex:[] }],
  },
  {
    id: uid(), nombre:"Colchón Semi Ortopédico", categoria:"Colchones", activo:true,
    variantes:[{ id:uid(), medida:"1.20 m", colores:[], precio:280000, stock:6, kardex:[] },
               { id:uid(), medida:"1.40 m", colores:[], precio:320000, stock:4, kardex:[] }],
  },
  {
    id: uid(), nombre:"Colchón Doble Pillow Top", categoria:"Colchones", activo:true,
    variantes:[{ id:uid(), medida:"1.60 m", colores:[], precio:580000, stock:3, kardex:[] },
               { id:uid(), medida:"2.00 m", colores:[], precio:680000, stock:2, kardex:[] }],
  },
  {
    id: uid(), nombre:"Espaldar Sencillo", categoria:"Espaldares", activo:true,
    variantes:[{ id:uid(), medida:"1.00 m", colores:["Beige","Negro","Gris"], precio:145000, stock:6, kardex:[] },
               { id:uid(), medida:"1.20 m", colores:["Beige","Negro","Gris"], precio:165000, stock:5, kardex:[] }],
  },
  {
    id: uid(), nombre:"Espaldar de Lujo", categoria:"Espaldares", activo:true,
    variantes:[{ id:uid(), medida:"1.20 m", colores:["Negro","Gris","Beige","Café"], precio:240000, stock:4, kardex:[] },
               { id:uid(), medida:"1.60 m", colores:["Negro","Gris","Beige","Café"], precio:280000, stock:3, kardex:[] }],
  },
  {
    id: uid(), nombre:"Sala Apartamentera", categoria:"Salas", activo:true,
    variantes:[{ id:uid(), medida:"Estándar", colores:["Gris Claro","Gris Oscuro","Beige","Negro"], precio:620000, stock:3, kardex:[] }],
  },
  {
    id: uid(), nombre:"Sofá Cama", categoria:"Salas", activo:true,
    variantes:[{ id:uid(), medida:"Estándar", colores:["Negro","Gris","Café"], precio:850000, stock:2, kardex:[] }],
  },
  {
    id: uid(), nombre:"Mesa de Noche", categoria:"Accesorios", activo:true,
    variantes:[{ id:uid(), medida:"Estándar", colores:["Beige","Negro","Café","Gris"], precio:118000, stock:10, kardex:[] }],
  },
  {
    id: uid(), nombre:"Colchoneta", categoria:"Colchones", activo:true,
    variantes:[{ id:uid(), medida:"17 cm", colores:[], precio:135000, stock:8, kardex:[] },
               { id:uid(), medida:"20 cm", colores:[], precio:155000, stock:6, kardex:[] }],
  },
];

export const INIT_PROVIDERS = [
  { id:uid(), nombre:"Colchones Paraíso Cauca", nit:"800123456-1", contacto:"Jhon López", telefono:"3124567890", email:"ventas@paradisocauca.com", ciudad:"Popayán", activo:true },
  { id:uid(), nombre:"Muebles del Valle S.A.S", nit:"900234567-2", contacto:"Gloria Muñoz", telefono:"3209876543", email:"compras@mueblesvalle.com", ciudad:"Cali", activo:true },
  { id:uid(), nombre:"Tapizados Cauca", nit:"700345678-3", contacto:"Pedro Gómez", telefono:"3174321098", email:"tapizadoscauca@gmail.com", ciudad:"Popayán", activo:true },
];

export const INIT_CLIENTS = [
  { id:uid(), nombre:"Cliente General", cedula:"", telefono:"", email:"", ciudad:"Popayán", activo:true },
];

export const INIT_PURCHASES = [];
export const INIT_SALES     = [];
export const INIT_GARANTIAS = [];
export const INIT_COTIZACIONES = [];

// ── Datos reales de la empresa ────────────────────────────────────────────────
export const EMPRESA_DEFAULT = {
  nombre:    "Mundo Muebles Popayan",
  subtit:    "Moda en el hogar",
  nit:       "4616882-9",
  telefono:  "316 7145208",
  email:     "mundomueblespopayan1@gmail.com",
  direccion: "Cra 4 # 13-08, Popayan, Cauca",
};
