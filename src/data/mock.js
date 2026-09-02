// Dados de demonstração — refletem o catálogo e os exemplos do layout
// aprovado (Open Legaliza - Fase 1.dc.html). Em produção isto vem das
// tabelas `servicos`, `propostas`, `processos` etc. descritas na spec.

export const SERVICOS = [
  { id: 1, nome: "Abertura MEI", cat: "abertura", cobranca: "pontual", valor: 350, custo: 0, prazo: 3, etapas: "Dados → Protocolo → CNPJ emitido" },
  { id: 2, nome: "Abertura ME / LTDA", cat: "abertura", cobranca: "pontual", valor: 1200, custo: 550, prazo: 15, etapas: "Viabilidade → Contrato social → Junta → Receita → CNPJ" },
  { id: 3, nome: "Alteração contratual", cat: "alteracao", cobranca: "pontual", valor: 800, custo: 320, prazo: 20, etapas: "Análise → Minuta → Junta → Deferimento" },
  { id: 4, nome: "Encerramento / baixa", cat: "encerramento", cobranca: "pontual", valor: 950, custo: 380, prazo: 30, etapas: "Certidões → Distrato → Junta → Receita" },
  { id: 5, nome: "Alvará de funcionamento", cat: "alvara", cobranca: "pontual", valor: 450, custo: 180, prazo: 25, etapas: "Documentos → Protocolo prefeitura → Vistoria → Emissão" },
  { id: 6, nome: "Alvará vigilância sanitária", cat: "alvara", cobranca: "pontual", valor: 520, custo: 210, prazo: 30, etapas: "Documentos → Protocolo → Vistoria → Emissão" },
  { id: 7, nome: "Curso de gestão para MEI", cat: "curso", cobranca: "pontual", valor: 290, custo: 0, prazo: 1, etapas: "Matrícula → Acesso liberado" },
  { id: 8, nome: "Contabilidade mensal", cat: "contabil", cobranca: "recorrente", valor: 380, custo: 0, prazo: null, etapas: "Cobrança automática mensal" },
  { id: 9, nome: "Jurídico — contratos e consultoria", cat: "juridico", cobranca: "pontual", valor: 1500, custo: 0, prazo: 10, etapas: "Briefing → Minuta → Revisão → Entrega" },
];

export const PROPOSTAS = [
  { numero: "#0148", cliente: "Marina Ribeiro Alimentos", doc: "51.882.104/0001-22", servicos: "Alteração contratual", total: 800, status: "aceita", data: "28 ago" },
  { numero: "#0147", cliente: "Douglas Prado", doc: "CPF 044.812.330-17", servicos: "Abertura MEI + Curso", total: 590, status: "vista", data: "27 ago" },
  { numero: "#0146", cliente: "Ateliê Casa Nove LTDA", doc: "48.201.775/0001-90", servicos: "Alvará de funcionamento", total: 450, status: "enviada", data: "26 ago" },
  { numero: "#0145", cliente: "Ricardo Menezes", doc: "CPF 128.440.902-55", servicos: "Abertura ME / LTDA", total: 1200, status: "aceita", data: "22 ago" },
  { numero: "#0144", cliente: "Clínica Vitta ME", doc: "39.774.021/0001-14", servicos: "Alvará vigilância sanitária", total: 520, status: "recusada", data: "19 ago" },
  { numero: "#0143", cliente: "Padaria Trigo Bom", doc: "22.906.318/0001-73", servicos: "Contabilidade mensal", total: 380, status: "aceita", data: "15 ago" },
];

export const STATUS = {
  rascunho: { bg: "#F1F3F6", fg: "#5C6675", label: "Rascunho" },
  enviada: { bg: "#EAF1FB", fg: "#0A4D9E", label: "Enviada" },
  vista: { bg: "#FDF3E3", fg: "#8A5A0B", label: "Vista" },
  aceita: { bg: "#EAF6EE", fg: "#1F6F4C", label: "Aceita" },
  recusada: { bg: "#FBEDEC", fg: "#A33F36", label: "Recusada" },
};

export const CATS = {
  abertura: "Abertura",
  alteracao: "Alteração",
  encerramento: "Encerramento",
  alvara: "Alvará",
  curso: "Curso",
  contabil: "Contábil",
  juridico: "Jurídico",
};

