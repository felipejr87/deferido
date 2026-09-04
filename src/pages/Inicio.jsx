import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConectado } from "../lib/supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";
import { useAuth } from "../context/AuthContext.jsx";
import { Page, Card, EstadoVazio, SecondaryButton, Carregando, Erro } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { traduzirErro } from "../lib/erros.js";

// Parte 2 da spec de fluxos: a tela inicial não é dashboard de números — é
// uma fila de trabalho priorizada. fila_de_trabalho() é uma função SQL real
// (migration 20260904120000) que varre processos/propostas/leads/cobranças
// atrasadas do escritório.
//
// Correção pós-auditoria: esta tela NUNCA mostra fila de mock — nem sem
// Supabase conectado, nem se a RPC falhar. Inventar pendência que não
// existe é pior que não mostrar nada (alguém pode perseguir um prazo que
// não é real). Diferente do resto do app (que tem "dados de exemplo" como
// modo offline honesto e rotulado), a fila de trabalho é a única tela onde
// mesmo esse mock é arriscado demais — vira estado vazio/erro em vez disso.
const CORES = {
  prazo_critico: { emoji: "🔴", bg: "#FBEDEC", fg: "#A33F36" },
  pendencia: { emoji: "🟠", bg: "#FDF0E6", fg: "#B0530B" },
  doc_pendente: { emoji: "🟡", bg: "#FDF3E3", fg: "#8A5A0B" },
  proposta_parada: { emoji: "🟡", bg: "#FDF3E3", fg: "#8A5A0B" },
  lead_frio: { emoji: "⚪", bg: "#F1F3F6", fg: "#5C6675" },
  cobranca_vencida: { emoji: "🔴", bg: "#FBEDEC", fg: "#A33F36" },
};

export default function Inicio() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [fila, setFila] = useState(null);
  const [erro, setErro] = useState(null);
  const [semConexao, setSemConexao] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    setSemConexao(false);
    if (!supabaseConectado) {
      setFila(null);
      setSemConexao(true);
      return;
    }
    try {
      const { data, error } = await supabase.rpc("fila_de_trabalho", { p_escritorio_id: ESCRITORIO_ID });
      if (error) throw error;
      setFila(data || []);
    } catch (e) {
      // NUNCA cair pro mock aqui.
      setFila(null);
      setErro(traduzirErro(e));
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const primeiroNome = session?.nome?.split(" ")[0] || "";
  const saudacao = new Date().getHours() < 12 ? "Bom dia" : new Date().getHours() < 18 ? "Boa tarde" : "Boa noite";

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <div>
        <div style={{ fontSize: 20, fontWeight: 600 }}>
          {saudacao}{primeiroNome ? `, ${primeiroNome}` : ""}.
        </div>
        <div style={{ fontSize: 13.5, color: "#6B7480", marginTop: 4 }}>
          {erro || semConexao
            ? " "
            : fila === null
              ? "Vendo o que precisa de atenção…"
              : fila.length
                ? `${fila.length} coisa${fila.length > 1 ? "s" : ""} pede${fila.length > 1 ? "m" : ""} sua atenção hoje.`
                : "Tudo em dia."}
        </div>
      </div>

      {erro && (
        <Card>
          <Erro
            titulo="Não consegui carregar suas pendências"
            motivo={erro.motivo}
            acoes={erro.acoes?.length ? erro.acoes : [{ rotulo: "Tentar de novo", onClick: carregar }]}
          />
        </Card>
      )}

      {!erro && semConexao && (
        <Card>
          <EstadoVazio
            titulo="Sem conexão com o banco"
            explicacao="O Supabase não está conectado nesta sessão — não dá pra saber o que precisa de atenção sem isso. Configure a conexão pra ver a fila real."
          />
        </Card>
      )}

      {!erro && !semConexao && fila === null && <Carregando linhas={4} />}

      {!erro && !semConexao && fila !== null && fila.length === 0 && (
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

      {!erro && !semConexao && fila !== null && fila.length > 0 && (
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
