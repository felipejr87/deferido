import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConectado } from "../lib/supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Page, Card, EstadoVazio, SecondaryButton, Badge, Carregando } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { PROCESSOS, PROPOSTAS } from "../data/mock.js";

// Parte 2 da spec de fluxos: a tela inicial não é dashboard de números — é
// uma fila de trabalho priorizada. fila_de_trabalho() é uma função SQL real
// (migration 20260904120000) que varre processos/propostas/leads/cobranças
// atrasadas do escritório. Sem Supabase conectado, deriva uma fila
// equivalente dos mesmos dados de exemplo que o resto do app já usa (não
// inventa números novos, só aplica a mesma lógica de prioridade).
const CORES = {
  prazo_critico: { emoji: "🔴", bg: "#FBEDEC", fg: "#A33F36" },
  pendencia: { emoji: "🟠", bg: "#FDF0E6", fg: "#B0530B" },
  doc_pendente: { emoji: "🟡", bg: "#FDF3E3", fg: "#8A5A0B" },
  proposta_parada: { emoji: "🟡", bg: "#FDF3E3", fg: "#8A5A0B" },
  lead_frio: { emoji: "⚪", bg: "#F1F3F6", fg: "#5C6675" },
  cobranca_vencida: { emoji: "🔴", bg: "#FBEDEC", fg: "#A33F36" },
};

function filaMock() {
  const itens = [];
  for (const p of PROCESSOS) {
    if (p.status === "pendencia") {
      itens.push({ prioridade: 2, tipo: "pendencia", titulo: `Exigência aberta: ${p.servico}`, subtitulo: `${p.cliente} · há ${p.parado} dia(s)`, acao_rotulo: "Resolver", acao_rota: `/processos/${p.numero.replace("#", "")}`, dias: p.parado });
    } else if (p.parado >= 5 && p.status !== "concluido") {
      itens.push({ prioridade: 1, tipo: "prazo_critico", titulo: `Sem movimentação: ${p.servico}`, subtitulo: `${p.cliente} · parado há ${p.parado} dia(s)`, acao_rotulo: "Ver processo", acao_rota: `/processos/${p.numero.replace("#", "")}`, dias: p.parado });
    }
  }
  for (const pr of PROPOSTAS) {
    if (pr.status === "vista") {
      itens.push({ prioridade: 4, tipo: "proposta_parada", titulo: `Proposta sem resposta: ${pr.cliente}`, subtitulo: `R$ ${pr.total}`, acao_rotulo: "Fazer follow-up", acao_rota: "/propostas", dias: 3 });
    }
  }
  return itens.sort((a, b) => a.prioridade - b.prioridade).slice(0, 30);
}

export default function Inicio() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [fila, setFila] = useState(null);
  const [real, setReal] = useState(false);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (supabaseConectado) {
        const { data, error } = await supabase.rpc("fila_de_trabalho", { p_escritorio_id: ESCRITORIO_ID });
        if (!error && data) {
          if (vivo) {
            setFila(data);
            setReal(true);
          }
          return;
        }
      }
      if (vivo) {
        setFila(filaMock());
        setReal(false);
      }
    }
    carregar();
    return () => {
      vivo = false;
    };
  }, []);

  const primeiroNome = session?.nome?.split(" ")[0] || "";
  const saudacao = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {saudacao}{primeiroNome ? `, ${primeiroNome}` : ""}.
        </div>
        <div style={{ fontSize: 13.5, color: "#6B7480", marginTop: 4 }}>
          {fila === null
            ? "Vendo o que precisa de atenção…"
            : fila.length
              ? `${fila.length} coisa${fila.length > 1 ? "s" : ""} pede${fila.length > 1 ? "m" : ""} sua atenção hoje.`
              : "Tudo em dia."}
        </div>
        {!real && fila !== null && (
          <div style={{ marginTop: 8 }}>
            <Badge bg="#F1F3F6" fg="#5C6675">dados de exemplo (offline)</Badge>
          </div>
        )}
      </div>

      {fila === null && <Carregando linhas={4} />}

      {fila !== null && fila.length === 0 && (
        <Card>
          <EstadoVazio
            titulo="Nada pedindo atenção agora"
            explicacao="Prazos, exigências de órgão, documentos parados e propostas sem resposta aparecem aqui assim que surgirem."
            acoes={[
              { rotulo: "Nova proposta", tag: "inicio_nova_proposta", onClick: () => navigate("/propostas/nova") },
              { rotulo: "Ver processos", tag: "inicio_ver_processos", onClick: () => navigate("/processos") },
            ]}
          />
        </Card>
      )}

      {fila !== null && fila.length > 0 && (
        <>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {fila.map((item, i) => {
              const cor = CORES[item.tipo] || CORES.lead_frio;
              return (
                <Card key={i} style={{ padding: 14, display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 15 }}>{cor.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{item.titulo}</div>
                    <div style={{ fontSize: 12, color: "#8A929E", marginTop: 2 }}>{item.subtitulo}</div>
                  </div>
                  <Tracked
                    as="div"
                    tag="fila_item_acao"
                    data={{ tipo: item.tipo }}
                    onClick={() => {
                      track("fila_item_clicar", { tipo: item.tipo });
                      navigate(item.acao_rota);
                    }}
                    style={{ fontSize: 12.5, fontWeight: 600, color: "#0A4D9E", cursor: "pointer", whiteSpace: "nowrap", padding: "6px 10px" }}
                  >
                    {item.acao_rotulo}
                  </Tracked>
                </Card>
              );
            })}
          </div>
          <div style={{ textAlign: "center", paddingTop: 8 }}>
            <SecondaryButton tag="inicio_ver_numeros" onClick={() => navigate("/relatorios")}>
              Ver números do mês
            </SecondaryButton>
          </div>
        </>
      )}
    </Page>
  );
}
