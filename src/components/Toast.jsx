import Icon from "./Icons.jsx";
import { useApp } from "../context/AppContext.jsx";

export default function Toast() {
  const { toasts } = useApp();
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 400, display: "flex", flexDirection: "column", gap: 8 }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.ok ? "rgba(5,150,105,.95)" : "rgba(186,26,26,.95)",
          backdropFilter: "blur(8px)",
          color: "#fff",
          padding: "12px 18px",
          borderRadius: 16,
          fontSize: ".85rem",
          fontFamily: "'Inter', sans-serif", fontWeight: 500,
          display: "flex", alignItems: "center", gap: 10,
          boxShadow: t.ok ? "0 8px 24px rgba(5,150,105,.25)" : "0 8px 24px rgba(186,26,26,.25)",
          minWidth: 240,
          animation: "tIn .3s cubic-bezier(.34,1.56,.64,1)",
          border: `1px solid ${t.ok ? "rgba(255,255,255,.15)" : "rgba(255,255,255,.12)"}`,
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: 8,
            background: "rgba(255,255,255,.18)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon n={t.ok ? "check" : "alert"} s={14} />
          </div>
          {t.msg}
        </div>
      ))}
      <style>{`@keyframes tIn{from{transform:translateX(100%) scale(.9);opacity:0}to{transform:translateX(0) scale(1);opacity:1}}`}</style>
    </div>
  );
}
