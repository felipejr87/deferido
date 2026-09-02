import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mic, Command } from "lucide-react";
import { useApp } from "../context/AppContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useFeature } from "../context/FeatureContext.jsx";
import { parseComando } from "../lib/comandos.js";
import { interpretarComandoIA } from "../lib/edgeFunctions.js";
import { supabaseConectado } from "../lib/supabaseClient.js";
import { vozDisponivel, criarReconhecimento, normalizarNumeros } from "../lib/voz.js";
import { track } from "../lib/analytics.js";
import { brl, SERVICOS, PROPOSTAS, PROCESSOS } from "../data/mock.js";

// Nível 4 (linguagem natural) + Nível 5 (voz), ver src/lib/comandos.js e
// src/lib/voz.js: parser local por regras, sem chamada de IA — honesto sobre
// isso na própria UI (rótulo "sem IA conectada"). Toda ação passa pelo card
// de confirmação antes de tocar em qualquer estado real.

function buscarLocal({ tipo, termo }) {
  const q = (termo || "").toLowerCase();
  if (tipo === "proposta") {
    const achados = PROPOSTAS.filter((p) => p.cliente.toLowerCase().includes(q) || p.numero.includes(q));
    return achados.length ? achados.map((p) => `${p.numero} ${p.cliente} — ${p.status}`).join(" · ") : `Nenhuma proposta encontrada para "${termo}".`;
  }
  if (tipo === "processo") {
    const achados = PROCESSOS.filter((p) => p.cliente.toLowerCase().includes(q) || p.numero.includes(q));
    return achados.length ? achados.map((p) => `${p.numero} ${p.cliente} — ${p.status}`).join(" · ") : `Nenhum processo encontrado para "${termo}".`;
  }
  if (tipo === "cliente") {
    const nomes = [...new Set([...PROPOSTAS, ...PROCESSOS].map((r) => r.cliente))].filter((n) => n.toLowerCase().includes(q));
    return nomes.length ? nomes.join(", ") : `Nenhum cliente encontrado para "${termo}".`;
  }
  return `Busca de ${tipo} não coberta nesta demo.`;
}

