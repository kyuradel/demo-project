#!/usr/bin/env bash
# Smoke-tests tdd-guard.js against known PreToolUse input shapes, so the
# next time this hook changes, checking it doesn't mean hand-writing JSON
# and piping it in again from scratch.
#
# Usage: .claude/hooks/test-hook.sh   (or: npm run test-hook)
set -euo pipefail

root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
hook="$root/.claude/hooks/tdd-guard.js"
fixtures="$root/.claude/hooks/__tests__/fixtures"
cd "$root"

fail=0

check() {
  local name="$1" input="$2" expect_deny="$3"
  local out
  out="$(printf '%s' "$input" | node "$hook")"
  if [ "$expect_deny" = "yes" ]; then
    if printf '%s' "$out" | grep -q '"permissionDecision":"deny"'; then
      echo "PASS  $name (denied as expected)"
    else
      echo "FAIL  $name — expected deny, got: $out"
      fail=1
    fi
  else
    if printf '%s' "$out" | grep -q '"permissionDecision":"deny"'; then
      echo "FAIL  $name — expected allow, got: $out"
      fail=1
    else
      echo "PASS  $name (allowed as expected)"
    fi
  fi
}

check "deny-no-test" "$(cat "$fixtures/deny-no-test.json")" yes
check "allow-green-existing-test" "$(cat "$fixtures/allow-green-existing-test.json")" no
check "allow-excluded-types" "$(cat "$fixtures/allow-excluded-types.json")" no

# Absolute paths aren't portable across machines, so this one is built at
# run time instead of living as a static fixture.
abs_path="$(node -e "console.log(require('path').resolve('src/lib/parseChat.ts'))")"
abs_input="$(node -e "console.log(JSON.stringify({tool_name:'Write',tool_input:{file_path:process.argv[1]}}))" "$abs_path")"
check "allow-absolute-path" "$abs_input" no

exit "$fail"
