import { useState } from "react";
import { TEMPLATES_SEED } from "../data/blocoC.js";
import { Page, Card, SectionTitle, Badge } from "../components/ui.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

export default function TemplatesMensagem() {
  const [templates, setTemplates] = useState(TEMPLATES_SEED);
  const [editandoId, setEditandoId] = useState(null);

  const atualizar = (id, corpo) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, corpo } : t)));
  };

  const salvar = (id) => {
    setEditandoId(null);
    track("template_mensagem_salvar", { template_id: id });
  };

  const toggleAtivo = (id) => {
    setTemplates((prev) => prev.map((t) => (t.id === id ? { ...t, ativo: !t.ativo } : t)));
    track("template_mensagem_toggle", { template_id: id });
  };

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ fontSize: 12.5, color: "#8A929E" }}>
        O escritório edita os textos das notificações sem depender de desenvolvedor. Variáveis como{" "}
        <code>{"{{cliente_nome}}"}</code>, <code>{"{{link}}"}</code> são substituídas no envio.
      </div>

      {templates.map((t) => (
        <Card key={t.id}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 13, fontWeight: 600, fontFamily: "monospace" }}>{t.evento}</span>
              <Badge bg="#F1F3F6" fg="#5C6675">
                {t.canal}
              </Badge>
              <Badge bg={t.ativo ? "#EAF6EE" : "#F1F3F6"} fg={t.ativo ? "#1F6F4C" : "#98A0AC"}>
                {t.ativo ? "ativo" : "inativo"}
              </Badge>
            </div>
            <Tracked as="div" tag="template_toggle_ativo" data={{ template_id: t.id }} onClick={() => toggleAtivo(t.id)} style={{ fontSize: 12, color: "#0A4D9E", cursor: "pointer" }}>
              {t.ativo ? "desativar" : "ativar"}
            </Tracked>
          </div>

          {editandoId === t.id ? (
            <>
              <TrackedInput
                as="textarea"
                tag={`template_corpo_${t.id}`}
                value={t.corpo}
                onChange={(e) => atualizar(t.id, e.target.value)}
                rows={3}
                style={{ width: "100%", padding: 10, border: "1px solid #DDE1E7", borderRadius: 6, fontSize: 13, fontFamily: "inherit", resize: "vertical" }}
              />
              <div style={{ marginTop: 8 }}>
                <Tracked as="div" tag="template_salvar" data={{ template_id: t.id }} onClick={() => salvar(t.id)} className="ol-btn-primary" style={{ display: "inline-block", padding: "8px 14px", borderRadius: 6, background: "#0A4D9E", color: "#fff", fontSize: 12.5, cursor: "pointer" }}>
                  Salvar
                </Tracked>
              </div>
            </>
          ) : (
            <div onDoubleClick={() => setEditandoId(t.id)} style={{ fontSize: 13, color: "#3C4453", lineHeight: 1.5, cursor: "text" }}>
              {t.corpo}
              <Tracked as="div" tag="template_editar" data={{ template_id: t.id }} onClick={() => setEditandoId(t.id)} style={{ fontSize: 11.5, color: "#0A4D9E", cursor: "pointer", marginTop: 6 }}>
                editar
              </Tracked>
            </div>
          )}
        </Card>
      ))}
    </Page>
  );
}
