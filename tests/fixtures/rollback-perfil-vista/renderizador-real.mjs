// Harness de integración SIN DOM: monta componentes React REALES uno a uno
// (SeccionActivaProvider, PerfilProvider, SnapshotProvider, GestionPerfiles,
// Contenido) con hooks sobre ranuras estables por componente y un registro
// compartido de contextos. Los handlers que se disparan son los reales.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { buscarArbol } from './buscador-arbol.mjs';

const despachador = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
const iguales = (a = [], b = []) => a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
const ceder = () => new Promise((resolver) => setImmediate(resolver));
const contextos = new Map();

/** Publica el valor de un provider para los useContext posteriores. */
export function publicarContexto(elemento) {
  const tipo = elemento?.type;
  if (tipo && typeof tipo === 'object') {
    contextos.set(tipo._context ?? tipo, elemento.props.value);
    return true;
  }
  return false;
}

export function crearMontaje(Componente, fabricaProps = () => ({})) {
  const estado = []; const refs = []; const memo = []; const montados = [];
  let sucio = true;
  let ranuras = 0;
  let pendientes = [];
  const guardar = (almacen, fabricaValor) => {
    const i = ranuras++;
    if (!(i in almacen)) almacen[i] = { valor: fabricaValor() };
    return almacen[i];
  };
  const memoizar = (fabrica, deps) => {
    const ranura = guardar(memo, fabrica);
    if (!iguales(ranura.deps, deps)) { ranura.deps = deps; ranura.valor = fabrica(); }
    return ranura.valor;
  };
  const hooks = {
    useState(inicial) {
      const ranura = guardar(estado, () => (typeof inicial === 'function' ? inicial() : inicial));
      return [ranura.valor, (nuevo) => {
        const valor = typeof nuevo === 'function' ? nuevo(ranura.valor) : nuevo;
        if (!Object.is(valor, ranura.valor)) { ranura.valor = valor; sucio = true; }
      }];
    },
    useRef(valorInicial) { return guardar(refs, () => ({ current: valorInicial })).valor; },
    useCallback: (fn, deps) => memoizar(() => fn, deps),
    useMemo: (fabrica, deps) => memoizar(fabrica, deps),
    useContext(clave) {
      const ctx = clave._context ?? clave;
      return contextos.has(ctx) ? contextos.get(ctx) : clave._currentValue;
    },
    useEffect(efecto, deps) { pendientes.push({ efecto, deps }); },
    useLayoutEffect(efecto, deps) { pendientes.push({ efecto, deps }); },
    useSyncExternalStore(_suscribir, obtener) { return obtener(); },
  };
  const montaje = {
    salida: null,
    get sucio() { return sucio; },
    forzar() { sucio = true; },
    async asentar() {
      while (sucio) {
        sucio = false;
        ranuras = 0;
        pendientes = [];
        despachador.H = hooks;
        try { montaje.salida = Componente(fabricaProps()); }
        finally { despachador.H = null; }
        pendientes.forEach((efecto, i) => {
          const antes = montados[i];
          if (!antes || efecto.deps === undefined || !iguales(antes.deps, efecto.deps)) {
            antes?.limpiar?.(); efecto.limpiar = efecto.efecto();
          }
          montados[i] = { deps: efecto.deps, limpiar: efecto.limpiar };
        });
        await ceder(); await ceder();
      }
    },
    html() {
      let arbol = montaje.salida;
      for (const [ctx, valor] of contextos) arbol = React.createElement(ctx.Provider ?? ctx, { value: valor }, arbol);
      return renderToStaticMarkup(arbol);
    },
    pulsar(predicado) {
      const [control] = buscarArbol(montaje.salida, (el) =>
        typeof el.props.onClick === 'function' && predicado(el), contextos);
      if (!control) throw new Error('control no encontrado');
      control.props.onClick();
      return control;
    },
    tecla(predicado, evento) {
      const [destino] = buscarArbol(montaje.salida, (el) =>
        typeof el.props.onKeyDown === 'function' && predicado(el), contextos);
      if (!destino) throw new Error('superficie de teclado no encontrada');
      destino.props.onKeyDown({ shiftKey: false, ...evento, preventDefault() {} });
    },
  };
  return montaje;
}
