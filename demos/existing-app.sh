#! /usr/bin/env bash

# include helpers
DIR_PATH="$(dirname "$0")"
source $DIR_PATH/helpers.sh
clear
print_and_wait "$ cd printful"
clear

print_and_wait ""
run_demo existing-app/install-cli.json

step ""
run_demo existing-app/link-staging.json

step ""
ORIGINAL_TOML=$(cat << 'EOL'
[app_config]
client_id = "384f1ddba5120d2622af435ebbabacbe"
scopes = "write_products,write_customers_read_orders"

[app_info]
name = "Printful Staging"
api_contact_email="dev@printful.com"

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://www.shopify.staging.printful.com/"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

[event_subscriptions]
webhook_api_version = "2023-01"

EOL
)
echo "--------------------------shopify.app.staging.toml---------------------------------"
echo "$ORIGINAL_TOML"
echo "--------------------------shopify.app.staging.toml---------------------------------"

step ""
run_demo existing-app/link-production.json

step ""
run_demo existing-app/use-staging.json

step ""
MODIFIED_TOML=$(cat << 'EOL'
[app_config]
client_id = "384f1ddba5120d2622af435ebbabacbe"
scopes = "write_products,write_customers_read_orders"

[app_info]
name = "Printful Staging"
api_contact_email="dev@printful.com"

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://www.shopify.staging.printful.com/"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

[event_subscriptions]
webhook_api_version = "2023-04"

EOL
)
fake_diff "$ORIGINAL_TOML" "$MODIFIED_TOML"

step ""
run_demo existing-app/push-staging.json

step ""
PRODUCTION_TOML=$(cat << 'EOL'
[app_config]
client_id = "8614c837eefe0236fc3d2eb6c9841206"
scopes = "write_products,write_customers_read_orders"

[app_info]
name = "Printful Staging"
api_contact_email="dev@printful.com"

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://printful.fly.io"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

[event_subscriptions]
webhook_api_version = "2023-01"

[privacyComplianceWebhooks]
customerDeletionUrl = "https://www.printful.com/wh/customer_deletion"
customerDataRequestUrl = "https://www.printful.com/wh/customer_data_request"
shopDeletionUrl = "https://www.printful.com/wh/deletion"

EOL
)
MODIFIED_PRODUCTION_TOML=$(cat << 'EOL'
[app_config]
client_id = "8614c837eefe0236fc3d2eb6c9841206"
scopes = "write_products,write_customers_read_orders"

[app_info]
name = "Printful Staging"
api_contact_email="dev@printful.com"

[embedded_app_settings]
embedded = true
pos_embedded = false

[app_urls]
app_url = "https://printful-v2.fly.io"
redirect_url_allowlist=["/dashboard/shopify/connect", "/dashboard/shopify/auth"]

[event_subscriptions]
webhook_api_version = "2023-04"

[privacyComplianceWebhooks]
customerDeletionUrl = "https://www.printful.com/wh/customer_deletion"
customerDataRequestUrl = "https://www.printful.com/wh/customer_data_request"
shopDeletionUrl = "https://www.printful.com/wh/deletion"

EOL
)
fake_diff "$PRODUCTION_TOML" "$MODIFIED_PRODUCTION_TOML"

step ""
run_demo existing-app/push-production.json

step ""
