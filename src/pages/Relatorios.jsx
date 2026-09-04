import { PROPOSTAS, PROCESSOS, CATS, PSTATUS, brl } from "../data/mock.js";
import { OBRIGACOES } from "../data/blocoB.js";
import { Page, Card, SectionTitle, Table, Th, Row, SecondaryButton } from "../components/ui.jsx";
import BarRanking from "../components/BarRanking.jsx";
import { downloadCsv } from "../lib/export.js";
import { track } from "../lib/analytics.js";
import { useApp } from "../context/AppContext.jsx";

const gridColsFat = "minmax(160px,1.4fr) 100px 100px";
const gridColsConv = "140px 90px 90px 90px";

function Kpi({ label, valor, nota }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ fontSize: 11.5, color: "#8A929E", letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#6B7480" }}>{nota}</div>
    </div>
  );
}

export default function Relatorios() {
  const { catalogo } = useApp();

  const propostasAguardando = PROPOSTAS.filter((p) => ["enviada", "vista"].includes(p.status));
  const processosParados = PROCESSOS.filter((p) => p.parado >= 5);
  const contagemPorStatus = PROCESSOS.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const obrigacoesVencendo = OBRIGACOES.filter((o) => o.status === "pendente" || o.status === "atrasada");
  const margemPorServico = catalogo.servicos
    .filter((s) => s.custo > 0)
    .map((s) => ({ label: s.nome, value: s.valor - s.custo }))
    .sort((a, b) => b.value - a.value);

  const porServico = catalogo.servicos.map((s) => {
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
      <section>
        <div style={{ fontSize: 12, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>Comercial</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          <Kpi label="Propostas aguardando" valor={String(propostasAguardando.length)} nota="resposta do cliente" />
          <Kpi label="Taxa de conversão" valor="50%" nota="+8 p.p. vs julho" />
          <Kpi label="Ticket médio" valor={brl(1270)} nota="últimos 30 dias" />
          <Kpi label="Leads novos" valor="0" nota="funil de leads ainda desligado (Fase 3)" />
        </div>
      </section>

      <section>
        <div style={{ fontSize: 12, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>Operacional</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          <Kpi label="Processos em andamento" valor={String(PROCESSOS.length)} nota={Object.entries(contagemPorStatus).map(([k, v]) => `${v} ${PSTATUS[k].label.toLowerCase()}`).join(", ")} />
          <Kpi label="Processos parados" valor={String(processosParados.length)} nota="5+ dias sem movimentação ⚠️" />
          <Kpi label="Documentos pendentes" valor="1" nota="cliente ainda não enviou" />
          <Kpi label="Obrigações a vencer" valor={String(obrigacoesVencendo.length)} nota="próximos 30 dias" />
        </div>
      </section>

      <section>
        <div style={{ fontSize: 12, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase", marginBottom: 10 }}>Financeiro</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          <Kpi label="A receber este mês" valor={brl(4870)} nota="6 cobranças em aberto" />
          <Kpi label="Recebido este mês" valor={brl(11430)} nota="9 propostas aceitas" />
          <Kpi label="Inadimplência" valor="4%" nota="1 cobrança vencida" />
          <Kpi label="Margem do mês" valor={brl(7250)} nota="receita − custos de terceiros" />
        </div>
      </section>

      <Card>
        <SectionTitle>Margem por serviço</SectionTitle>
        <BarRanking data={margemPorServico} formatValue={brl} />
      </Card>

      {processosParados.length > 0 && (
        <Card style={{ borderColor: "#F0DFC0", background: "#FDF9F1" }}>
          <SectionTitle>⚠️ Processos parados</SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {processosParados.map((p) => (
              <div key={p.numero} style={{ fontSize: 12.5, color: "#8A5A0B" }}>
                {p.numero} · {p.cliente} — parado há {p.parado} dias
              </div>
            ))}
          </div>
        </Card>
      )}

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
