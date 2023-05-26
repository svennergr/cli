### Step by step flow
#### New Remix app
`./demos/new-remix-app.sh`

1. Generate new Remix app template (npm init @shopify/app@latest) -> init.json
1. Run app server locally (npm run dev) and link development app -> dev.json
1. Show a git diff after making changes to toml file
1. Push app configuration after changes made to shopify.app.drops-magic-dev.toml (npm run config push) -> push.json
1. Link to a new production app -> link-production.json
1. Show change to hosted URL and webhook API version
1. Push production configuration with hosted URL example -> push-production.json
1. Deploy app extensions -> deploy.json


#### Existing app
`./demos/existing-app.sh`

1. cd into your app repository
1. Install cli dependency
1. Link staging app to app repository (npm run config link) -> link-staging.json
1. Link production app to app repository (npm run config link) -> link-production.json
1. Use staging configuration (npm run config use staging) -> use-staging.json
1. Update configuration in shopify.app.staging.toml and push config (npm run config push) -> push-staging.json
