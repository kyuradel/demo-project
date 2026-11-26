#!/usr/bin/env bash
# PreToolUse hook entry point — delegates to tdd-guard.js for JSON parsing
# and the vitest check (far more reliable on Windows than bash alone).
hook_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec node "$hook_dir/tdd-guard.js"
