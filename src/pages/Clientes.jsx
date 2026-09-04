import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Page, Card, PrimaryButton, SecondaryButton, EstadoVazio, Explicacao, Field, inputStyle, Badge } from "../components/ui.jsx";
import { TrackedInput } from "../components/Tracked.jsx";
import { useToast } from "../context/ToastContext.jsx";
import { buscarClientesReais, buscarLeadsReais, criarClienteReal } from "../lib/data.js";
import { buscarCnpj } from "../lib/integracoes.js";
import { haQuantoTempo } from "../lib/vocabulario.js";
import { track } from "../lib/analytics.js";

// Simplificação radical de navegação (Passo 3): tela que faltava — o menu
// pedia "Clientes" mas não existia lista nenhuma. Unifica clientes reais e
// leads (que ainda não viraram cliente) numa tela só, com duas abas —
// pra quem opera o dia a dia, os dois são a mesma coisa: gente que pode
// dar dinheiro.
export default function Clientes() {
  const navigate = useNavigate();
  const { avisar } = useToast();
  const [aba, setAba] = useState("clientes");
  const [clientes, setClientes] = useState([]);
  const [leads, setLeads] = useState([]);
  const [real, setReal] = useState(false);
  const [novo, setNovo] = useState(null);

  const carregar = () => {
    buscarClientesReais().then((res) => {
      setClientes(res.dados);
      setReal(res.ok);
    });
    buscarLeadsReais().then((res) => setLeads(res.dados));
  };

  useEffect(() => {
    carregar();
  }, []);

  return (
    <Page style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Explicacao chave="clientes">
        Todo mundo que pode virar dinheiro: quem já é cliente e quem ainda está negociando.
      </Explicacao>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <div style={{ display: "flex", gap: 4, background: "#F1F3F6", borderRadius: 8, padding: 3 }}>
          <TabButton active={aba === "clientes"} onClick={() => setAba("clientes")}>
            Clientes ({clientes.length})
          </TabButton>
          <TabButton active={aba === "leads"} onClick={() => setAba("leads")}>
            Em negociação ({leads.length})
          </TabButton>
        </div>
        <PrimaryButton tag="cliente_novo_abrir" onClick={() => setNovo({ nome: "", documento: "", email: "", telefone: "" })}>
          Novo cliente
        </PrimaryButton>
      </div>

      {novo && (
        <NovoClienteForm
          novo={novo}
          setNovo={setNovo}
          onCancelar={() => setNovo(null)}
          onCriado={(nome) => {
            setNovo(null);
            avisar(`${nome} cadastrado.`);
            carregar();
          }}
        />
      )}

      {!real && (
        <Badge bg="#F1F3F6" fg="#5C6675">dados de exemplo (offline)</Badge>
      )}

      {aba === "clientes" &&
        (clientes.length === 0 ? (
          <Card>
            <EstadoVazio
              titulo="Nenhum cliente ainda"
              explicacao="Clientes aparecem aqui quando uma proposta é aceita, ou você pode cadastrar direto."
              acoes={[{ rotulo: "Novo cliente", onClick: () => setNovo({ nome: "", documento: "", email: "", telefone: "" }) }]}
            />
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {clientes.map((c) => (
              <Card key={c.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{c.nome}</div>
                  <div style={{ fontSize: 12, color: "#8A929E", marginTop: 2 }}>{c.documento || c.telefone || c.email || "—"}</div>
                </div>
                <div style={{ fontSize: 12, color: "#6B7480", textAlign: "right", flexShrink: 0 }}>
                  {c.processosAtivos > 0 ? `${c.processosAtivos} processo${c.processosAtivos > 1 ? "s" : ""} ativo${c.processosAtivos > 1 ? "s" : ""}` : "sem processo ativo"}
                </div>
                <SecondaryButton tag="cliente_ver" onClick={() => navigate("/processos")}>
                  Ver
                </SecondaryButton>
              </Card>
            ))}
          </div>
        ))}

      {aba === "leads" &&
        (leads.length === 0 ? (
          <Card>
            <EstadoVazio
              titulo="Ninguém em negociação agora"
              explicacao="Leads que ainda não viraram proposta aceita aparecem aqui."
            />
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {leads.map((l) => (
              <Card key={l.id} style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{l.nome}</div>
                  <div style={{ fontSize: 12, color: "#8A929E", marginTop: 2 }}>{l.interesse || l.telefone || "—"}</div>
                </div>
                <div style={{ fontSize: 12, color: "#6B7480" }}>{l.atualizado_em ? haQuantoTempo(l.atualizado_em) : ""}</div>
              </Card>
            ))}
          </div>
        ))}
    </Page>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "7px 14px",
        borderRadius: 6,
        border: "none",
        background: active ? "#fff" : "transparent",
        color: active ? "#14181F" : "#6B7480",
        fontWeight: active ? 600 : 400,
        fontSize: 12.5,
        cursor: "pointer",
        boxShadow: active ? "0 1px 2px rgba(0,0,0,.08)" : "none",
      }}
    >
      {children}
    </button>
  );
}

