import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';

// Test de integridad del kit genérico del arnés (feature 17).
// Verifique presencia de archivos obligatorios, ausencia de tokens de app (fugas)
// y que templates/feature_list.json contiene exactamente 1 feature de ejemplo.

const KIT_ROOT = new URL('../', import.meta.url);

const OBLIGATORY_FILES = [
  'AGENTS.md',
  'KICKOFF.md',
  'CHECKPOINTS.md',
  'README.md',
  'init.sh',
  'docs/architecture.md',
  'docs/conventions.md',
  'docs/verification.md',
  '.opencode/agents/spec_author.md',
  '.opencode/agents/leader.md',
  '.opencode/agents/implementer.md',
  '.opencode/agents/reviewer.md',
  '.opencode/agents/explorer.md',
  '.claude/agents/spec_author.md',
  '.claude/agents/leader.md',
  '.claude/agents/implementer.md',
  '.claude/agents/reviewer.md',
  '.claude/agents/explorer.md',
  'scripts/check-format.mjs',
  'scripts/validate-feature-list.mjs',
  'scripts/validate-progress.mjs',
  'scripts/validate-specs.mjs',
  'specs/_template/requirements.md',
  'specs/_template/design.md',
  'templates/feature_list.json',
  'templates/current.md',
  'templates/history.md',
];

const FORBIDDEN_TOKENS = ['tomatesoft', 'cards-data', 'og-image', 'hero'];

function getKitFiles(dirUrl) {
  const files = [];
  const entries = readdirSync(dirUrl, { withFileTypes: true });
  for (const entry of entries) {
    const entryUrl = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, dirUrl);
    if (entry.isDirectory()) {
      files.push(...getKitFiles(entryUrl));
    } else {
      // Ignorar este archivo de test para evitar falsos positivos con los tokens definidos aquí
      if (!entryUrl.pathname.endsWith('harness-kit-integrity.test.mjs')) {
        files.push(entryUrl);
      }
    }
  }
  return files;
}

test('REQ-17-01/02: los archivos obligatorios del kit existen en disco', () => {
  for (const fileRel of OBLIGATORY_FILES) {
    const fileUrl = new URL(fileRel, KIT_ROOT);
    assert.ok(
      existsSync(fileUrl),
      `harness-kit/${fileRel}: archivo obligatorio del kit no existe`
    );
  }
});

test('REQ-17-03/05: los tokens de la app no aparecen en los archivos del kit', () => {
  const files = getKitFiles(KIT_ROOT);
  for (const fileUrl of files) {
    const content = readFileSync(fileUrl, 'utf8').toLowerCase();
    const relativePath = fileUrl.pathname.slice(KIT_ROOT.pathname.length);
    for (const token of FORBIDDEN_TOKENS) {
      assert.ok(
        !content.includes(token),
        `harness-kit/${relativePath}: fuga de token de app detectada "${token}"`
      );
    }
  }
});

test('REQ-17-04: templates/feature_list.json contiene una única feature de ejemplo', () => {
  const fileUrl = new URL('templates/feature_list.json', KIT_ROOT);
  const content = readFileSync(fileUrl, 'utf8');
  const data = JSON.parse(content);
  assert.ok(
    Array.isArray(data.features),
    'templates/feature_list.json: no contiene la propiedad array "features"'
  );
  assert.equal(
    data.features.length,
    1,
    `templates/feature_list.json: se esperaban 1 feature de ejemplo pero hay ${data.features.length}`
  );
});
