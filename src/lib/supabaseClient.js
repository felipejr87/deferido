import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Sem as duas variáveis, o cliente fica null e o app cai para os dados
// mock automaticamente (ver src/context/AppContext.jsx) — nunca quebra a
// build por falta de credencial.
export const supabase = url && anonKey ? createClient(url, anonKey) : null;

export const supabaseConectado = Boolean(supabase);
