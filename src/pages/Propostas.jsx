import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { brl } from "../data/mock.js";
import { buscarPropostasReais, gerarProcessoDaProposta } from "../lib/data.js";
import { transicionar } from "../lib/fluxo.js";
import { traduzirErro, ErroAmigavel } from "../lib/erros.js";
import { Tracked } from "../components/Tracked.jsx";
import { usePagination, Pagination, SecondaryButton, Badge, EstadoVazio, StatusBadge, Erro, Explicacao } from "../components/ui.jsx";
import ImportarConversa from "../components/ImportarConversa.jsx";
import { useToast } from "../context/ToastContext.jsx";
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
  const { avisar, comDesfazer } = useToast();

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
      setFeedback(new ErroAmigavel(`Não consegui criar o processo de ${p.numero}`, res.motivo));
      return;
    }
    avisar(`${res.dados.length} processo(s) criado(s) a partir de ${p.numero}.`);
    navigate("/processos");
  };

  const enviarProposta = async (p) => {
    if (!p.id) return;
    setMudando(p.numero);
    setFeedback(null);
    try {
      await transicionar("proposta", p.id, "enviada");
      avisar(`Proposta ${p.numero} enviada.`);
      await recarregar();
    } catch (err) {
      setFeedback(traduzirErro(err));
    }
    setMudando(null);
  };

  const arquivarProposta = async (p) => {
    if (!p.id) return;
    setMudando(p.numero);
    try {
      await transicionar("proposta", p.id, "arquivada");
    } catch (err) {
      setFeedback(traduzirErro(err));
      setMudando(null);
      return;
    }
    setMudando(null);
    await recarregar();
    comDesfazer(`Proposta ${p.numero} arquivada.`, async () => {
      await transicionar("proposta", p.id, "rascunho");
      await recarregar();
    });
  };

  useEffect(() => {
    recarregar();
  }, []);

  return (
    <div className="ol-page">
      <Explicacao chave="propostas">
        Aqui ficam os orçamentos. Crie, envie por link e acompanhe se o cliente abriu. Quando ele aceita, vira processo automaticamente.
      </Explicacao>
      <div style={{ marginBottom: 14, display: "flex", flexDirection: "column", gap: 10 }}>
        <Badge bg={real ? "#EAF6EE" : "#F1F3F6"} fg={real ? "#1F6F4C" : "#5C6675"}>
          {real ? "dados do Postgres" : "dados de exemplo (offline)"}
        </Badge>
        {feedback && <Erro titulo={feedback.titulo} motivo={feedback.motivo} acoes={feedback.acoes} />}
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
          <EstadoVazio
            titulo="Nenhuma proposta ainda"
            explicacao="Proposta é o primeiro passo para virar cliente. Leva 2 minutos."
            acoes={[{ rotulo: "Nova proposta", tag: "propostas_criar_primeira", onClick: () => navigate("/propostas/nova") }]}
          />
        )}
        {pageItems.map((p) => {
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
                <StatusBadge entidade="proposta" status={p.status} />
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
