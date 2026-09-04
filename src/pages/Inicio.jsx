import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, supabaseConectado } from "../lib/supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Page, Card, EstadoVazio, SecondaryButton, Carregando, Erro, Explicacao } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { traduzirErro } from "../lib/erros.js";
import { buscarClientesReais, buscarPropostasReais } from "../lib/data.js";

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

const CHAVE_PULAR_GUIA = "guia_primeiro_acesso_pulado";

// Passo 6 da simplificação de navegação: substitui a rota /onboarding por
// um guia embutido no topo do "Hoje", que some sozinho quando os 4 passos
// terminam. Dois passos têm sinal real (cliente/proposta cadastrados no
// banco); os outros dois (config do escritório, revisar catálogo) não têm
// onde persistir "feito" no schema atual — usam localStorage, marcado
// quando a pessoa de fato salva/visita essas telas (ver EscritorioConfig.jsx
// e Servicos.jsx), honesto sobre ser um sinal local, não um dado real.
function GuiaPrimeiroAcesso() {
  const navigate = useNavigate();
  const { escritorio } = useApp();
  const [totalClientes, setTotalClientes] = useState(null);
  const [totalPropostas, setTotalPropostas] = useState(null);
  const [pulado, setPulado] = useState(() => {
    try {
      return localStorage.getItem(CHAVE_PULAR_GUIA) === "1";
    } catch {
      return false;
    }
  });
  const lido = (chave) => {
    try {
      return localStorage.getItem(chave) === "1";
    } catch {
      return false;
    }
  };

  useEffect(() => {
    buscarClientesReais().then((res) => setTotalClientes(res.ok ? res.dados.length : 0));
    buscarPropostasReais().then((res) => setTotalPropostas(res.ok ? res.dados.length : 0));
  }, []);

  if (pulado || totalClientes === null || totalPropostas === null) return null;

  const passos = [
    { chave: "escritorio", label: "Complete os dados do seu escritório", ajuda: "Nome e cor aparecem nas propostas que o cliente recebe", feito: lido("guia_passo_escritorio") || escritorio.nome !== "Open Legaliza", path: "/config/escritorio" },
    { chave: "servicos", label: "Confira seu catálogo de serviços", ajuda: "Ajuste os valores para os seus", feito: lido("guia_passo_servicos"), path: "/servicos" },
    { chave: "cliente", label: "Cadastre seu primeiro cliente", ajuda: "Digite só o CNPJ — o resto o sistema busca sozinho", feito: totalClientes > 0, path: "/clientes" },
    { chave: "proposta", label: "Crie sua primeira proposta", ajuda: "Escolha o cliente, marque os serviços e envie o link", feito: totalPropostas > 0, path: "/propostas/nova" },
  ];

  const feitos = passos.filter((p) => p.feito).length;
  if (feitos === passos.length) return null;

  const pular = () => {
    try {
      localStorage.setItem(CHAVE_PULAR_GUIA, "1");
    } catch {
      // ignora
    }
    track("guia_primeiro_acesso_pular", { feitos });
    setPulado(true);
  };

  return (
    <Card style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Configurando seu sistema</div>
        <div style={{ fontSize: 11.5, color: "#8A929E" }}>{feitos} de {passos.length}</div>
      </div>
      <div style={{ height: 4, borderRadius: 3, background: "#EDEFF3", overflow: "hidden" }}>
        <div style={{ height: "100%", background: escritorio.corPrimaria, width: `${(feitos / passos.length) * 100}%` }} />
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {passos.map((p) => (
          <div key={p.chave} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid #EEF0F3" }}>
            <span style={{ fontSize: 14, color: p.feito ? "#1F6F4C" : "#B4BBC4" }}>{p.feito ? "✓" : "○"}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, textDecoration: p.feito ? "line-through" : "none", color: p.feito ? "#8A929E" : "#14181F" }}>{p.label}</div>
              {!p.feito && <div style={{ fontSize: 11.5, color: "#98A0AC", marginTop: 1 }}>{p.ajuda}</div>}
            </div>
            {!p.feito && (
              <SecondaryButton tag="guia_passo_ir" data={{ chave: p.chave }} onClick={() => navigate(p.path)}>
                {p.chave === "cliente" ? "Cadastrar" : p.chave === "proposta" ? "Criar" : "Ajustar"}
              </SecondaryButton>
            )}
          </div>
        ))}
      </div>
      <div style={{ textAlign: "right" }}>
        <Tracked as="div" tag="guia_pular" onClick={pular} style={{ fontSize: 12, color: "#98A0AC", cursor: "pointer", display: "inline-block" }}>
          Pular por enquanto
        </Tracked>
      </div>
    </Card>
  );
}

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
      <Explicacao chave="inicio">
        Esta é sua lista de pendências. O sistema olha prazos, documentos e propostas e mostra o que precisa de você primeiro.
      </Explicacao>

      <GuiaPrimeiroAcesso />

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
