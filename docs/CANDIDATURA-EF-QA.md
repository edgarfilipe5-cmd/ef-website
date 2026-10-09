# EF Coaching — Candidatura nativa — Estado técnico 09/10/2026

## PREVISUALIZAÇÃO ATIVA: NÃO FAZER MERGE / NÃO CAPTAR LEADS REAIS
- URL: https://ef-candidatura-preview-20261009.onrender.com/candidatura.html
- Branch: `feature/candidatura-nativa-ef-qa-20261009`
- Pull Request: https://github.com/edgarfilipe5-cmd/ef-website/pull/3 (DRAFT)
- `main` permanece com CTA oficial Jotform `262522804984059`.
- App EF, clientes, Stripe, site principal e AP-01 não foram alterados.

## Implementado na fase de QA
1. Página EF de candidatura em duas etapas, responsiva, com botão **Preencher dados fictícios**.
2. Backend Supabase **`ef-website-candidatura-qa`**, endpoint público exclusivamente para QA; CORS limitado à origem preview. Não aceita dados reais: o nome tem de começar por `TESTE EF` e o email terminar em `@example.com`.
3. Novas tabelas isoladas `public.ef_website_applications`, `public.ef_website_application_limits`, `public.ef_website_integration_config`; RLS ativo, `anon` e `authenticated` sem acesso aos dados.
4. RPC `ef_accept_website_application`, invoker/service_role apenas; dedupe por chave e email/dia; limite de submissões por hash de IP.
5. Activepieces `AP-08 — Candidatura EF Website → CRM + Gmail — QA` (flow `8lVeJuFxNRFX23vOpohJi`) publicado com autenticação por header privada apenas entre serviços. Ramo Notion procura por email, cria apenas quando é novo, depois Gmail.
6. Render preview com auto deploy desligado. Site oficial continua intacto.
7. Supabase marca `DELIVERED` somente quando o fluxo devolve confirmação positiva; no erro, `DELIVERY_PENDING`.

## Testes efetuados e limites
- PASS: Activepieces criou lead sintética no Notion existente `Leads & Vendas` (registo identificável como TESTE EF).
- PASS: repetição de candidatura fictícia com mesmo email acionou o ramo **existente**, sem nova lead.
- PASS: migração isolada, privilégios negados a `anon` e `authenticated`.
- PASS: RPC de deduplicação testada com transação SQL revertida.
- PASS: build Render Preview com novo formulário `live` e página pública legível.
- **BLOQUEADO:** Gmail conectado no AP tem autorização OAuth insuficiente para `gmail.send`, erro Google 403. Exige **reconectar/autorização explícita do utilizador** no Activepieces.
- **PENDENTE:** prova E2E por clique real na página até confirmação simultânea DB + CRM + email. Não declarar o fluxo pronto para candidaturas reais.
- **PENDENTE:** política RGPD definitiva, retenção, anti-bot mais forte, estratégia de reprocessamento de notificações pendentes e alertas, revisão de custos.
- A política de privacidade da pré-visualização é rascunho e identifica apenas teste fictício.

## Próxima ação essencial do Edgar
Abrir Activepieces → Connections → Gmail → Reconnect / Authorize com permissão **Enviar emails**. Se a ligação atual não permitir ampliar os scopes, criar uma nova ligação Gmail com Gmail Send autorizado e substituir somente a referência da ação `step_4` de AP-08. Não alterar AP-01 nem outros flows.

Após reconexão: testar AP-08 com candidatura `TESTE EF` e email `@example.com` → confirmar recibo, Notion (sem duplicação) e chegada Gmail → corrigir política / retenção / bot → pedir aprovação para troca do CTA de produção. Preservar Jotform até cutover comprovado.

## Notas de segurança
- O backend da branch GitHub não contém tokens ou passwords. A credencial do webhook é mantida unicamente em dados Supabase com privilégios exclusivos `service_role`.
- As chaves de teste são para QA, sem dados clínicos.
- Não enviar ficheiros/documentos de saúde na candidatura. Anamnese clínica continua na App EF/Supabase.
- Ao passar a produção: remover bloqueio `TESTE EF/@example.com` apenas no novo endpoint após testes + política + consentimento aprovados. A proteção anti-bot de QA não substitui captcha/limitação mais robusta para produção.