export default function CommandBar() {
  const on = useFeature("captura_comando_natural");
  const vozOn = useFeature("captura_voz");
  const navigate = useNavigate();
  const app = useApp();
  const { isAuthenticated } = useAuth();

  const [aberto, setAberto] = useState(false);
  const [texto, setTexto] = useState("");
  const [acao, setAcao] = useState(null);
  const [naoReconhecido, setNaoReconhecido] = useState(false);
  const [ouvindo, setOuvindo] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [processando, setProcessando] = useState(false);
  const inputRef = useRef(null);
  const recRef = useRef(null);

  useEffect(() => {
    if (!on) return;
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAberto((v) => {
          if (!v) track("commandbar_abrir", { via: "atalho" });
          return !v;
        });
      }
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [on]);

  useEffect(() => {
    if (aberto) setTimeout(() => inputRef.current?.focus(), 30);
  }, [aberto]);

  if (!on || !isAuthenticated) return null;

  const processar = async () => {
    setFeedback("");
    setProcessando(true);

    if (supabaseConectado) {
      const contexto = {
        catalogoServicos: SERVICOS.map((s) => ({ id: s.id, nome: s.nome, valor: s.valor })),
        clientesRecentes: [{ nome: app.cliente.nome, telefone: app.cliente.tel }],
        processosAbertos: [{ numero: 87, cliente: "Ricardo Menezes", status: app.processoDemo.status }],
      };
      const res = await interpretarComandoIA(texto, contexto);
      setProcessando(false);
      if (res.ok && res.acao?.tipo === "buscar") {
        // Só leitura — mostra direto, sem card de confirmação.
        setFeedback(buscarLocal(res.acao.dados));
        setAcao(null);
        return;
      }
      if (res.ok && res.acao) {
        track("comando_natural_processar", { texto, reconhecido: true, origem: "ia" });
        setNaoReconhecido(false);
        setAcao(res.acao);
        return;
      }
      if (res.ok && res.resposta) {
        track("comando_natural_processar", { texto, reconhecido: false, origem: "ia_resposta" });
        setFeedback(res.resposta);
        setAcao(null);
        return;
      }
      // IA indisponível/erro — cai pro parser local sem incomodar o operador.
    }

    setProcessando(false);
    const resultado = parseComando(texto);
    track("comando_natural_processar", { texto, reconhecido: Boolean(resultado), origem: "local" });
    if (!resultado) {
      setNaoReconhecido(true);
      setAcao(null);
      return;
    }
    setNaoReconhecido(false);
    setAcao(resultado);
  };

  const cancelar = () => {
    setAcao(null);
    setNaoReconhecido(false);
    setTexto("");
    track("comando_natural_cancelar", {});
  };

  const fechar = () => {
    setAberto(false);
    cancelar();
    setFeedback("");
  };

  const confirmar = () => {
    if (!acao) return;
    track("comando_natural_confirmar", { tipo: acao.tipo, dados: acao.dados });

    if (acao.tipo === "criar_proposta") {
      if (acao.dados.clienteNome) app.setCliente((c) => ({ ...c, nome: acao.dados.clienteNome }));
      if (acao.dados.servicoId) app.addItem(acao.dados.servicoId);
      if (acao.dados.parcelas > 1) app.setParcelas(String(acao.dados.parcelas));
      navigate("/propostas/nova");
      setFeedback(
        acao.dados.servicoId
          ? `Proposta iniciada com ${acao.dados.servicoNome}.`
          : `Proposta iniciada${acao.dados.clienteNome ? " para " + acao.dados.clienteNome : ""} — não achei "${acao.dados.servicoNome}" no catálogo, adicione manualmente.`,
      );
    }

    if (acao.tipo === "atualizar_processo") {
      app.atualizarProcessoDemo({ status: acao.dados.status, protocolo: acao.dados.protocolo, orgao: acao.dados.orgao });
      navigate(`/processos/0087`);
      setFeedback(`Processo #${acao.dados.processoNumero} atualizado.`);
    }

    if (acao.tipo === "registrar_documento") {
      const alvo = (acao.dados.documentoNome || "").toLowerCase();
      const doc = alvo ? app.DOCS.find((d) => d.nome.toLowerCase().includes(alvo)) : null;
      if (doc && !app.docsOk.includes(doc.id)) app.toggleDoc(doc.id);
      navigate(`/processos/0087`);
      setFeedback(doc ? `"${doc.nome}" marcado como recebido.` : "Documento não encontrado no checklist do processo #0087.");
    }

    if (acao.tipo === "criar_lead") {
      track("lead_criar_via_comando", acao.dados);
      setFeedback(`Lead de ${acao.dados.nome ?? "contato"} registrado no log. Fase 3 (funil de leads) está desligada nesta build — não há uma lista para ver o lead, mas a ação ficou na Auditoria.`);
    }

    setAcao(null);
    setTexto("");
    // Fecha sozinho depois de mostrar a confirmação — command palette não
    // deve ficar aberta depois que a ação já foi aplicada.
    setTimeout(() => {
      setAberto(false);
      setFeedback("");
    }, 1400);
  };

  const editarAntes = () => {
    if (acao?.tipo === "criar_proposta") {
      if (acao.dados.clienteNome) app.setCliente((c) => ({ ...c, nome: acao.dados.clienteNome }));
      navigate("/propostas/nova");
    } else if (acao?.tipo === "atualizar_processo" || acao?.tipo === "registrar_documento") {
      navigate("/processos/0087");
    }
    track("comando_natural_editar_antes", { tipo: acao?.tipo });
    fechar();
  };

  const toggleVoz = () => {
    if (!vozOn || !vozDisponivel()) return;
    if (ouvindo) {
      recRef.current?.stop();
      return;
    }
    const rec = criarReconhecimento({
      onResult: (transcript) => {
        setTexto(normalizarNumeros(transcript));
        track("voz_transcricao", { chars: transcript.length });
      },
      onEnd: () => setOuvindo(false),
      onError: (err) => {
        setOuvindo(false);
        track("voz_erro", { erro: err });
      },
    });
    recRef.current = rec;
    rec.start();
    setOuvindo(true);
    track("voz_iniciar", {});
  };

  return (
    <>
      <Command
        data-track="commandbar_hint"
        onClick={() => { track("commandbar_abrir", { via: "clique" }); setAberto(true); }}
        size={16}
        style={{ position: "fixed", bottom: 20, right: 76, width: 44, height: 44, padding: 13, boxSizing: "border-box", borderRadius: "50%", background: "#0A4D9E", color: "#fff", boxShadow: "0 6px 20px rgba(0,0,0,.25)", cursor: "pointer", zIndex: 1000 }}
      />

      {aberto && (
        <div
          onClick={fechar}
          style={{ position: "fixed", inset: 0, background: "rgba(14,20,32,.45)", zIndex: 1200, display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: "12vh" }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ width: 560, maxWidth: "92vw", background: "#fff", borderRadius: 14, boxShadow: "0 24px 60px rgba(0,0,0,.35)", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderBottom: "1px solid #EEF0F3" }}>
              <input
                ref={inputRef}
                data-track="commandbar_input"
                value={texto}
                onChange={(e) => { setTexto(e.target.value); setAcao(null); setNaoReconhecido(false); }}
                onKeyDown={(e) => e.key === "Enter" && processar()}
                placeholder='Descreva o que quer criar… ex: "abertura mei pra João Silva, 800 reais"'
                style={{ flex: 1, border: "none", outline: "none", fontSize: 14.5 }}
              />
              {vozOn && vozDisponivel() && (
                <Mic
                  data-track="commandbar_mic"
                  onClick={toggleVoz}
                  size={17}
                  style={{ cursor: "pointer", color: ouvindo ? "#A33F36" : "#8A929E", flexShrink: 0 }}
                />
              )}
            </div>

            <div style={{ padding: 16 }}>
              {processando && (
                <div style={{ fontSize: 12.5, color: "#8A929E" }}>Pensando…</div>
              )}
              {!processando && !acao && !naoReconhecido && !feedback && (
                <div style={{ fontSize: 12, color: "#98A0AC", lineHeight: 1.6 }}>
                  {supabaseConectado
                    ? "Assistente com IA (Claude) — entende linguagem livre, com fallback local se a chamada falhar."
                    : "Sem IA conectada — parser local por regras, só 4 formatos fixos (ver Integrações)."}{" "}
                  Enter para processar.
                </div>
              )}

              {feedback && (
                <div style={{ fontSize: 13, color: "#1F6F4C", background: "#EAF6EE", borderRadius: 8, padding: "10px 12px" }}>{feedback}</div>
              )}

              {naoReconhecido && (
                <div style={{ fontSize: 13, color: "#8A5A0B", background: "#FDF3E3", borderRadius: 8, padding: "10px 12px" }}>
                  Não reconheci esse formato. Tente algo como "protocolei o processo 87 na junta, protocolo 2026/887766".
                </div>
              )}

              {acao && (
                <div style={{ border: "1px solid #E4E7EC", borderRadius: 10, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{acao.descricao}</div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                    {Object.entries(acao.dados)
                      .filter(([, v]) => v !== null && v !== undefined)
                      .map(([k, v]) => (
                        <div key={k} style={{ fontSize: 12.5, color: "#4B5563", display: "flex", gap: 6 }}>
                          <span style={{ color: "#8A929E", minWidth: 110 }}>{k}:</span>
                          <span style={{ fontVariantNumeric: "tabular-nums" }}>{typeof v === "number" && k.toLowerCase().includes("valor") ? brl(v) : String(v)}</span>
                        </div>
                      ))}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                    <button data-track="commandbar_confirmar" onClick={confirmar} style={{ padding: "8px 14px", borderRadius: 6, background: "#0A4D9E", color: "#fff", fontSize: 12.5, cursor: "pointer" }}>
                      Confirmar
                    </button>
                    <button data-track="commandbar_editar" onClick={editarAntes} style={{ padding: "8px 14px", borderRadius: 6, border: "1px solid #DDE1E7", fontSize: 12.5, cursor: "pointer" }}>
                      Editar antes
                    </button>
                    <button data-track="commandbar_cancelar" onClick={cancelar} style={{ padding: "8px 14px", borderRadius: 6, fontSize: 12.5, color: "#98A0AC", cursor: "pointer" }}>
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
