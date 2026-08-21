#!/usr/bin/env bash
# init.sh — Verifica que el entorno está listo para trabajar.
# Si falla algo, reporta y NO se debe continuar.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
YELLOW=$'\033[1;33m'
NC=$'\033[0m'

ok() { printf '%s✔ %s%s\n' "$GREEN" "$1" "$NC"; }
fail() { printf '%s✘ %s%s\n' "$RED" "$1" "$NC"; }

FAILURES=0
run_check() {
  local description="$1"
  shift
  if "$@" >/dev/null 2>&1; then
    ok "$description"
  else
    fail "$description"
    FAILURES=$((FAILURES + 1))
  fi
}

echo "=== init.sh: verificando entorno ==="

echo ""
echo "--- Herramientas y dependencias ---"
run_check "node instalado" command -v node
run_check "pnpm instalado" command -v pnpm
run_check "dependencias instaladas (node_modules)" test -d node_modules

echo ""
echo "--- Archivos del harness ---"
run_check "AGENTS.md existe" test -f AGENTS.md

if [ ! -f feature_list.json ]; then
  fail "feature_list.json ausente: crea un nuevo feature_list.json desde cero (esqueleto { project, description, rules, features } según el validador) y da de alta las features vía spec_author"
  FAILURES=$((FAILURES + 1))
else
  ok "feature_list.json existe"
fi

run_check "progress/current.md existe" test -f progress/current.md

echo ""
echo "--- Formato ---"
if [ ! -f feature_list.json ]; then
  run_check "formato con guard (feature_list.json ausente)" node scripts/check-format.mjs
else
  run_check "formato de feature_list.json y progress/current.md" node scripts/check-format.mjs
fi

echo ""
echo "--- Tests ---"
run_check "tests al 100% (node:test)" pnpm test

echo ""
echo "--- Build ---"
run_check "build de producción (pnpm build)" pnpm build

echo ""
if [ "$FAILURES" -eq 0 ]; then
  printf '%s✔ El entorno está perfecto. Podemos empezar a trabajar.%s\n' "$GREEN" "$NC"
  exit 0
else
  printf '%s✘ %d comprobación(es) fallida(s). NO se debe continuar hasta resolverlo.%s\n' "$RED" "$FAILURES" "$NC"
  exit 1
fi
