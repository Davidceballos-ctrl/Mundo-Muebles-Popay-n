import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],

  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Recharts — heavy charting library
          if (id.includes("node_modules/recharts") ||
              id.includes("node_modules/d3")       ||
              id.includes("node_modules/victory")) {
            return "vendor-charts";
          }
          // PDF
          if (id.includes("node_modules/jspdf") ||
              id.includes("node_modules/html2canvas")) {
            return "vendor-pdf";
          }
          // Excel (write-excel-file — liviano, ~126KB)
          if (id.includes("node_modules/write-excel-file")) {
            return "vendor-excel";
          }
          // React core — siempre en caché después del primer visit
          if (id.includes("node_modules/react")             ||
              id.includes("node_modules/react-dom")         ||
              id.includes("node_modules/react-router-dom")  ||
              id.includes("node_modules/scheduler")) {
            return "vendor-react";
          }
          // Todo lo demás de node_modules va junto
          if (id.includes("node_modules")) {
            return "vendor-misc";
          }
          // Tu código de app va en index
        },
      },
    },
    chunkSizeWarningLimit: 500,
    minify:    "esbuild",
    sourcemap: false,
    // Eliminar console.log en producción
    esbuild: { drop: ["console", "debugger"] },
  },

  test: {
    globals:    true,
    environment:"jsdom",
    setupFiles: "./tests/setup.js",
  },

  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "recharts", "dayjs"],
  },
});
