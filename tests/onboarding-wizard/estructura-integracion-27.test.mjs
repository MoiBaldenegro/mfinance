// REQ-27-06..10 + REQ-23-11: cableado wizard/Ajustes/shell/backend y
// commands de metas registrados en lib.rs. Estilo regex del arnés.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const leer = (ruta) => readFileSync(join('src', ruta), 'utf8');

describe('Cableado del wizard pasos 4-5 (REQ-27-01/06)', () => {
  it('WizardContenido monta paso 4 y paso 5 reales (sin placeholder)', () => {
    const c = leer('components/onboarding/WizardContenido.tsx');
    for (const patron of [/OnboardingPasoMetas/, /OnboardingPasoResumen/, /'paso4'/, /'paso5'/]) {
      assert.match(c, patron);
    }
  });

  it('OnboardingWizard ofrece Finalizar onboarding y delega el contenido', () => {
    const c = leer('components/onboarding/OnboardingWizard.tsx');
    assert.match(c, /Finalizar onboarding/);
    assert.match(c, /WizardContenido/);
  });

  it('use-onboarding expone actualizarPaso4 y propaga perfilId', () => {
    const c = leer('hooks/use-onboarding.ts');
    assert.match(c, /actualizarPaso4/);
    assert.match(c, /perfilId/);
  });

  it('el adapter envía perfilId/metaId camelCase a los commands de onboarding y metas (REQ-31-01/02)', () => {
    const c = leer('adapters/onboarding-adapter.ts');
    for (const comando of ['agregar_meta', 'actualizar_meta', 'eliminar_meta']) {
      assert.ok(c.includes(comando), `adapter sin ${comando}`);
    }
    // Tauri 2 renombra a camelCase los parámetros de #[tauri::command]:
    // el payload de invoke DEBE viajar con clave perfilId / metaId.
    assert.match(c, /obtener_onboarding_status',\s*\{\s*perfilId/);
    assert.match(c, /actualizar_perfil_onboarding',\s*\{\s*perfilId/);
    assert.match(c, /completar_onboarding',\s*\{\s*perfilId/);
    assert.match(c, /agregar_meta',\s*\{\s*perfilId/);
    assert.match(c, /actualizar_meta',\s*\{[^}]*perfilId[^}]*metaId/);
    assert.match(c, /eliminar_meta',\s*\{[^}]*perfilId[^}]*metaId/);
    // La clave snake_case no puede quedar ni como clave ni como identificador.
    assert.doesNotMatch(c, /perfil_id/);
    assert.doesNotMatch(c, /meta_id/);
  });

  it('los commands de metas están registrados en lib.rs', () => {
    const lib = readFileSync(join('src-tauri', 'src', 'lib.rs'), 'utf8');
    for (const comando of ['agregar_meta', 'actualizar_meta', 'eliminar_meta']) {
      assert.ok(lib.includes(comando), `lib.rs sin ${comando}`);
    }
  });
});

describe('Integración Ajustes y post-onboarding (REQ-27-07..10)', () => {
  it('GestionPerfiles: badge en progreso + reanudación con metas iniciales', () => {
    const c = leer('components/ajustes-section/GestionPerfiles.tsx');
    assert.match(c, /goals_journal|metasIniciales/);
    assert.match(c, /perfilId/);
    const fila = leer('components/ajustes-section/PerfilFila.tsx');
    assert.match(fila, /Onboarding en progreso/);
  });

  it('sub-sección Mis metas en Ajustes reutiliza MetasJournalSection', () => {
    const c = leer('components/ajustes-section/MisMetas.tsx');
    assert.match(c, /MetasJournalSection/);
    const ajustes = leer('components/ajustes-section/AjustesSection.tsx');
    assert.match(ajustes, /MisMetas/);
  });

  it('la shell escucha bus-ui y muestra ToastAviso; navega a registro', () => {
    const shell = leer('components/shell/AppShell.tsx');
    assert.match(shell, /usarBusUi|bus-ui/);
    assert.match(shell, /ToastAviso/);
    assert.ok(existsSync(join('src', 'components', 'shell', 'ToastAviso.tsx')));
    assert.ok(existsSync(join('src', 'styles', 'toast-aviso.css')));
  });

  it('GestionPerfiles publica navegación y toasts al completar o saltar', () => {
    const c = leer('components/ajustes-section/GestionPerfiles.tsx');
    assert.match(c, /navegarA\('registro'\)/);
    assert.match(c, /mostrarToast\(.*Bienvenido/);
    assert.match(c, /Puedes completar tu onboarding después en Ajustes/);
  });
});
