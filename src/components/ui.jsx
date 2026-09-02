import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Tracked } from "./Tracked.jsx";

export function Page({ children, style }) {
  return <div style={{ padding: "24px 28px 40px 28px", ...style }}>{children}</div>;
}

export function Card({ children, style }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18, ...style }}>
      {children}
    </div>
  );
}

export function SectionTitle({ children, action }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
      <div style={{ fontSize: 13, fontWeight: 600 }}>{children}</div>
      {action && <div style={{ fontSize: 12, color: "#8A929E" }}>{action}</div>}
    </div>
  );
}

export function Badge({ children, bg, fg }) {
  return (
    <span
      style={{
        display: "inline-block",
        padding: "3px 9px",
        borderRadius: 20,
        fontSize: 11.5,
        fontWeight: 500,
        background: bg,
        color: fg,
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({ children, style, tag, data, onClick, ...rest }) {
  const { escritorio } = useApp();
  return (
    <Tracked
      as="div"
      tag={tag ?? "acao"}
      data={data}
      onClick={onClick}
      className="ol-btn-primary"
      style={{
        padding: "10px 15px",
        borderRadius: 7,
        background: escritorio.corPrimaria,
        color: "#fff",
        fontSize: 13,
        fontWeight: 500,
        cursor: "pointer",
        textAlign: "center",
        display: "inline-block",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tracked>
  );
}

export function SecondaryButton({ children, style, tag, data, onClick, ...rest }) {
  return (
    <Tracked
      as="div"
      tag={tag ?? "acao"}
      data={data}
      onClick={onClick}
      className="ol-btn-secondary"
      style={{
        padding: "9px 14px",
        border: "1px solid #DDE1E7",
        borderRadius: 7,
        fontSize: 12.5,
        cursor: "pointer",
        textAlign: "center",
        display: "inline-block",
        color: "#3C4453",
        ...style,
      }}
      {...rest}
    >
      {children}
    </Tracked>
  );
}

export function Field({ label, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11.5, color: "#6B7480", letterSpacing: ".03em", textTransform: "uppercase" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11.5, color: "#98A0AC" }}>{hint}</span>}
    </label>
  );
}

export const inputStyle = {
  padding: "9px 11px",
  border: "1px solid #DDE1E7",
  borderRadius: 6,
  background: "#fff",
  outline: "none",
  fontSize: 13.5,
  width: "100%",
};

export function Table({ cols, children }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, overflowX: "auto" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: cols,
          gap: 12,
          padding: "11px 18px",
          background: "#FAFBFC",
          borderBottom: "1px solid #E4E7EC",
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function Th({ children, right }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: "#8A929E",
        letterSpacing: ".05em",
        textTransform: "uppercase",
        textAlign: right ? "right" : "left",
      }}
    >
      {children}
    </div>
  );
}

export function Row({ cols, onClick, children, style }) {
  return (
    <div
      className={onClick ? "ol-row" : undefined}
      onClick={onClick}
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: 12,
        padding: "14px 18px",
        borderBottom: "1px solid #EEF0F3",
        alignItems: "center",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function EmptyState({ title, hint, action }) {
  return (
    <div
      style={{
        border: "1px dashed #DDE1E7",
        borderRadius: 8,
        padding: "32px 20px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 13.5, fontWeight: 500, color: "#3C4453" }}>{title}</div>
      {hint && <div style={{ fontSize: 12.5, color: "#8A929E", maxWidth: 340 }}>{hint}</div>}
      {action}
    </div>
  );
}

export function Toggle({ checked, onChange, tag, data }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
      <input type="checkbox" data-track={tag} data-testid={tag} checked={checked} onChange={onChange} />
    </label>
  );
}

export function usePagination(items, pageSize = 5) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const clampedPage = Math.min(page, totalPages);
  const pageItems = items.slice((clampedPage - 1) * pageSize, clampedPage * pageSize);
  return { page: clampedPage, totalPages, setPage, pageItems };
}

export function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px 0" }}>
      <PageBtn tag="pagina_anterior" disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹
      </PageBtn>
      <span style={{ fontSize: 12.5, color: "#6B7480", padding: "0 8px" }}>
        Página {page} de {totalPages}
      </span>
      <PageBtn tag="pagina_proxima" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        ›
      </PageBtn>
    </div>
  );
}

function PageBtn({ children, disabled, onClick, tag }) {
  return (
    <Tracked
      as="div"
      tag={tag}
      onClick={disabled ? undefined : onClick}
      style={{
        width: 28,
        height: 28,
        borderRadius: 6,
        border: "1px solid #DDE1E7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
        fontSize: 14,
      }}
    >
      {children}
    </Tracked>
  );
}

export function Spinner({ size = 16 }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: size,
        height: size,
        border: "2px solid #DDE1E7",
        borderTopColor: "#0A4D9E",
        borderRadius: "50%",
        animation: "ol-spin 0.7s linear infinite",
      }}
    />
  );
}
