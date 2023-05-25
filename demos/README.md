### Step by step flow
#### New Remix app
1. Generate new Remix app template (npm init @shopify/app@latest) -> init.json
2. Run app server locally (npm run dev) and link development app -> dev.json
3. Show a git diff after making changes to toml file
4. Push app configuration after changes made to shopify.app.development.toml (npm run config push) -> push.json
5. Link to a new production app -> link-production.json
6. Show change to hosted URL and webhook API version
7. Push production configuration with hosted URL example -> push-production.json
7. Deploy app extensions with (--config flag) -> deploy.json


#### Existing app
1. cd into your app repository
1. Install cli dependency
1. Link staging app to app repository (npm run config link) -> link-staging.json
2. Link production app to app repository (npm run config link) -> link-production.json
3. Use staging configuration (npm run config use staging) -> use-staging.json
4. Update configuration in shopify.app.staging.toml and push config (npm run config push) -> push-staging.json
