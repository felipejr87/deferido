# Open Legaliza — resumo do projeto (para retomar em outra conversa)

Cole este arquivo (ou peça pra ler `RESUMO-PARA-CLAUDE.md` no repo) no
início de uma sessão nova do Claude Code para retomar o contexto sem
precisar reconstruir tudo do zero.

## O que é

Sistema de gestão comercial/operacional para a **Open Legaliza**, escritório
de legalização empresarial (aberturas de MEI/LTDA, alvarás, contabilidade,
jurídico). Visão de longo prazo: virar produto SaaS multi-tenant. Implementa
3 specs entregues em sequência pelo usuário:

1. Spec original — fluxo comercial (propostas → processos → leads → financeiro)
2. Spec complementar — Blocos A-G (fundação, módulos de negócio, comunicação,
   inteligência, integrações, SaaS, qualidade)
3. Spec de captura inteligente — 5 níveis (consulta automática, OCR,
   extração de conversa, linguagem natural, voz)

## Stack

React 18 + Vite + react-router-dom + lucide-react (sem TypeScript).
Backend: **Supabase real, conectado** (Postgres + Auth + Edge Functions).
Deploy: Vercel, com deploy automático a cada push em `main` via integração
GitHub↔Vercel.

## Infraestrutura (tudo real, já provisionado)

- **GitHub**: https://github.com/felipejr87/deferido (branch `main`)
- **Supabase**: projeto `deferido`, ref `lwjaszqusgkzasnyvfgs`,
  região us-east-1, Postgres 17
- **Vercel**: https://deferido.vercel.app (produção)
- Credenciais (URL + anon key, DB password, tokens) ficam em
  `open-legaliza/.secrets/local.env` — **git-ignorado, nunca commitado**.
  Se essa sessão não tiver esse arquivo, as credenciais precisam ser
  pedidas de novo ao usuário (URL e anon key são seguras de colar no chat;
  DB password, access token e ANTHROPIC_API_KEY não deveriam ser, mas o
  usuário já colou antes — considerar rotacionar se for continuar mexendo).
- CLI usada para tudo: `npx --yes supabase <comando>` (não tem instalação
  global funcional no PATH, mas `npx` resolve). Autenticação via
  `SUPABASE_ACCESS_TOKEN` como env var, não `supabase login` interativo.

### Gotcha de `git push`

O Git Credential Manager (Windows) periodicamente perde a credencial em
cache e o `git push` trava esperando um prompt interativo que a ferramenta
de Bash não consegue completar (timeout sem erro claro). Quando isso
acontece, pedir pro usuário rodar `git push` uma vez num terminal normal
dele (PowerShell/Git Bash) — geralmente resolve o cache pros próximos
pushes também.

## Banco de dados

Schema completo aplicado via `supabase/migrations/0001` a `0006`:

- `0001_schema.sql` / `0002_rls.sql` — schema original (cópia de
  `db/schema.sql`/`db/rls.sql`, que agora são só histórico/referência)
- `0003_auth_e_seed.sql` — liga `usuarios.auth_user_id` ao Supabase Auth
  (em vez do `senha_hash` pensado originalmente pra auth caseira), semeia
  o escritório (id fixo `00000000-0000-0000-0000-000000000001`, ver
  `src/config/escritorio.js`) + catálogo de 9 serviços, cria a função
  `provisionar_usuario()` (RPC que cria a linha em `usuarios` no primeiro
  login — dono se for o primeiro do escritório, operador depois) e
  `meu_escritorio_id()` (helper SECURITY DEFINER pra evitar RLS
  recursiva). **Corrige um gap real**: `db/rls.sql` original só tinha um
  *comentário* de exemplo pras tabelas principais — nunca um
  `ENABLE ROW LEVEL SECURITY` de fato. 0003 fecha isso com um loop
  `DO $$ ... FOREACH ...` habilitando RLS em ~18 tabelas de uma vez.
- `0004_seed_propostas_processos.sql` / `0005_seed_proposta_itens.sql` —
  semeia 6 propostas + 6 processos + clientes + etapas, reproduzindo os
  mesmos exemplos que antes eram só mock em `src/data/mock.js`.
- `0006_fix_rls_tabelas_filhas.sql` — corrige `proposta_itens`/
  `processo_etapas`/`processo_documentos`/`processo_eventos`, que
  herdavam do `db/rls.sql` antigo uma policy checando
  `auth.jwt()->>'escritorio_id'` (claim que o Supabase Auth nunca
  populou) — estavam **inacessíveis pra qualquer papel**, corrigido pro
  mesmo padrão via `meu_escritorio_id()` + policies de leitura pública
  (portal do cliente/link da proposta são "sem login" por spec).

Ao criar uma migration nova: `supabase/migrations/NNNN_nome.sql`, depois
`set -a && source .secrets/local.env && set +a && npx --yes supabase db
push --linked`.

