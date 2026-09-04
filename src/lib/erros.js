// Parte 0.10 da spec de fluxos: todo erro tem 3 partes — o que aconteceu,
// por que, e o que fazer. Nunca só a mensagem crua do Postgres/rede.
export class ErroAmigavel extends Error {
  constructor(titulo, motivo, acoes = []) {
    super(titulo);
    this.titulo = titulo;
    this.motivo = motivo;
    this.acoes = acoes;
  }
}

// Traduz erro técnico (Supabase/Postgres/rede, ou um ErroAmigavel já
// lançado por src/lib/fluxo.js) para o formato usado por <Erro /> em ui.jsx.
export function traduzirErro(erro) {
  if (erro?.titulo) return erro; // já é um ErroAmigavel (fluxo.js ou daqui)
  if (erro?.mensagem) return new ErroAmigavel(erro.mensagem, erro.sugestao); // ErroAmigavel de fluxo.js (formato antigo)

  const msg = erro?.message || String(erro);
  const code = erro?.code;

  if (code === "23505" || msg.includes("duplicate key")) return new ErroAmigavel("Esse registro já existe", "Procure na lista antes de criar de novo.");
  if (code === "23503") return new ErroAmigavel("Não dá para apagar", "Este item está sendo usado em outro lugar do sistema.");
  if (code === "23514") return new ErroAmigavel("Algum campo está com valor inválido", "Confira os campos preenchidos e tente de novo.");
  if (code === "PGRST116") return new ErroAmigavel("Não encontrei esse registro", "Ele pode ter sido apagado ou você não tem acesso a ele.");
  if (code === "42883" || code === "PGRST202" || (msg.includes("function") && (msg.includes("does not exist") || msg.includes("Could not find"))))
    return new ErroAmigavel("Essa função ainda não está disponível", "O sistema pode estar em atualização. Tente de novo em alguns minutos.");
  if (code === "42501" || msg.includes("row-level security"))
    return new ErroAmigavel("Você não tem acesso a isso", "Se acha que deveria ter, fale com o responsável do escritório.");
  if (msg.includes("JWT") || msg.includes("expired"))
    return new ErroAmigavel("Sua sessão expirou", "Entre de novo para continuar.", [{ rotulo: "Entrar", onClick: () => (window.location.href = "/login") }]);
  if (msg.includes("Failed to fetch") || msg.includes("fetch") || msg.includes("network"))
    return new ErroAmigavel("Não consegui falar com o servidor", "Verifique sua internet. Nada do que você digitou foi perdido.", [{ rotulo: "Tentar de novo", onClick: () => window.location.reload() }]);

  return new ErroAmigavel("Alguma coisa deu errado", "Tente de novo. Se continuar, avise o suporte.", [{ rotulo: "Tentar de novo", onClick: () => window.location.reload() }]);
}