function NovoClienteForm({ novo, setNovo, onCancelar, onCriado }) {
  const [buscando, setBuscando] = useState(false);
  const [erroCnpj, setErroCnpj] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState("");

  const ehCnpj = novo.documento.replace(/\D/g, "").length === 14;

  const buscarPorCnpj = async () => {
    setErroCnpj("");
    setBuscando(true);
    const res = await buscarCnpj(novo.documento);
    setBuscando(false);
    if (!res.ok) {
      setErroCnpj(res.error);
      return;
    }
    setNovo((s) => ({ ...s, nome: res.data.razaoSocial || s.nome, email: res.data.email || s.email, telefone: res.data.telefone || s.telefone }));
    track("cliente_cnpj_autopreenchido", {});
  };

  const salvar = async () => {
    if (!novo.nome.trim()) {
      setErroSalvar("Falta o nome do cliente.");
      return;
    }
    setSalvando(true);
    setErroSalvar("");
    const res = await criarClienteReal({
      nome: novo.nome.trim(),
      documento: novo.documento || null,
      tipo: ehCnpj ? "pj" : "pf",
      email: novo.email,
      telefone: novo.telefone,
    });
    setSalvando(false);
    if (!res.ok) {
      setErroSalvar(res.motivo);
      return;
    }
    onCriado(res.nome);
  };

  return (
    <Card style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <Field label="CPF ou CNPJ" hint="digite o CNPJ e clique em buscar — o resto vem sozinho">
        <div style={{ display: "flex", gap: 6 }}>
          <TrackedInput
            tag="cliente_novo_doc"
            style={inputStyle}
            value={novo.documento}
            onChange={(e) => setNovo((s) => ({ ...s, documento: e.target.value }))}
          />
          {ehCnpj && (
            <SecondaryButton tag="cliente_novo_buscar_cnpj" onClick={buscarPorCnpj} style={{ whiteSpace: "nowrap" }}>
              {buscando ? "…" : "Buscar"}
            </SecondaryButton>
          )}
        </div>
        {erroCnpj && <span style={{ fontSize: 11, color: "#A33F36" }}>{erroCnpj}</span>}
      </Field>
      <Field label="Nome / razão social">
        <TrackedInput tag="cliente_novo_nome" style={inputStyle} value={novo.nome} onChange={(e) => setNovo((s) => ({ ...s, nome: e.target.value }))} />
      </Field>
      <Field label="E-mail">
        <TrackedInput tag="cliente_novo_email" style={inputStyle} value={novo.email} onChange={(e) => setNovo((s) => ({ ...s, email: e.target.value }))} />
      </Field>
      <Field label="Telefone">
        <TrackedInput tag="cliente_novo_telefone" style={inputStyle} value={novo.telefone} onChange={(e) => setNovo((s) => ({ ...s, telefone: e.target.value }))} />
      </Field>
      {erroSalvar && <div style={{ gridColumn: "1 / -1", fontSize: 12, color: "#A33F36" }}>{erroSalvar}</div>}
      <div style={{ gridColumn: "1 / -1", display: "flex", gap: 8 }}>
        <PrimaryButton tag="cliente_novo_salvar" onClick={salvar}>
          {salvando ? "Salvando…" : "Salvar cliente"}
        </PrimaryButton>
        <SecondaryButton tag="cliente_novo_cancelar" onClick={onCancelar}>
          Cancelar
        </SecondaryButton>
      </div>
    </Card>
  );
}
