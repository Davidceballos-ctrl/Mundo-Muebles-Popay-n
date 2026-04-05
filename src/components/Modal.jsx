import Icon from "./Icons.jsx";

export default function Modal({ open, onClose, title, children, footer, wide, maxW }) {
  if (!open) return null;
  return (
    <div className="overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? "wide" : ""}`} style={maxW ? {maxWidth:maxW}:{}}>
        <div className="mh">
          <h2>{title}</h2>
          <button className="btn btn-outline btn-sm btn-icon" onClick={onClose}><Icon n="close"/></button>
        </div>
        <div className="mb">{children}</div>
        {footer && <div className="mf">{footer}</div>}
      </div>
    </div>
  );
}
