# Skill: Automatização de Versão (/version)

Esta skill permite o incremento automático da versão do aplicativo Liturgia SJE em todos os subsistemas (Código, Interface e Banco de Dados) através do comando `/version`.

## Como atuar quando o usuário disser "/version":

1.  **Incrementar arquivo local**:
    - Execute o script `node scripts/bump-version.mjs`.
    - O script retornará um JSON com a `oldVersion` e a `newVersion`.

2.  **Atualizar o Banco de Dados (Supabase)**:
    - Use a ferramenta `mcp_supabase-mcp-server_execute_sql`.
    - Execute o seguinte comando:
      ```sql
      UPDATE app_settings 
      SET value = '[NOVA_VERSAO]', updated_at = NOW() 
      WHERE key = 'min_version';
      ```
    - Substitua `[NOVA_VERSAO]` pelo valor de `newVersion` retornado pelo script.

3.  **Confirmar para o usuário**:
    - Informe que a versão foi atualizada com sucesso de `[VERSAO_ANTIGA]` para `[NOVA_VERSAO]`.
    - Mencione que o rodapé e o bloqueio do PWA já estão refletindo a mudança.

## Recursos:
- **Script**: `scripts/bump-version.mjs`
- **Arquivo de Versão**: `src/constants/version.ts`
- **Tabela**: `app_settings` no Supabase.
