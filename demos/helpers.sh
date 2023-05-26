#! /usr/bin/env bash

# current dir
DIR_PATH="$(dirname "$0")"

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
