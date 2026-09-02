// Metadados de cada rota: breadcrumb, título e o par Sistema/Visão-do-cliente
// usado pelo seletor de modo no topbar (mesma ideia do "modos" no layout
// original, onde a mesma tela pode ser vista como operador ou como cliente).

export const ROUTES = {
  "/dashboard": { crumb: "Visão geral", titulo: "Dashboard" },
  "/onboarding": { crumb: "Configuração", titulo: "Onboarding do escritório" },

  "/propostas": { crumb: "Comercial", titulo: "Propostas" },
  "/propostas/nova": {
    crumb: "Comercial · Propostas",
    titulo: "Nova proposta",
    modos: { sistema: "/propostas/nova", cliente: "/propostas/publica" },
  },
  "/propostas/publica": {
    crumb: "Link público da proposta",
    titulo: "O que o cliente vê no celular",
    modos: { sistema: "/propostas/nova", cliente: "/propostas/publica" },
  },
  "/servicos": { crumb: "Configuração", titulo: "Catálogo de serviços" },
  "/processos": { crumb: "Operação", titulo: "Processos em andamento" },

  "/arquivos": { crumb: "Operação", titulo: "Documentos e arquivos" },
  "/assinaturas": { crumb: "Operação", titulo: "Assinaturas eletrônicas" },
  "/cursos": { crumb: "Cursos", titulo: "Progresso do aluno" },
  "/obrigacoes": { crumb: "Contabilidade", titulo: "Calendário de obrigações" },
  "/juridico": { crumb: "Jurídico", titulo: "Modelos de documento" },

  "/notificacoes": { crumb: "Comunicação", titulo: "Notificações" },
  "/templates-mensagem": { crumb: "Comunicação", titulo: "Templates de mensagem" },
  "/regua-cobranca": { crumb: "Comunicação", titulo: "Régua de cobrança" },

  "/relatorios": { crumb: "Inteligência", titulo: "Relatórios" },

  "/cnae": { crumb: "Integrações", titulo: "Consulta de CNAE" },
  "/integracoes": { crumb: "Integrações", titulo: "Configuração" },

  "/admin": { crumb: "SaaS", titulo: "Super admin — escritórios" },
  "/planos": { crumb: "SaaS", titulo: "Planos" },

  "/usuarios": { crumb: "Configuração", titulo: "Usuários e papéis" },
  "/auditoria": { crumb: "Configuração", titulo: "Auditoria" },
  "/lgpd": { crumb: "Configuração", titulo: "LGPD" },
};

export function routeMeta(pathname, processoNumero) {
  if (ROUTES[pathname]) return ROUTES[pathname];

  if (processoNumero) {
    const base = `/processos/${processoNumero}`;
    if (pathname === base) {
      return {
        crumb: "Operação · Processos",
        titulo: `${processoNumero} · Abertura ME / LTDA`,
        modos: { sistema: base, cliente: `${base}/portal` },
      };
    }
    if (pathname === `${base}/portal`) {
      return {
        crumb: "Portal público do processo",
        titulo: "O que o cliente vê no celular",
        modos: { sistema: base, cliente: `${base}/portal` },
      };
    }
  }

  return { crumb: "Open Legaliza", titulo: "" };
}
