import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import React, { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PerfilCargaErrorDialog } from '../../../src/components/error-screen/PerfilCargaErrorDialog.tsx';
import { Contenido } from '../../../src/App.tsx';
import { SnapshotContext } from '../../../src/components/shell/SnapshotProvider.tsx';
import { PerfilContext } from '../../../src/hooks/use-perfil.ts';
import { SeccionActivaProvider } from '../../../src/hooks/use-seccion-activa.ts';

const perfil = { id: 'p-beto', nombre: 'Beto', creado_en: '2026-01-02' };
const motivo = 'no se pudo leer el archivo del perfil';
const dialogo = createElement(PerfilCargaErrorDialog, { perfilObjetivo: perfil, motivo,
  alVolverPerfilAnterior: () => {}, alCerrar: () => {} });
const html = renderToStaticMarkup(dialogo);
assert.match(html, /role="dialog"/); assert.match(html, /aria-modal="true"/);
assert.match(html, /aria-labelledby="perfil-carga-error-titulo"/);
assert.match(html, /aria-describedby="perfil-carga-error-descripcion"/);
assert.match(html, /No se pudo cargar el perfil/); assert.match(html, /Beto/);
assert.equal(html.split(motivo).length - 1, 1);
assert.equal(html.split('Volver al perfil anterior').length - 1, 2);
assert.equal(html.split('aria-label="Cerrar diálogo"').length - 1, 1);
assert.match(html, />Cancelar</);
const fuente = readFileSync(new URL('../../../src/components/error-screen/PerfilCargaErrorDialog.tsx', import.meta.url), 'utf8');
assert.match(fuente, /evento\.key === 'Escape'/); assert.match(fuente, /autoFocus/);
assert.match(fuente, /querySelectorAll/); assert.equal((fuente.match(/onClick=\{alCerrar\}/g) ?? []).length, 2);
const contexto = { estado: { nombre: 'fallo-perfil', perfilObjetivo: perfil,
  error: { message: motivo }, rollback: async () => ({ ok: true }) }, recargar: () => {},
  cargarParaCambio: async () => ({}), esCargaVigente: () => true, generacionActual: () => 1,
  publicarSnapshot: () => true, mostrarError: () => true, registrarReintento: () => {},
  reintento: () => {}, aplicarSnapshot: () => true, completarOnboarding: () => {},
  mostrarFalloPerfil: () => {}, confirmarRollback: () => {}, cerrarFalloPerfil: () => {} };
const pantalla = renderToStaticMarkup(createElement(SnapshotContext.Provider, { value: contexto },
  createElement(PerfilContext.Provider, { value: { perfiles: [], activo: perfil, avisoCarga: null,
    fijarActivo: () => {}, refrescar: () => {} } }, createElement(SeccionActivaProvider, null,
      createElement(Contenido)))));
assert.match(pantalla, /role="dialog"/); assert.doesNotMatch(pantalla, /app-shell|balance-section/);
assert.equal(pantalla.split(motivo).length - 1, 1);
contexto.estado = { nombre: 'error', error: { message: motivo }, recuperar: () => {} };
const salida = renderToStaticMarkup(createElement(SnapshotContext.Provider, { value: contexto },
  createElement(PerfilContext.Provider, { value: { perfiles: [], activo: perfil, avisoCarga: null,
    fijarActivo: () => {}, refrescar: () => {} } }, createElement(SeccionActivaProvider, null,
      createElement(Contenido)))));
assert.match(salida, /No se pudieron cargar tus datos|Volver al perfil anterior/);
assert.doesNotMatch(salida, /app-shell|balance-section/); assert.equal(salida.split(motivo).length - 1, 1);
assert.match(salida, />Reintentar</); assert.match(salida, /Volver al perfil anterior/);
