import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STATUS, brl } from "../data/mock.js";
import { buscarPropostasReais, gerarProcessoDaProposta } from "../lib/data.js";
import { transicionar, ErroAmigavel } from "../lib/fluxo.js";
import { supabaseConectado } from "../lib/supabaseClient.js";
import { Tracked } from "../components/Tracked.jsx";
import { usePagination, Pagination, SecondaryButton, Badge, EmptyState, PrimaryButton } from "../components/ui.jsx";
import ImportarConversa from "../components/ImportarConversa.jsx";
import Toast, { useToast } from "../components/Toast.jsx";
import { useFeature } from "../context/FeatureContext.jsx";

const KPIS = [
  { label: "Propostas no mês", valor: "18", nota: "9 aceitas, 4 aguardando" },
  { label: "Taxa de aceite", valor: "50%", nota: "+8 p.p. vs julho" },
  { label: "Valor aceito", valor: brl(11430), nota: `ticket médio ${brl(1270)}` },
  { label: "Margem real", valor: brl(7250), nota: "depois de taxas e despachante" },
];

const gridCols = "70px minmax(180px,1.5fr) minmax(140px,1fr) 118px 122px 84px 118px";

export default function Propostas() {
  const navigate = useNavigate();
  const [propostas, setPropostas] = useState([]);
  const [real, setReal] = useState(false);
  const { page, totalPages, setPage, pageItems } = usePagination(propostas, 4);
  const conversaOn = useFeature("captura_conversa");
  const [importando, setImportando] = useState(false);
  const [gerando, setGerando] = useState(null);
  const [mudando, setMudando] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const { toast, mostrar, fechar } = useToast();

  const recarregar = () =>
    buscarPropostasReais().then((res) => {
      setPropostas(res.dados);
      setReal(res.ok);
    });

  const criarProcesso = async (p) => {
    if (!p.id) {
      navigate("/processos/0087");
      return;
    }
    setGerando(p.numero);
    setFeedback(null);
    const res = await gerarProcessoDaProposta(p.id);
    setGerando(null);
    if (!res.ok) {
      setFeedback({ ok: false, texto: `Não foi possível criar o processo de ${p.numero}: ${res.motivo}` });
      return;
    }
    setFeedback({ ok: true, texto: `${res.dados.length} processo(s) criado(s) a partir de ${p.numero}.` });
    navigate("/processos");
  };

  const enviarProposta = async (p) => {
    if (!p.id) return;
    setMudando(p.numero);
    setFeedback(null);
    try {
      await transicionar("proposta", p.id, "enviada");
      setFeedback({ ok: true, texto: `Proposta ${p.numero} enviada.` });
      await recarregar();
    } catch (err) {
      setFeedback({ ok: false, texto: err instanceof ErroAmigavel ? err.message : "Não consegui enviar a proposta." });
    }
    setMudando(null);
  };

  const arquivarProposta = async (p) => {
    if (!p.id) return;
    setMudando(p.numero);
    try {
      await transicionar("proposta", p.id, "arquivada");
    } catch (err) {
      setFeedback({ ok: false, texto: err instanceof ErroAmigavel ? err.message : "Não consegui arquivar a proposta." });
      setMudando(null);
      return;
    }
    setMudando(null);
    await recarregar();
    mostrar({
      texto: `Proposta ${p.numero} arquivada.`,
      aoDesfazer: async () => {
        await transicionar("proposta", p.id, "rascunho");
        await recarregar();
      },
    });
  };

  useEffect(() => {
    recarregar();
  }, []);

  return (
    <div className="ol-page">
      <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge bg={real ? "#EAF6EE" : "#F1F3F6"} fg={real ? "#1F6F4C" : "#5C6675"}>
          {real ? "dados do Postgres" : "dados de exemplo (offline)"}
        </Badge>
        {feedback && (
          <div style={{ fontSize: 12.5, color: feedback.ok ? "#1F6F4C" : "#A33F36", background: feedback.ok ? "#EAF6EE" : "#FBEDEC", borderRadius: 8, padding: "8px 10px" }}>
            {feedback.texto}
          </div>
        )}
      </div>
      {conversaOn && (
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: importando ? 0 : 14 }}>
          {!importando && (
            <SecondaryButton tag="propostas_importar_conversa" onClick={() => setImportando(true)}>
              Importar de conversa (WhatsApp)
            </SecondaryButton>
          )}
        </div>
      )}
      {importando && <ImportarConversa onFechar={() => setImportando(false)} />}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14, marginBottom: 22 }}>
        {KPIS.map((k) => (
          <div
            key={k.label}
            style={{
              background: "#fff",
              border: "1px solid #E4E7EC",
              borderRadius: 9,
              padding: "15px 16px",
              display: "flex",
              flexDirection: "column",
              gap: 7,
            }}
          >
            <div style={{ fontSize: 11.5, color: "#8A929E", letterSpacing: ".04em", textTransform: "uppercase" }}>
              {k.label}
            </div>
            <div style={{ fontSize: 23, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>
              {k.valor}
            </div>
            <div style={{ fontSize: 12, color: "#6B7480" }}>{k.nota}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, overflowX: "auto" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: gridCols,
            gap: 12,
            padding: "11px 18px",
            background: "#FAFBFC",
            borderBottom: "1px solid #E4E7EC",
            fontSize: 11,
            color: "#8A929E",
            letterSpacing: ".05em",
            textTransform: "uppercase",
          }}
        >
          <div>Nº</div>
          <div>Cliente</div>
          <div>Serviços</div>
          <div style={{ textAlign: "right" }}>Total</div>
          <div>Status</div>
          <div>Criada</div>
          <div>Ação</div>
        </div>

        {propostas.length === 0 && (
          <div style={{ padding: "8px 18px 24px 18px" }}>
            <EmptyState
              title="Nenhuma proposta ainda"
              hint="Propostas aparecem aqui assim que você criar a primeira. Leva menos de 5 minutos."
              action={
                <PrimaryButton tag="propostas_criar_primeira" onClick={() => navigate("/propostas/nova")}>
                  Criar primeira proposta
                </PrimaryButton>
              }
            />
          </div>
        )}
        {pageItems.map((p) => {
          const st = STATUS[p.status];
          const podeGerarProcesso = p.status === "aceita";
          const podeEnviar = p.status === "rascunho";
          const podeArquivar = p.status === "rascunho";
          return (
            <div
              key={p.numero}
              className="ol-row"
              style={{
                display: "grid",
                gridTemplateColumns: gridCols,
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid #EEF0F3",
                alignItems: "center",
                cursor: "pointer",
              }}
            >
              <div style={{ fontVariantNumeric: "tabular-nums", color: "#6B7480", fontSize: 13 }}>{p.numero}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
                <div style={{ fontWeight: 500 }}>{p.cliente}</div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>{p.doc}</div>
              </div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{p.servicos}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>{brl(p.total)}</div>
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "3px 9px",
                    borderRadius: 20,
                    fontSize: 11.5,
                    fontWeight: 500,
                    background: st.bg,
                    color: st.fg,
                  }}
                >
                  {st.label}
                </span>
              </div>
              <div style={{ fontSize: 12.5, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>{p.data}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {podeGerarProcesso && (
                  <AcaoLink tag="proposta_criar_processo" data={{ numero: p.numero }} onClick={() => criarProcesso(p)}>
                    {gerando === p.numero ? "Gerando…" : "Criar processo"}
                  </AcaoLink>
                )}
                {podeEnviar && (
                  <AcaoLink tag="proposta_enviar" data={{ numero: p.numero }} onClick={() => enviarProposta(p)} disabled={!p.id}>
                    {mudando === p.numero ? "Enviando…" : "Enviar proposta"}
                  </AcaoLink>
                )}
                {podeArquivar && (
                  <AcaoLink tag="proposta_arquivar" data={{ numero: p.numero }} onClick={() => arquivarProposta(p)} muted disabled={!p.id}>
                    {mudando === p.numero ? "Arquivando…" : "Arquivar"}
                  </AcaoLink>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
      <Toast toast={toast} onFechar={fechar} />
    </div>
  );
}

function AcaoLink({ children, onClick, tag, data, muted, disabled }) {
  return (
    <Tracked
      as="div"
      tag={tag}
      data={data}
      onClick={disabled ? undefined : onClick}
      style={{
        fontSize: 12.5,
        fontWeight: 500,
        color: muted ? "#98A0AC" : "#0A4D9E",
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseOver={(e) => !disabled && (e.currentTarget.style.textDecoration = "underline")}
      onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
    >
      {children}
    </Tracked>
  );
}
