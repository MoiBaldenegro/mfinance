import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';

const rustPath = 'src-tauri/src/domain/onboarding/status.rs';
const providerPath = 'src/components/shell/SnapshotProvider.tsx';
const appPath = 'src/App.tsx';

describe('contrato IPC de OnboardingStatus (REQ-35)', () => {
  it('declara el discriminador JSON canónico nombre', () => {
    const source = readFileSync(rustPath, 'utf8');
    assert.match(source, /Serialize/);
    assert.match(source, /nombre/);
    assert.match(source, /current_step/);
  });

  it('conserva lectura de la forma externa legacy', () => {
    const source = readFileSync(rustPath, 'utf8');
    assert.match(source, /Deserializer/);
    assert.match(source, /InProgress/);
    assert.match(source, /NotStarted/);
    assert.match(source, /Completed/);
  });

  it('el gate clasifica Completed como listo y los demás como onboarding', () => {
    const source = readFileSync(providerPath, 'utf8');
    assert.match(source, /onboarding_status\.nombre === 'Completed'/);
    assert.match(source, /nombre: 'listo'/);
    assert.match(source, /nombre: 'onboarding'/);
  });

  it('finalizar y saltar recargan el estado antes de mostrar AppShell', () => {
    const source = readFileSync(appPath, 'utf8');
    const callbacks = source.match(/al(?:Completar|Saltar)=\{\(\) => void completarOnboarding\(\)\}/g) ?? [];
    assert.equal(callbacks.length, 2);
    const provider = readFileSync(providerPath, 'utf8');
    assert.match(provider, /const completarOnboarding = useCallback/);
    assert.match(provider, /setIntento\(\(n\) => n \+ 1\)/);
  });
});
