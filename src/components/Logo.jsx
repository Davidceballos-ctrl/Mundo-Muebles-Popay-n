/**
 * Logo oficial — Mundo Muebles Popayán
 * Variantes: "full" (horizontal), "icon" (solo MM), "receipt" (para recibo)
 */
export default function Logo({ variant = "full", size = 36, white = false, className = "" }) {
  const primary = white ? "#FFFFFF" : "#003fb1";
  const accent  = white ? "rgba(255,255,255,0.75)" : "#1a56db";
  const muted   = white ? "rgba(255,255,255,0.5)"  : "#64748B";
  const amber   = white ? "#FCD34D" : "#E09A3F";

  if (variant === "icon") {
    return (
      <svg width={size} height={size} viewBox="0 0 44 44" fill="none" className={className}>
        <rect width="44" height="44" rx="10" fill={primary} />
        {/* Dos M estilizadas */}
        <text x="4" y="32" fontFamily="'Playfair Display', Georgia, serif" fontWeight="700"
          fontSize="28" fill="#FFFFFF" letterSpacing="-1">MM</text>
        <rect x="4" y="36" width="36" height="2" rx="1" fill={amber} />
      </svg>
    );
  }

  if (variant === "receipt") {
    // Para recibos: solo texto, sin SVG complejo
    return (
      <svg width={180} height={48} viewBox="0 0 180 48" fill="none" className={className}>
        {/* Las dos M grandes */}
        <text x="2" y="34" fontFamily="Georgia, serif" fontWeight="700" fontSize="34"
          fill={primary} letterSpacing="-2">MM</text>
        {/* Línea dorada */}
        <rect x="2" y="38" width="68" height="2.5" rx="1" fill={amber} />
        {/* Texto derecha */}
        <text x="78" y="22" fontFamily="Georgia, serif" fontWeight="700" fontSize="13"
          fill={primary}>Mundo Muebles</text>
        <text x="78" y="36" fontFamily="Arial, sans-serif" fontSize="9.5"
          fill={muted}>Moda en el hogar</text>
        <text x="78" y="46" fontFamily="Arial, sans-serif" fontSize="8"
          fill={muted}>Popayán, Cauca</text>
      </svg>
    );
  }

  // variant === "full" — logo horizontal completo
  return (
    <div className={`mm-logo ${className}`} style={{ display: "flex", alignItems: "center", gap: size * 0.28 }}>
      {/* Bloque MM */}
      <div style={{
        background: white ? "rgba(255,255,255,0.18)" : primary,
        borderRadius: size * 0.22,
        width:  size * 1.1,
        height: size * 1.1,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
        position: "relative",
        border: white ? "1.5px solid rgba(255,255,255,0.3)" : "none",
      }}>
        <span style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize:   size * 0.62,
          color:      "#fff",
          letterSpacing: "-1px",
          lineHeight: 1,
        }}>MM</span>
        {/* Línea dorada debajo de las M */}
        <div style={{
          position: "absolute", bottom: size * 0.07,
          left: size * 0.1, right: size * 0.1,
          height: 2, borderRadius: 1,
          background: amber,
        }} />
      </div>

      {/* Texto */}
      <div style={{ lineHeight: 1 }}>
        <div style={{
          fontFamily: "'Playfair Display', Georgia, serif",
          fontWeight: 700,
          fontSize:   size * 0.44,
          color:      white ? "#FFFFFF" : primary,
          letterSpacing: "-.3px",
          lineHeight: 1.1,
        }}>Mundo Muebles</div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize:   size * 0.26,
          color:      white ? "rgba(255,255,255,.55)" : muted,
          letterSpacing: ".05em",
          textTransform: "uppercase",
          marginTop: 2,
        }}>Moda en el hogar</div>
      </div>
    </div>
  );
}
