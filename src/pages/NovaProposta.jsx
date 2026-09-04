import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CATS, brl } from "../data/mock.js";
import { useApp } from "../context/AppContext.jsx";
import { useFeature } from "../context/FeatureContext.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { buscarCnpj } from "../lib/integracoes.js";
import { sugerirCnae } from "../data/cnae.js";
import { salvarPropostaReal } from "../lib/data.js";
import { supabaseConectado } from "../lib/supabaseClient.js";
import { SecondaryButton, Badge } from "../components/ui.jsx";
import { useIsMobile } from "../hooks/useIsMobile.js";

const OPCOES_PARCELAS = [
  { value: "1", label: "À vista" },
  { value: "2", label: "2× sem juros" },
  { value: "3", label: "3× sem juros" },
  { value: "6", label: "6× sem juros" },
];

const NOVO_NUMERO = "#0149";
const TOKEN = "a7f3c1e908d2b45f";

export default function NovaProposta() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const {
    escritorio,
    catalogo,
    linhas,
    addItem,
    bumpItem,
    removeItem,
    desconto,
    setDesconto,
    parcelas,
    setParcelas,
    cliente,
    setCliente,
    subtotal,
    descontoNum,
    total,
    custos,
    margem,
    parcelasNum,
  } = useApp();

  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(null);

  const mostrarMargem = useFeature("fase1_mostrar_margem");
  const whatsappOn = useFeature("fase1_whatsapp_share");
  const pdfOn = useFeature("fase1_pdf_proposta");
  const cnpjLookupOn = useFeature("e_cnpj_lookup");
  const cnpjAvancadoOn = useFeature("captura_cnpj_avancado");
  const cnaeSugestaoOn = useFeature("captura_cnae_sugestao");

  const [buscandoCnpj, setBuscandoCnpj] = useState(false);
  const [erroCnpj, setErroCnpj] = useState("");
  const [dadosCnpj, setDadosCnpj] = useState(null);
  const [atividade, setAtividade] = useState("");

  const ehCnpj = cliente.doc.replace(/\D/g, "").length === 14;
  const cnaeSugerido = cnaeSugestaoOn ? sugerirCnae(atividade) : null;

  const handleBuscarCnpj = async () => {
    setErroCnpj("");
    setBuscandoCnpj(true);
    const res = await buscarCnpj(cliente.doc);
    setBuscandoCnpj(false);
    if (!res.ok) {
      setErroCnpj(res.error);
      setDadosCnpj(null);
      return;
    }
    setCliente((s) => ({
      ...s,
      nome: res.data.razaoSocial || s.nome,
      email: res.data.email || s.email,
      tel: res.data.telefone || s.tel,
    }));
    if (cnpjAvancadoOn) setDadosCnpj(res.data);
    track("captura_cnpj_avancado_preenchido", { socios: res.data.socios?.length ?? 0, regime: res.data.regimeProvavel });
  };

  const margemCor = total > 0 && margem / total < 0.4 ? "#A33F36" : "#1F6F4C";
  const parcelaTexto = parcelasNum > 1 ? `${parcelasNum}× de ${brl(total / parcelasNum)}` : "Pagamento à vista";

  const enviarWhatsapp = () => {
    track("proposta_enviar_whatsapp", { numero: NOVO_NUMERO, total });
    const link = `${window.location.origin}/propostas/publica`;
    const msg = encodeURIComponent(
      `Olá ${cliente.nome.split(" ")[0]}! Aqui está sua proposta ${NOVO_NUMERO} da ${escritorio.nome}: ${link}`,
    );
    const tel = cliente.tel.replace(/\D/g, "");
    window.open(`https://wa.me/55${tel}?text=${msg}`, "_blank", "noopener");
    navigate("/propostas/publica");
  };

  const baixarPdf = () => {
    track("proposta_baixar_pdf", { numero: NOVO_NUMERO });
    window.print();
  };

  const itemMock = linhas.find((l) => l.servico._mock);

  const salvarRascunho = async () => {
    track("proposta_salvar_rascunho", { numero: NOVO_NUMERO });
    if (!supabaseConectado || linhas.length === 0) {
      setSalvo({ ok: false, motivo: !supabaseConectado ? "Supabase não conectado nesta sessão." : "Adicione ao menos um serviço antes de salvar." });
      return;
    }
    if (itemMock) {
      setSalvo({ ok: false, motivo: `"${itemMock.servico.nome}" não está no catálogo real (dados de exemplo offline) — recarregue a página ou cadastre o serviço em Catálogo antes de salvar.` });
      return;
    }
    setSalvando(true);
    setSalvo(null);
    const res = await salvarPropostaReal({ cliente, linhas, subtotal, descontoNum, total, parcelasNum });
    setSalvando(false);
    setSalvo(res);
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "minmax(0,1fr) 372px", gap: 0, alignItems: "start", minHeight: "100%" }}>
      <div style={{ minWidth: 0, padding: isMobile ? "16px 16px 24px 16px" : "24px 28px 40px 28px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18 }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>Cliente</div>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 12 }}>
            <Field label="Nome / razão social">
              <TrackedInput
                tag="cliente_nome_input"
                className="ol-input"
                style={inputStyle}
                value={cliente.nome}
                onChange={(e) => setCliente((c) => ({ ...c, nome: e.target.value }))}
              />
            </Field>
            <Field label="CPF / CNPJ">
              <div style={{ display: "flex", gap: 6 }}>
                <TrackedInput
                  tag="cliente_doc_input"
                  className="ol-input"
                  style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
                  value={cliente.doc}
                  onChange={(e) => setCliente((c) => ({ ...c, doc: e.target.value }))}
                />
                {cnpjLookupOn && ehCnpj && (
                  <SecondaryButton tag="cliente_buscar_cnpj" onClick={handleBuscarCnpj} style={{ whiteSpace: "nowrap", padding: "9px 12px" }}>
                    {buscandoCnpj ? "…" : "Buscar"}
                  </SecondaryButton>
                )}
              </div>
              {erroCnpj && <span style={{ fontSize: 11, color: "#A33F36" }}>{erroCnpj}</span>}
            </Field>
            <Field label="WhatsApp">
              <TrackedInput
                tag="cliente_tel_input"
                className="ol-input"
                style={{ ...inputStyle, fontVariantNumeric: "tabular-nums" }}
                value={cliente.tel}
                onChange={(e) => setCliente((c) => ({ ...c, tel: e.target.value }))}
              />
            </Field>
            <Field label="E-mail">
              <TrackedInput
                tag="cliente_email_input"
                className="ol-input"
                style={inputStyle}
                value={cliente.email}
                onChange={(e) => setCliente((c) => ({ ...c, email: e.target.value }))}
              />
            </Field>
            {cnaeSugestaoOn && (
              <Field label="Atividade pretendida" hint="sugere CNAE por palavra-chave, sem IA">
                <TrackedInput
                  tag="cliente_atividade_input"
                  className="ol-input"
                  style={inputStyle}
                  placeholder="ex: comércio de roupas, cabeleireiro, consultoria em TI…"
                  value={atividade}
                  onChange={(e) => setAtividade(e.target.value)}
                />
                {cnaeSugerido && (
                  <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, fontFamily: "monospace", color: "#6B7480" }}>{cnaeSugerido.codigo}</span>
                    <span style={{ fontSize: 12.5 }}>{cnaeSugerido.descricao}</span>
                    {cnaeSugerido.permitidoMei ? (
                      <Badge bg="#EAF6EE" fg="#1F6F4C">permitido MEI</Badge>
                    ) : (
                      <Badge bg="#FBEDEC" fg="#A33F36">não permitido MEI</Badge>
                    )}
                  </div>
                )}
                {!cnaeSugerido && atividade.trim().length > 2 && (
                  <div style={{ marginTop: 6, fontSize: 11.5, color: "#98A0AC" }}>Nenhum CNAE do recorte casou com esse termo — busque em Consulta de CNAE.</div>
                )}
              </Field>
            )}
          </div>

          {dadosCnpj && (
            <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid #EEF0F3", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontSize: 11, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase" }}>
                Preenchido automaticamente pela Receita (BrasilAPI)
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                <Badge bg="#EAF1FB" fg="#0A4D9E">{dadosCnpj.situacao}</Badge>
                {dadosCnpj.cnaePrincipal && <Badge bg="#F1F3F6" fg="#5C6675">{dadosCnpj.cnaeCodigo} · {dadosCnpj.cnaePrincipal}</Badge>}
                <Badge bg="#F1F3F6" fg="#5C6675">regime provável: {dadosCnpj.regimeProvavel}</Badge>
              </div>
              {dadosCnpj.socios?.length > 0 && (
                <div style={{ fontSize: 12.5, color: "#4B5563" }}>
                  Sócios: {dadosCnpj.socios.map((s) => s.nome).join(", ")}
                </div>
              )}
              {dadosCnpj.endereco?.logradouro && (
                <div style={{ fontSize: 12.5, color: "#4B5563" }}>
                  {dadosCnpj.endereco.logradouro}, {dadosCnpj.endereco.numero} — {dadosCnpj.endereco.municipio}/{dadosCnpj.endereco.uf}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18 }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Catálogo de serviços</div>
            <div style={{ fontSize: 12, color: "#8A929E" }}>
              {catalogo.carregando ? "Carregando…" : "Clique para adicionar à proposta"}
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 10 }}>
            {catalogo.servicos.map((s) => {
              const margemS = s.valor - s.custo;
              return (
                <Tracked
                  key={s.id}
                  as="div"
                  tag="catalogo_add_item"
                  data={{ servico_id: s.id, nome: s.nome }}
                  className="ol-catalogo-card"
                  onClick={() => addItem(s.id)}
                  style={{
                    border: "1px solid #E4E7EC",
                    borderRadius: 8,
                    padding: "12px 13px",
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 7,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <span
                      style={{
                        fontSize: 10.5,
                        letterSpacing: ".05em",
                        textTransform: "uppercase",
                        color: "#6B7480",
                        background: "#F1F3F6",
                        padding: "2px 7px",
                        borderRadius: 4,
                      }}
                    >
                      {CATS[s.cat]}
                    </span>
                    <span style={{ fontSize: 10.5, color: "#8A929E" }}>{s.prazo ? `${s.prazo} dias` : "recorrente"}</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.nome}</div>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                    <span style={{ fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 600 }}>
                      {s.cobranca === "recorrente" ? `${brl(s.valor)}/mês` : brl(s.valor)}
                    </span>
                    <span style={{ fontSize: 11.5, color: "#8A929E" }}>
                      {s.custo ? `margem ${brl(margemS)}` : "sem custo externo"}
                    </span>
                  </div>
                </Tracked>
              );
            })}
          </div>
        </div>
      </div>

      <div
        style={{
          borderLeft: isMobile ? "none" : "1px solid #E4E7EC",
          borderTop: isMobile ? "1px solid #E4E7EC" : "none",
          background: "#fff",
          padding: isMobile ? "20px 16px 32px 16px" : "24px 24px 40px 24px",
          minHeight: "100%",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Proposta {NOVO_NUMERO}</div>
          <div style={{ fontSize: 11.5, color: "#8A929E" }}>Rascunho</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
          {linhas.map((l) => (
            <div key={l.id} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "11px 0", borderBottom: "1px solid #EEF0F3" }}>
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{l.servico.nome}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Tracked
                    as="div"
                    tag="item_qtd_menos"
                    data={{ servico_id: l.id }}
                    className="ol-stepper"
                    onClick={() => bumpItem(l.id, -1)}
                    style={stepperStyle}
                  >
                    −
                  </Tracked>
                  <div style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums", minWidth: 14, textAlign: "center" }}>
                    {l.qtd}
                  </div>
                  <Tracked
                    as="div"
                    tag="item_qtd_mais"
                    data={{ servico_id: l.id }}
                    className="ol-stepper"
                    onClick={() => bumpItem(l.id, 1)}
                    style={stepperStyle}
                  >
                    +
                  </Tracked>
                  <div style={{ fontSize: 12, color: "#8A929E" }}>× {brl(l.servico.valor)}</div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{brl(l.total)}</div>
                <Tracked
                  as="div"
                  tag="item_remover"
                  data={{ servico_id: l.id }}
                  className="ol-remover"
                  onClick={() => removeItem(l.id)}
                  style={{ fontSize: 11.5, color: "#98A0AC", cursor: "pointer" }}
                >
                  remover
                </Tracked>
              </div>
            </div>
          ))}
        </div>

        {linhas.length === 0 && (
          <div style={{ border: "1px dashed #DDE1E7", borderRadius: 8, padding: "22px 14px", textAlign: "center", fontSize: 12.5, color: "#98A0AC" }}>
            Nenhum serviço adicionado
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 9, paddingTop: 4 }}>
          <Row label="Subtotal" value={brl(subtotal)} />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#6B7480" }}>Desconto</span>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: "#98A0AC", fontSize: 12.5 }}>R$</span>
              <TrackedInput
                tag="desconto_input"
                className="ol-input"
                style={{ width: 78, padding: "6px 9px", border: "1px solid #DDE1E7", borderRadius: 6, textAlign: "right", outline: "none", fontSize: 13, fontVariantNumeric: "tabular-nums" }}
                value={desconto}
                onChange={(e) => setDesconto(e.target.value)}
              />
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#6B7480" }}>Pagamento</span>
            <TrackedInput
              as="select"
              tag="parcelas_select"
              className="ol-select"
              style={{ padding: "6px 9px", border: "1px solid #DDE1E7", borderRadius: 6, background: "#fff", outline: "none", fontSize: 13 }}
              value={parcelas}
              onChange={(e) => setParcelas(e.target.value)}
            >
              {OPCOES_PARCELAS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </TrackedInput>
          </div>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", paddingTop: 11, borderTop: "1px solid #E4E7EC" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>Total</span>
            <span style={{ fontSize: 22, fontWeight: 600, letterSpacing: "-.02em", fontVariantNumeric: "tabular-nums" }}>{brl(total)}</span>
          </div>
          <div style={{ textAlign: "right", fontSize: 12, color: "#8A929E", fontVariantNumeric: "tabular-nums" }}>{parcelaTexto}</div>
        </div>

        {mostrarMargem && (
          <div style={{ background: "#F7F8FA", border: "1px solid #E9ECF0", borderRadius: 8, padding: "12px 13px", display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ fontSize: 11, color: "#8A929E", letterSpacing: ".05em", textTransform: "uppercase" }}>Margem estimada</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, color: "#6B7480" }}>Custos de terceiros</span>
              <span style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>− {brl(custos)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>Sobra real</span>
              <span style={{ fontSize: 14, fontWeight: 600, fontVariantNumeric: "tabular-nums", color: margemCor }}>{brl(margem)}</span>
            </div>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: "auto", paddingTop: 8 }}>
          {whatsappOn && (
            <Tracked
              as="div"
              tag="enviar_whatsapp"
              data={{ numero: NOVO_NUMERO }}
              className="ol-btn-primary"
              onClick={enviarWhatsapp}
              style={{ padding: 11, borderRadius: 7, background: escritorio.corPrimaria, color: "#fff", textAlign: "center", fontSize: 13, fontWeight: 500, cursor: "pointer" }}
            >
              Enviar por WhatsApp
            </Tracked>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <Tracked
              as="div"
              tag="salvar_rascunho"
              className="ol-btn-secondary"
              onClick={salvarRascunho}
              style={{ padding: 10, border: "1px solid #DDE1E7", borderRadius: 7, textAlign: "center", fontSize: 12.5, cursor: "pointer", color: "#3C4453" }}
            >
              {salvando ? "Salvando…" : "Salvar rascunho"}
            </Tracked>
            {pdfOn && (
              <Tracked
                as="div"
                tag="baixar_pdf"
                className="ol-btn-secondary"
                onClick={baixarPdf}
                style={{ padding: 10, border: "1px solid #DDE1E7", borderRadius: 7, textAlign: "center", fontSize: 12.5, cursor: "pointer" }}
              >
                Baixar PDF
              </Tracked>
            )}
          </div>
          {salvo && (
            <div style={{ fontSize: 12, color: salvo.ok ? "#1F6F4C" : "#A33F36", background: salvo.ok ? "#EAF6EE" : "#FBEDEC", borderRadius: 8, padding: "8px 10px" }}>
              {salvo.ok ? `Rascunho salvo como proposta ${salvo.numero} no Postgres.` : salvo.motivo}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 11.5, color: "#6B7480", letterSpacing: ".03em", textTransform: "uppercase" }}>{label}</span>
      {children}
      {hint && <span style={{ fontSize: 11, color: "#98A0AC", fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>{hint}</span>}
    </label>
  );
}

function Row({ label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13 }}>
      <span style={{ color: "#6B7480" }}>{label}</span>
      <span style={{ fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

const inputStyle = {
  padding: "9px 11px",
  border: "1px solid #DDE1E7",
  borderRadius: 6,
  background: "#fff",
  outline: "none",
  fontSize: 13.5,
};

const stepperStyle = {
  width: 20,
  height: 20,
  border: "1px solid #DDE1E7",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  fontSize: 13,
  color: "#6B7480",
};
