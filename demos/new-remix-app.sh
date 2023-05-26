#! /usr/bin/env bash

# grab paths
FULL_PATH=$(realpath $0)
DIR_PATH=$(dirname $FULL_PATH)

# helper to read any key and continue
function print_and_wait() {
  local message="$1"
  read -p "🦀 ${message} "
}

function step() {
  local message="$1"
  read
  clear
  print_and_wait "$1"
}

# helper to run a demo
function run_demo() {
  local file="$1"
  $DIR_PATH/../packages/cli/bin/dev.js demo --file "$DIR_PATH/$file"
}

# helper to diff two variables
function fake_diff() {
  diff -U10 <(echo "$1") <(echo "$2") | tail -n +3
}

# flow starts here
clear
print_and_wait "Let's generate a new remix app"
run_demo new-remix-app/init.json

step "Now we can start developing our app"
run_demo new-remix-app/dev.json

step "We can now make a change to the shopify.app.dropshipping.toml"
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

[config]
webhook_event_version = "2023-04"
EOL
)
fake_diff "$ORIGINAL_TOML" "$MODIFIED_TOML"

step "And push the config change to Shopify"
run_demo new-remix-app/push.json

step "What if we wanted to link an existing app to this codebase?"
run_demo new-remix-app/link-production.json

step "Here is how that shopify.app.dropshipping.toml would look like"
PRODUCTION_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[config]
webhook_event_version = "2023-01"

[config.urls]
app_url = "https://my-cool-dropshipping-app.fly.io"
EOL
)
echo "$PRODUCTION_TOML"

step "We can make a change to it"
MODIFIED_PRODUCTION_TOML=$(cat << 'EOL'
scopes = "write_products"

[settings]
api_key = "8614c837eefe0236fc3d2eb6c9841206"

[config]
webhook_event_version = "2023-04"

[config.urls]
app_url = "https://my-cool-dropshipping-app-v2.fly.io"
EOL
)
fake_diff "$PRODUCTION_TOML" "$MODIFIED_PRODUCTION_TOML"

step "And push the change to Shopify"
run_demo new-remix-app/push-production.json

step "What happens when we deploy?"
run_demo new-remix-app/deploy.json

step "Fin"
