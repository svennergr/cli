### Step by step flow
1. Generate new Remix app template (npm init @shopify/app@latest) -> init.json
3. Run app server locally (npm run dev) and link development app -> dev.json
4. Push app configuration after changes made to shopify.app.development.toml (npm run config push) -> push.json
5. Link staging app to app repository (npm run config link) -> link-staging.json
6. Use staging configuration (npm run config use staging) -> use-staging.json
7. Update configuration in shopify.app.staging.toml and push config (npm run config push) -> push-staging.json
8. Deploy extension changes to staging (npm run deploy) -> deploy-staging.json
9. Link production
10. Deploy production
