import { PROPOSTAS, PROCESSOS, SERVICOS, PSTATUS, brl } from "../data/mock.js";
import { OBRIGACOES } from "../data/blocoB.js";
import { Page, Card, SectionTitle } from "../components/ui.jsx";
import BarRanking from "../components/BarRanking.jsx";

function Kpi({ label, valor, nota }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ fontSize: 11.5, color: "#8A929E", letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#6B7480" }}>{nota}</div>
    </div>
  );
}

export default function Dashboard() {
  const propostasAguardando = PROPOSTAS.filter((p) => ["enviada", "vista"].includes(p.status));
  const processosParados = PROCESSOS.filter((p) => p.parado >= 5);
  const contagemPorStatus = PROCESSOS.reduce((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});
  const obrigacoesVencendo = OBRIGACOES.filter((o) => o.status === "pendente" || o.status === "atrasada");

  const margemPorServico = SERVICOS.filter((s) => s.custo > 0)
    .map((s) => ({ label: s.nome, value: s.valor - s.custo }))
    .sort((a, b) => b.value - a.value);

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 24 }}>
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
    </Page>
  );
}
