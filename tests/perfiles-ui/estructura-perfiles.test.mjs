// Suite F22 (REQ-22-01/02/07): barridos estructurales permanentes del
// hexágono de perfiles: puerto en domain, adapter ÚNICO con invoke,
// pureza del dominio, indicador permanente en la cabecera y herencia de
// la moneda desde el snapshot sin lógica adicional. Escrito ANTES del
// código (rojo): los archivos aún no existen.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const RAIZ = join(import.meta.dirname, '..', '..');

function leer(rutaRelativa) {
  return readFileSync(join(RAIZ, rutaRelativa), 'utf8');
}

describe('REQ-22-01: puerto y adapter IPC del hexágono de perfiles', () => {
  it('el puerto vive en src/domain/ports con sus cuatro operaciones', () => {
    const puerto = leer('src/domain/ports/perfil-port.ts');
    for (const metodo of ['listar', 'activo', 'crear', 'seleccionar']) {
      assert.ok(puerto.includes(metodo), `el puerto declara ${metodo}`);
    }
  });

  it('la entidad espejo Perfil existe con id nombre y creado_en', () => {
    const entidad = leer('src/domain/entities/perfil.ts');
    assert.match(entidad, /interface\s+Perfil/);
    for (const campo of ['id', 'nombre', 'creado_en']) {
      assert.ok(entidad.includes(campo), `campo ${campo}`);
    }
  });

  it('el adapter vive bajo src/adapters con invoke y los cuatro commands', () => {
    const adapter = leer('src/adapters/perfil-ipc-adapter.ts');
    assert.match(adapter, /invoke\s*\(/);
    for (const comando of [
      'listar_perfiles',
      'perfil_activo',
      'crear_perfil',
      'seleccionar_perfil',
    ]) {
      assert.ok(adapter.includes(`'${comando}'`), `falta ${comando}`);
    }
  });
});

describe('pureza hexagonal de los módulos nuevos (REQ-22-01)', () => {
  const dominioNuevo = [
    'src/domain/entities/perfil.ts',
    'src/domain/errors/perfil-errors.ts',
    'src/domain/ports/perfil-port.ts',
    'src/domain/use-cases/cambiar-perfil.ts',
    'src/domain/use-cases/crear-perfil.ts',
    'src/domain/use-cases/cargar-perfiles.ts',
  ];

  it('ningún módulo nuevo de dominio usa invoke ni importa react o @tauri-apps', () => {
    for (const ruta of dominioNuevo) {
      const contenido = leer(ruta);
      assert.doesNotMatch(contenido, /invoke\s*\(/, ruta);
      assert.doesNotMatch(contenido, /from\s+["']react|@tauri-apps/, ruta);
    }
  });

  it('los componentes nuevos no invocan invoke directamente', () => {
    for (const ruta of [
      'src/components/shell/AppShell.tsx',
      'src/components/shell/HeaderBar.tsx',
      'src/components/ajustes-section/GestionPerfiles.tsx',
    ]) {
      assert.doesNotMatch(leer(ruta), /invoke\s*\(/, ruta);
    }
  });
});

describe('REQ-22-02: indicador permanente del titular en la cabecera', () => {
  it('HeaderBar muestra «Perfil:» a partir de un titular recibido', () => {
    const cabecera = leer('src/components/shell/HeaderBar.tsx');
    assert.match(cabecera, /titular/);
    assert.ok(cabecera.includes('Perfil:'));
  });

  it('AppShell alimenta el titular y deriva la moneda del snapshot sin lógica extra (REQ-22-07)', () => {
    const shell = leer('src/components/shell/AppShell.tsx');
    assert.match(shell, /monedaDeSnapshot\(snapshot\)/);
    assert.match(shell, /usarPerfiles|PerfilContext/);
  });

  it('existe el hook de perfiles con su contexto compartido', () => {
    const hook = leer('src/hooks/use-perfil.ts');
    assert.match(hook, /createContext/);
    assert.match(hook, /export function usarPerfiles/);
  });

  it('Ajustes renderiza el bloque de gestión de perfiles (REQ-22-04)', () => {
    const ajustes = leer('src/components/ajustes-section/AjustesSection.tsx');
    assert.match(ajustes, /GestionPerfiles/);
  });
});
