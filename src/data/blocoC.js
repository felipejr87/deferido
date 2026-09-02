// Dados de demonstração do Bloco C (comunicação).

export const EVENTOS_NOTIFICACAO = [
  { evento: "proposta_enviada", label: "Proposta enviada", cliente: true, escritorio: false },
  { evento: "proposta_vista", label: "Proposta vista", cliente: false, escritorio: true },
  { evento: "proposta_aceita", label: "Proposta aceita", cliente: true, escritorio: true },
  { evento: "documento_pendente", label: "Documento pendente (D+2, D+5)", cliente: true, escritorio: false },
  { evento: "documento_recebido", label: "Documento recebido", cliente: false, escritorio: true },
  { evento: "etapa_concluida", label: "Etapa concluída", cliente: true, escritorio: false },
  { evento: "processo_pendencia", label: "Processo com pendência", cliente: true, escritorio: true },
  { evento: "processo_concluido", label: "Processo concluído", cliente: true, escritorio: true },
  { evento: "cobranca_a_vencer", label: "Cobrança a vencer (D-3)", cliente: true, escritorio: false },
  { evento: "cobranca_vencida", label: "Cobrança vencida (D+1, D+7)", cliente: true, escritorio: true },
  { evento: "obrigacao_a_vencer", label: "Obrigação a vencer (D-5 / D-10)", cliente: true, escritorio: true },
  { evento: "lead_sem_contato", label: "Lead sem contato há 3 dias", cliente: false, escritorio: true },
  { evento: "processo_parado", label: "Processo parado há 7 dias", cliente: false, escritorio: true },
];

export const TEMPLATES_SEED = [
  { id: "tp1", evento: "proposta_enviada", canal: "whatsapp", assunto: "", corpo: "Olá {{cliente_nome}}! Sua proposta {{proposta_numero}} da {{escritorio_nome}} está pronta: {{link}}", ativo: true },
  { id: "tp2", evento: "proposta_aceita", canal: "email", assunto: "Proposta {{proposta_numero}} aceita 🎉", corpo: "Recebemos o aceite de {{cliente_nome}} para a proposta {{proposta_numero}}. Já vamos iniciar o processo.", ativo: true },
  { id: "tp3", evento: "documento_pendente", canal: "whatsapp", assunto: "", corpo: "Oi {{cliente_nome}}, ainda falta você enviar: {{documentos_pendentes}}. Envie pelo link: {{link}}", ativo: true },
  { id: "tp4", evento: "processo_concluido", canal: "email", assunto: "Processo {{processo_numero}} concluído!", corpo: "Parabéns, {{cliente_nome}}! Seu processo foi concluído. Os documentos finais estão disponíveis em {{link}}.", ativo: true },
  { id: "tp5", evento: "cobranca_a_vencer", canal: "whatsapp", assunto: "", corpo: "Lembrete: sua cobrança de {{valor}} vence em {{vencimento}}. Link de pagamento: {{link}}", ativo: false },
];

export const NOTIFICACOES_LOG_SEED = [
  { id: "n1", destinatario: "ricardo.menezes@gmail.com", canal: "email", evento: "proposta_enviada", status: "enviado", enviadoEm: "22 ago · 09:15" },
  { id: "n2", destinatario: "+55 11 98844-2071", canal: "whatsapp", evento: "documento_pendente", status: "enviado", enviadoEm: "24 ago · 09:00" },
  { id: "n3", destinatario: "felipe@openlegaliza.com.br", canal: "email", evento: "proposta_vista", status: "enviado", enviadoEm: "27 ago · 14:02" },
  { id: "n4", destinatario: "+55 11 98844-2071", canal: "whatsapp", evento: "cobranca_a_vencer", status: "falha", erro: "Número inválido no provedor", enviadoEm: "28 ago · 09:00" },
];

export const REGUA_COBRANCA = [
  { dia: "D-3", tom: "Lembrete amigável", canal: "whatsapp", ativo: true },
  { dia: "D+1", tom: "Aviso de vencimento", canal: "email", ativo: true },
  { dia: "D+7", tom: "Cobrança formal", canal: "email + whatsapp", ativo: true },
  { dia: "D+15", tom: "Suspensão de serviço", canal: "email", ativo: false },
  { dia: "D+30", tom: "Protesto / negativação (manual)", canal: "—", ativo: false, manual: true },
];
