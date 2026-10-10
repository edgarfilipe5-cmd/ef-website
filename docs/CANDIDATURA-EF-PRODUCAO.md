# EF Coaching — Preparação segura do formulário público (10/10/2026)

## Situação
- **Website oficial:** mantém candidatura Jotform / fluxo Activepieces AP-01, sem alterações.
- **Versão QA:** https://ef-candidatura-preview-20261009.onrender.com/candidatura.html, só aceita dados fictícios.
- **Branch de produção candidata:** `feature/candidatura-prod-readiness-20261010`, ainda **sem merge**.
- **Página a publicar depois da revisão:** `candidatura-publica.html`.
- **Política de privacidade proposta:** `privacidade-candidatura.html`.
- **Edge Function preparada:** `ef-website-candidatura` (Supabase), **exige Turnstile válido no servidor; sem chave, recusa o envio**.
- **Chave pública Turnstile:** `content/site.json` → `site.turnstile_site_key` (por preencher).
- **Chave privada Turnstile:** Supabase Edge Functions Secrets → `EF_TURNSTILE_SECRET` (por preencher).
- **Outros secrets:** EF_NOTION_TOKEN e EF_RESEND_API_KEY já foram testados funcionalmente.

## Testes efetuados
1. QA via Supabase, Notion e Resend: candidatura sintética criada, CRM atualizado, email entregue, repetição sem duplicados.
2. Teste recuperável: candidatura sintética guardada como DELIVERY_PENDING; chamada protegida de retry devolveu `processed:1, completed:1`. Notion confirmou novo lead e Resend confirmou envio *delivered*.
3. Segurança: novo endpoint público devolveu **403** quando a verificação Turnstile estava ausente e não guardou qualquer candidatura para o teste rejeitado.
4. Segurança BD: privilégios `anon` e `authenticated` negados à leitura de candidaturas, RPC de claim e RPC de verificação de token.
5. Agenda Supabase Cron ativa: `ef-candidatura-pending-retry` de 15 em 15 minutos, `pg_net`, segredo privado na BD; não depende do Activepieces.
6. Agenda de manutenção de contadores técnicos: `ef-candidatura-rate-limit-cleanup`, diariamente, limpeza de contadores com mais de 7 dias.
7. Alertas: quando houver 6+ tentativas falhadas, o worker tenta um email de alerta idempotente por dia ao PT.
8. **Atenção**: os testes de chamadas manuais e proteção passaram, mas a **execução autónoma agendada e a submissão pública com Turnstile real** ainda não foram comprovadas de ponta a ponta.

## Passo obrigatório do titular
1. Em https://dash.cloudflare.com/?to=/:account/turnstile, criar widget gratuito **EF Coaching Candidatura** para:
   - `edgarfilipe.pt`
   - `www.edgarfilipe.pt`
   - `ef-candidatura-preview-20261009.onrender.com` (só se quiseres testar pelo preview).
2. Copiar apenas a **Site Key (pública)** para `content/site.json` na branch de preparação.
3. Guardar a **Secret Key (privada)** exclusivamente no Supabase Secrets, nome `EF_TURNSTILE_SECRET`. Nunca enviar a Secret Key no chat.
4. Verificar na página se o desafio aparece e fazer teste com pedido fictício válido, esperando `202`, Notion Novo e email entregue.

## Proteções operacionais e coisas que NÃO mudar agora
- Nunca colocar `SUPABASE_SERVICE_ROLE_KEY`, `EF_NOTION_TOKEN` ou `EF_RESEND_API_KEY` no website.
- Evitar recolha de dados de saúde na candidatura; anamnese sensível pertence à App com acesso restrito.
- Não confundir entrega de Resend à API com entrega à caixa; confirmar no Resend Messages.
- **RGPD/retenção:** revisão humana necessária da proposta de 180 dias e de um processo que elimine o lead também do Notion e não só do Supabase; confirmar informação de processadores e transferências internacionais. O texto da branch ainda está sinalizado como não publicado.
- Testar o formulário no telemóvel, os links de privacidade, indisponibilidade temporária, idempotência, limites e recuperação.
- Após tudo passar, copiar `candidatura-publica.html` para `candidatura.html`, ajustar ligações e atualizar CTA `site.application_url` para `https://www.edgarfilipe.pt/candidatura.html` em main.
- Fazer deploy e conferir domínio oficial, Notion, Resend e erros. Ter pronto rollback do `content/site.json` para Jotform.
- **Só depois do período de verificação, apagar AP-01**, não os clientes nem o histórico do Notion.

## Teste Turnstile de pré-lançamento — 10/10/2026 (após configuração do utilizador)
- Site Key pública na branch de preparação: `0x4AAAAAAFS_kCXbYp1nmtnc`; Secret Key guardada pelo utilizador no Supabase (valor nunca lido/exposto).
- Backend Edge Function `ef-website-candidatura` v5. Teste de token falso: `HTTP 403 verification_required`.
- Origem de preview restringida no backend a nomes começados `TESTE EF` e emails `@example.com`. Teste de identidade não autorizada: `HTTP 422 preview_test_only`.
- Formulário público com Turnstile e botão de preenchimento fictício servido só em **preview**, verificado deploy Render **live**: https://ef-candidatura-preview-20261009.onrender.com/candidatura-publica.html
- Documento de privacidade em preview: https://ef-candidatura-preview-20261009.onrender.com/privacidade-candidatura.html
- A branch QA mantém Jotform nas CTAs; `main` oficial mantém Jotform e AP-01.
- Supabase Cron `ef-candidatura-pending-retry`: observado `succeeded` na execução automática de 10:00 UTC.
- **PENDENTE**: validar de forma interativa na pré-visualização que Turnstile emite token real aceite e que a candidatura fictícia aparece no CRM e Resend; conferir compatibilidade mobile.
- **PENDENTE**: política/operacionalização do ciclo de vida dos dados, sobretudo purga dos registos correspondentes no Notion e retenção final de 180 dias antes do cutover.
- **Não apagar AP-01** nem trocar CTA de produção antes de aprovação/testes finais.

## Diagnóstico de envio do preview — 10/10/2026
- O utilizador confirmou tentativa de envio. Os logs da função pública mostram pedidos `POST 422` após a publicação; **nenhuma candidatura nova persistida**, nenhum lead novo no Notion e nenhum email Resend novo.
- A causa específica não é dedutível dos logs atuais (sem payload pessoal). O serviço devolvia `invalid_fields` genérico para erros de campos.
- Edge Function `ef-website-candidatura` v6: adicionado retorno de nomes dos campos rejeitados sem expor os valores. Teste de rejeição `frequency=0` devolve `422` e mensagem `Verifica os seguintes campos: dias disponíveis.`; corpo fictício válido + token Turnstile inválido devolve `403 verification_required`.
- **Não publicar nem remover AP-01** até repetir o formulário no preview, ler a mensagem precisa e obter `202` acompanhado de lead Notion e email entregue.