## Auth

`src/context/AuthContext.jsx`: usa Supabase Auth de verdade
(`signInWithPassword`) quando `.env.local` está configurado; cai pro login
mock (qualquer senha 4+ chars, usuários em `src/data/usuarios.js`) quando
não está — nunca quebra por falta de credencial.

**Criar usuário novo**: não tem admin API (só a anon key, de propósito).
Único jeito hoje é manual, no dashboard Supabase: Authentication → Users →
Add user (marcar auto-confirm). No primeiro login, `provisionar_usuario()`
cria o profile em `usuarios` automaticamente (dono se for o primeiro do
escritório, operador depois). `Usuarios.jsx` (tela de "convidar usuário")
ainda é mock — não cria conta real, só demonstra a UI.

## O que é real vs. mock (estado atual)

| Real | Mock/pendente |
|---|---|
| Login/sessão via Supabase Auth | Convite de usuário (`Usuarios.jsx` ainda mock) |
| Catálogo de serviços lido do Postgres (`Servicos.jsx`) | Builder da proposta (itens, CommandBar, extração) continua com id inteiro (1-9) do catálogo mock, não uuid real — ver nota abaixo |
| Propostas/Processos lidos do Postgres (listas) | Detalhe do processo (`Processo.jsx`, etapas/documentos toggle) ainda mock — só a lista foi migrada |
| "Salvar rascunho" grava proposta+itens real | Upload de arquivo (`Arquivos.jsx`) só em memória, sem Supabase Storage |
| OCR de documento, extração de conversa, comando em linguagem natural — todas via Edge Functions reais (Claude) implantadas, com fallback local se falhar | Asaas, Resend, WhatsApp (Z-API/Evolution) — telas de config existem, não enviam nada de verdade |
| Busca de CNPJ (BrasilAPI) e CEP (ViaCEP) — direto do browser | `consultar-cnpj` Edge Function existe mas não é usada (rate-limit 429 da BrasilAPI contra IP do Supabase Edge) |
| Hash SHA-256 real (Web Crypto) na assinatura eletrônica | Certificado digital A1 — decisão consciente de NÃO implementar (spec pede avaliar risco antes) |
| Entrada por voz (Web Speech API nativa) | Tabela CNAE é um recorte curado (~20), não os ~1.300 do IBGE |
| Export JSON/CSV real (download no navegador) | Geração de PDF via `window.print()`, não lib dedicada |
| Módulo jurídico (gerar documento por template) funciona 100% client-side | Documentos gerados não persistem no Postgres ainda (tabelas existem, não conectadas) |

**Nota importante sobre o builder de proposta**: `AppContext.itens` e tudo
que deriva dele (CommandBar, `comandos.js`, `extracaoLocal.js`) referencia
o catálogo por **id inteiro (1-9)** do array mock `SERVICOS` em
`src/data/mock.js` — não pelo uuid real do Postgres. Isso foi uma decisão
deliberada pra não precisar refatorar essa cadeia inteira nesta rodada.
`Servicos.jsx` (só leitura) já mostra dado real; o catálogo *interativo*
dentro de Nova Proposta ainda é o mock. Se for continuar essa migração,
esse é o próximo ponto de atrito.

## Feature flags

`src/config/features.js`, ~35 flags, editáveis via painel de engrenagem
(canto inferior direito), querystring `?flag=nome:0`, ou localStorage.
`f_super_admin`/`f_planos` (Bloco F, SaaS) desligadas por padrão.

## Padrão de trabalho estabelecido nesta conversa

- Specs grandes e ambíguas → perguntar o recorte antes de codar (mas só
  quando a resposta não já estiver implícita no histórico).
- Onde dá pra conectar de verdade sem credencial (Web Speech API, Web
  Crypto, BrasilAPI/ViaCEP, download de arquivo) → fazer de verdade, nunca
  simular.
- Onde precisa de credencial que falta → construir a UI completa + o
  código real (Edge Function, etc.) mas deixar claramente sinalizado como
  "não conectado", nunca fingir um resultado de IA/backend que não
  aconteceu.
- Nunca pedir pro usuário colar segredo (token, senha, API key) direto no
  chat — usar um arquivo local git-ignorado (`.secrets/local.env`) que só
  eu leio via Bash, sem ecoar o conteúdo. (O usuário colou mesmo assim
  algumas vezes; funcionou, mas vale reforçar a prática e considerar
  rotacionar credenciais expostas no histórico.)
- Toda migration SQL nova: escrever em `supabase/migrations/`, aplicar com
  `db push --linked`, **verificar de verdade** com uma query real (curl no
  REST endpoint) antes de dar como certo — dois bugs reais (RLS quebrada
  duas vezes, erro de sintaxe `%L` vs `%I`) só foram pegos assim.
