// F37 (REQ-37-04..08): la selección confirmada precede a la recarga; una
// selección rechazada no cambia titular ni solicita snapshot.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';
import { cambiarPerfil } from '../../src/domain/use-cases/cambiar-perfil.ts';

const perfil = (nombre) => ({
  id: `id-${nombre.toLowerCase()}`, nombre, creado_en: '2026-01-01',
});

describe('flujo selección → recarga de recuperación', () => {
  it('confirma selección antes de pedir la recarga', async () => {
    const elegido = perfil('Beto');
    const orden = [];
    const resultado = await cambiarPerfil({
      perfiles: { seleccionar: async () => elegido },
      alConfirmar: (actual) => orden.push(['confirmar', actual]),
      alRecargar: () => orden.push(['recargar']),
    }, elegido.id);
    assert.equal(resultado.ok, true);
    assert.deepEqual(orden, [['confirmar', elegido], ['recargar']]);
  });

  it('mantiene el activo visible y no recarga si seleccionar falla', async () => {
    const orden = [];
    const resultado = await cambiarPerfil({
      perfiles: { seleccionar: async () => Promise.reject({ mensaje: 'perfil no disponible' }) },
      alConfirmar: () => orden.push('confirmar'),
      alRecargar: () => orden.push('recargar'),
    }, 'id-fantasma');
    assert.equal(resultado.ok, false);
    assert.match(resultado.error.message, /perfil no disponible/);
    assert.deepEqual(orden, []);
  });

  it('la gestión conserva el botón de reintento y solo la carga lista muestra shell', () => {
    const error = requireSource('src/components/error-screen/ErrorScreen.tsx');
    const app = requireSource('src/App.tsx');
    assert.match(error, /Reintentar/);
    assert.match(app, /return <AppShell snapshot=\{estado\.snapshot\} \/>/);
    assert.match(app, /usarSeccionActiva/);
    assert.match(app, /alRegresarAjustes/);
    assert.match(app, /estado\.nombre === "cargando"/);
    assert.match(app, /estado\.nombre === "error"/);
  });

  it('conserva Ajustes al remontar AppShell y no recarga al entrar', () => {
    const app = requireSource('src/App.tsx');
    const shell = requireSource('src/components/shell/AppShell.tsx');
    const recovery = requireSource('src/components/ajustes-recuperacion/AjustesRecuperacion.tsx');
    assert.match(app, /SeccionActivaProvider/);
    assert.match(app, /elegir\(['"]ajustes['"]\)/);
    assert.match(shell, /usarSeccionActiva/);
    assert.match(shell, /activa/);
    assert.doesNotMatch(recovery, /recargar\(|alRecargar/);
  });

  it('la carga solo se dispara tras confirmar selección o Reintentar', () => {
    const gestion = requireSource('src/components/ajustes-section/GestionPerfiles.tsx');
    const activar = requireSource('src/components/ajustes-section/activar-perfil.ts');
    const error = requireSource('src/components/error-screen/ErrorScreen.tsx');
    assert.match(gestion, /activarPerfil/);
    assert.match(activar, /alConfirmar: deps\.fijarActivo/);
    assert.match(activar, /alRecargar: deps\.recargar/);
    assert.match(error, /onClick=\{reintentar\}/);
  });
});

function requireSource(ruta) {
  return readFileSync(join(import.meta.dirname, '..', '..', ruta), 'utf8');
}
