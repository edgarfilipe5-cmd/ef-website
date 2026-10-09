# EF — Candidatura nativa, migração para arquitetura SEM Activepieces
**Última atualização:** 2026-10-09
**Estado:** página QA publicada; função QA direta em Supabase v2; Notion/Resend aguardam segredos/validação de domínio; **não publicar para clientes reais**.

## Arquitetura final (após autorização)
Website oficial EF -> Edge Function Supabase -> Inbox comercial Supabase -> Notion Leads & Vendas (API direta) + Resend (API direta).
Pagamento e convite para App EF continuam manuais; a candidatura nunca cria cliente, conta, anamnese ou pagamento.

## Realizado
- Pré-visualização: https://ef-candidatura-preview-20261009.onrender.com/candidatura.html
- GitHub: branch `feature/candidatura-nativa-ef-qa-20261009`; PR https://github.com/edgarfilipe5-cmd/ef-website/pull/3 (DRAFT).
- Backend: Edge Function `ef-website-candidatura-qa` v2, sem chamadas Activepieces.
- Aceita apenas `TESTE EF*` + email `@example.com` para impedir candidaturas reais na preview.
- Supabase: tabelas `ef_website_applications` e `ef_website_application_limits`, RLS ativo; anon/authenticated sem acesso; deduplicação por submissionKey e email/dia.
- Duplicados tentam apenas completar entregas pendentes sem duplicar o registo.
- Integração direta com Notion usando API 2025-09-03, data source `a877082e-2e54-42ef-a693-a9571987b0b2`; por email, cria o lead apenas se não existir.
- Integração direta com Resend via POST /emails, usando `Idempotency-Key` e apenas variáveis de ambiente privadas.
- A função marca `DELIVERY_PENDING` quando não consegue sincronizar/enviar e não afirma que a notificação foi entregue.
- Novo domínio Resend `edgarfilipe.pt`, região `eu-west-1`, criado mas ainda não verificado.
- AP-08, AP-02 e AP-03 apagados após serem substituídos ou estarem desativados. Credenciais AP do Supabase apagadas; a tabela temporária de integração foi eliminada.
- **AP-01 mantém-se ativo** exclusivamente para o Jotform oficial; é a última dependência. Não desativar até cutover E2E comprovado.

## Passos obrigatórios (sem introduzir tokens no chat ou GitHub)
### 1. Configurar DNS e validar Resend
No painel DNS do fornecedor que gere `edgarfilipe.pt`, adicionar exatamente os registos gerados pelo Resend. Não alterar MX do email principal, SPF existente no domínio raiz, nem outros registos de website.
- TXT `resend._domainkey` = `p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDG/iidbp0j7c2t5r0/8t+GMbhB0U1O6KwJuU8cVxpNl2X6epsi3AHjxN4I5JVX1B1xfxwNKhN+bcPPcQ9rybCBLjp096Cn61gxbyIUJF2ejISFHQVs/m+UuGvfiqbj0ZGlcDeMXHKph7wdHF7haSgVfXSkvwSz8vFJh9ay/RC1FQIDAQAB`
- MX `send` = `feedback-smtp.eu-west-1.amazonses.com`, prioridade 10
- TXT `send` = `v=spf1 include:amazonses.com ~all`
- CNAME `rsend` = `send.forge.rmta.net` (se pedido no painel)
Validar no Resend -> Domains -> edgarfilipe.pt. Não enviar emails do domínio antes de ficar verificado.

### 2. Criar credenciais próprias e guardar na Supabase Edge Function Secrets
Painel: https://supabase.com/dashboard/project/twbriibfrrfcrksnsypd/settings/functions
- Resend -> API keys -> criar chave com permissão somente `sending_access`.
- Supabase Secrets: `EF_RESEND_API_KEY` = chave gerada; opcional `EF_RESEND_FROM` = `EF Coaching <candidaturas@edgarfilipe.pt>`.
- Notion -> My connections / Internal integrations -> criar `EF Website Candidaturas` com permissões de leitura e inserção de páginas; partilhar a base `Leads & Vendas` com a integração.
- Supabase Secrets: `EF_NOTION_TOKEN` = token da integração. **Nunca partilhar a chave em mensagens/chat/repo.**
- Opcional: `EF_LEAD_NOTIFICATION_TO` = email EF de receção.

### 3. QA e cutover
- Enviar no formulário fictício, confirmar guarda Supabase + lead no Notion + aceitação Resend + chegada à caixa de correio.
- Enviar repetido e confirmar sem duplicação. Simular falhas e confirmar `DELIVERY_PENDING`.
- Rever RGPD, destinatários, prazo de retenção, proteção anti-bot/limite de tráfego, política de exclusão, reprocessamento de pendentes e alertas.
- Criar endpoint production separadamente, sem restrição `TESTE EF` apenas depois da revisão; atualizar o CTA oficial.
- Quando o CTA oficial deixar de usar Jotform/AP-01, verificar todas as dependências e **só então apagar o AP-01** e desligar a conexão/conta Activepieces.

### Importante
- A página QA **não é um formulário real de clientes**: apenas dados fictícios.
- Se Notion/Resend não estiverem configurados, a candidatura pode ficar guardada no Supabase, mas com encaminhamento pendente.
- Nenhuma automatização AP residual fica no novo backend; a única dependência Activepieces restante é AP-01 do website oficial.
