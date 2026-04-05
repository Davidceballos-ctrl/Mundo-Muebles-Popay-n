export const fmt = n => new Intl.NumberFormat("es-CO",{style:"currency",currency:"COP",maximumFractionDigits:0}).format(n||0);
export const fmtN = n => new Intl.NumberFormat("es-CO").format(n||0);
export const today = () => new Date().toISOString().slice(0,10);
export const fmtDate = d => d ? new Date(d+'T00:00:00').toLocaleDateString("es-CO",{day:"2-digit",month:"short",year:"numeric"}) : "";
