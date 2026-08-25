// Integración ejecutable REAL: GestionPerfiles → activarPerfil →
// SnapshotProvider → Contenido → diálogo y ErrorScreen reales, con los
// adapters IPC sustituidos por el loader. Dispara los handlers reales de
// Cerrar, Cancelar, Escape y «Volver al perfil anterior», verifica los
// contadores de selección/carga, la ausencia de AppShell/datos financieros,
// el rollback one-shot y el segundo intento tras un rollback roto.
import assert from 'node:assert/strict';
import { escenario, gestion, vista, asentarTodo, pulsarEn } from './montaje-integracion.mjs';

await asentarTodo();
assert.match(vista.html(), /app-shell/);
assert.equal(escenario.cargas, 1);

// Activar Beto desde la fila real de GestionPerfiles: fallo objetivo pendiente.
pulsarEn(gestion, 'Activar');
await asentarTodo();
let html = vista.html();
assert.deepEqual(escenario.selecciones, ['p-beto']);
assert.equal(escenario.cargas, 2);
assert.match(html, /No se pudo cargar el perfil/);
assert.match(html, /Beto/);
assert.match(html, /snapshot ilegible/);
assert.match(html, /role="dialog"/);
assert.match(html, /aria-modal="true"/);
assert.match(html, /aria-labelledby="perfil-carga-error-titulo"/);
assert.match(html, /aria-describedby="perfil-carga-error-descripcion"/);
assert.doesNotMatch(html, /app-shell|section-tabs|balance-section|Perfil: Ana/);

// Escape real del diálogo: salida segura explícita sin shell.
vista.tecla((el) => el.props.className === 'perfil-carga-error-dialog', { key: 'Escape' });
await asentarTodo();
html = vista.html();
assert.equal(escenario.selecciones.length, 1);
assert.equal(escenario.cargas, 2);
assert.match(html, /No se pudieron cargar tus datos/);
assert.match(html, /Reintentar/);
assert.doesNotMatch(html, /app-shell|section-tabs|balance-section/);

// Cancelar real sobre el diálogo reabierto: misma salida segura, sin cargas extra.
pulsarEn(gestion, 'Activar');
await asentarTodo();
pulsarEn(vista, 'Cancelar');
await asentarTodo();
html = vista.html();
assert.deepEqual(escenario.selecciones, ['p-beto', 'p-beto']);
assert.equal(escenario.cargas, 3);
assert.match(html, /No se pudieron cargar tus datos/);

// Cerrar real y «Volver al perfil anterior»: rollback one-shot que restaura.
pulsarEn(gestion, 'Activar');
await asentarTodo();
pulsarEn(vista, 'Cerrar');
await asentarTodo();
assert.match(vista.html(), /No se pudieron cargar tus datos/);
pulsarEn(gestion, 'Activar');
await asentarTodo();
pulsarEn(vista, 'Volver al perfil anterior');
await asentarTodo();
html = vista.html();
assert.deepEqual(escenario.selecciones,
  ['p-beto', 'p-beto', 'p-beto', 'p-beto', 'p-ana']);
assert.equal(escenario.cargas, 6);
assert.match(html, /app-shell/);
assert.match(html, /Perfil: Ana/);
assert.match(html, /balance-section/);

// Fallo durante el rollback: ErrorScreen con motivo y recuperación que lanza
// una NUEVA ejecución sin volver a seleccionar/cargar a Beto.
escenario.fallosAna = 1;
pulsarEn(gestion, 'Activar');
await asentarTodo();
pulsarEn(vista, 'Volver al perfil anterior');
await asentarTodo();
html = vista.html();
assert.equal(escenario.fallosAna, 0);
assert.match(html, /snapshot anterior corrupto|rollback/);
assert.match(html, /Reintentar/);
assert.doesNotMatch(html, /app-shell|section-tabs|balance-section/);
const antesDelReintento = escenario.selecciones.length;
pulsarEn(vista, 'Reintentar');
await asentarTodo();
html = vista.html();
assert.deepEqual(escenario.selecciones.slice(antesDelReintento), ['p-ana'],
  'el segundo intento solo recupera al perfil anterior, sin recargar Beto');
assert.match(html, /app-shell/);
assert.match(html, /Perfil: Ana/);
