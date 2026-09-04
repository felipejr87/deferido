import { useEffect, useRef, useState } from "react";

// Parte 0.7 da spec de fluxos: salvamento automático em todo formulário
// longo (2s depois de parar de digitar), pra nada se perder se a aba
// fechar. `salvar` deve ser idempotente pra chamada repetida (upsert, não
// insert) — ver salvarRascunhoAuto em src/lib/data.js.
export function useAutoSave(valor, salvar, { atraso = 2000, ativo = true } = {}) {
  const [estado, setEstado] = useState("ocioso"); // ocioso | salvando | salvo | erro
  const timer = useRef(null);
  const primeira = useRef(true);

  useEffect(() => {
    if (!ativo) return;
    if (primeira.current) {
      primeira.current = false;
      return;
    }

    clearTimeout(timer.current);
    setEstado("ocioso");

    timer.current = setTimeout(async () => {
      setEstado("salvando");
      try {
        await salvar(valor);
        setEstado("salvo");
        setTimeout(() => setEstado((e) => (e === "salvo" ? "ocioso" : e)), 2500);
      } catch {
        setEstado("erro");
      }
    }, atraso);

    return () => clearTimeout(timer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(valor), ativo]);

  return estado;
}

export function IndicadorSalvamento({ estado }) {
  if (estado === "ocioso") return null;
  const texto = { salvando: "Salvando…", salvo: "✓ Salvo", erro: "Não consegui salvar — vou tentar de novo" }[estado];
  const cor = estado === "erro" ? "#B42318" : "#667085";
  return <span style={{ fontSize: 12, color: cor }}>{texto}</span>;
}
