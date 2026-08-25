// F37 (REQ-37-03): el contexto de perfiles vive durante la recuperación y
// mantiene la lista/activo cargados mediante el puerto existente.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const RAIZ = join(import.meta.dirname, '..', '..');
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');

describe('proveedor común de perfiles', () => {
  it('carga lista y activo con cargarPerfiles y publica PerfilContext', () => {
    const provider = leer('src/components/shell/PerfilProvider.tsx');
    assert.match(provider, /cargarPerfiles/);
    assert.match(provider, /perfilPort/);
    assert.match(provider, /PerfilContext\.Provider/);
    assert.match(provider, /fijarActivo/);
    assert.match(provider, /setPerfiles|setActivo/);
  });

  it('App monta PerfilProvider fuera de SnapshotProvider y AppShell no es dueño', () => {
    const app = leer('src/App.tsx');
    const shell = leer('src/components/shell/AppShell.tsx');
    assert.match(app, /PerfilProvider/);
    assert.match(app, /<PerfilProvider>[\s\S]*<SnapshotProvider>/);
    assert.doesNotMatch(shell, /cargarPerfiles|perfilPort|PerfilContext\.Provider/);
  });

  it('la recuperación reutiliza la lista conservada y marca al activo', () => {
    const recovery = leer('src/components/ajustes-recuperacion/AjustesRecuperacion.tsx');
    const gestion = leer('src/components/ajustes-section/GestionPerfiles.tsx');
    assert.match(recovery, /GestionPerfiles/);
    assert.match(gestion, /usarPerfiles/);
    assert.match(gestion, /esActivo=\{perfil\.id === activo\?\.id\}/);
  });
});
