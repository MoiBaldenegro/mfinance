import assert from 'node:assert/strict';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PerfilCargaErrorDialog } from '../../../src/components/error-screen/PerfilCargaErrorDialog.tsx';
import { ErrorScreen } from '../../../src/components/error-screen/ErrorScreen.tsx';

const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const anteriorDispatcher = internals.H; const refs = []; const efectos = [];
internals.H = { useRef: (current) => { const ref = { current }; refs.push(ref); return ref; },
  useEffect: (efecto) => efectos.push(efecto) };
const perfil = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };
const motivo = 'snapshot anterior corrupto'; let cierres = 0; let rollbacks = 0;
const exterior = { nombre: 'exterior', enfocados: 0, focus() { this.enfocados += 1; documento.activeElement = this; } };
const documento = { activeElement: exterior }; globalThis.document = documento;
const arbol = PerfilCargaErrorDialog({ perfilObjetivo: perfil, motivo,
  alVolverPerfilAnterior: () => { rollbacks += 1; }, alCerrar: () => { cierres += 1; } });
internals.H = anteriorDispatcher;
const botones = arbol.props.children.props.children.filter((hijo) => hijo?.type === 'button');
const reales = botones.map((boton, indice) => ({ nombre: indice, enfocados: 0,
  focus() { this.enfocados += 1; documento.activeElement = this; }, props: boton.props }));
refs[0].current = { querySelectorAll: () => reales };
refs[1].current = reales[0]; const desmontar = efectos[0]();
assert.equal(reales[0].enfocados, 1); assert.match(renderToStaticMarkup(arbol), /role="dialog"/);
assert.match(renderToStaticMarkup(arbol), /aria-modal="true"|aria-labelledby|aria-describedby/);
assert.equal(renderToStaticMarkup(arbol).split(motivo).length - 1, 1);
botones[1].props.onClick(); botones[2].props.onClick();
assert.equal(cierres, 2); assert.equal(rollbacks, 0);
arbol.props.onKeyDown({ key: 'Escape', shiftKey: false, preventDefault() { cierres += 1; } });
assert.equal(cierres, 4); assert.equal(rollbacks, 0);
documento.activeElement = reales[2]; let prevenido = 0;
arbol.props.onKeyDown({ key: 'Tab', shiftKey: false, preventDefault() { prevenido += 1; } });
assert.equal(documento.activeElement, reales[0]); assert.equal(prevenido, 1);
documento.activeElement = reales[0];
arbol.props.onKeyDown({ key: 'Tab', shiftKey: true, preventDefault() { prevenido += 1; } });
assert.equal(documento.activeElement, reales[2]); assert.equal(prevenido, 2);
botones[0].props.onClick(); assert.equal(rollbacks, 1); assert.equal(cierres, 4);
// Pese a los dos ciclos de Tab, el foco nunca alcanzó el control exterior.
assert.equal(exterior.enfocados, 0);
assert.notEqual(documento.activeElement, exterior);
desmontar(); assert.equal(exterior.enfocados, 1);

// Fallo durante el rollback dentro de este flujo: la primera ejecución se
// rechaza, ErrorScreen conserva el diagnóstico una sola vez y la acción de
// recuperación lanza una NUEVA ejecución (segundo intento).
let ejecuciones = 0;
const rollbackFallable = () => {
  ejecuciones += 1;
  return ejecuciones === 1
    ? Promise.reject(new Error('rollback-carga: snapshot anterior corrupto'))
    : Promise.resolve({ ok: true });
};
const pantalla = createElement(ErrorScreen, {
  error: { message: 'rollback-carga: snapshot anterior corrupto' },
  reintentar: rollbackFallable, alVolverPerfilAnterior: rollbackFallable,
});
const seguro = renderToStaticMarkup(pantalla);
assert.match(seguro, /No se pudieron cargar tus datos/);
assert.match(seguro, /rollback-carga: snapshot anterior corrupto/);
assert.equal(seguro.split('snapshot anterior corrupto').length - 1, 1);
assert.match(seguro, />Reintentar</);
assert.match(seguro, /Volver al perfil anterior/);
assert.doesNotMatch(seguro, /app-shell|balance-section|section-tabs/);
await assert.rejects(pantalla.props.reintentar(), /rollback-carga/);
assert.equal(ejecuciones, 1);
await pantalla.props.reintentar();
assert.equal(ejecuciones, 2);
desmontar(); assert.equal(exterior.enfocados, 2);
