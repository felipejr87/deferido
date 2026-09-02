// Subconjunto curado da tabela CNAE (Bloco E1 / Nível 1 da captura
// inteligente) — não é a tabela completa do IBGE (~1.300 códigos), é um
// recorte representativo dos CNAEs mais comuns entre clientes de um
// escritório de legalização, com palavras-chave para sugestão automática.
// Em produção isso vira a tabela `cnaes` (db/schema.sql), populada a partir
// do arquivo oficial do IBGE/Receita e buscável por full-text search.

export const CNAES = [
  { codigo: "5611-2/01", descricao: "Restaurantes e similares", secao: "I", permitidoMei: true, anexoSimples: 1, palavrasChave: ["restaurante", "comida", "alimentação", "lanchonete"] },
  { codigo: "4721-1/02", descricao: "Padaria com predominância de produção própria", secao: "G", permitidoMei: true, anexoSimples: 1, palavrasChave: ["padaria", "pão", "confeitaria"] },
  { codigo: "9602-5/01", descricao: "Cabeleireiros, manicure e pedicure", secao: "S", permitidoMei: true, anexoSimples: 3, palavrasChave: ["cabeleireiro", "salão", "beleza", "manicure"] },
  { codigo: "4781-4/00", descricao: "Comércio varejista de artigos do vestuário e acessórios", secao: "G", permitidoMei: true, anexoSimples: 1, palavrasChave: ["roupa", "vestuário", "loja de roupa", "moda"] },
  { codigo: "4520-0/01", descricao: "Serviços de manutenção e reparação mecânica de veículos automotores", secao: "G", permitidoMei: true, anexoSimples: 3, palavrasChave: ["oficina", "mecânica", "carro", "veículo"] },
  { codigo: "8121-4/00", descricao: "Limpeza em prédios e domicílios", secao: "N", permitidoMei: true, anexoSimples: 1, palavrasChave: ["limpeza", "faxina", "diarista"] },
  { codigo: "4744-0/99", descricao: "Comércio varejista de materiais de construção", secao: "G", permitidoMei: true, anexoSimples: 1, palavrasChave: ["material de construção", "loja de construção"] },
  { codigo: "6920-6/01", descricao: "Atividades de contabilidade", secao: "M", permitidoMei: false, anexoSimples: 5, motivo: "Serviço intelectual/regulamentado — exige registro profissional incompatível com MEI.", palavrasChave: ["contabilidade", "contador"] },
  { codigo: "6912-2/00", descricao: "Sociedade de advogados", secao: "M", permitidoMei: false, anexoSimples: 5, motivo: "Advocacia é atividade regulamentada, não permitida para MEI.", palavrasChave: ["advocacia", "advogado", "escritório de advocacia"] },
  { codigo: "8630-5/03", descricao: "Atividade médica ambulatorial restrita a consultas", secao: "Q", permitidoMei: false, anexoSimples: 5, motivo: "Medicina é atividade regulamentada (CRM), não permitida para MEI.", palavrasChave: ["médico", "clínica médica", "consultório"] },
  { codigo: "6821-8/01", descricao: "Corretagem na compra e venda e avaliação de imóveis", secao: "L", permitidoMei: false, anexoSimples: 4, motivo: "Corretagem imobiliária exige registro no CRECI, incompatível com MEI.", palavrasChave: ["corretor de imóveis", "imobiliária"] },
  { codigo: "6499-9/99", descricao: "Outras atividades de serviços financeiros", secao: "K", permitidoMei: false, anexoSimples: 5, motivo: "Atividades financeiras não constam na lista de ocupações permitidas ao MEI.", palavrasChave: ["financeira", "empréstimo"] },
  { codigo: "8599-6/04", descricao: "Treinamento em desenvolvimento profissional e gerencial", secao: "P", permitidoMei: true, anexoSimples: 3, palavrasChave: ["treinamento", "curso", "capacitação"] },
  { codigo: "4729-6/02", descricao: "Comércio varejista de produtos alimentícios em geral", secao: "G", permitidoMei: true, anexoSimples: 1, palavrasChave: ["mercearia", "mercadinho", "alimentos"] },
  { codigo: "9511-8/00", descricao: "Reparação e manutenção de computadores", secao: "S", permitidoMei: true, anexoSimples: 3, palavrasChave: ["computador", "informática", "manutenção de pc"] },
  { codigo: "6204-0/00", descricao: "Consultoria em tecnologia da informação", secao: "J", permitidoMei: false, anexoSimples: 5, motivo: "Consultoria em TI não consta na lista de ocupações permitidas ao MEI (depende do CNAE específico — avalie 6209-1/00 para alguns casos).", palavrasChave: ["consultoria em ti", "consultoria de tecnologia", "ti"] },
  { codigo: "4321-5/00", descricao: "Instalação e manutenção elétrica", secao: "F", permitidoMei: true, anexoSimples: 1, palavrasChave: ["eletricista", "instalação elétrica"] },
  { codigo: "9002-7/01", descricao: "Design de interiores", secao: "R", permitidoMei: true, anexoSimples: 3, palavrasChave: ["design de interiores", "decoração"] },
  { codigo: "7420-0/01", descricao: "Atividades de produção de fotografias", secao: "M", permitidoMei: true, anexoSimples: 3, palavrasChave: ["fotógrafo", "fotografia"] },
  { codigo: "4390-9/00", descricao: "Obras de engenharia civil não especificadas anteriormente", secao: "F", permitidoMei: false, anexoSimples: 4, motivo: "Engenharia é atividade regulamentada (CREA), não permitida para MEI.", palavrasChave: ["engenharia civil", "obra"] },
];

// Sugestão local por palavra-chave (Nível 1) — casa texto livre (ex: "comércio
// de roupas") contra descrição e palavras-chave. Sem IA: é busca por
// substring, não semântica — o operador sempre confirma antes de aplicar.
export function sugerirCnae(textoLivre) {
  const q = String(textoLivre || "").toLowerCase().trim();
  if (q.length < 3) return null;
  return (
    CNAES.find(
      (c) => c.descricao.toLowerCase().includes(q) || (c.palavrasChave || []).some((p) => q.includes(p) || p.includes(q)),
    ) ?? null
  );
}
