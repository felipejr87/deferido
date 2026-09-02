import { createContext, useContext, useState, useCallback } from "react";
import { USUARIOS } from "../data/usuarios.js";
import { track } from "../lib/analytics.js";

// Sessão mock (Bloco A1). Sem backend, então: sem bcrypt de verdade, sem JWT
// assinado — o "token" é só um objeto salvo em localStorage. Qualquer senha
// com 4+ caracteres autentica um dos e-mails cadastrados em USUARIOS. Ver
// README para o que precisa entrar quando houver Supabase Auth de verdade.

const SESSION_KEY = "ol:session";
const ATTEMPTS_KEY = "ol:login_attempts";
const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 10;

const AuthContext = createContext(null);

function readSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function readAttempts(email) {
  try {
    const raw = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "{}");
    return raw[email] || { count: 0, lockedUntil: null };
  } catch {
    return { count: 0, lockedUntil: null };
  }
}

function writeAttempts(email, data) {
  try {
    const raw = JSON.parse(localStorage.getItem(ATTEMPTS_KEY) || "{}");
    raw[email] = data;
    localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(raw));
  } catch {
    // ignore
  }
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => readSession());

  const login = useCallback((email, senha) => {
    const attempts = readAttempts(email);
    if (attempts.lockedUntil && Date.now() < attempts.lockedUntil) {
      const min = Math.ceil((attempts.lockedUntil - Date.now()) / 60000);
      track("login_bloqueado", { email });
      return { ok: false, error: `Muitas tentativas. Tente de novo em ${min} min.` };
    }

    const usuario = USUARIOS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    const senhaValida = senha && senha.length >= 4;

    if (!usuario || !usuario.ativo || !senhaValida) {
      const count = attempts.count + 1;
      const lockedUntil = count >= MAX_ATTEMPTS ? Date.now() + LOCK_MINUTES * 60000 : null;
      writeAttempts(email, { count, lockedUntil });
      track("login_falhou", { email, tentativas: count });
      if (!usuario) return { ok: false, error: "E-mail não encontrado." };
      if (!usuario.ativo) return { ok: false, error: "Usuário desativado. Fale com o dono do escritório." };
      return { ok: false, error: lockedUntil ? `Muitas tentativas. Bloqueado por ${LOCK_MINUTES} min.` : "Senha inválida." };
    }

    writeAttempts(email, { count: 0, lockedUntil: null });
    const s = {
      usuarioId: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      papel: usuario.papel,
      escritorioId: "open-legaliza",
      expiraEm: Date.now() + 8 * 60 * 60 * 1000,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    track("login_sucesso", { usuario_id: usuario.id, papel: usuario.papel });
    return { ok: true };
  }, []);

  const logout = useCallback(() => {
    track("logout", { usuario_id: session?.usuarioId });
    localStorage.removeItem(SESSION_KEY);
    setSession(null);
  }, [session]);

  const solicitarRecuperacao = useCallback((email) => {
    const usuario = USUARIOS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    track("recuperacao_senha_solicitada", { email, encontrado: Boolean(usuario) });
    // Resposta sempre genérica — não revela se o e-mail existe (evita enumeração de contas).
    return { ok: true, mensagem: "Se este e-mail existir, enviamos um link de recuperação (válido por 1 hora)." };
  }, []);

  const value = { session, isAuthenticated: Boolean(session), login, logout, solicitarRecuperacao };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
