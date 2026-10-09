# EF Coaching — candidatura nativa: branch de pré-visualização
**Estado em 09/10/2026: QA / código apenas. NÃO PUBLICAR / NÃO USAR PARA CANDIDATURAS REAIS.**

## Implementado nesta branch, sem alterar produção
- `/candidatura.html`: página com identidade EF, adaptação mobile, duas etapas, campos do funil comercial, validação e indicação de preços / pagamento manual.
- `/src/candidatura.js`: modo simulação deliberadamente fixo. NENHUM POST, armazenamento local ou email. A confirmação diz claramente que nada foi enviado.
- `/privacidade.html`: **rascunho** de informação de privacidade, não pronto para publicação.
- `/build.mjs`: copia estas páginas para `dist/` no ramo de teste.
- `/supabase/functions/ef-website-candidatura/index.ts`: **código backend não publicado**. Concebe endpoint público com validação, controlo de spam básico, persistência, consulta/criação de lead no Notion e notificação Gmail. Não tem endpoint ativo.
- `/docs/ef-candidatura-schema-proposta.sql`: proposta de esquema com RLS, funções de escrita exclusivas do `service_role`, deduplicação pelo email/dia e limitação por IP/hora. **Não executar sem aprovação adicional.**

**Intactos:** `main`, `content/site.json` (CTA Jotform), `src/site-v2.js`, Render de produção, Supabase live, Notion e Activepieces AP-01. **Não houve uso de dados de candidatos reais.**

## Fluxo de produto aprovado
Website formulário EF → persistência segura de candidatura comercial → criação/identificação da lead **Leads & Vendas** Notion → aviso Gmail ao Edgar → qualificação pelo Edgar no WhatsApp → pagamento diretamente ao Edgar → convite App EF → anamnese na App EF (dados clínicos só no Supabase da App).

**Notion existente:** database `4af1e9d6-fa58-40f1-8432-7d7ca55964f7`, data source `a877082e-2e54-42ef-a693-a9571987b0b2` (usar API `Notion-Version: 2025-09-03` ou superior). Não criar nova base nem fichas de cliente prematuras. `Origem` não tem ainda opção `Website EF`; a integração de proposta usa `Outro` e texto de origem nas notas, sem alterar schema Notion.

## Configuração indispensável antes de um teste E2E real
1. Confirmar titular do tratamento, texto RGPD, prazo de retenção, subcontratantes/transferências internacionais e política definitiva. Ativar proteção anti-bot com eficácia validada e evitar recolher dados de saúde no campo livre.
2. Criar cópia de segurança e validar a migração SQL em contexto de QA. **Não executar esquema diretamente no projeto live sem autorização adicional.**
3. Configurar Edge Function pública com `verify_jwt=false`, mas somente após revisão independente de CORS, rate limits, abuso, cabeçalhos de proxy, validação, quota e erros. Limitar origens em `EF_FORM_ALLOWED_ORIGINS` (origem de produção e URL preview reais, sem `*`).
4. Configurar **apenas no servidor**: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (ou chave secreta apropriada), `EF_FORM_IP_SALT`, `EF_NOTION_TOKEN`, `EF_NOTION_LEADS_DATA_SOURCE_ID=a877082e-2e54-42ef-a693-a9571987b0b2`, `EF_GMAIL_CLIENT_ID`, `EF_GMAIL_CLIENT_SECRET`, `EF_GMAIL_REFRESH_TOKEN`, `EF_GMAIL_OWNER`. Integração Notion tem de ter acesso autorizado à base; Gmail requer OAuth com autorização e escopo de envio.
5. Acrescentar **fila/reprocessamento de entregas pendentes**. O backend de proposta grava candidaturas antes de tentar Notion/Gmail e assinala `DELIVERY_PENDING`, mas **não tem worker de retry automático**. Não declarar uma integração fiável enquanto os pendentes não forem reprocessados e alertados.
6. Expor frontend apenas após o endpoint ter teste com candidato fictício e integração aprovada. Na publicação, mudar explicitamente o modo de simulação do `src/candidatura.js` para envio autorizado e **só depois** alterar `site.application_url`.
7. Caso de falha, manter CTA Jotform e AP-01. Não desativar/arquivar qualquer integração antiga sem confirmação.

## Checklist de testes antes de publicação
- [ ] Aspeto 320px, 375px, 430px, tablet, desktop, teclado e leitores de ecrã
- [ ] Campos obrigatórios e email/telefone inválidos travados em ambos os passos
- [ ] Consentimento informativo e política RGPD aprovados
- [ ] Spam/honeypot, rate limit, ataques diretos e cabeçalhos falsificados avaliados
- [ ] Validação repetida no servidor; nunca confiar apenas no navegador
- [ ] Dois envios com mesma chave e mesmo email no mesmo dia geram só uma lead
- [ ] Notion recebe lead com `Estado=Novo` sem criar registos na base clínica de Clientes
- [ ] Gmail informa Edgar, sem confirmar pagamento nem criar conta
- [ ] Simular falha de Notion e Gmail: lead persiste, aparece em fila e chega ao operador
- [ ] Inventariar quotas e custos (sem serviços pagos adicionados)
- [ ] Confirmar eventual preview Render sem tocar no `main`; bloquear indexação
- [ ] Rever legalmente a informação de privacidade, limites de retenção e eliminação
- [ ] Cutover apenas após aprovação explícita e rollback (reverter o URL do CTA para Jotform)

## Notas operacionais
- Este código backend é uma **proposta que precisa de QA e credenciais**, não uma integração comprovada.
- Gmail API usa credenciais OAuth existentes/autorizadas do titular; não pressupor que já estão provisionadas.
- A segurança anti-bot apresentada é apenas uma primeira camada; CORS e honeypot por si só não impedem tráfego automatizado.
- Nenhuma notificação de email está programada ou foi enviada por este ramo.
- O plano de publicação final deve incluir recuperação da base e limpeza de dados fictícios.
