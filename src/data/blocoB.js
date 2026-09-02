// Dados de demonstração do Bloco B (módulos de negócio).

export const CURSO_MODULOS = [
  {
    id: "m1",
    titulo: "Fundamentos do MEI",
    aulas: [
      { id: "a1", titulo: "O que é MEI e quem pode abrir", tipo: "video", duracaoMin: 12 },
      { id: "a2", titulo: "Limites de faturamento e quando migrar", tipo: "texto", duracaoMin: 6 },
      { id: "a3", titulo: "Modelo de planilha de controle mensal", tipo: "pdf", duracaoMin: 4 },
    ],
  },
  {
    id: "m2",
    titulo: "Obrigações e impostos",
    aulas: [
      { id: "a4", titulo: "Como pagar o DAS pelo app", tipo: "video", duracaoMin: 9 },
      { id: "a5", titulo: "Declaração anual (DASN-SIMEI)", tipo: "video", duracaoMin: 14 },
      { id: "a6", titulo: "Link oficial da Receita Federal", tipo: "link", duracaoMin: 2 },
    ],
  },
];

export const MATRICULA_DEMO = {
  cliente: "Douglas Prado",
  curso: "Curso de gestão para MEI",
  token: "c9f1e4a2b0d3f7c8",
  progresso: ["a1", "a2", "a4"],
};

export const OBRIGACOES_TIPOS = [
  { id: "t1", nome: "DAS", descricao: "Documento de Arrecadação do Simples Nacional", regime: ["mei", "simples"], periodicidade: "mensal", diaVencimento: 20 },
  { id: "t2", nome: "DASN-SIMEI", descricao: "Declaração Anual do MEI", regime: ["mei"], periodicidade: "anual", diaVencimento: 31, mesVencimento: 5 },
  { id: "t3", nome: "DEFIS", descricao: "Declaração de Informações Socioeconômicas e Fiscais", regime: ["simples"], periodicidade: "anual", diaVencimento: 31, mesVencimento: 3 },
  { id: "t4", nome: "DARF", descricao: "Imposto de Renda trimestral", regime: ["presumido"], periodicidade: "trimestral", diaVencimento: 30 },
  { id: "t5", nome: "DCTF", descricao: "Declaração de Débitos e Créditos Tributários Federais", regime: ["presumido"], periodicidade: "mensal", diaVencimento: 15 },
  { id: "t6", nome: "ECF", descricao: "Escrituração Contábil Fiscal", regime: ["presumido"], periodicidade: "anual", diaVencimento: 31, mesVencimento: 7 },
];

export const OBRIGACOES = [
  { id: "o1", cliente: "Padaria Trigo Bom", regime: "mei", tipo: "DAS", competencia: "ago/2026", vencimento: "20 set", status: "pendente" },
  { id: "o2", cliente: "Douglas Prado", regime: "mei", tipo: "DAS", competencia: "ago/2026", vencimento: "20 set", status: "pendente" },
  { id: "o3", cliente: "Marina Ribeiro Alimentos", regime: "simples", tipo: "DAS", competencia: "ago/2026", vencimento: "20 set", status: "cumprida" },
  { id: "o4", cliente: "Marina Ribeiro Alimentos", regime: "simples", tipo: "DEFIS", competencia: "2025", vencimento: "31 mar", status: "atrasada" },
  { id: "o5", cliente: "Clínica Vitta ME", regime: "presumido", tipo: "DCTF", competencia: "ago/2026", vencimento: "15 set", status: "pendente" },
];

export const MODELOS_DOCUMENTO = [
  {
    id: "md1",
    nome: "Contrato de prestação de serviços",
    categoria: "prestacao_servico",
    variaveis: ["contratante_nome", "contratante_doc", "servico", "valor", "prazo_dias"],
    conteudo:
      "CONTRATO DE PRESTAÇÃO DE SERVIÇOS\n\nCONTRATANTE: {{contratante_nome}}, portador(a) do documento {{contratante_doc}}.\nCONTRATADA: {{escritorio_nome}}.\n\nObjeto: prestação do serviço de {{servico}}, pelo valor de {{valor}}, com prazo estimado de {{prazo_dias}} dias.\n\nAs partes assinam o presente instrumento na forma eletrônica, nos termos da MP 2.200-2/2001.",
  },
  {
    id: "md2",
    nome: "Contrato social — LTDA",
    categoria: "contrato_social",
    variaveis: ["razao_social", "socios", "capital_social", "cnae_principal", "endereco_sede"],
    conteudo:
      "CONTRATO SOCIAL\n\nRazão social: {{razao_social}}\nSócios: {{socios}}\nCapital social: {{capital_social}}\nAtividade principal (CNAE): {{cnae_principal}}\nSede: {{endereco_sede}}",
  },
  {
    id: "md3",
    nome: "Distrato social",
    categoria: "distrato",
    variaveis: ["razao_social", "cnpj", "motivo", "data_encerramento"],
    conteudo: "DISTRATO SOCIAL\n\n{{razao_social}}, CNPJ {{cnpj}}, encerra suas atividades em {{data_encerramento}}.\nMotivo: {{motivo}}",
  },
  {
    id: "md4",
    nome: "Procuração",
    categoria: "procuracao",
    variaveis: ["outorgante_nome", "outorgante_doc", "poderes"],
    conteudo: "PROCURAÇÃO\n\n{{outorgante_nome}} ({{outorgante_doc}}) outorga poderes para: {{poderes}}.",
  },
  {
    id: "md5",
    nome: "Termo de confidencialidade (NDA)",
    categoria: "nda",
    variaveis: ["parte_nome", "parte_doc", "vigencia_meses"],
    conteudo: "TERMO DE CONFIDENCIALIDADE\n\nEntre {{escritorio_nome}} e {{parte_nome}} ({{parte_doc}}), vigência de {{vigencia_meses}} meses.",
  },
];

export const ARQUIVOS_DEMO = [
  { id: "f1", nome: "RG_socio1.pdf", cliente: "Ricardo Menezes", tamanho: "412 KB", enviadoPor: "cliente", versao: 1, criadoEm: "23 ago · 16:02" },
  { id: "f2", nome: "comprovante_endereco.pdf", cliente: "Ricardo Menezes", tamanho: "298 KB", enviadoPor: "cliente", versao: 1, criadoEm: "23 ago · 16:04" },
  { id: "f3", nome: "contrato_social_assinado.pdf", cliente: "Ricardo Menezes", tamanho: "1.1 MB", enviadoPor: "escritorio", versao: 2, criadoEm: "27 ago · 15:30" },
];
