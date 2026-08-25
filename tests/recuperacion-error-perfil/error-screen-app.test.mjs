// F37 (REQ-37-01/02/05): el diagnóstico ofrece una transición a una pantalla
// de Ajustes separada, sin pasar un snapshot anterior a ErrorScreen.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const RAIZ = join(import.meta.dirname, '..', '..');
const leer = (ruta) => readFileSync(join(RAIZ, ruta), 'utf8');

describe('recuperación desde ErrorScreen', () => {
  it('ofrece Regresar a Ajustes y conserva título, motivo y Reintentar', () => {
    const source = leer('src/components/error-screen/ErrorScreen.tsx');
    assert.match(source, /Regresar a Ajustes/);
    assert.match(source, /alRegresarAjustes/);
    assert.match(source, /error\.message/);
    assert.match(source, /Reintentar/);
    assert.doesNotMatch(source, /GestionPerfiles|useState|history\.back/);
  });

  it('la gestión vive en una pantalla separada de Ajustes', () => {
    const screen = leer('src/components/ajustes-recuperacion/AjustesRecuperacion.tsx');
    const error = leer('src/components/error-screen/ErrorScreen.tsx');
    assert.match(screen, /Ajustes/);
    assert.match(screen, /GestionPerfiles/);
    assert.doesNotMatch(screen, /FinanceSnapshot|snapshot\s*=|recargar/);
    assert.doesNotMatch(error, /GestionPerfiles/);
    assert.match(leer('src/App.tsx'), /AjustesRecuperacion/);
  });

  it('no entrega un snapshot anterior a la pantalla de error o recuperación', () => {
    const error = leer('src/components/error-screen/ErrorScreen.tsx');
    const recovery = leer('src/components/ajustes-recuperacion/AjustesRecuperacion.tsx');
    const app = leer('src/App.tsx');
    assert.doesNotMatch(error, /FinanceSnapshot|snapshot\s*=|snapshot\s*:/i);
    assert.doesNotMatch(recovery, /FinanceSnapshot|snapshot\s*=|snapshot\s*:/i);
    assert.match(app, /estado\.error/);
    assert.match(app, /ErrorScreen[^\n]*error=\{estado\.error\}/);
  });
});
