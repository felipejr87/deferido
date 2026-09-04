import { useRef, useState } from "react";
import { ARQUIVOS_DEMO } from "../data/blocoB.js";
import { Page, Table, Th, Row, Badge, SecondaryButton, PrimaryButton, EstadoVazio, Field, inputStyle } from "../components/ui.jsx";
import { TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";
import { extrairDocumento, arquivoParaBase64, CAMPOS_POR_TIPO, TIPOS_DOCUMENTO } from "../lib/ocr.js";
import { useFeature } from "../context/FeatureContext.jsx";

const gridCols = "minmax(200px,1.6fr) minmax(140px,1fr) 90px 90px 110px 130px";
const LIMITE_MB = 15;
const TIPOS_PERMITIDOS = [".pdf", ".jpg", ".jpeg", ".png"];

export default function Arquivos() {
  const ocrOn = useFeature("captura_ocr");
  const [arquivos, setArquivos] = useState(ARQUIVOS_DEMO);
  const [erro, setErro] = useState("");
  const [pendente, setPendente] = useState(null); // { file, tipoDocumento, extraindo, erroExtracao, campos, metodo }
  const inputRef = useRef(null);

  const onFiles = (fileList) => {
    setErro("");
    const file = fileList[0];
    if (!file) return;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    if (!TIPOS_PERMITIDOS.includes(ext)) {
      setErro(`Tipo não permitido: ${file.name}. Aceitos: ${TIPOS_PERMITIDOS.join(", ")}.`);
      return;
    }
    if (file.size > LIMITE_MB * 1024 * 1024) {
      setErro(`${file.name} passa de ${LIMITE_MB} MB.`);
      return;
    }

    if (ocrOn) {
      setPendente({ file, tipoDocumento: "rg", extraindo: false, erroExtracao: "", campos: {}, metodo: null });
    } else {
      salvarArquivo(file, {}, "sem_ocr");
    }
  };

  const salvarArquivo = (file, campos, metodo) => {
    const existente = arquivos.find((a) => a.nome === file.name);
    const novo = {
      id: `f${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      nome: file.name,
      cliente: "Ricardo Menezes",
      tamanho: `${(file.size / 1024).toFixed(0)} KB`,
      enviadoPor: "escritorio",
      versao: existente ? existente.versao + 1 : 1,
      criadoEm: new Date().toLocaleString("pt-BR"),
      dadosExtraidos: Object.keys(campos).length ? campos : null,
      metodoExtracao: metodo,
    };
    setArquivos((prev) => [novo, ...prev]);
    track("arquivo_upload", { nome: file.name, tamanho_bytes: file.size, versao: novo.versao, metodo });
    setPendente(null);
  };

  const tentarExtracao = async () => {
    setPendente((p) => ({ ...p, extraindo: true, erroExtracao: "" }));
    const base64 = await arquivoParaBase64(pendente.file);
    const res = await extrairDocumento({ arquivoBase64: base64, mimeType: pendente.file.type, tipoDocumento: pendente.tipoDocumento });
    track("ocr_tentar_extracao", { tipo: pendente.tipoDocumento, sucesso: res.ok });
    if (res.ok) {
      setPendente((p) => ({ ...p, extraindo: false, campos: res.dados, metodo: "ocr" }));
    } else {
      setPendente((p) => ({ ...p, extraindo: false, erroExtracao: res.erro, metodo: "manual" }));
    }
  };

  const camposDoTipo = pendente ? CAMPOS_POR_TIPO[pendente.tipoDocumento] || [] : [];

  return (
    <Page>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
        <div style={{ fontSize: 12.5, color: "#8A929E" }}>
          Upload local nesta demo — em produção vai para Supabase Storage, bucket por escritório. Reenviar um arquivo com
          o mesmo nome cria uma nova versão, sem sobrescrever.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <input ref={inputRef} type="file" accept={TIPOS_PERMITIDOS.join(",")} style={{ display: "none" }} onChange={(e) => onFiles(e.target.files)} />
          <SecondaryButton tag="arquivo_selecionar" onClick={() => inputRef.current?.click()}>
            Enviar arquivo
          </SecondaryButton>
          <SecondaryButton tag="arquivo_baixar_zip" onClick={() => track("arquivo_baixar_zip", { total: arquivos.length })}>
            Baixar tudo (.zip)
          </SecondaryButton>
        </div>
      </div>

      {erro && <div style={{ background: "#FBEDEC", color: "#A33F36", borderRadius: 8, padding: "10px 12px", fontSize: 12.5, marginBottom: 14 }}>{erro}</div>}

      {pendente && (
        <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderRadius: 9, padding: 18, marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{pendente.file.name}</div>

          <Field label="Tipo de documento">
            <TrackedInput
              as="select"
              tag="ocr_tipo_documento"
              className="ol-select"
              style={inputStyle}
              value={pendente.tipoDocumento}
              onChange={(e) => setPendente((p) => ({ ...p, tipoDocumento: e.target.value, campos: {}, erroExtracao: "", metodo: null }))}
            >
              {TIPOS_DOCUMENTO.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </TrackedInput>
          </Field>

          {!pendente.metodo && (
            <SecondaryButton tag="ocr_tentar" onClick={tentarExtracao}>
              {pendente.extraindo ? "Tentando…" : "Extrair dados automaticamente"}
            </SecondaryButton>
          )}

          {pendente.erroExtracao && (
            <div style={{ fontSize: 12.5, color: "#8A5A0B", background: "#FDF9F1", border: "1px solid #F0DFC0", borderRadius: 8, padding: "10px 12px" }}>
              {pendente.erroExtracao} Preencha manualmente abaixo — o card de confirmação é o mesmo dos dois caminhos.
            </div>
          )}

          {pendente.metodo === "ocr" && (
            <div style={{ fontSize: 12.5, color: "#1F6F4C", background: "#EAF6EE", borderRadius: 8, padding: "10px 12px" }}>
              Extraído automaticamente — revise os campos antes de confirmar.
            </div>
          )}

          {pendente.metodo && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {camposDoTipo.map((campo) => (
                <Field key={campo} label={campo.replace(/_/g, " ")}>
                  <TrackedInput
                    tag={`ocr_campo_${campo}`}
                    style={inputStyle}
                    value={pendente.campos[campo] ?? ""}
                    onChange={(e) => setPendente((p) => ({ ...p, campos: { ...p.campos, [campo]: e.target.value } }))}
                  />
                </Field>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8 }}>
            {pendente.metodo && (
              <PrimaryButton tag="ocr_confirmar" onClick={() => salvarArquivo(pendente.file, pendente.campos, pendente.metodo)}>
                Confirmar e salvar arquivo
              </PrimaryButton>
            )}
            {!pendente.metodo && (
              <SecondaryButton tag="ocr_pular" onClick={() => setPendente((p) => ({ ...p, metodo: "manual" }))}>
                Pular extração e preencher manualmente
              </SecondaryButton>
            )}
            <SecondaryButton tag="ocr_cancelar" onClick={() => setPendente(null)}>
              Cancelar
            </SecondaryButton>
          </div>
        </div>
      )}

      {arquivos.length === 0 ? (
        <EstadoVazio
          titulo="Nenhum arquivo"
          explicacao="Documentos enviados pelo cliente aparecem aqui."
          acoes={[{ rotulo: "Enviar arquivo", tag: "arquivo_selecionar_vazio", onClick: () => inputRef.current?.click() }]}
        />
      ) : (
        <>
          <Table cols={gridCols}>
            <Th>Arquivo</Th>
            <Th>Cliente</Th>
            <Th>Tamanho</Th>
            <Th>Versão</Th>
            <Th>Enviado por</Th>
            <Th>Quando</Th>
          </Table>
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderTop: "none", borderRadius: "0 0 9px 9px", overflowX: "auto" }}>
            {arquivos.map((a) => (
              <Row key={a.id} cols={gridCols}>
                <div style={{ fontWeight: 500, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
                  {a.nome}
                  {a.dadosExtraidos && (
                    <Badge bg={a.metodoExtracao === "ocr" ? "#EAF6EE" : "#F1F3F6"} fg={a.metodoExtracao === "ocr" ? "#1F6F4C" : "#5C6675"}>
                      {a.metodoExtracao === "ocr" ? "dados por OCR" : "dados manuais"}
                    </Badge>
                  )}
                </div>
                <div style={{ fontSize: 12.5, color: "#4B5563" }}>{a.cliente}</div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>{a.tamanho}</div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>v{a.versao}</div>
                <div>
                  <Badge bg={a.enviadoPor === "cliente" ? "#EAF1FB" : "#F1F3F6"} fg={a.enviadoPor === "cliente" ? "#0A4D9E" : "#5C6675"}>
                    {a.enviadoPor === "cliente" ? "Cliente" : "Escritório"}
                  </Badge>
                </div>
                <div style={{ fontSize: 12, color: "#8A929E" }}>{a.criadoEm}</div>
              </Row>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
