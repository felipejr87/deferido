import { useState } from "react";
import { USUARIOS as SEED_USUARIOS, PAPEL_PERMISSOES } from "../data/usuarios.js";
import { Page, Card, Table, Th, Row, Badge, PrimaryButton, SecondaryButton, Field, inputStyle } from "../components/ui.jsx";
import { Tracked, TrackedInput } from "../components/Tracked.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { track } from "../lib/analytics.js";

const gridCols = "minmax(180px,1.5fr) minmax(200px,1.7fr) 130px 140px 90px";

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState(SEED_USUARIOS);
  const [convidando, setConvidando] = useState(false);
  const [novo, setNovo] = useState({ nome: "", email: "", papel: "operador" });
  const { avisar, comDesfazer } = useToast();

  const convidar = () => {
    if (!novo.nome || !novo.email) return;
    const usuario = { id: `u${Date.now()}`, ...novo, ativo: true, ultimoAcesso: "convite enviado, aguardando ativação" };
    setUsuarios((prev) => [...prev, usuario]);
    track("usuario_convidar", { email: novo.email, papel: novo.papel });
    setNovo({ nome: "", email: "", papel: "operador" });
    setConvidando(false);
    avisar(`Convite enviado para ${usuario.email}.`);
  };

  const definirAtivo = (id, ativo) => {
    setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ativo } : u)));
    track(ativo ? "usuario_reativar" : "usuario_desativar", { usuario_id: id });
  };

  const toggleAtivo = (id) => {
    const usuario = usuarios.find((u) => u.id === id);
    if (usuario.ativo) {
      definirAtivo(id, false);
      comDesfazer(`${usuario.nome} desativado.`, () => definirAtivo(id, true));
    } else {
      definirAtivo(id, true);
      avisar(`${usuario.nome} reativado.`);
    }
  };

  return (
    <Page>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <div style={{ fontSize: 12.5, color: "#8A929E" }}>
          Convite por e-mail com link de ativação. Desativar preserva o histórico — nunca deleta.
        </div>
        {convidando ? (
          <SecondaryButton tag="usuario_abrir_convite" onClick={() => setConvidando((v) => !v)}>
            Cancelar
          </SecondaryButton>
        ) : (
          <PrimaryButton tag="usuario_abrir_convite" onClick={() => setConvidando((v) => !v)}>
            Convidar usuário
          </PrimaryButton>
        )}
      </div>

      {convidando && (
        <Card style={{ marginBottom: 16, display: "grid", gridTemplateColumns: "1.4fr 1.4fr 1fr auto", gap: 12, alignItems: "end" }}>
          <Field label="Nome">
            <TrackedInput tag="convite_nome" style={inputStyle} value={novo.nome} onChange={(e) => setNovo((s) => ({ ...s, nome: e.target.value }))} />
          </Field>
          <Field label="E-mail">
            <TrackedInput tag="convite_email" type="email" style={inputStyle} value={novo.email} onChange={(e) => setNovo((s) => ({ ...s, email: e.target.value }))} />
          </Field>
          <Field label="Papel">
            <TrackedInput as="select" tag="convite_papel" className="ol-select" style={inputStyle} value={novo.papel} onChange={(e) => setNovo((s) => ({ ...s, papel: e.target.value }))}>
              {Object.entries(PAPEL_PERMISSOES).map(([k, v]) => (
                <option key={k} value={k}>
                  {v.label}
                </option>
              ))}
            </TrackedInput>
          </Field>
          <PrimaryButton tag="convite_enviar" onClick={convidar}>
            Enviar convite
          </PrimaryButton>
        </Card>
      )}

      <Table cols={gridCols}>
        <Th>Nome</Th>
        <Th>E-mail</Th>
        <Th>Papel</Th>
        <Th>Último acesso</Th>
        <Th right>Ação</Th>
      </Table>
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderTop: "none", borderRadius: "0 0 9px 9px", overflowX: "auto" }}>
        {usuarios.map((u) => (
          <Row key={u.id} cols={gridCols}>
            <div style={{ fontWeight: 500, opacity: u.ativo ? 1 : 0.5 }}>{u.nome}</div>
            <div style={{ fontSize: 12.5, color: "#4B5563", opacity: u.ativo ? 1 : 0.5 }}>{u.email}</div>
            <div>
              <Badge bg="#EAF1FB" fg="#0A4D9E">
                {PAPEL_PERMISSOES[u.papel].label}
              </Badge>
            </div>
            <div style={{ fontSize: 12, color: "#8A929E" }}>{u.ultimoAcesso}</div>
            <div style={{ textAlign: "right" }}>
              <Tracked as="div" tag="usuario_toggle_ativo" data={{ usuario_id: u.id }} onClick={() => toggleAtivo(u.id)} style={{ fontSize: 12, cursor: "pointer", color: u.ativo ? "#A33F36" : "#1F6F4C" }}>
                {u.ativo ? "Desativar" : "Reativar"}
              </Tracked>
            </div>
          </Row>
        ))}
      </div>

      <div style={{ marginTop: 20, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 12 }}>
        {Object.entries(PAPEL_PERMISSOES).map(([k, v]) => (
          <Card key={k}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{v.label}</div>
            <div style={{ fontSize: 12.5, color: "#6B7480" }}>{v.descricao}</div>
          </Card>
        ))}
      </div>
    </Page>
  );
}
