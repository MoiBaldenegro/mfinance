// Búsqueda de controles sobre árboles de elementos React sin DOM: recorre
// con conjunto de visitados y expande componentes función con hooks neutros,
// de modo que los handlers reales quedan alcanzables para el harness.
import React from 'react';

const despachador = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;

/**
 * Recorre el árbol desde la raíz y devuelve los elementos hospedados que
 * cumplen el predicado. `contextos` es el registro compartido de valores
 * publicados por los providers montados en el harness.
 */
export function buscarArbol(raiz, predicado, contextos) {
  const vistos = new Set();
  const hallados = [];
  const leerContexto = (clave) => {
    const ctx = clave._context ?? clave;
    return contextos.has(ctx) ? contextos.get(ctx) : clave._currentValue;
  };
  const hooksNeutros = {
    useState: (v) => [typeof v === 'function' ? v() : v, () => {}],
    useRef: (v) => ({ current: v }),
    useEffect: () => {}, useLayoutEffect: () => {}, useInsertionEffect: () => {},
    useCallback: (fn) => fn,
    useMemo: (fabrica) => fabrica(),
    useContext: leerContexto,
    useSyncExternalStore: (_s, obtener) => obtener(),
    useId: (() => { let n = 0; return () => `busqueda-${n++}`; })(),
    useDebugValue: () => {}, useImperativeHandle: () => {},
  };
  const pasear = (nodo) => {
    if (!nodo || typeof nodo !== 'object' || vistos.has(nodo)) return;
    vistos.add(nodo);
    if (Array.isArray(nodo)) { nodo.forEach(pasear); return; }
    if (typeof nodo.type === 'function') {
      const previo = despachador.H;
      despachador.H = hooksNeutros;
      try { pasear(nodo.type(nodo.props)); }
      catch { /* componente con estado no invocable en búsqueda */ }
      finally { despachador.H = previo; }
      return;
    }
    if (typeof nodo.type !== 'string') {
      if (nodo.props) pasear(nodo.props.children);
      return;
    }
    if (predicado(nodo)) hallados.push(nodo);
    pasear(nodo.props?.children);
  };
  pasear(raiz);
  return hallados;
}
