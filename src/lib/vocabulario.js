// Traduz o vocabulário do banco para linguagem de gente.
// Regra: se você não diria em voz alta, não escreva aqui.

export const STATUS_PROPOSTA = {
  rascunho: { label: "Rascunho", cor: "neutro", ajuda: "Ainda não foi enviada" },
  enviada: { label: "Enviada", cor: "info", ajuda: "Aguardando o cliente abrir" },
  vista: { label: "Cliente abriu", cor: "atencao", ajuda: "Viu mas ainda não respondeu" },
  aceita: { label: "Aceita", cor: "sucesso", ajuda: "Cliente aceitou" },
  recusada: { label: "Recusada", cor: "erro", ajuda: "Cliente não seguiu" },
  expirada: { label: "Prazo venceu", cor: "neutro", ajuda: "Passou da validade" },
  arquivada: { label: "Arquivada", cor: "neutro", ajuda: "" },
};

export const STATUS_PROCESSO = {
  aguardando_docs: { label: "Esperando documentos", cor: "atencao", ajuda: "O cliente ainda precisa enviar" },
  em_andamento: { label: "Em andamento", cor: "info", ajuda: "Trabalhando nisso" },
  aguardando_orgao: { label: "No órgão", cor: "info", ajuda: "Protocolado, aguardando análise" },
  pendencia: { label: "Tem exigência", cor: "erro", ajuda: "O órgão pediu algo a mais" },
  concluido: { label: "Concluído", cor: "sucesso", ajuda: "Deferido e entregue" },
  cancelado: { label: "Cancelado", cor: "neutro", ajuda: "" },
};

export const STATUS_COBRANCA = {
  pendente: { label: "A receber", cor: "info" },
  pago: { label: "Pago", cor: "sucesso" },
  atrasado: { label: "Atrasado", cor: "erro" },
  cancelado: { label: "Cancelado", cor: "neutro" },
};

export const CAMPOS = {
  cliente_nome: "nome do cliente",
  cliente_doc: "CPF ou CNPJ",
  cliente_email: "email",
  cliente_telefone: "telefone",
  protocolo: "número do protocolo",
  orgao: "órgão",
  valor: "valor",
  vencimento: "data de vencimento",
  prazo_estimado: "prazo de entrega",
  observacoes: "uma observação",
};

export function haQuantoTempo(data) {
  if (!data) return "";
  const dias = Math.floor((Date.now() - new Date(data).getTime()) / 86400000);
  if (dias <= 0) return "hoje";
  if (dias === 1) return "ontem";
  if (dias < 7) return `há ${dias} dias`;
  if (dias < 14) return "há uma semana";
  if (dias < 30) return `há ${Math.floor(dias / 7)} semanas`;
  if (dias < 60) return "há um mês";
  return `há ${Math.floor(dias / 30)} meses`;
}

export function emQuantoTempo(data) {
  if (!data) return "";
  const dias = Math.ceil((new Date(data).getTime() - Date.now()) / 86400000);
  if (dias < 0) return `venceu ${haQuantoTempo(data)}`;
  if (dias === 0) return "vence hoje";
  if (dias === 1) return "vence amanhã";
  if (dias < 7) return `vence em ${dias} dias`;
  return `vence em ${new Date(data).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}`;
}

export function rotuloStatus(entidade, status) {
  const mapa = { proposta: STATUS_PROPOSTA, processo: STATUS_PROCESSO, cobranca: STATUS_COBRANCA }[entidade];
  return mapa?.[status] || { label: status, cor: "neutro", ajuda: "" };
}

export function rotuloCampo(campo) {
  return CAMPOS[campo] || String(campo).replace(/_/g, " ");
}
