export const ESCRITORIOS_SAAS = [
  { id: "e1", nome: "Open Legaliza", plano: "profissional", usuarios: 3, processosNoMes: 22, status: "ativo", cadastradoEm: "12 jan 2026" },
  { id: "e2", nome: "Legaliza Fácil ME", plano: "essencial", usuarios: 1, processosNoMes: 8, status: "ativo", cadastradoEm: "03 mar 2026" },
  { id: "e3", nome: "Abre Aqui Contabilidade", plano: "escritorio", usuarios: 9, processosNoMes: 61, status: "ativo", cadastradoEm: "19 nov 2025" },
  { id: "e4", nome: "Rápido Registro LTDA", plano: "essencial", usuarios: 1, processosNoMes: 2, status: "inadimplente", cadastradoEm: "28 jul 2026" },
  { id: "e5", nome: "Certo Jurídico", plano: "profissional", usuarios: 4, processosNoMes: 0, status: "trial", cadastradoEm: "30 ago 2026" },
];

export const PLANOS = [
  { id: "essencial", nome: "Essencial", preco: 97, limites: "1 usuário, 30 processos/mês, propostas ilimitadas" },
  { id: "profissional", nome: "Profissional", preco: 197, limites: "3 usuários, processos ilimitados, WhatsApp, cursos" },
  { id: "escritorio", nome: "Escritório", preco: 397, limites: "10 usuários, contabilidade recorrente, jurídico, relatórios avançados" },
];
