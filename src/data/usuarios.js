// Usuários e papéis (Bloco A3). Senha mock única para todos nesta demo:
// qualquer senha com 4+ caracteres autentica — não há backend real, então
// não há hash bcrypt de verdade aqui (ver README para o que falta).

export const PAPEL_PERMISSOES = {
  dono: {
    label: "Dono",
    descricao: "Tudo. Configurações, financeiro completo, usuários",
    pode: ["configuracoes", "financeiro", "usuarios", "processos", "leads", "propostas"],
  },
  operador: {
    label: "Operador",
    descricao: "Processos, documentos, clientes. Sem financeiro do escritório",
    pode: ["processos", "clientes"],
  },
  comercial: {
    label: "Comercial",
    descricao: "Leads, propostas, clientes. Sem processos operacionais",
    pode: ["leads", "propostas", "clientes"],
  },
};

export const USUARIOS = [
  { id: "u1", nome: "Felipe Andrade", email: "felipe@openlegaliza.com.br", papel: "dono", ativo: true, ultimoAcesso: "hoje · 08:42" },
  { id: "u2", nome: "Camila Duarte", email: "camila@openlegaliza.com.br", papel: "operador", ativo: true, ultimoAcesso: "hoje · 09:10" },
  { id: "u3", nome: "Bruna Lopes", email: "bruna@openlegaliza.com.br", papel: "comercial", ativo: true, ultimoAcesso: "ontem · 17:55" },
  { id: "u4", nome: "Diego Nunes", email: "diego@openlegaliza.com.br", papel: "operador", ativo: false, ultimoAcesso: "12 ago · 11:20" },
];
