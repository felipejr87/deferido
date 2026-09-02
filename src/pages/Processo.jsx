import { useNavigate } from "react-router-dom";
import { PSTATUS, EVENTOS } from "../data/mock.js";
import { useApp } from "../context/AppContext.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { useIsMobile } from "../hooks/useIsMobile.js";

const PROC_BASE = {
  numero: "#0087",
  cliente: "Ricardo Menezes",
  servico: "Abertura ME / LTDA",
  resp: "Camila Duarte",
  prazo: "12 set 2026",
  parado: "Sem movimentação há 6 dias",
};

export default function Processo() {
  const navigate = useNavigate();
  const { escritorio, etapasOk, toggleEtapa, docsOk, toggleDoc, ETAPAS, DOCS, processoDemo } = useApp();
  const PROC = { ...PROC_BASE, ...processoDemo };
  const isMobile = useIsMobile();

  const st = PSTATUS[PROC.status];
  const progresso = Math.round((etapasOk.length / ETAPAS.length) * 100) + "%";

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) 356px", alignItems: "start", minHeight: "100%" }}>
      <div style={{ minWidth: 0, padding: isMobile ? "16px 16px 24px 16px" : "24px 28px 40px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <div style={{ fontSize: 16, fontWeight: 600 }}>{PROC.cliente}</div>
              <div style={{ fontSize: 12.5, color: "#8A929E" }}>{PROC.servico} · proposta #0145 aceita</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ display: "inline-block", padding: "5px 11px", borderRadius: 20, fontSize: 12, fontWeight: 500, background: st.bg, color: st.fg }}>
                {st.label}
              </span>
              <span style={{ fontSize: 12, color: "#A33F36" }}>{PROC.parado}</span>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14, paddingTop: 14, borderTop: "1px solid #EEF0F3" }}>
            <Info label="Órgão" value={PROC.orgao} />
            <Info label="Protocolo" value={PROC.protocolo} mono />
            <Info label="Responsável" value={PROC.resp} />
            <Info label="Prazo estimado" value={PROC.prazo} mono />
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Etapas</div>
            <div style={{ fontSize: 12, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>
              {etapasOk.length} de {ETAPAS.length} etapas concluídas
            </div>
          </div>
          <div style={{ height: 4, borderRadius: 3, background: "#EDEFF3", overflow: "hidden", marginBottom: 14 }}>
            <div style={{ height: "100%", background: escritorio.corPrimaria, width: progresso }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {ETAPAS.map((e, idx) => {
              const ok = etapasOk.includes(e.id);
              const atual = !ok && etapasOk.length === idx;
              return (
                <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
                  <Tracked
                    as="div"
                    tag="etapa_toggle"
                    data={{ etapa_id: e.id }}
                    onClick={() => toggleEtapa(e.id)}
                    style={{
                      width: 20,
                      height: 20,
                      flex: "0 0 20px",
                      borderRadius: 5,
                      border: `1.5px solid ${ok ? "#1F6F4C" : atual ? escritorio.corPrimaria : "#DDE1E7"}`,
                      background: ok ? "#1F6F4C" : "#FFFFFF",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {ok ? "✓" : ""}
                  </Tracked>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 13.5, color: ok ? "#6B7480" : "#14181F", textDecoration: ok ? "line-through" : "none" }}>
                        {e.nome}
                      </span>
                      {atual && (
                        <span style={{ fontSize: 10.5, letterSpacing: ".04em", textTransform: "uppercase", color: escritorio.corPrimaria }}>
                          etapa atual
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: "#8A929E" }}>
                      {e.resp} · prazo {e.prazo}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#B4BBC4", fontVariantNumeric: "tabular-nums" }}>{idx + 1}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Checklist de documentos</div>
            <div style={{ fontSize: 12, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>
              {docsOk.length} de {DOCS.length} documentos recebidos
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {DOCS.map((d) => {
              const ok = docsOk.includes(d.id);
              return (
                <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
                  <Tracked
                    as="div"
                    tag="documento_toggle"
                    data={{ doc_id: d.id }}
                    onClick={() => toggleDoc(d.id)}
                    style={{
                      width: 20,
                      height: 20,
                      flex: "0 0 20px",
                      borderRadius: 5,
                      border: `1.5px solid ${ok ? "#1F6F4C" : "#DDE1E7"}`,
                      background: ok ? "#1F6F4C" : "#FFFFFF",
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      cursor: "pointer",
                    }}
                  >
                    {ok ? "✓" : ""}
                  </Tracked>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ fontSize: 13.5 }}>{d.nome}</div>
                    <div style={{ fontSize: 11.5, color: "#98A0AC" }}>{d.obrigatorio ? "obrigatório" : "opcional"}</div>
                  </div>
                  <span
                    style={{
                      display: "inline-block",
                      padding: "3px 9px",
                      borderRadius: 20,
                      fontSize: 11.5,
                      fontWeight: 500,
                      background: ok ? "#EAF6EE" : "#FDF3E3",
                      color: ok ? "#1F6F4C" : "#8A5A0B",
                    }}
                  >
                    {ok ? "Recebido" : "Falta enviar"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          borderLeft: isMobile ? "none" : "1px solid #E4E7EC",
          borderTop: isMobile ? "1px solid #E4E7EC" : "none",
          background: "#fff",
          padding: isMobile ? "20px 16px 32px 16px" : "24px 24px 40px 24px",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600 }}>Linha do tempo</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {[...EVENTOS].reverse().map((ev, idx) => (
            <div key={idx} style={{ display: "flex", gap: 11, paddingBottom: 16 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: "0 0 9px" }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: escritorio.corPrimaria, marginTop: 5 }} />
                <div style={{ flex: 1, width: 1, background: "#E4E7EC" }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{ev.tipo}</div>
                <div style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.5 }}>{ev.desc}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 11.5, color: "#98A0AC", fontVariantNumeric: "tabular-nums" }}>{ev.data}</span>
                  <span style={{ fontSize: 11, color: ev.cliente ? "#8A929E" : "#A33F36" }}>
                    {ev.cliente ? "visível ao cliente" : "interno"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto", paddingTop: 8 }}>
          <Tracked
            as="div"
            tag="enviar_link_acompanhamento"
            className="ol-btn-primary"
            onClick={() => navigate("/processos/0087/portal")}
            style={{ padding: 11, borderRadius: 7, background: escritorio.corPrimaria, color: "#fff", textAlign: "center", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
          >
            Enviar link de acompanhamento
          </Tracked>
          <Tracked
            as="div"
            tag="registrar_evento"
            className="ol-btn-secondary"
            onClick={() => track("processo_registrar_evento", { numero: PROC.numero })}
            style={{ padding: 10, border: "1px solid #DDE1E7", borderRadius: 7, textAlign: "center", fontSize: 12.5, cursor: "pointer" }}
          >
            Registrar evento
          </Tracked>
        </div>
      </div>
    </div>
  );
}

function Info({ label, value, mono }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 11, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 13, fontVariantNumeric: mono ? "tabular-nums" : "normal" }}>{value}</div>
    </div>
  );
}
