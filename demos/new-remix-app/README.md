### Step by step flow
1. Generate new Remix app template (npm init @shopify/app@latest) -> init.json
2. Link development app to app repository (npm run config link) -> link.json
3. Generate extension?
4. Run app server locally (npm run dev) -> dev.json
5. Push app configuration after changes made to shopify.app.development.toml (npm run config push) -> push.json
6. Link staging app to app repository (npm run config link) -> link-staging.json
7. Use staging configuration (npm run config use staging) -> use-staging.json
8. Update configuration in shopify.app.staging.toml and push config (npm run config push) -> push-staging.json
9. Deploy extension changes to staging (npm run deploy) -> deploy-staging.json
10. Link production
11. Deploy production
