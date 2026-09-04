import { useState } from "react";
import { useApp } from "../context/AppContext.jsx";
import { Tracked } from "./Tracked.jsx";
import { rotuloStatus } from "../lib/vocabulario.js";

export function Page({ children, style }) {
  return (
    <div className="ol-page" style={style}>
      {children}
    </div>
  );
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

export function Badge({ children, bg, fg, title }) {
  return (
    <span
      title={title}
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

// ── Estado vazio que ensina (Parte 0.4) — várias ações ranqueadas, a
// primeira vira PrimaryButton, o resto SecondaryButton. EmptyState (acima)
// continua existindo pros casos de uma ação só; use este quando fizer
// sentido oferecer mais de um caminho.
export function EstadoVazio({ titulo, explicacao, acoes = [] }) {
  return (
    <div style={{ padding: "48px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
      <div style={{ fontSize: 15, fontWeight: 600, color: "#101828" }}>{titulo}</div>
      {explicacao && <div style={{ fontSize: 13.5, color: "#6B7480", maxWidth: 380, lineHeight: 1.6 }}>{explicacao}</div>}
      {acoes.length > 0 && (
        <div style={{ display: "flex", gap: 10, marginTop: 8, flexWrap: "wrap", justifyContent: "center" }}>
          {acoes.map((a, i) =>
            i === 0 ? (
              <PrimaryButton key={i} tag={a.tag} onClick={a.onClick}>
                {a.rotulo}
              </PrimaryButton>
            ) : (
              <SecondaryButton key={i} tag={a.tag} onClick={a.onClick}>
                {a.rotulo}
              </SecondaryButton>
            ),
          )}
        </div>
      )}
    </div>
  );
}

// ── Linha "onde estamos e o que fazer agora" (Parte 0.6) ──
export function ProximoPasso({ agora, desde, acao }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#F5F8FF", border: "1px solid #D6E4FF", borderRadius: 8, marginBottom: 18, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: "#0A4D9E" }}>{agora}</div>
        {desde && <div style={{ fontSize: 12, color: "#6B7480", marginTop: 2 }}>{desde}</div>}
      </div>
      {acao && (
        <PrimaryButton tag={acao.tag} onClick={acao.onClick}>
          {acao.rotulo}
        </PrimaryButton>
      )}
    </div>
  );
}

// ── Erro amigável: o quê, por quê, o que fazer (Parte 0.10) ──
export function Erro({ titulo, motivo, acoes = [] }) {
  return (
    <div style={{ padding: "14px 16px", background: "#FEF3F2", border: "1px solid #FDA29B", borderRadius: 8, display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ fontSize: 13.5, fontWeight: 600, color: "#B42318" }}>{titulo}</div>
      {motivo && <div style={{ fontSize: 13, color: "#912018", lineHeight: 1.5 }}>{motivo}</div>}
      {acoes.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {acoes.map((a, i) => (
            <SecondaryButton key={i} tag={a.tag} onClick={a.onClick}>
              {a.rotulo}
            </SecondaryButton>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeleton em vez de tela em branco (Parte 0.9) ──
export function Carregando({ linhas = 3 }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {Array.from({ length: linhas }, (_, i) => (
        <div key={i} style={{ height: 56, background: "#F2F4F7", borderRadius: 8, animation: "ol-pulso 1.4s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
      ))}
    </div>
  );
}

// ── Badge de status usando o vocabulário (src/lib/vocabulario.js) ──
const CORES_STATUS = {
  neutro: { bg: "#F2F4F7", fg: "#475467" },
  info: { bg: "#EFF8FF", fg: "#175CD3" },
  sucesso: { bg: "#ECFDF3", fg: "#027A48" },
  atencao: { bg: "#FFFAEB", fg: "#B54708" },
  erro: { bg: "#FEF3F2", fg: "#B42318" },
};

export function StatusBadge({ entidade, status }) {
  const { label, cor, ajuda } = rotuloStatus(entidade, status);
  const c = CORES_STATUS[cor] || CORES_STATUS.neutro;
  return (
    <Badge bg={c.bg} fg={c.fg} title={ajuda}>
      {label}
    </Badge>
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
