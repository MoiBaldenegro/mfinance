import assert from 'node:assert/strict';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import App, { Contenido } from '../../../src/App.tsx';
import { ErrorScreen } from '../../../src/components/error-screen/ErrorScreen.tsx';
import { AjustesRecuperacion } from '../../../src/components/ajustes-recuperacion/AjustesRecuperacion.tsx';
import { SnapshotContext } from '../../../src/components/shell/SnapshotProvider.tsx';
import { PerfilContext } from '../../../src/hooks/use-perfil.ts';
import { SeccionActivaProvider } from '../../../src/hooks/use-seccion-activa.ts';
import { SNAPSHOT_VACIO } from '../../../src/domain/entities/finance-snapshot.ts';
import { capturarContexto, ejecutarCambioPerfil } from '../../../src/domain/use-cases/rollback-perfil-vista.ts';

const ana = { id: 'p-ana', nombre: 'Ana', creado_en: '2026-01-01' };
const beto = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };
const error = new Error('snapshot no disponible');
function montar(estado, activo = ana, seccion = 'balance', contenido = createElement(Contenido)) {
  const valorSnapshot = { estado, recargar: () => {}, cargarParaCambio: async () => {},
    esCargaVigente: () => true, generacionActual: () => 1, publicarSnapshot: () => true,
    mostrarError: () => true, registrarReintento: () => {}, reintento: () => {},
    aplicarSnapshot: () => true, completarOnboarding: () => {} };
  const valorPerfil = { perfiles: [ana, beto], activo, avisoCarga: null,
    fijarActivo: () => {}, refrescar: () => {} };
  return renderToStaticMarkup(createElement(SnapshotContext.Provider, { value: valorSnapshot },
    createElement(PerfilContext.Provider, { value: valorPerfil },
      createElement(SeccionActivaProvider, { inicial: seccion }, contenido))));
}
function crearFlujo(seccion = 'balance') {
  const ui = { activo: ana, seccion, estado: { nombre: 'cargando' }, vistas: [], transitorias: [] };
  const render = () => { const html = montar(ui.estado, ui.activo, ui.seccion); ui.vistas.push(html); return html; };
  const transitoria = () => { ui.estado = { nombre: 'cargando' }; ui.transitorias.push(render()); };
  return {
    ui, vistas: ui.vistas, transitorias: ui.transitorias, iniciar: transitoria, fase: transitoria,
    confirmar: (perfil) => { ui.activo = perfil; }, vista: (vista) => { ui.seccion = vista; },
    publicar: (_, commit) => { commit(); ui.estado = listo(); render(); return true; },
    finalizar: () => { ui.finalizado = true; }, cancelar: () => { ui.cancelado = true; },
    error: (_, error, __, reintentar) => { ui.estado = { nombre: 'error', error }; ui.reintentar = reintentar; render(); },
  };
}
function dependencias(cargarSnapshot, flujo, port = { seleccionar: async (id) => id === beto.id ? beto : ana }) {
  return { perfilPort: port, cargarSnapshot, esCargaVigente: () => true, generacionActual: () => 1,
    publicarSnapshot: flujo.publicar, contexto: capturarContexto(flujo.ui.activo.id, flujo.ui.seccion), objetivoId: beto.id,
    alIniciar: flujo.iniciar, alFase: flujo.fase, alFinalizar: flujo.finalizar, alConfirmar: flujo.confirmar,
    alRestaurarVista: flujo.vista, alError: flujo.error, alCancelar: flujo.cancelar };
}
const listo = (snapshot = SNAPSHOT_VACIO) => ({ nombre: 'listo', snapshot });
assert.match(renderToStaticMarkup(createElement(App)), /Cargando tus finanzas/);
const recuperacion = async () => {
  const flujo = crearFlujo('balance');
  let n = 0;
  const pendiente = await ejecutarCambioPerfil(dependencias(async () => ({ generacion: ++n,
    resultado: n === 1 ? { ok: false, error } : { ok: true, datos: {} } }), flujo));
  assert.equal(pendiente.ok, false);
  assert.equal(pendiente.fase, 'snapshot-nuevo-pendiente');
  assert.equal(flujo.transitorias.every((html) => !/app-shell|header-bar|section-tabs|balance-section/.test(html)), true);
  const resultado = await pendiente.rollback();
  assert.equal(resultado.ok, true);
  const html = flujo.vistas.at(-1);
  assert.equal(flujo.ui.activo, ana); assert.equal(flujo.ui.seccion, 'balance');
  assert.match(html, /Perfil: Ana/); assert.match(html, /HeaderBar|mfinance/);
  assert.match(html, /class="app-shell"/); assert.match(html, /class="header-bar"/);
  assert.match(html, /class="section-tabs"/); assert.match(html, /class="balance-section"/);
  assert.match(html, /Secciones de mfinance/); assert.match(html, /aria-current="page"/);
  assert.match(html, /Balance/); assert.doesNotMatch(html, /ajustes-recuperacion/);
};
await recuperacion();
let n = 0;
const felizFlujo = crearFlujo('balance');
const feliz = await ejecutarCambioPerfil(dependencias(async () => ({ generacion: ++n,
  resultado: { ok: true, datos: {} } }), felizFlujo));
