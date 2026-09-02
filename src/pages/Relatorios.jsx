import { PROPOSTAS, PROCESSOS, SERVICOS, CATS, STATUS, brl } from "../data/mock.js";
import { Page, Card, SectionTitle, Table, Th, Row, SecondaryButton } from "../components/ui.jsx";
import { downloadCsv } from "../lib/export.js";
import { track } from "../lib/analytics.js";

const gridColsFat = "minmax(160px,1.4fr) 100px 100px";
const gridColsConv = "140px 90px 90px 90px";

export default function Relatorios() {
  const porServico = SERVICOS.map((s) => {
    const propostas = PROPOSTAS.filter((p) => p.servicos.toLowerCase().includes(s.nome.toLowerCase().split(" ")[0]));
    const faturamento = propostas.filter((p) => p.status === "aceita").reduce((a, p) => a + p.total, 0);
    return { servico: s.nome, categoria: CATS[s.cat], faturamento };
  }).filter((r) => r.faturamento > 0);

  const origens = ["instagram", "whatsapp", "indicacao", "site"];
  const conversao = origens.map((o) => ({
    origem: o,
    leads: Math.floor(Math.random() * 10) + 5,
    propostas: Math.floor(Math.random() * 6) + 2,
    fechados: Math.floor(Math.random() * 3) + 1,
  }));

  const exportarFaturamento = () => {
    downloadCsv(
      "relatorio-faturamento-por-servico",
      porServico.map((r) => ({ Servico: r.servico, Categoria: r.categoria, Faturamento: r.faturamento.toFixed(2) })),
    );
    track("relatorio_exportar_csv", { relatorio: "faturamento_servico" });
  };

  const exportarProcessos = () => {
    downloadCsv(
      "relatorio-processos",
      PROCESSOS.map((p) => ({ Numero: p.numero, Cliente: p.cliente, Servico: p.servico, Orgao: p.orgao, Status: p.status, DiasParado: p.parado })),
    );
    track("relatorio_exportar_csv", { relatorio: "processos" });
  };

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle action={<SecondaryButton tag="relatorio_export_faturamento" onClick={exportarFaturamento}>Exportar CSV</SecondaryButton>}>
          Faturamento por serviço (propostas aceitas)
        </SectionTitle>
        <Table cols={gridColsFat}>
          <Th>Serviço</Th>
          <Th>Categoria</Th>
          <Th right>Faturamento</Th>
        </Table>
        <div style={{ border: "1px solid #E4E7EC", borderTop: "none", overflowX: "auto" }}>
          {porServico.map((r) => (
            <Row key={r.servico} cols={gridColsFat}>
              <div style={{ fontSize: 13 }}>{r.servico}</div>
              <div style={{ fontSize: 12.5, color: "#6B7480" }}>{r.categoria}</div>
              <div style={{ textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{brl(r.faturamento)}</div>
            </Row>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Tempo médio de conclusão por tipo de processo</SectionTitle>
        <div style={{ fontSize: 12.5, color: "#6B7480" }}>
          Abertura MEI: <b>3 dias</b> · Abertura ME/LTDA: <b>15 dias</b> · Alvará: <b>25-30 dias</b> — é o que o cliente
          compra quando lê "abertura em 24h" no anúncio.
        </div>
      </Card>

      <Card>
        <SectionTitle action={<SecondaryButton tag="relatorio_export_processos" onClick={exportarProcessos}>Exportar CSV</SecondaryButton>}>
          Conversão por origem de lead
        </SectionTitle>
        <Table cols={gridColsConv}>
          <Th>Origem</Th>
          <Th right>Leads</Th>
          <Th right>Propostas</Th>
          <Th right>Fechados</Th>
        </Table>
        <div style={{ border: "1px solid #E4E7EC", borderTop: "none", overflowX: "auto" }}>
          {conversao.map((c) => (
            <Row key={c.origem} cols={gridColsConv}>
              <div style={{ fontSize: 13, textTransform: "capitalize" }}>{c.origem}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c.leads}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{c.propostas}</div>
              <div style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>{c.fechados}</div>
            </Row>
          ))}
        </div>
        <div style={{ fontSize: 11.5, color: "#98A0AC", marginTop: 8 }}>
          Números ilustrativos — fica real quando o funil de leads (Fase 3) estiver ligado.
        </div>
      </Card>
    </Page>
  );
}
