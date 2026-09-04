import { useState } from "react";
import { ESCRITORIOS_SAAS, PLANOS } from "../data/saas.js";
import { useApp } from "../context/AppContext.jsx";
import { Page, Table, Th, Row, Badge } from "../components/ui.jsx";
import { Tracked } from "../components/Tracked.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { track } from "../lib/analytics.js";

const STATUS_UI = {
  ativo: { bg: "#EAF6EE", fg: "#1F6F4C" },
  trial: { bg: "#EAF1FB", fg: "#0A4D9E" },
  inadimplente: { bg: "#FBEDEC", fg: "#A33F36" },
  suspenso: { bg: "#F1F3F6", fg: "#5C6675" },
};

const gridCols = "minmax(180px,1.5fr) 110px 90px 120px 110px 130px 100px";

export default function SuperAdmin() {
  const [escritorios, setEscritorios] = useState(ESCRITORIOS_SAAS);
  const { setEscritorio } = useApp();
  const { avisar, comDesfazer } = useToast();

  const definirStatus = (id, status) => {
    setEscritorios((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)));
    track("saas_toggle_suspenso", { escritorio_id: id, status });
  };

  const toggleSuspenso = (id) => {
    const alvo = escritorios.find((e) => e.id === id);
    const statusAnterior = alvo.status;
    const suspendendo = alvo.status !== "suspenso";
    definirStatus(id, suspendendo ? "suspenso" : "ativo");
    if (suspendendo) {
      comDesfazer(`"${alvo.nome}" suspenso — os usuários perdem acesso imediatamente.`, () => definirStatus(id, statusAnterior));
    } else {
      avisar(`"${alvo.nome}" reativado.`);
    }
  };

  const impersonar = (e) => {
    setEscritorio((s) => ({ ...s, nome: e.nome }));
    track("saas_impersonate", { escritorio_id: e.id });
  };

  return (
    <Page>
      <div style={{ fontSize: 12.5, color: "#8A929E", marginBottom: 16 }}>
        Visão do dono do SaaS — só existe se a Open Legaliza decidir vender o sistema para outros escritórios (Fase 7,
        desligada por padrão). "Entrar como" troca o nome do escritório ativo, sem apagar sessão real.
      </div>
      <Table cols={gridCols}>
        <Th>Escritório</Th>
        <Th>Plano</Th>
        <Th>Usuários</Th>
        <Th>Processos/mês</Th>
        <Th>Status</Th>
        <Th>Desde</Th>
        <Th right>Ação</Th>
      </Table>
      <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderTop: "none", borderRadius: "0 0 9px 9px", overflowX: "auto" }}>
        {escritorios.map((e) => {
          const st = STATUS_UI[e.status];
          const plano = PLANOS.find((p) => p.id === e.plano);
          return (
            <Row key={e.id} cols={gridCols}>
              <div style={{ fontWeight: 500 }}>{e.nome}</div>
              <div style={{ fontSize: 12.5, color: "#4B5563" }}>{plano?.nome}</div>
              <div style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{e.usuarios}</div>
              <div style={{ fontSize: 12.5, fontVariantNumeric: "tabular-nums" }}>{e.processosNoMes}</div>
              <div>
                <Badge bg={st.bg} fg={st.fg}>
                  {e.status}
                </Badge>
              </div>
              <div style={{ fontSize: 12, color: "#8A929E" }}>{e.cadastradoEm}</div>
              <div style={{ textAlign: "right", display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <Tracked as="div" tag="saas_impersonar" data={{ escritorio_id: e.id }} onClick={() => impersonar(e)} style={{ fontSize: 12, color: "#0A4D9E", cursor: "pointer" }}>
                  Entrar como
                </Tracked>
                <Tracked as="div" tag="saas_toggle_suspenso" data={{ escritorio_id: e.id }} onClick={() => toggleSuspenso(e.id)} style={{ fontSize: 12, color: e.status === "suspenso" ? "#1F6F4C" : "#A33F36", cursor: "pointer" }}>
                  {e.status === "suspenso" ? "Reativar" : "Suspender"}
                </Tracked>
              </div>
            </Row>
          );
        })}
      </div>
    </Page>
  );
}
