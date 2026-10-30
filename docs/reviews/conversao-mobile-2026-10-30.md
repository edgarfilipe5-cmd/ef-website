# EF — Conversão e mobile — 30/10/2026

## Alterações

Oferta visível no início: acompanhamento online, plano personalizado, App EF, treinador,199 €,12semanas e pagamento único. O CTA principal abre a candidatura local, permitindo testar a mesma rota antes da publicação. Link secundário e menu apontam diretamente à oferta completa, movida para antes do processo e dos efeitos visuais. Condições e preço preservados; continua sem checkout automático.

Em mobile, vantagens em lista legível, controlos de toque maiores, campos com16px e entrada direta na candidatura. CTA persistente apenas quando o principal sai do ecrã. Fotos reais e3D mantidos. FAQ acrescenta treino em casa, suportado pela oferta existente.

Build gera HTML com conteúdo e foto inicial antes de executar JavaScript. O JSON continua a atualizar o conteúdo no cliente. Se falhar, mantém-se o conteúdo estático com navegação funcional. Imagem inicial responsiva WebP:16.560bytes a480px/31.640bytes a800px, comparados com212.461bytes do JPEG anterior (menos92,2% no asset móvel; não é uma medição da velocidade total do site). Three.js só é importado perto da secção3D e a renderização pausa fora do ecrã ou com o separador oculto. Vídeos continuam sem autoplay e preload none.

## Correções encontradas nos testes

A decoração circular da introdução da candidatura alargava a página em375/390px. Contida no respetivo bloco. Turnstile compacto até720px para caber na coluna interna do formulário, mantendo validação e segurança.

## Validação concreta

- Build, sintaxe JS e conteúdo inicial estático aprovados.
-158referências locais (links, recursos e âncoras) verificadas sem destino ausente.
-9páginas×4viewports:375×667,390×844,768×1024 e1440×900.36combinações finais sem overflow, títulos cortados ou imagens partidas observadas. CTA principal acima da dobra nos quatro tamanhos.
- UI real: menu abre/fecha, acesso à oferta e à candidatura, obrigatórios impedem avanço, primeira etapa válida avança, email inválido é reconhecido, voltar preserva respostas.
-10cenários isolados do script real do formulário: obrigatórios, ir/voltar, privacidade, captcha expirado, honeypot, sucesso simulado,429, falha de rede, resposta negativa e JSON inválido. Rede, captcha e DOM simulados, zero submissões reais.
-3D: canvas inicial300px (não inicializado),348×298 após chegar à secção no mobile; botão fixo visível apenas depois de sair do CTA inicial. Vídeo testado na revisão anterior e recurso preservado.
- Domínio oficial consultado apenas em leitura: Turnstile devolveu “Verificação concluída.” e habilitou o botão. Nenhuma candidatura enviada, nenhum CAPTCHA resolvido manualmente, nenhum contacto criado.

## Limites

Não há medição Lighthouse ou dados reais de Core Web Vitals após publicação; não se promete aumento de vendas nem uma pontuação de performance. Não foi testada a persistência real de uma candidatura no backend nem notificações subsequentes. Teste de envio foi isolado. Versão continua em branch/PR de revisão, sem alteração de produção.

Referências técnicas: https://web.dev/learn/performance/video-performance e https://developer.chrome.com/docs/modern-web-guidance/guides/performance/performance .
