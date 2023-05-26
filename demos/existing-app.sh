#! /usr/bin/env bash

# include helpers
DIR_PATH="$(dirname "$0")"
source $DIR_PATH/helpers.sh

clear
print_and_wait "Let's enable config in code for an existing dashboard managed app"
clear

print_and_wait "$ cd printful"
clear

print_and_wait "Let's add the Shopify CLI as a dependency"
run_demo existing-app/install-cli.json

step "We can now link an existing staging app"
run_demo existing-app/link-staging.json

step "And link a production app too"
run_demo existing-app/link-production.json

step "We might prefer to use the staging config"
run_demo existing-app/use-staging.json

step "Now we can make a change in shopify.app.staging.toml"
ORIGINAL_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "384f1ddba5120d2622af435ebbabacbe"

[config]
webhook_event_version = "2023-01"
EOL
)
MODIFIED_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "384f1ddba5120d2622af435ebbabacbe"
automatically_update_urls_on_dev = false

[config]
webhook_event_version = "2023-04"
EOL
)
fake_diff "$ORIGINAL_TOML" "$MODIFIED_TOML"

step "And push it to Shopify"
run_demo existing-app/push-staging.json

step "We can also make changes to the production config"
PRODUCTION_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[config]
webhook_event_version = "2023-01"

[config.urls]
app_url = "https://printful.fly.io"
EOL
)
MODIFIED_PRODUCTION_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"
automatically_update_urls_on_dev = false

[config]
webhook_event_version = "2023-04"

[config.urls]
app_url = "https://printful-v2.fly.io"
EOL
)
fake_diff "$PRODUCTION_TOML" "$MODIFIED_PRODUCTION_TOML"

step "And push it to Shopify"
run_demo existing-app/push-production.json

step "Fin"
