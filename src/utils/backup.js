// ─── Respaldo completo del sistema ────────────────────────────────────────────
// Exporta todo el localStorage a un archivo JSON descargable.
// Importa ese mismo archivo para restaurar todos los datos.

const KEYS = ["products","providers","clients","purchases","users","sales"];

export function exportBackup() {
  const data = {};
  KEYS.forEach(k => {
    const raw = localStorage.getItem("mm_" + k);
    if (raw) data[k] = JSON.parse(raw);
  });
  data.__exported = new Date().toISOString();
  data.__version  = "4.0";

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `MundoMuebles_Respaldo_${new Date().toLocaleDateString("es-CO").replace(/\//g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        KEYS.forEach(k => {
          if (data[k]) localStorage.setItem("mm_" + k, JSON.stringify(data[k]));
        });
        resolve(data.__exported || "desconocida");
      } catch (err) {
        reject(new Error("Archivo de respaldo inválido"));
      }
    };
    reader.onerror = () => reject(new Error("Error al leer el archivo"));
    reader.readAsText(file);
  });
}
