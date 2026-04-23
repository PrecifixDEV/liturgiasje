<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.

## Git Workflow Rules
1. **DEFAULT BRANCH**: All development and testing MUST be done on the `preview` branch.
2. **PRODUCTION**: Pushing to the `main` branch is FORBIDDEN unless the user explicitly commands "Enviar para produção".
3. **COMMITS**: Always commit to `preview` first.
## Release & Cache Rules
1. **BUMP VERSION**: Before pushing to `main`, ALWAYS run `node scripts/bump-version.mjs`.
2. **SYNC DATABASE**: After bumping, ALWAYS update `min_version` in the `app_settings` table to match `APP_VERSION`.
3. **SAFARI CACHE**: Always register the Service Worker with a version query: `/sw.js?v=${APP_VERSION}`.
4. **FORCE UPDATE**: If a critical cache issue occurs, update `force_update_at` in the database to trigger a deep clean on all clients.
<!-- END:nextjs-agent-rules -->
