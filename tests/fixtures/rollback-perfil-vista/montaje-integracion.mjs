// Montaje compartido de la integración real: entorno sin DOM, providers y
// consumidores reales, y bombeo conjunto hasta que todo queda estable.
import { pathToFileURL } from 'node:url';

globalThis.document = {
  documentElement: { style: { setProperty() {}, getPropertyValue: () => '' } },
  addEventListener() {}, removeEventListener() {},
  getElementById: () => null,
  createElement: () => ({ style: {}, setAttribute() {} }),
  body: { appendChild() {} },
  activeElement: null,
};
globalThis.window ??= {
  matchMedia: () => ({ matches: false, addEventListener() {}, removeEventListener() {} }),
  addEventListener() {}, removeEventListener() {},
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
};

const raiz = 'C:/Users/Moises/Desktop/mi_tauri_app/sd_web_astro/mfinance';
const u = (ruta) => pathToFileURL(`${raiz}${ruta}`).href;
const { crearMontaje, publicarContexto } = await import('./renderizador-real.mjs');
const { SeccionActivaProvider } = await import(u('/src/hooks/use-seccion-activa.ts'));
const { PerfilProvider } = await import(u('/src/components/shell/PerfilProvider.tsx'));
const { SnapshotProvider } = await import(u('/src/components/shell/SnapshotProvider.tsx'));
const { Contenido } = await import(u('/src/App.tsx'));
const { GestionPerfiles } = await import(u('/src/components/ajustes-section/GestionPerfiles.tsx'));

export const escenario = (await import('./escenario-falso.mjs')).escenario;

const seccion = crearMontaje(SeccionActivaProvider, () => ({ inicial: 'balance' }));
const perfiles = crearMontaje(PerfilProvider);
const snapshot = crearMontaje(SnapshotProvider, () => ({ children: null }));
export const gestion = crearMontaje(GestionPerfiles);
export const vista = crearMontaje(Contenido);

/** Repinta providers y consumidores hasta que nada quede pendiente. */
export async function asentarTodo() {
  for (let vuelta = 0; vuelta < 50; vuelta += 1) {
    await seccion.asentar(); await perfiles.asentar(); await snapshot.asentar();
    publicarContexto(seccion.salida); publicarContexto(perfiles.salida);
    publicarContexto(snapshot.salida);
    gestion.forzar(); vista.forzar();
    await gestion.asentar(); await vista.asentar();
    const montajes = [seccion, perfiles, snapshot, gestion, vista];
    if (!montajes.some((m) => m.sucio)) break;
    await new Promise((r) => setImmediate(r));
  }
}

export const texto = (el) => (typeof el.props.children === 'string' ? el.props.children : '');

/** Dispara el onClick real del primer control cuyo rótulo coincida. */
export function pulsarEn(montaje, etiqueta) {
  return montaje.pulsar((el) =>
    texto(el) === etiqueta || el.props['aria-label']?.includes(etiqueta));
}
