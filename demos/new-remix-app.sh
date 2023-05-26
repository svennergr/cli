#! /usr/bin/env bash

# include helpers
DIR_PATH="$(dirname "$0")"
source $DIR_PATH/helpers.sh

clear
print_and_wait "Let's generate a new remix app"
run_demo new-remix-app/init.json

step "Now we can start developing our app"
run_demo new-remix-app/dev.json

step "Here is how that shopify.app.drops-magic-dev.toml would look like"
ORIGINAL_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "384f1ddba5120d2622af435ebbabacbe"

[config]
webhook_event_version = "2023-01"

[config.urls]
app_url = "https://congress-concerned-halifax-spiritual.trycloudflare.com"
redirect_url_allowlist = ["/auth/callback"]

EOL
)
echo "--------------------------shopify.app.drops-magic-dev.toml---------------------------------"
echo "$ORIGINAL_TOML"
echo "--------------------------shopify.app.drops-magic-dev.toml---------------------------------"

step "We can now make a change to the shopify.app.drops-magic-dev.toml"
MODIFIED_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "384f1ddba5120d2622af435ebbabacbe"

[config]
webhook_event_version = "2023-04"

[config.urls]
app_url = "https://congress-concerned-halifax-spiritual.trycloudflare.com"
redirect_url_allowlist = ["/auth/callback"]

[config.app_proxy]
url = "https://congress-concerned-halifax-spiritual.trycloudflare.com/proxy"
subpath = "drop-proxy"
subpathPrefix = "apps"

EOL
)
fake_diff "$ORIGINAL_TOML" "$MODIFIED_TOML"

step "And push the config change to Shopify"
run_demo new-remix-app/push.json

step "What if we wanted to create a production app?"
run_demo new-remix-app/link-production.json

step "Here is how that shopify.app.drops-magic-prod.toml would look like"
PRODUCTION_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[config]
webhook_event_version = "2023-01"

[config.urls]
app_url = "https://example.com"

EOL
)
echo "--------------------------shopify.app.drops-magic-prod.toml---------------------------------"
echo "$PRODUCTION_TOML"
echo "--------------------------shopify.app.drops-magic-prod.toml---------------------------------"


step "We can make a change to it"
MODIFIED_PRODUCTION_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[config]
webhook_event_version = "2023-04"

[config.urls]
app_url = "https://wwww.drops-magic.io"
redirect_url_allowlist = ["/auth/callback"]

[config.app_proxy]
url = "https://wwww.drops-magic.io/proxy"
subpath = "drop-proxy"
subpathPrefix = "apps"

EOL
)
fake_diff "$PRODUCTION_TOML" "$MODIFIED_PRODUCTION_TOML"

step "And push the change to Shopify"
run_demo new-remix-app/push-production.json

step "What happens when we deploy?"
run_demo new-remix-app/deploy.json

step "Fin"
