# EF Coaching — Candidaturas em produção (10/10/2026)

## Arquitetura ATIVA

- **Website oficial:** https://www.edgarfilipe.pt/
- **CTA de candidatura:** https://www.edgarfilipe.pt/candidatura.html (confirmado em produção no Render e em links das páginas inicial e Coaching)
- **Website form:** HTML + JavaScript e verificação Cloudflare Turnstile. Não usa Jotform na CTA oficial.
- **Backend:** Supabase Edge Function `ef-website-candidatura`, projeto `twbriibfrrfcrksnsypd`.
- **Persistência técnica:** `public.ef_website_applications`; RLS protege acesso de utilizadores finais.
- **CRM:** Notion EF OS → 💰 Leads & Vendas (o sistema cria ou localiza o lead).
- **Email:** Resend → `edgarfilipe5@gmail.com` (aviso mínimo, sem dados pessoais no assunto e corpo; abrir CRM para detalhes).
- **Recuperação de falhas:** Supabase Cron `ef-candidatura-pending-retry`, de 15 em 15 min. `ef-candidatura-rate-limit-cleanup` diariamente.
- **Conservação ativa:** 180 dias para candidaturas criadas exclusivamente pelo formulário EF, que não se converteram em clientes nem estão em acompanhamento comercial. A função privada `ef-website-retention` v3 e o Cron `ef-candidatura-retention-180d` estão ativos diariamente às 04:40 UTC. Estado gerido por `ef_internal.website_retention_control`, sem segredos no código. Elimina o registo Supabase após anonimização de campos pessoais e envio da página do Notion para o lixo. O lixo/histórico/backups do Notion não equivalem a apagamento físico definitivo.
- **Pagamento:** não é feito no formulário. O treinador decide e contacta o candidato; Stripe continua fora desta parte.

## Testes VALIDADOS
- No preview, formulário + Turnstile real → Supabase estado DELIVERED → novo lead Notion → email Resend entregue.
- No domínio real `www.edgarfilipe.pt`, candidatura **TESTE EF — Domínio Oficial** → Supabase DELIVERED com `notion_owned=true`, Notion Novo e Resend delivered.
- Endpoint recusa token Turnstile inválido com 403, campos inválidos com 422 e bloqueia dados reais em preview.
- Retentativa de candidatura pendente testada com dados sintéticos (cron worker) e convertida em DELIVERED.
- Permissão de atualização da integração Notion verificada sobre notas de um registo sintético, sem alterar o conteúdo.
- Página oficial e política de privacidade publicadas e verificadas.

## Legado RETIRADO
- CTA anterior: `https://form.jotform.com/262522804984059` (guardar como referência para rollback; já não é a ligação pública oficial).
- Activepieces AP-01 (`lNYMJcukTE6bvf14qEKFL`): primeiro DISABLED, depois **eliminado**, após QA e cutover. Lista de flows depois da eliminação: **0**.
- Plugins Activepieces **e Jotform** no ChatGPT **desinstalados**. As contas externas e formulários históricos permanecem intactos.
- **Atenção:** a conta externa Activepieces e os formulários históricos Jotform não foram apagados. Links antigos distribuídos fora do website podem continuar abertos, mas já não têm fluxo Activepieces para chegar ao CRM; atualizar links partilhados manualmente.
- Não alterar nem eliminar páginas do Notion EF OS, dados de clientes existentes ou histórico de Jotform.

## Plano de reversão
- Repor temporariamente no `content/site.json` a ligação anterior Jotform é possível, mas **o fluxo AP-01 já foi eliminado**, pelo que os leads enviados por esse caminho não voltam a sincronizar automaticamente com o Notion. Se o backend novo falhar, preferir informar os candidatos de um contacto direto (`edgarfilipe5@gmail.com`) ou recriar conscientemente a integração antiga, em vez de prometer recuperação automática inexistente.

## QA final de conservação (10/10/2026)
- Foi escolhida exclusivamente a candidatura fictícia `TESTE EF — Domínio Oficial`, email `@example.com`, sem cliente real ou pagamento.
- No Supabase, o `created_at` desse registo de QA foi temporariamente simulado com 181 dias.
- Teste 1: endpoint privado respondeu `dryRun=true,scanned=1,eligible=1,cleaned=0,errors=0`.
- Teste 2: limpeza autorizada apenas para este registo fictício: `dryRun=false,scanned=1,eligible=1,cleaned=1,errors=0`.
- Verificação independente: a linha fictícia já não existe em `ef_website_applications`; no Notion a página mostra `deleted`, o nome foi substituído por `EF — candidatura expirada`, e os campos de email, telefone, Instagram e notas pessoais foram apagados/anonimizados.
- A exceção temporária de QA foi **removida da função** (versão 3). Função em produção de segurança restrita a token privado, com flag interna e proteção de origem da própria integração, estados `Novo`/`Perdido`, ligação de cliente, pagamentos, follow-ups e contactos recentes.
- A flag privada `enabled=true` foi ativada e a agenda diária `ef-candidatura-retention-180d` substituiu `ef-candidatura-retention-dryrun`.
- Teste de saúde pós-ativação: `HTTP 200,dryRun=false,scanned=0,errors=0`; utilizador anónimo não consegue executar RPC privada; Cron presente e `active=true`.
- **Limitação de privacidade:** o Notion mantém mecanismos de lixo/histórico/backups fora do controlo da integração. As páginas ficam anonimizadas e no lixo, mas não há garantia técnica de apagamento definitivo no armazenamento do fornecedor.
