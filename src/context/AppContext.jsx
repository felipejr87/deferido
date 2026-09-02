import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { SERVICOS, ETAPAS, DOCS } from "../data/mock.js";
import { track } from "../lib/analytics.js";
import { sha256Hex } from "../lib/hash.js";

const AppContext = createContext(null);

const DEFAULT_ESCRITORIO = {
  id: "open-legaliza",
  nome: "Open Legaliza",
  corPrimaria: "#0A4D9E",
};

export function AppProvider({ children }) {
  const [escritorio, setEscritorio] = useState(DEFAULT_ESCRITORIO);

  // Estado do construtor de proposta (equivalente ao state do DCLogic no mock)
  const [itens, setItens] = useState([
    { id: 2, qtd: 1 },
    { id: 5, qtd: 1 },
  ]);
  const [desconto, setDesconto] = useState("150");
  const [parcelas, setParcelas] = useState("3");
  const [cliente, setCliente] = useState({
    nome: "Ricardo Menezes",
    doc: "128.440.902-55",
    tel: "(11) 98844-2071",
    email: "ricardo.menezes@gmail.com",
  });

  // Estado do aceite digital (portal público da proposta)
  const [aceiteNome, setAceiteNome] = useState("");
  const [aceito, setAceito] = useState(false);
  const [assinaturas, setAssinaturas] = useState([]);

  // Estado do processo de demonstração (#0087) — inclui campos mutáveis por
  // comando em linguagem natural ("protocolei o processo 45 na junta...").
  const [etapasOk, setEtapasOk] = useState([1, 2]);
  const [docsOk, setDocsOk] = useState([1, 2, 5]);
  const [processoDemo, setProcessoDemo] = useState({
    status: "aguardando_orgao",
    orgao: "Junta Comercial de São Paulo",
    protocolo: "JCSP-2026-441802",
  });

  const atualizarProcessoDemo = useCallback((patch) => {
    setProcessoDemo((prev) => ({ ...prev, ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v != null)) }));
    track("processo_atualizar_via_comando", patch);
  }, []);

  const addItem = useCallback((id) => {
    setItens((prev) => {
      const existing = prev.find((i) => i.id === id);
      if (existing) return prev.map((i) => (i.id === id ? { ...i, qtd: i.qtd + 1 } : i));
      return [...prev, { id, qtd: 1 }];
    });
    track("proposta_item_adicionado", { servico_id: id });
  }, []);

  const bumpItem = useCallback((id, delta) => {
    setItens((prev) => prev.map((i) => (i.id === id ? { ...i, qtd: Math.max(1, i.qtd + delta) } : i)));
    track("proposta_item_quantidade", { servico_id: id, delta });
  }, []);

  const removeItem = useCallback((id) => {
    setItens((prev) => prev.filter((i) => i.id !== id));
    track("proposta_item_removido", { servico_id: id });
  }, []);

  const toggleEtapa = useCallback((id) => {
    setEtapasOk((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    track("processo_etapa_toggle", { etapa_id: id });
  }, []);

  const toggleDoc = useCallback((id) => {
    setDocsOk((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
    track("processo_documento_toggle", { doc_id: id });
  }, []);

  const linhas = useMemo(
    () =>
      itens.map((i) => {
        const servico = SERVICOS.find((s) => s.id === i.id);
        return { ...i, servico, total: servico.valor * i.qtd, custo: servico.custo * i.qtd };
      }),
    [itens],
  );

  const subtotal = useMemo(() => linhas.reduce((a, l) => a + l.total, 0), [linhas]);
  const descontoNum = useMemo(() => Math.min(Number(desconto || 0), subtotal), [desconto, subtotal]);
  const total = subtotal - descontoNum;
  const custos = useMemo(() => linhas.reduce((a, l) => a + l.custo, 0), [linhas]);
  const margem = total - custos;
  const parcelasNum = Number(parcelas || 1);

  const aceitarProposta = useCallback(async () => {
    const ok = aceiteNome.trim().length > 2;
    track("proposta_aceite_tentado", { sucesso: ok });
    if (!ok) return;

    // Assinatura eletrônica nível 1 (Bloco B2): hash SHA-256 real do
    // conteúdo assinado, calculado no navegador via Web Crypto.
    const conteudo = JSON.stringify({ itens: linhas.map((l) => ({ id: l.id, qtd: l.qtd, total: l.total })), total, aceiteNome, ts: Date.now() });
    const hash = await sha256Hex(conteudo);
    const registro = {
      id: `sig-${Date.now()}`,
      documentoTipo: "proposta",
      signatarioNome: aceiteNome.trim(),
      hashDocumento: hash,
      assinadoEm: new Date().toISOString(),
      provedor: null,
    };
    setAssinaturas((prev) => [registro, ...prev]);
    track("proposta_aceitar_proposta", { hash });
    setAceito(true);
  }, [aceiteNome, linhas, total]);

  const value = {
    escritorio,
    setEscritorio,
    itens,
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
    aceiteNome,
    setAceiteNome,
    aceito,
    aceitarProposta,
    assinaturas,
    etapasOk,
    toggleEtapa,
    docsOk,
    toggleDoc,
    ETAPAS,
    DOCS,
    processoDemo,
    atualizarProcessoDemo,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp deve ser usado dentro de <AppProvider>");
  return ctx;
}
