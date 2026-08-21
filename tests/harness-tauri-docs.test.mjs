import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Tests de la feature 1 (harness-tauri-hexagonal-docs): codifican los REQ de
// specs/01_harness-tauri-hexagonal-docs/requirements.md. Solo stdlib de Node.

const ROOT = new URL('../', import.meta.url);
const SELF_URL = new URL(import.meta.url);

function read(rel) {
  return readFileSync(new URL(rel, ROOT), 'utf8');
}

function assertContiene(doc, rel, claves) {
  for (const clave of claves) {
    assert.ok(doc.includes(clave), `${rel}: falta "${clave}"`);
  }
}

// REQ-01-01/12: cero referencias al stack web anterior en la documentación del
// arnés. Quedan fuera este propio archivo (define el término buscado) y
// docs/dependencies.md, que se reescribe con las dependencias reales del stack
// Tauri en la feature 2 (harness-tooling-tauri) según su acceptance.
const DOCS_SIN_STACK_ANTERIOR = [
  'AGENTS.md', 'CLAUDE.md', 'README.md', 'CHECKPOINTS.md', 'KICKOFF.md',
  'docs/architecture.md', 'docs/conventions.md', 'docs/verification.md',
  'templates/current.md', 'templates/history.md', 'templates/feature_list.json',
  '.opencode/agents/spec_author.md', '.claude/agents/spec_author.md',
];

const TOKEN_LEGADO = 'astro';

test('REQ-01-01/12: sin referencias al stack anterior en los docs del arnés', () => {
  for (const rel of DOCS_SIN_STACK_ANTERIOR) {
    const fileUrl = new URL(rel, ROOT);
    // Excluirse a sí mismo evita el auto-falso-positivo del token definido aquí.
    if (fileUrl.href === SELF_URL.href) continue;
    const content = readFileSync(fileUrl, 'utf8').toLowerCase();
    assert.ok(!content.includes(TOKEN_LEGADO), `${rel}: referencia al stack anterior detectada`);
  }
});

test('REQ-01-02: architecture.md describe el backend hexagonal Rust', () => {
  const doc = read('docs/architecture.md').toLowerCase();
  assertContiene(doc, 'docs/architecture.md', ['src-tauri/src/domain/', 'src-tauri/src/application/', 'src-tauri/src/infrastructure/', 'src-tauri/src/commands/', 'lib.rs', 'composition root', 'cargo test']);
});

test('REQ-01-03/04: architecture.md describe el frontend hexagonal con adapter Tauri IPC', () => {
  const doc = read('docs/architecture.md').toLowerCase();
  assertContiene(doc, 'docs/architecture.md', ['src/domain/entities/', 'src/domain/ports/', 'src/domain/use-cases/', 'src/adapters/', '@tauri-apps/api', 'invoke', 'src/components/', 'src/styles/tokens.css']);
});

test('REQ-01-05/06/07: reglas hexagonales explícitas en architecture.md', () => {
  const doc = read('docs/architecture.md').toLowerCase();
  assertContiene(doc, 'docs/architecture.md', ['las dependencias apuntan siempre hacia el dominio', 'el dominio no conoce el framework', 'los puertos los define el núcleo', 'los implementan los adapters', 'único sitio que usa invoke', 'jamás invocan invoke directamente']);
});

test('REQ-01-08: AGENTS.md y CLAUDE.md sincronizados byte a byte', () => {
  assert.equal(read('AGENTS.md'), read('CLAUDE.md'));
});

test('REQ-01-08: AGENTS.md documenta los comandos reales del stack Tauri', () => {
  assertContiene(read('AGENTS.md'), 'AGENTS.md', ['pnpm dev', '1420', 'pnpm tauri dev', 'pnpm tauri build', 'pnpm test', 'node:test', 'cargo check', 'cargo test']);
});

test('REQ-01-09: conventions.md define naming .tsx/.ts/.rs/.css y estructura hexagonal', () => {
  assertContiene(read('docs/conventions.md'), 'docs/conventions.md', ['.tsx', '.ts', '.rs', '.css', 'PascalCase', 'snake_case', 'kebab-case', 'src/domain/', 'src/adapters/', 'src-tauri/src/domain/']);
});

test('REQ-01-10: verification.md documenta verificación Tauri y conserva la política del backlog', () => {
  const doc = read('docs/verification.md');
  assertContiene(doc, 'docs/verification.md', ['./init.sh', 'cargo check', 'cargo test', '1420', 'regeneración', 'limpieza manual', 'vaciado automático']);
  assert.ok(!doc.includes('4321'), 'docs/verification.md: aún menciona el puerto 4321');
  assert.ok(!doc.toLowerCase().includes('dev logs'), 'docs/verification.md: aún menciona dev logs');
});

test('REQ-01-11: CHECKPOINTS.md refleja criterios Tauri/hexagonales', () => {
  assertContiene(read('CHECKPOINTS.md').toLowerCase(), 'CHECKPOINTS.md', ['hexagonal', 'cargo', './init.sh']);
});