assert.equal(feliz.ok, true);
const felizHtml = felizFlujo.vistas.at(-1);
assert.equal(felizFlujo.ui.activo, beto);
assert.match(felizHtml, /Perfil: Beto/); assert.match(felizHtml, /app-shell|section-tabs|balance-section/);
let antiguos = 0;
const falloFlujo = crearFlujo('balance');
const falloPendiente = await ejecutarCambioPerfil(dependencias(
  (() => { let i = 0; return async () => ({ generacion: ++i,
    resultado: i === 1 ? { ok: false, error: new Error('nuevo roto') } : { ok: true, datos: {} } }); })(),
  falloFlujo,
  { seleccionar: async (id) => {
    if (id === ana.id && ++antiguos === 1) throw new Error('rollback temporal');
    return id === beto.id ? beto : ana;
  } },
));
const falloRollback = await falloPendiente.rollback();
assert.equal(falloRollback.ok, false);
const errorHtml = falloFlujo.vistas.at(-1);
assert.match(errorHtml, /Gestionar perfiles/); assert.match(errorHtml, /rollback-seleccion|rollback temporal/);
assert.match(errorHtml, /Reintentar/); assert.doesNotMatch(errorHtml, /balance-section|app-shell|section-tabs/);
assert.equal(falloFlujo.transitorias.every((html) => !/app-shell|section-tabs|balance-section/.test(html)), true);
let gestionHtml; let gestiones = 0; let reintentos = 0;
const antesGestion = falloFlujo.transitorias.length;
const errorElement = ErrorScreen({ error: falloFlujo.ui.estado.error,
  reintentar: () => { reintentos += 1; return falloFlujo.ui.reintentar(); },
  alGestionarPerfiles: () => { gestiones += 1; gestionHtml = montar(falloFlujo.ui.estado, ana, 'balance', createElement(AjustesRecuperacion)); } });
const botones = errorElement.props.children.filter((hijo) => hijo?.type === 'button');
botones[1].props.onClick();
assert.equal(falloFlujo.transitorias.length, antesGestion);
assert.match(gestionHtml, /class="ajustes-recuperacion"/); assert.match(gestionHtml, /Gestión de perfiles/);
assert.doesNotMatch(gestionHtml, /app-shell|section-tabs|balance-section/);
await botones[0].props.onClick();
assert.deepEqual([reintentos, gestiones], [1, 1]);
assert.equal(falloFlujo.ui.activo, ana); assert.match(falloFlujo.vistas.at(-1), /Perfil: Ana/);
