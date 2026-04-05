# Guía de Despliegue — Mundo Muebles Popayán
## De localhost a producción real

---

## PASO 0 — Ejecutar en tu PC antes de todo

```bash
# Desde la carpeta del proyecto:
npm install
npm run build
npm run preview
```
Abre http://localhost:4173 y prueba: login, crear venta, exportar Excel.
Si funciona aquí, funcionará en producción. No sigas si hay errores.

---

## PASO 1 — Crear el archivo .env.local

En la raíz del proyecto (mismo nivel que package.json), crea el archivo `.env.local`:

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_APP_SALT=MundoMueblesPopayan2025#Sec
```

Dónde encontrar estos valores:
- Entra a supabase.com → tu proyecto → Settings → API
- "Project URL" → VITE_SUPABASE_URL
- "anon public" key → VITE_SUPABASE_KEY
- VITE_APP_SALT: invéntalo tú, cualquier frase larga y única

⚠️ NUNCA subas este archivo a GitHub. Ya está en .gitignore.

---

## PASO 2 — Supabase: crear tablas y activar seguridad

Ve a supabase.com → tu proyecto → SQL Editor → New query.
Pega y ejecuta este SQL completo:

```sql
-- Crear tablas
CREATE TABLE IF NOT EXISTS mm_products     (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS mm_sales        (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS mm_clients      (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS mm_purchases    (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS mm_garantias    (id TEXT PRIMARY KEY, data JSONB);
CREATE TABLE IF NOT EXISTS mm_cotizaciones (id TEXT PRIMARY KEY, data JSONB);

-- Activar Row Level Security (RLS)
ALTER TABLE mm_products     ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_sales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_clients      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_purchases    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_garantias    ENABLE ROW LEVEL SECURITY;
ALTER TABLE mm_cotizaciones ENABLE ROW LEVEL SECURITY;

-- Política: solo la anon key puede leer/escribir
CREATE POLICY "acceso_app" ON mm_products     FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "acceso_app" ON mm_sales        FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "acceso_app" ON mm_clients      FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "acceso_app" ON mm_purchases    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "acceso_app" ON mm_garantias    FOR ALL TO anon USING (true) WITH CHECK (true);
CREATE POLICY "acceso_app" ON mm_cotizaciones FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

## PASO 3 — Subir a GitHub

### 3.1 Crear cuenta en github.com (gratis)

### 3.2 Crear repositorio
- Botón "New repository"
- Nombre: `mundo-muebles`
- Visibilidad: **Private** (importante — código privado)
- Sin README, sin .gitignore (ya los tienes)

### 3.3 Subir el código
Abre la terminal en la carpeta del proyecto:

```bash
git init
git add .
git commit -m "v8.1.3 - listo para produccion"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/mundo-muebles.git
git push -u origin main
```

Si pide usuario/contraseña:
- Usuario: tu email de GitHub
- Contraseña: genera un token en GitHub → Settings → Developer Settings
  → Personal Access Tokens → Tokens (classic) → Generate new token
  (marca: repo, workflow) → copia el token y úsalo como contraseña

---

## PASO 4 — Desplegar en Vercel

### 4.1 Crear cuenta en vercel.com
Usa "Continue with GitHub" para conectar directamente.

### 4.2 Importar el proyecto
- Dashboard → "Add New" → "Project"
- Selecciona el repositorio `mundo-muebles`
- Vercel detecta automáticamente que es Vite

### 4.3 Agregar variables de entorno (CRÍTICO)
Antes de hacer clic en Deploy, en la sección "Environment Variables":

| Key                  | Value                              |
|----------------------|------------------------------------|
| VITE_SUPABASE_URL    | https://tu-proyecto.supabase.co    |
| VITE_SUPABASE_KEY    | eyJ... (tu anon key)               |
| VITE_APP_SALT        | MundoMueblesPopayan2025#Sec        |

### 4.4 Deploy
Haz clic en "Deploy". En 2 minutos tendrás una URL como:
`https://mundo-muebles-abc123.vercel.app`

### 4.5 Agregar el dominio de Vercel a Supabase
Supabase → Settings → API → "Allowed origins":
Agrega: `https://mundo-muebles-abc123.vercel.app`

---

## PASO 5 — Prueba completa desde celular

Abre la URL de Vercel desde tu celular (red diferente a tu casa):
1. Login con gerencia@mundomuebles.com / MM$Admin2025!
2. Crea una venta
3. Verifica en Supabase → Table Editor → mm_sales que aparece el registro
4. Abre en otro dispositivo — los datos deben estar sincronizados

Si todo funciona: el sistema está en producción.

---

## PASO 6 — Crear usuarios reales y eliminar los de prueba

⚠️ Hacer ANTES de darle la URL a los empleados:

1. Entra al sistema como Administrador
2. Ve a Sistema → Usuarios
3. Crea los usuarios reales:
   - Nombre real del dueño / gerente → Administrador
   - Nombre de cada vendedor → Vendedor
   - Nombre del bodeguero → Bodeguero
4. Para cada usuario: contraseña de mínimo 12 caracteres
   Ejemplo seguro: `Popayan2025#Muebles`
5. Elimina o desactiva las cuentas iniciales (gerencia@, vendedor@, bodega@)
6. Cada empleado entra con su propio usuario desde el primer día

---

## PASO 7 — Dominio propio (opcional, recomendado)

Una URL como `sistema.mundomuebles.com` da mucho más profesionalismo.

### 7.1 Comprar dominio
- porkbun.com → busca `mundomueblesPopayan.com` o similar (~$8-12 USD/año)
- Elige `.com` o `.co` (más reconocidos en Colombia)

### 7.2 Conectar a Vercel
- Vercel → tu proyecto → Settings → Domains
- "Add Domain" → escribe tu dominio
- Vercel te da 2 registros DNS

### 7.3 Configurar DNS en Porkbun
- Porkbun → Domain Management → DNS
- Agrega los 2 registros que te dio Vercel (tipo A y CNAME)
- En 10-30 minutos el dominio queda activo con HTTPS automático

---

## PASO 8 — Actualizaciones futuras

Cada vez que hagas cambios al código:

```bash
git add .
git commit -m "descripcion del cambio"
git push
```

Vercel detecta el push automáticamente y redespliega en ~2 minutos.
La URL no cambia. Los datos en Supabase se mantienen intactos.

---

## Resumen de costos

| Servicio          | Plan     | Costo           |
|-------------------|----------|-----------------|
| Vercel            | Hobby    | $0 / mes        |
| Supabase          | Free     | $0 / mes        |
| GitHub            | Free     | $0 / mes        |
| Dominio .com      | Porkbun  | ~$8 USD / año   |
| **TOTAL mínimo**  |          | **$0 / mes**    |
| **Con dominio**   |          | **~$8 USD/año** |

El sistema puede operar completamente gratis.
El dominio propio es opcional pero recomendado para un negocio real.

---

## Checklist final antes de dar la URL a los empleados

```
✅ npm run build  sin errores
✅ .env.local creado con credenciales reales de Supabase
✅ Tablas SQL creadas en Supabase con RLS activado
✅ Código subido a GitHub (repositorio privado)
✅ Proyecto desplegado en Vercel
✅ Variables de entorno configuradas en Vercel
✅ URL probada desde celular (red diferente)
✅ Datos sincronizados en Supabase verificados
✅ Usuarios reales creados
✅ Cuentas de prueba eliminadas
✅ Cada empleado probó su login
✅ Respaldo inicial exportado (JSON) guardado en lugar seguro
```

---

*Mundo Muebles Popayán · Sistema de Gestión v8.1.3*
