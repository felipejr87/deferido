import { useApp } from "../context/AppContext.jsx";
import { Page, Card, Table, Th, Row, Badge, EmptyState } from "../components/ui.jsx";

const gridCols = "150px minmax(160px,1.2fr) minmax(200px,2fr) 110px";

export default function Assinaturas() {
  const { assinaturas } = useApp();

  return (
    <Page>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nível 1 — nativo (ativo)</div>
        <div style={{ fontSize: 12.5, color: "#6B7480" }}>
          Aceite com registro de IP, timestamp, nome, CPF/CNPJ e hash SHA-256 do conteúdo assinado — calculado de
          verdade no navegador (Web Crypto). Válido para contratos entre partes conforme MP 2.200-2/2001.
        </div>
      </Card>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Nível 2 — certificado digital (não conectado)</div>
        <div style={{ fontSize: 12.5, color: "#6B7480" }}>
          Para contratos de maior valor: integração com Clicksign, D4Sign ou ZapSign. Precisa de credenciais do
          provedor — configure em Configurações → Integrações quando decidir contratar.
        </div>
      </Card>

      {assinaturas.length === 0 ? (
        <EmptyState title="Nenhuma assinatura registrada ainda" hint="Aceite uma proposta no Link da proposta para ver o registro aqui." />
      ) : (
        <>
          <Table cols={gridCols}>
            <Th>Assinado em</Th>
            <Th>Signatário</Th>
            <Th>Hash (SHA-256)</Th>
            <Th>Provedor</Th>
          </Table>
          <div style={{ background: "#fff", border: "1px solid #E4E7EC", borderTop: "none", borderRadius: "0 0 9px 9px", overflow: "hidden" }}>
            {assinaturas.map((a) => (
              <Row key={a.id} cols={gridCols}>
                <div style={{ fontSize: 12, color: "#8A929E" }}>{new Date(a.assinadoEm).toLocaleString("pt-BR")}</div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{a.signatarioNome}</div>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: "#6B7480", wordBreak: "break-all" }}>{a.hashDocumento}</div>
                <div>
                  <Badge bg="#F1F3F6" fg="#5C6675">
                    {a.provedor ?? "nativo"}
                  </Badge>
                </div>
              </Row>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}
