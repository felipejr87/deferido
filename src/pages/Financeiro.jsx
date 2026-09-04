import { useEffect, useState } from "react";
import { Page, Card, EstadoVazio, Explicacao, StatusBadge, Badge } from "../components/ui.jsx";
import { buscarCobrancasReais } from "../lib/data.js";
import { brl } from "../data/mock.js";
import { emQuantoTempo } from "../lib/vocabulario.js";

// Simplificação radical de navegação (Passo 1): "Dinheiro" no menu
// principal — a receber, recebido e atrasado. Não existia lista de
// cobranças alguma antes desta tela (só números soltos no Relatórios).
export default function Financeiro() {
  const [cobrancas, setCobrancas] = useState(null);
  const [real, setReal] = useState(false);

  useEffect(() => {
    buscarCobrancasReais().then((res) => {
      setCobrancas(res.dados);
      setReal(res.ok);
    });
  }, []);

  const pendentes = (cobrancas || []).filter((c) => c.status === "pendente" || c.status === "atrasado");
  const aReceber = pendentes.reduce((a, c) => a + c.valor, 0);
  const atrasadas = (cobrancas || []).filter((c) => c.status === "atrasado" || (c.status === "pendente" && new Date(c.vencimento) < new Date()));

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Explicacao chave="financeiro">O que você tem a receber, o que já entrou e o que está atrasado.</Explicacao>

      {cobrancas !== null && !real && <Badge bg="#F1F3F6" fg="#5C6675">dados de exemplo (offline)</Badge>}

      {cobrancas !== null && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 14 }}>
          <Kpi label="A receber" valor={brl(aReceber)} nota={`${pendentes.length} cobrança${pendentes.length !== 1 ? "s" : ""} em aberto`} />
          <Kpi label="Atrasadas" valor={String(atrasadas.length)} nota={atrasadas.length ? "cobrar hoje" : "nenhuma"} cor={atrasadas.length ? "#A33F36" : undefined} />
        </div>
      )}

      {cobrancas === null && <Card style={{ color: "#8A929E", fontSize: 13 }}>Carregando…</Card>}

      {cobrancas !== null && cobrancas.length === 0 && (
        <Card>
          <EstadoVazio
            titulo="Nenhuma cobrança ainda"
            explicacao="Cobranças aparecem aqui quando uma proposta é aceita — o sistema gera automaticamente."
          />
        </Card>
      )}

      {cobrancas !== null && cobrancas.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {cobrancas.map((c) => (
            <Card key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.cliente}</div>
                <div style={{ fontSize: 12, color: "#8A929E", marginTop: 2 }}>{c.descricao} · {emQuantoTempo(c.vencimento)}</div>
              </div>
              <div style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{brl(c.valor)}</div>
              <StatusBadge entidade="cobranca" status={c.status} />
            </Card>
          ))}
        </div>
      )}
    </Page>
  );
}

function Kpi({ label, valor, nota, cor }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: "15px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ fontSize: 11.5, color: "#8A929E", letterSpacing: ".04em", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums", color: cor }}>{valor}</div>
      <div style={{ fontSize: 12, color: "#6B7480" }}>{nota}</div>
    </div>
  );
}
