# App Skills & Rules

## Versionamento e Deploy
- **Incremento Obrigatório**: Sempre que houver uma alteração significativa no código ou na UI, o script `node scripts/bump-version.mjs` deve ser executado.
- **Sincronização com Banco**: Após o incremento, a nova versão deve ser atualizada na tabela `app_settings` (chave `min_version`) do Supabase para garantir que todos os usuários recebam o aviso de atualização.
- **Produção**: Somente enviar para `main` após garantir que a versão foi incrementada e o banco sincronizado.

## Controle de Cache (Anti-Cache Safari/Chrome)
- **Service Worker Versionado**: O Service Worker deve ser sempre registrado com o parâmetro de versão (ex: `/sw.js?v=${APP_VERSION}`) no `PWAHandler.tsx` para forçar o download em dispositivos iOS.
- **Estratégia SW**: Manter a estratégia `Network-First` para a página inicial (`/`) no `sw.js`.
- **Update Forçado (Botão de Pânico)**: Caso o cache persista em algum dispositivo, atualize a data `force_update_at` na tabela `app_settings`. Isso disparará uma limpeza profunda de Service Workers e Caches do navegador em todos os clientes.

## Qualidade de Código
- Manter o padrão de Clean Code.
- Priorizar estética premium com CSS Vanilla/Tailwind consistente (variáveis do `globals.css`).
