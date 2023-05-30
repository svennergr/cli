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

step "Printful already has app managed on the dashboard"

step "We can now link an existing staging app"
run_demo existing-app/link-staging.json

step "And link a production app too"
run_demo existing-app/link-production.json

step "We might prefer to use the staging config"
run_demo existing-app/use-staging.json

step "We can take a look at the latest staging config"
ORIGINAL_TOML=$(cat << 'EOL'
[settings]
api_key = "384f1ddba5120d2622af435ebbabacbe"

[app_config]
scopes = "write_products,write_customers_read_orders"

[app_config.event_subscriptions]
webhook_event_version = "2023-01"

[app_config.urls]
app_url = "https://www.shopify.staging.printful.com/"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

EOL
)
echo "--------------------------shopify.app.staging.toml---------------------------------"
echo "$ORIGINAL_TOML"
echo "--------------------------shopify.app.staging.toml---------------------------------"

step "Now we can make a change in shopify.app.staging.toml"
MODIFIED_TOML=$(cat << 'EOL'
[settings]
api_key = "384f1ddba5120d2622af435ebbabacbe"

[app_config]
scopes = "write_products,write_customers_read_orders"

[app_config.event_subscriptions]
webhook_event_version = "2023-04"

[app_config.urls]
app_url = "https://www.shopify.staging.printful.com/"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

EOL
)
fake_diff "$ORIGINAL_TOML" "$MODIFIED_TOML"

step "And push it to Shopify"
run_demo existing-app/push-staging.json

step "Let's take a look at the changes reflected on Partners"

step "We can also make changes to the production config"
PRODUCTION_TOML=$(cat << 'EOL'
[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[app_config]
scopes = "write_products,write_customers_read_orders"

[app_config.event_subscription]
webhook_event_version = "2023-01"

[app_config.urls]
app_url = "https://printful.fly.io"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

[privacyComplianceWebhooks]
customerDeletionUrl = "https://staging.printful.com/wh/customer_deletion"
customerDataRequestUrl = "https://staging.printful.com/wh/customer_data_request"
shopDeletionUrl = "https://staging.printful.com/wh/deletion"

EOL
)
MODIFIED_PRODUCTION_TOML=$(cat << 'EOL'
[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[app_config]
scopes = "write_products,write_customers_read_orders"

[app_config.event_subscription]
webhook_event_version = "2023-04"

[app_config.urls]
app_url = "https://printful-v2.fly.io"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

[privacyComplianceWebhooks]
customerDeletionUrl = "https://staging.printful.com/wh/customer_deletion"
customerDataRequestUrl = "https://staging.printful.com/wh/customer_data_request"
shopDeletionUrl = "https://staging.printful.com/wh/deletion"

EOL
)
fake_diff "$PRODUCTION_TOML" "$MODIFIED_PRODUCTION_TOML"

step "And push it to Shopify"
run_demo existing-app/push-production.json

step "Let's take a look at the changes reflected on Partners"

step "Fin"