export const PROCESSOS = [
  { numero: "#0087", cliente: "Ricardo Menezes", servico: "Abertura ME / LTDA", status: "aguardando_orgao", resp: "Camila", orgao: "Junta Comercial", protocolo: "JCSP-2026-441802", inicio: "22 ago", prazo: "12 set", feitas: 2, total: 5, parado: 6 },
  { numero: "#0086", cliente: "Marina Ribeiro Alimentos", servico: "Alteração contratual", status: "em_andamento", resp: "Felipe", orgao: "Junta Comercial", protocolo: "—", inicio: "28 ago", prazo: "18 set", feitas: 1, total: 4, parado: 1 },
  { numero: "#0085", cliente: "Ateliê Casa Nove LTDA", servico: "Alvará de funcionamento", status: "aguardando_docs", resp: "Camila", orgao: "Prefeitura", protocolo: "—", inicio: "26 ago", prazo: "21 set", feitas: 0, total: 4, parado: 9 },
  { numero: "#0084", cliente: "Padaria Trigo Bom", servico: "Alvará vigilância sanitária", status: "pendencia", resp: "Felipe", orgao: "Vigilância Sanitária", protocolo: "VS-9920-26", inicio: "12 ago", prazo: "09 set", feitas: 2, total: 4, parado: 4 },
  { numero: "#0083", cliente: "Douglas Prado", servico: "Abertura MEI", status: "concluido", resp: "Camila", orgao: "Receita Federal", protocolo: "51.902.774/0001-08", inicio: "27 ago", prazo: "30 ago", feitas: 3, total: 3, parado: 0 },
  { numero: "#0082", cliente: "Clínica Vitta ME", servico: "Encerramento / baixa", status: "em_andamento", resp: "Felipe", orgao: "Junta Comercial", protocolo: "JCSP-2026-438110", inicio: "04 ago", prazo: "03 set", feitas: 2, total: 4, parado: 2 },
];

export const ETAPAS = [
  { id: 1, nome: "Consulta de viabilidade", prazo: "24 ago", resp: "Camila" },
  { id: 2, nome: "Contrato social", prazo: "27 ago", resp: "Felipe" },
  { id: 3, nome: "Registro na Junta Comercial", prazo: "05 set", resp: "Camila" },
  { id: 4, nome: "Inscrição na Receita Federal", prazo: "10 set", resp: "Camila" },
  { id: 5, nome: "CNPJ emitido e entrega", prazo: "12 set", resp: "Felipe" },
];

export const DOCS = [
  { id: 1, nome: "RG e CPF dos sócios", obrigatorio: true },
  { id: 2, nome: "Comprovante de endereço dos sócios", obrigatorio: true },
  { id: 3, nome: "IPTU do imóvel da sede", obrigatorio: true },
  { id: 4, nome: "Contrato de locação", obrigatorio: true },
  { id: 5, nome: "Consulta de viabilidade assinada", obrigatorio: false },
];

export const EVENTOS = [
  { tipo: "Processo criado", desc: "Gerado a partir da proposta #0145 aceita.", data: "22 ago · 09:14", cliente: true },
  { tipo: "Documentos recebidos", desc: "RG, CPF e comprovante de endereço dos dois sócios.", data: "23 ago · 16:02", cliente: true },
  { tipo: "Etapa concluída", desc: "Consulta de viabilidade deferida pela prefeitura.", data: "24 ago · 11:40", cliente: true },
  { tipo: "Etapa concluída", desc: "Contrato social redigido e assinado digitalmente.", data: "27 ago · 15:28", cliente: true },
  { tipo: "Protocolo registrado", desc: "Protocolo JCSP-2026-441802 na Junta Comercial.", data: "28 ago · 10:05", cliente: true },
  { tipo: "Nota interna", desc: "Cobrar despachante se não sair até 04/09.", data: "28 ago · 10:06", cliente: false },
];

export const PSTATUS = {
  aguardando_docs: { bg: "#FDF3E3", fg: "#8A5A0B", label: "Aguardando documentos" },
  em_andamento: { bg: "#EAF1FB", fg: "#0A4D9E", label: "Em andamento" },
  aguardando_orgao: { bg: "#EFEAFB", fg: "#5340A0", label: "Aguardando órgão" },
  pendencia: { bg: "#FBEDEC", fg: "#A33F36", label: "Pendência" },
  concluido: { bg: "#EAF6EE", fg: "#1F6F4C", label: "Concluído" },
  cancelado: { bg: "#F1F3F6", fg: "#5C6675", label: "Cancelado" },
};

export const brl = (v) =>
  "R$ " + Number(v || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
