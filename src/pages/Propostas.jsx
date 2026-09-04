import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { STATUS, brl } from "../data/mock.js";
import { buscarPropostasReais, gerarProcessoDaProposta } from "../lib/data.js";
import { Tracked } from "../components/Tracked.jsx";
import { usePagination, Pagination, SecondaryButton, Badge } from "../components/ui.jsx";
import ImportarConversa from "../components/ImportarConversa.jsx";
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
  const [feedback, setFeedback] = useState(null);

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

  useEffect(() => {
    buscarPropostasReais().then((res) => {
      setPropostas(res.dados);
      setReal(res.ok);
    });
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

        {pageItems.map((p) => {
          const st = STATUS[p.status];
          const podeGerarProcesso = p.status === "aceita";
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
              <div>
                {podeGerarProcesso && (
                  <Tracked
                    as="div"
                    tag="proposta_criar_processo"
                    data={{ numero: p.numero }}
                    onClick={() => criarProcesso(p)}
                    style={{ fontSize: 12.5, fontWeight: 500, color: "#0A4D9E", cursor: "pointer" }}
                    onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
                    onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}
                  >
                    {gerando === p.numero ? "Gerando…" : "Criar processo"}
                  </Tracked>
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
