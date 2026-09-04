import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { extrairLeadDaConversa } from "../lib/extracaoLocal.js";
import { extrairLeadIA } from "../lib/edgeFunctions.js";
import { supabaseConectado } from "../lib/supabaseClient.js";
import { PrimaryButton, SecondaryButton, Badge } from "./ui.jsx";
import { Tracked, TrackedInput } from "./Tracked.jsx";
import { track } from "../lib/analytics.js";

const PLACEHOLDER = `Cole aqui a conversa do WhatsApp…

ex:
Maria Silva
Oi, vi vocês no Instagram. Quero abrir um MEI de cabeleireira.
Meu número é 11 98877-6655`;

// servico_sugerido da IA é um enum fixo (supabase/functions/extrair-lead).
// Mapeia pra um termo de busca e casa contra o catálogo real via
// catalogo.porNome — em vez de um id fixo do mock.
const ENUM_PARA_TERMO = {
  abertura_mei: "mei",
  abertura_ltda: "ltda",
  alteracao: "alteracao",
  encerramento: "encerramento",
  alvara: "alvara",
  contabilidade: "contabilidade",
  outro: null,
};

export default function ImportarConversa({ onFechar }) {
  const navigate = useNavigate();
  const { setCliente, addItem, catalogo } = useApp();
  const [conversa, setConversa] = useState("");
  const [extraido, setExtraido] = useState(null);
  const [extraindo, setExtraindo] = useState(false);

  const extrair = async () => {
    setExtraindo(true);
    if (supabaseConectado) {
      const res = await extrairLeadIA(conversa);
      if (res.ok) {
        const d = res.dados;
        const termo = ENUM_PARA_TERMO[d.servico_sugerido];
        const servico = termo ? catalogo.porNome(termo) : null;
        setExtraido({
          nome: d.nome,
          telefone: d.telefone,
          email: d.email,
          servicoSugerido: d.servico_sugerido,
          servicoId: servico?.id ?? null,
          interesse: d.interesse,
          observacoes: d.observacoes,
          proximoPasso: d.proximo_passo,
          metodo: "ia",
        });
        track("conversa_extrair", { metodo: "ia" });
        setExtraindo(false);
        return;
      }
      track("conversa_extrair_ia_falhou", { erro: res.erro });
    }
    // Fallback local — sem IA conectada ou chamada falhou.
    const resultado = extrairLeadDaConversa(conversa, catalogo);
    track("conversa_extrair", { metodo: resultado.metodo });
    setExtraido(resultado);
    setExtraindo(false);
  };

  const usarNaProposta = () => {
    setCliente((c) => ({
      ...c,
      nome: extraido.nome || c.nome,
      tel: extraido.telefone || c.tel,
    }));
    if (extraido.servicoId) addItem(extraido.servicoId);
    track("conversa_usar_na_proposta", { servico_id: extraido.servicoId });
    navigate("/propostas/nova");
    onFechar?.();
  };

  return (
    <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>Importar conversa (WhatsApp)</div>
        <Tracked as="div" tag="conversa_fechar" onClick={onFechar} style={{ fontSize: 12, color: "#8A929E", cursor: "pointer" }}>
          fechar
        </Tracked>
      </div>
      <div style={{ fontSize: 11.5, color: "#98A0AC" }}>
        {supabaseConectado
          ? "Extração via Claude (Edge Function extrair-lead) — cai pra regras locais se a chamada falhar. Revise antes de usar."
          : "Supabase não conectado nesta sessão — usando extração local por regras. Revise antes de usar."}
      </div>
      <TrackedInput
        as="textarea"
        tag="conversa_textarea"
        value={conversa}
        onChange={(e) => { setConversa(e.target.value); setExtraido(null); }}
        placeholder={PLACEHOLDER}
        rows={6}
        style={{ width: "100%", padding: 10, border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
      />
      {!extraido && (
        <SecondaryButton tag="conversa_extrair_btn" onClick={extrair}>
          {extraindo ? "Extraindo…" : "Extrair dados"}
        </SecondaryButton>
      )}

      {extraido && (
        <div style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <div>
            <Badge bg={extraido.metodo === "ia" ? "#EAF6EE" : "#F1F3F6"} fg={extraido.metodo === "ia" ? "#1F6F4C" : "#5C6675"}>
              {extraido.metodo === "ia" ? "extraído por IA" : "extração local (regras)"}
            </Badge>
          </div>
          <Linha label="Nome" valor={extraido.nome} />
          <Linha label="Telefone" valor={extraido.telefone} />
          <Linha label="E-mail" valor={extraido.email} />
          <Linha label="Serviço sugerido" valor={extraido.servicoSugerido} />
          {extraido.proximoPasso && <Linha label="Próximo passo" valor={extraido.proximoPasso} />}
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            <PrimaryButton tag="conversa_usar" onClick={usarNaProposta}>
              Usar em Nova Proposta
            </PrimaryButton>
            <SecondaryButton tag="conversa_descartar" onClick={() => setExtraido(null)}>
              Tentar de novo
            </SecondaryButton>
          </div>
        </div>
      )}
    </div>
  );
}

function Linha({ label, valor }) {
  return (
    <div style={{ fontSize: 12.5, display: "flex", gap: 6 }}>
      <span style={{ color: "#8A929E", minWidth: 110 }}>{label}:</span>
      <span style={{ color: valor ? "#14181F" : "#B4BBC4" }}>{valor || "não identificado"}</span>
    </div>
  );
}
