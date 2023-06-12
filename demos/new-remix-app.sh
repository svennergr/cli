#! /usr/bin/env bash

# include helpers
DIR_PATH="$(dirname "$0")"
source $DIR_PATH/helpers.sh

clear
run_demo new-remix-app/init.json

step ""
run_demo new-remix-app/dev.json

step ""
ORIGINAL_TOML=$(cat << 'EOL'
[cli_config]
automatically_update_urls_on_dev = true

[app_config]
client_id = "a61950a2cbd5f32876b0b55587ec7a27"
scopes = "write_products"

[app_info]
name = "Drops Magic Dev"
api_contact_email=”alice@drops-magic.com”

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://congress-concerned-halifax-spiritual.trycloudflare.com/"
preferences_url = ""
redirect_url_allowlist = ["auth/callback"]

[event_subscriptions]
webhook_api_version = "2022-07"

EOL
)
echo "--------------------------shopify.app.drops-magic-dev.toml---------------------------------"
echo "$ORIGINAL_TOML"
echo "--------------------------shopify.app.drops-magic-dev.toml---------------------------------"

step ""
MODIFIED_TOML=$(cat << 'EOL'
[cli_config]
automatically_update_urls_on_dev = true

[app_config]
client_id = "a61950a2cbd5f32876b0b55587ec7a27"
scopes = "write_products"

[app_info]
name = "Drops Magic Dev"
api_contact_email=”alice@drops-magic.com”

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://congress-concerned-halifax-spiritual.trycloudflare.com/"
preferences_url = ""
redirect_url_allowlist = ["auth/callback"]

[event_subscriptions]
webhook_api_version = "2023-04"

[app_proxy]
url = "https://congress-concerned-halifax-spiritual.trycloudflare.com/proxy"
subpath = "drop-proxy"
subpathPrefix = "apps"

EOL
)
fake_diff "$ORIGINAL_TOML" "$MODIFIED_TOML"

step ""
run_demo new-remix-app/push.json

step ""
run_demo new-remix-app/link-production.json

step ""
PRODUCTION_TOML=$(cat << 'EOL'
[cli_config]
automatically_update_urls_on_dev = true

[app_config]
client_id = "8614c837eefe0236fc3d2eb6c9841206"
scopes = "write_products"

[app_info]
name = "Drops Magic"
api_contact_email=""

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://example.com/"
preferences_url = ""
redirect_url_allowlist = []

[event_subscriptions]
webhook_api_version = "2022-07"

EOL
)
echo "--------------------------shopify.app.drops-magic.toml---------------------------------"
echo "$PRODUCTION_TOML"
echo "--------------------------shopify.app.drops-magic.toml---------------------------------"


step ""
MODIFIED_PRODUCTION_TOML=$(cat << 'EOL'
[cli_config]
automatically_update_urls_on_dev = true

[app_config]
client_id = "8614c837eefe0236fc3d2eb6c9841206"
scopes = "write_products"

[app_info]
name = "Drops Magic"
api_contact_email="support@drops-magic.com"

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://wwww.drops-magic.io"
redirect_url_allowlist = ["/auth/callback"]

[event_subscriptions]
webhook_api_version = "2023-04"
EOL
)
fake_diff "$PRODUCTION_TOML" "$MODIFIED_PRODUCTION_TOML"

step ""
run_demo new-remix-app/push-production.json

# step "What happens when we deploy?"
# run_demo new-remix-app/deploy.json
