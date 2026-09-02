import { useState } from "react";
import { EVENTOS, PROPOSTAS, PSTATUS, brl } from "../data/mock.js";
import { ARQUIVOS_DEMO, MATRICULA_DEMO, OBRIGACOES } from "../data/blocoB.js";
import { useApp } from "../context/AppContext.jsx";
import { useFeature } from "../context/FeatureContext.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

const PROC_BASE = {
  numero: "#0087",
  servico: "Abertura ME / LTDA",
  prazo: "12 set 2026",
};

const TOKEN = "9f2e7ab1c04d6ee3";

const TABS = [
  { key: "processo", label: "Processo" },
  { key: "documentos", label: "Documentos" },
  { key: "propostas", label: "Propostas" },
  { key: "cobrancas", label: "Cobranças" },
  { key: "cursos", label: "Cursos" },
  { key: "obrigacoes", label: "Obrigações" },
];

export default function PortalCliente() {
  const { escritorio, etapasOk, docsOk, ETAPAS, DOCS, processoDemo } = useApp();
  const [aba, setAba] = useState("processo");
  const fase4 = useFeature("fase4_financeiro");
  const PROC = { ...PROC_BASE, ...processoDemo, statusLabel: PSTATUS[processoDemo.status]?.label ?? processoDemo.status };

  const progresso = Math.round((etapasOk.length / ETAPAS.length) * 100) + "%";
  const docsPendentes = DOCS.filter((d) => !docsOk.includes(d.id));
  const temPendentes = docsPendentes.length > 0;
  const eventosCliente = EVENTOS.filter((e) => e.cliente).slice().reverse();

  return (
    <div style={{ minHeight: "100%", background: "#0E1420", padding: "32px 20px 48px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
      <div style={{ fontSize: 12, color: "#78849A", textAlign: "center", fontVariantNumeric: "tabular-nums" }}>
        open-legaliza.app/acompanhar/{TOKEN}
      </div>
      <div style={{ width: 390, maxWidth: "100%", background: "#fff", borderRadius: 14, overflow: "hidden", boxShadow: "0 20px 50px rgba(0,0,0,.35)" }}>
        <div style={{ background: escritorio.corPrimaria, padding: "18px 20px 0 20px", color: "#fff", display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div style={{ width: 26, height: 26, borderRadius: 5, background: "rgba(255,255,255,.18)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700 }}>
              OL
            </div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{escritorio.nome}</div>
          </div>
          <div style={{ display: "flex", gap: 4, overflowX: "auto", paddingBottom: 10 }}>
            {TABS.map((t) => (
              <Tracked
                key={t.key}
                as="div"
                tag="portal_aba"
                data={{ aba: t.key }}
                onClick={() => setAba(t.key)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 20,
                  fontSize: 11.5,
                  whiteSpace: "nowrap",
                  cursor: "pointer",
                  background: aba === t.key ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.14)",
                  color: aba === t.key ? "#14181F" : "#fff",
                }}
              >
                {t.label}
              </Tracked>
            ))}
          </div>
        </div>

        {aba === "processo" && (
          <>
            <div style={{ padding: "16px 20px 0 20px", display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ fontSize: 11, color: "#8A929E", letterSpacing: ".06em", textTransform: "uppercase" }}>Processo {PROC.numero}</div>
              <div style={{ fontSize: 17, fontWeight: 600 }}>{PROC.servico}</div>
              <div style={{ fontSize: 12.5, color: "#8A929E" }}>
                {PROC.statusLabel} · {PROC.orgao}
              </div>
              <div style={{ height: 5, borderRadius: 3, background: "#EDEFF3", overflow: "hidden", marginTop: 4 }}>
                <div style={{ height: "100%", background: escritorio.corPrimaria, width: progresso }} />
              </div>
              <div style={{ fontSize: 11.5, color: "#98A0AC", fontVariantNumeric: "tabular-nums" }}>
                {etapasOk.length} de {ETAPAS.length} etapas concluídas · previsão {PROC.prazo}
              </div>
            </div>

            {temPendentes ? (
              <div style={{ margin: "18px 20px 0 20px", border: "1px solid #F0DFC0", background: "#FDF9F1", borderRadius: 10, padding: 15, display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#8A5A0B" }}>Falta você enviar</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {docsPendentes.map((d) => (
                    <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 16, height: 16, flex: "0 0 16px", borderRadius: 4, border: "1.5px solid #D9C69B" }} />
                      <div style={{ fontSize: 13.5, color: "#3C4453" }}>{d.nome}</div>
                    </div>
                  ))}
                </div>
                <Tracked as="div" tag="portal_enviar_documentos" onClick={() => setAba("documentos")} className="ol-btn-primary" style={{ marginTop: 2, padding: 13, borderRadius: 8, background: escritorio.corPrimaria, color: "#fff", textAlign: "center", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>
                  Enviar documentos
                </Tracked>
              </div>
            ) : (
              <div style={{ margin: "18px 20px 0 20px", border: "1px solid #CFE3D6", background: "#F4FAF6", borderRadius: 10, padding: 15, display: "flex", flexDirection: "column", gap: 5 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1F6F4C" }}>Documentação completa</div>
                <div style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.5 }}>Nada pendente do seu lado. Seguimos com o órgão e avisamos a cada movimentação.</div>
              </div>
            )}

            <div style={{ padding: "18px 20px 22px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Andamento</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                {eventosCliente.map((ev, idx) => (
                  <div key={idx} style={{ display: "flex", gap: 11, paddingBottom: 15 }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flex: "0 0 9px" }}>
                      <div style={{ width: 9, height: 9, borderRadius: "50%", background: escritorio.corPrimaria, marginTop: 5 }} />
                      <div style={{ flex: 1, width: 1, background: "#E4E7EC" }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>{ev.tipo}</div>
                      <div style={{ fontSize: 12.5, color: "#4B5563", lineHeight: 1.5 }}>{ev.desc}</div>
                      <div style={{ fontSize: 11.5, color: "#98A0AC", fontVariantNumeric: "tabular-nums" }}>{ev.data}</div>
                    </div>
                  </div>
                ))}
              </div>
              <Tracked as="div" tag="portal_falar_whatsapp" onClick={() => track("portal_falar_whatsapp", { numero: PROC.numero })} className="ol-btn-secondary" style={{ padding: 12, border: "1px solid #DDE1E7", borderRadius: 8, textAlign: "center", fontSize: 13.5, cursor: "pointer" }}>
                Falar no WhatsApp
              </Tracked>
            </div>
          </>
        )}

        {aba === "documentos" && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Seus documentos</div>
            {ARQUIVOS_DEMO.map((a) => (
              <div key={a.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #EEF0F3", paddingBottom: 8 }}>
                <span>{a.nome}</span>
                <span style={{ color: "#98A0AC", fontSize: 12 }}>{a.tamanho}</span>
              </div>
            ))}
            <Tracked as="div" tag="portal_upload_documento" onClick={() => track("portal_upload_documento", {})} className="ol-btn-primary" style={{ padding: 13, borderRadius: 8, background: escritorio.corPrimaria, color: "#fff", textAlign: "center", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              Enviar novo documento
            </Tracked>
          </div>
        )}

        {aba === "propostas" && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Suas propostas</div>
            {PROPOSTAS.slice(0, 3).map((p) => (
              <div key={p.numero} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #EEF0F3", paddingBottom: 8 }}>
                <span>{p.numero} · {p.servicos}</span>
                <span style={{ fontWeight: 600 }}>{brl(p.total)}</span>
              </div>
            ))}
          </div>
        )}

        {aba === "cobrancas" && (
          <div style={{ padding: 20 }}>
            <div style={{ fontSize: 12.5, color: "#8A929E" }}>
              {fase4 ? "Nenhuma cobrança em aberto." : "Módulo financeiro (Fase 4) ainda não habilitado neste escritório."}
            </div>
          </div>
        )}

        {aba === "cursos" && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{MATRICULA_DEMO.curso}</div>
            <div style={{ fontSize: 12.5, color: "#8A929E" }}>
              {MATRICULA_DEMO.progresso.length} aulas concluídas — acesse pelo sistema para continuar assistindo.
            </div>
          </div>
        )}

        {aba === "obrigacoes" && (
          <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Próximas obrigações</div>
            {OBRIGACOES.slice(0, 3).map((o) => (
              <div key={o.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, borderBottom: "1px solid #EEF0F3", paddingBottom: 8 }}>
                <span>{o.tipo}</span>
                <span style={{ color: "#98A0AC", fontSize: 12 }}>{o.vencimento}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ fontSize: 12, color: "#78849A", textAlign: "center", maxWidth: 390, lineHeight: 1.6 }}>
        Sem login. Um único link reúne processo, documentos, propostas, cobranças, cursos e obrigações do cliente.
      </div>
    </div>
  );
}
