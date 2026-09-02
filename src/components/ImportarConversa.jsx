import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import { extrairLeadDaConversa } from "../lib/extracaoLocal.js";
import { PrimaryButton, SecondaryButton } from "./ui.jsx";
import { Tracked, TrackedInput } from "./Tracked.jsx";
import { track } from "../lib/analytics.js";

const PLACEHOLDER = `Cole aqui a conversa do WhatsApp…

ex:
Maria Silva
Oi, vi vocês no Instagram. Quero abrir um MEI de cabeleireira.
Meu número é 11 98877-6655`;

export default function ImportarConversa({ onFechar }) {
  const navigate = useNavigate();
  const { setCliente, addItem } = useApp();
  const [conversa, setConversa] = useState("");
  const [extraido, setExtraido] = useState(null);

  const extrair = () => {
    const resultado = extrairLeadDaConversa(conversa);
    track("conversa_extrair", { metodo: resultado.metodo, achou_nome: Boolean(resultado.nome), achou_telefone: Boolean(resultado.telefone) });
    setExtraido(resultado);
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
        Extração local por regras (telefone, e-mail, palavra-chave de serviço) — sem IA conectada. Revise antes de usar.
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
        <SecondaryButton tag="conversa_extrair_btn" onClick={extrair} style={{ alignSelf: "flex-start" }}>
          Extrair dados
        </SecondaryButton>
      )}

      {extraido && (
        <div style={{ border: "1px solid #E4E7EC", borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
          <Linha label="Nome" valor={extraido.nome} />
          <Linha label="Telefone" valor={extraido.telefone} />
          <Linha label="E-mail" valor={extraido.email} />
          <Linha label="Serviço sugerido" valor={extraido.servicoSugerido} />
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
