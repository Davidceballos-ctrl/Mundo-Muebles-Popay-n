import Icon from "./Icons.jsx";

export default function Confirm({ open, title, msg, onConfirm, onCancel, danger = true }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onCancel()}>
      <div style={{
        background: "#fff", borderRadius: 20, width: "100%", maxWidth: 400,
        padding: "28px 28px 24px",
        boxShadow: "0 25px 50px rgba(25,28,30,.18)",
        animation: "sUp .22s cubic-bezier(.34,1.56,.64,1)",
      }}>
        <div style={{
          width: 52, height: 52, borderRadius: 14,
          background: danger ? "#ffdad6" : "#dbeafe",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: danger ? "#ba1a1a" : "#1d4ed8", marginBottom: 18,
        }}>
          <Icon n={danger ? "warning" : "alert"} s={24} />
        </div>
        <h2 style={{ fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: "1.15rem", color: "#0f172a", marginBottom: 10 }}>
          {title || "¿Confirmar acción?"}
        </h2>
        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: ".875rem", color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
          {msg || "Esta acción no se puede deshacer."}
        </p>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            height: 40, padding: "0 18px", background: "#f3f4f6", color: "#374151",
            border: "none", borderRadius: 999, fontFamily: "'Inter', sans-serif",
            fontWeight: 600, fontSize: ".84rem", cursor: "pointer", transition: "all .15s",
          }}
            onMouseOver={e => e.currentTarget.style.background = "#e2e8f0"}
            onMouseOut={e => e.currentTarget.style.background = "#f3f4f6"}>
            Cancelar
          </button>
          <button onClick={onConfirm} style={{
            height: 40, padding: "0 18px",
            background: danger ? "linear-gradient(135deg,#ba1a1a,#dc2626)" : "linear-gradient(135deg,#003fb1,#1a56db)",
            color: "#fff", border: "none", borderRadius: 999,
            fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: ".84rem",
            cursor: "pointer",
            boxShadow: danger ? "0 4px 14px rgba(186,26,26,.28)" : "0 4px 14px rgba(0,63,177,.28)",
            transition: "all .15s",
          }}
            onMouseOver={e => e.currentTarget.style.transform = "scale(1.02)"}
            onMouseOut={e => e.currentTarget.style.transform = "scale(1)"}>
            {danger ? "Eliminar" : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}
