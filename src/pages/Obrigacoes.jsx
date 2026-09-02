import { useState } from "react";
import { OBRIGACOES as SEED, OBRIGACOES_TIPOS } from "../data/blocoB.js";
import { Page, Card, Table, Th, Row, Badge } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

const STATUS_UI = {
  pendente: { bg: "#FDF3E3", fg: "#8A5A0B", label: "Pendente" },
  cumprida: { bg: "#EAF6EE", fg: "#1F6F4C", label: "Cumprida" },
  atrasada: { bg: "#FBEDEC", fg: "#A33F36", label: "Atrasada" },
  dispensada: { bg: "#F1F3F6", fg: "#5C6675", label: "Dispensada" },
};

const REGIME_LABEL = { mei: "MEI", simples: "Simples", presumido: "Presumido" };
const gridCols = "minmax(160px,1.4fr) 90px 90px 130px 110px 100px";

export default function Obrigacoes() {
  const [obrigacoes, setObrigacoes] = useState(SEED);

  const marcarCumprida = (id) => {
    setObrigacoes((prev) => prev.map((o) => (o.id === id ? { ...o, status: "cumprida" } : o)));
    track("obrigacao_marcar_cumprida", { obrigacao_id: id });
  };

  return (
    <Page>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: "#6B7480" }}>
          Calendário gerado por cliente a partir do regime tributário. Seeds prontos: MEI (DAS mensal dia 20,
          DASN-SIMEI anual 31/05), Simples (DAS mensal, DEFIS anual 31/03), Presumido (DARF trimestral, DCTF mensal,
          ECF anual 31/07). Alerta antecipado: D-10 para o escritório, D-5 para o cliente.
        </div>
      </Card>

      <Table cols={gridCols}>
        <Th>Cliente</Th>
        <Th>Regime</Th>
        <Th>Tipo</Th>
        <Th>Competência</Th>
        <Th>Vencimento</Th>
        <Th right>Status</Th>
      </Table>
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderTop: "none", borderRadius: "0 0 9px 9px", overflowX: "auto" }}>
        {obrigacoes.map((o) => {
          const st = STATUS_UI[o.status];
          return (
            <Row key={o.id} cols={gridCols}>
              <div style={{ fontWeight: 500, fontSize: 13 }}>{o.cliente}</div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{REGIME_LABEL[o.regime]}</div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{o.tipo}</div>
              <div style={{ fontSize: 12.5, color: "#8A929E" }}>{o.competencia}</div>
              <div style={{ fontSize: 12.5, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>{o.vencimento}</div>
              <div style={{ textAlign: "right" }}>
                {o.status === "pendente" || o.status === "atrasada" ? (
                  <Tracked as="div" tag="obrigacao_marcar_cumprida_click" data={{ id: o.id }} onClick={() => marcarCumprida(o.id)} style={{ cursor: "pointer", display: "inline-block" }}>
                    <Badge bg={st.bg} fg={st.fg}>
                      {st.label} · marcar
                    </Badge>
                  </Tracked>
                ) : (
                  <Badge bg={st.bg} fg={st.fg}>
                    {st.label}
                  </Badge>
                )}
              </div>
            </Row>
          );
        })}
      </div>

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {OBRIGACOES_TIPOS.map((t) => (
          <Card key={t.id}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{t.nome}</div>
            <div style={{ fontSize: 12, color: "#8A929E", marginTop: 2 }}>{t.descricao}</div>
            <div style={{ fontSize: 11.5, color: "#98A0AC", marginTop: 6 }}>
              {t.regime.map((r) => REGIME_LABEL[r]).join(", ")} · {t.periodicidade}
            </div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
