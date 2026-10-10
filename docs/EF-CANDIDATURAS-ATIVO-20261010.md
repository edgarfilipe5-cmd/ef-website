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
- **Retenção proposta:** 180 dias para candidaturas não convertidas, com proteção de clientes e leads ativos. A rotina `ef-website-retention` e o Cron `ef-candidatura-retention-dryrun` estão ativos **só em simulação**, sem eliminar dados. A eliminação efetiva ainda requer aprovação da verificação da rotina com registos sintéticos elegíveis e posterior ativação controlada.
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
- Plugin Activepieces no ChatGPT **desinstalado**.
- **Atenção:** a conta externa Activepieces e os formulários históricos Jotform não foram apagados. Links antigos distribuídos fora do website podem continuar abertos, mas já não têm fluxo Activepieces para chegar ao CRM; atualizar links partilhados manualmente.
- Não alterar nem eliminar páginas do Notion EF OS, dados de clientes existentes ou histórico de Jotform.

## Plano de reversão
- Repor temporariamente no `content/site.json` a ligação anterior Jotform é possível, mas **o fluxo AP-01 já foi eliminado**, pelo que os leads enviados por esse caminho não voltam a sincronizar automaticamente com o Notion. Se o backend novo falhar, preferir informar os candidatos de um contacto direto (`edgarfilipe5@gmail.com`) ou recriar conscientemente a integração antiga, em vez de prometer recuperação automática inexistente.
