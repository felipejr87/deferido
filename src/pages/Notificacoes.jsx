import { useState } from "react";
import { EVENTOS_NOTIFICACAO, NOTIFICACOES_LOG_SEED } from "../data/blocoC.js";
import { Page, Card, SectionTitle, Table, Th, Row, Badge, Field, inputStyle } from "../components/ui.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { track } from "../lib/analytics.js";

const gridColsMatrix = "minmax(220px,1.6fr) 90px 90px";
const gridColsLog = "minmax(180px,1.6fr) 100px minmax(160px,1.4fr) 100px 130px";

export default function Notificacoes() {
  const [emailAtivo, setEmailAtivo] = useState(true);
  const [whatsappAtivo, setWhatsappAtivo] = useState(false);
  const [horario, setHorario] = useState("09:00");

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card>
        <SectionTitle>Canais</SectionTitle>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" data-track="notif_email_ativo" checked={emailAtivo} onChange={(e) => { setEmailAtivo(e.target.checked); track("notif_email_ativo", { valor: e.target.checked }); }} />
            E-mail (via Resend) — {emailAtivo ? <Badge bg="#EAF6EE" fg="#1F6F4C">ativo</Badge> : <Badge bg="#F1F3F6" fg="#5C6675">inativo</Badge>}
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
            <input type="checkbox" data-track="notif_whatsapp_ativo" checked={whatsappAtivo} onChange={(e) => { setWhatsappAtivo(e.target.checked); track("notif_whatsapp_ativo", { valor: e.target.checked }); }} />
            WhatsApp (Z-API / Evolution / Cloud API) — <Badge bg="#F1F3F6" fg="#5C6675">requer credenciais em Integrações</Badge>
          </label>
          <div style={{ maxWidth: 220 }}>
            <Field label="Horário padrão de envio">
              <TrackedInput tag="notif_horario" type="time" style={inputStyle} value={horario} onChange={(e) => setHorario(e.target.value)} />
            </Field>
          </div>
        </div>
      </Card>

      <Card>
        <SectionTitle>Matriz de eventos</SectionTitle>
        <Table cols={gridColsMatrix}>
          <Th>Evento</Th>
          <Th>Cliente</Th>
          <Th>Escritório</Th>
        </Table>
        <div style={{ border: "1px solid #E4E7EC", borderTop: "none", overflowX: "auto" }}>
          {EVENTOS_NOTIFICACAO.map((e) => (
            <Row key={e.evento} cols={gridColsMatrix}>
              <div style={{ fontSize: 13 }}>{e.label}</div>
              <div>{e.cliente ? "✅" : "—"}</div>
              <div>{e.escritorio ? "✅" : "—"}</div>
            </Row>
          ))}
        </div>
      </Card>

      <Card>
        <SectionTitle>Log de envios</SectionTitle>
        <Table cols={gridColsLog}>
          <Th>Destinatário</Th>
          <Th>Canal</Th>
          <Th>Evento</Th>
          <Th>Status</Th>
          <Th>Quando</Th>
        </Table>
        <div style={{ border: "1px solid #E4E7EC", borderTop: "none", overflowX: "auto" }}>
          {NOTIFICACOES_LOG_SEED.map((n) => (
            <Row key={n.id} cols={gridColsLog}>
              <div style={{ fontSize: 12.5 }}>{n.destinatario}</div>
              <div style={{ fontSize: 12.5, textTransform: "capitalize" }}>{n.canal}</div>
              <div style={{ fontSize: 12, color: "#6B7480", fontFamily: "monospace" }}>{n.evento}</div>
              <div>
                <Badge bg={n.status === "enviado" ? "#EAF6EE" : "#FBEDEC"} fg={n.status === "enviado" ? "#1F6F4C" : "#A33F36"}>
                  {n.status}
                </Badge>
              </div>
              <div style={{ fontSize: 12, color: "#8A929E" }}>{n.enviadoEm}</div>
            </Row>
          ))}
        </div>
      </Card>
    </Page>
  );
}
