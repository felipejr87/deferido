import { PLANOS } from "../data/saas.js";
import { useApp } from "../context/AppContext.jsx";
import { Page, Card, PrimaryButton } from "../components/ui.jsx";
import { track } from "../lib/analytics.js";

export default function Planos() {
  const { escritorio } = useApp();

  return (
    <Page>
      <div style={{ background: "#EAF1FB", color: "#0A4D9E", borderRadius: 9, padding: "12px 16px", fontSize: 12.5, marginBottom: 20, textAlign: "center" }}>
        Trial de 14 dias sem cartão. Cobrança recorrente via Asaas.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))", gap: 16 }}>
        {PLANOS.map((p, idx) => (
          <Card key={p.id} style={{ display: "flex", flexDirection: "column", gap: 12, border: idx === 1 ? `2px solid ${escritorio.corPrimaria}` : undefined }}>
            <div style={{ fontSize: 15, fontWeight: 600 }}>{p.nome}</div>
            <div>
              <span style={{ fontSize: 28, fontWeight: 600 }}>R$ {p.preco}</span>
              <span style={{ fontSize: 12.5, color: "#8A929E" }}>/mês</span>
            </div>
            <div style={{ fontSize: 12.5, color: "#6B7480", lineHeight: 1.5, flex: 1 }}>{p.limites}</div>
            <PrimaryButton tag="planos_assinar" data={{ plano: p.id }} onClick={() => track("planos_assinar_clique", { plano: p.id })}>
              Começar trial
            </PrimaryButton>
          </Card>
        ))}
      </div>
    </Page>
  );
}
