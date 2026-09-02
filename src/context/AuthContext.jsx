import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { USUARIOS } from "../data/usuarios.js";
import { track } from "../lib/analytics.js";
import { supabase, supabaseConectado } from "../lib/supabaseClient.js";
import { ESCRITORIO_ID } from "../config/escritorio.js";

// Sessão real via Supabase Auth quando .env.local está configurado
// (VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY); cai pro mock (Bloco A1
// original — qualquer senha 4+ chars) quando não está. Nunca quebra por
// falta de credencial, só degrada.

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

function nomeDoEmail(email) {
  const local = email.split("@")[0].replace(/[._-]+/g, " ");
  return local.replace(/\b\w/g, (c) => c.toUpperCase());
}

// Garante (via RPC security definer) que existe uma linha em `usuarios`
// ligada a esta conta do Supabase Auth — dono se for a primeira do
// escritório, operador nas seguintes — e devolve os dados de sessão no
// mesmo formato que o resto do app já espera (papel, escritorioId etc).
async function provisionarESessao(authUser) {
  const { data: usuario, error } = await supabase.rpc("provisionar_usuario", {
    p_escritorio_id: ESCRITORIO_ID,
    p_nome: nomeDoEmail(authUser.email),
  });
  if (error) throw error;
  return {
    usuarioId: usuario.id,
    nome: usuario.nome,
    email: usuario.email,
    papel: usuario.papel,
    escritorioId: usuario.escritorio_id,
    expiraEm: Date.now() + 8 * 60 * 60 * 1000,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => (supabaseConectado ? null : readSession()));
  const [carregando, setCarregando] = useState(supabaseConectado);

  useEffect(() => {
    if (!supabaseConectado) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (data.session?.user) {
        try {
          setSession(await provisionarESessao(data.session.user));
        } catch (err) {
          track("sessao_restaurar_erro", { erro: String(err) });
        }
      }
      setCarregando(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, authSession) => {
      if (!authSession?.user) {
        setSession(null);
        return;
      }
      try {
        setSession(await provisionarESessao(authSession.user));
      } catch (err) {
        track("sessao_provisionar_erro", { erro: String(err) });
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const loginSupabase = useCallback(async (email, senha) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: senha });
    if (error) {
      track("login_falhou", { email, motivo: error.message });
      return { ok: false, error: error.message === "Invalid login credentials" ? "E-mail ou senha inválidos." : error.message };
    }
    try {
      const s = await provisionarESessao(data.user);
      setSession(s);
      track("login_sucesso", { usuario_id: s.usuarioId, papel: s.papel });
      return { ok: true };
    } catch (err) {
      return { ok: false, error: "Login funcionou, mas falhou ao carregar o perfil: " + String(err.message || err) };
    }
  }, []);

  const loginMock = useCallback((email, senha) => {
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
      escritorioId: ESCRITORIO_ID,
      expiraEm: Date.now() + 8 * 60 * 60 * 1000,
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    setSession(s);
    track("login_sucesso", { usuario_id: usuario.id, papel: usuario.papel });
    return { ok: true };
  }, []);

  const login = supabaseConectado ? loginSupabase : loginMock;

  const logout = useCallback(async () => {
    track("logout", { usuario_id: session?.usuarioId });
    if (supabaseConectado) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem(SESSION_KEY);
    }
    setSession(null);
  }, [session]);

  const solicitarRecuperacao = useCallback(async (email) => {
    if (supabaseConectado) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      track("recuperacao_senha_solicitada", { email, ok: !error });
      // Resposta sempre genérica — não revela se o e-mail existe (evita enumeração de contas).
      return { ok: true, mensagem: "Se este e-mail existir, enviamos um link de recuperação por e-mail." };
    }
    const usuario = USUARIOS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
    track("recuperacao_senha_solicitada", { email, encontrado: Boolean(usuario) });
    return { ok: true, mensagem: "Se este e-mail existir, enviamos um link de recuperação (válido por 1 hora)." };
  }, []);

  const value = { session, isAuthenticated: Boolean(session), carregando, login, logout, solicitarRecuperacao, autenticacaoReal: supabaseConectado };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth deve ser usado dentro de <AuthProvider>");
  return ctx;
}
