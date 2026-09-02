// Id fixo do escritório semeado em supabase/migrations/0003_auth_e_seed.sql —
// enquanto o app for mono-tenant na prática (só a Open Legaliza usando),
// não precisa de lógica de "qual escritório" nenhuma; isso é o único lugar
// que hardcoda esse id.
export const ESCRITORIO_ID = "00000000-0000-0000-0000-000000000001";
