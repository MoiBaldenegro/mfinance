// Hook React de la moneda activa (patrón use-tema, REQ-20-02): la moneda
// se propaga desde el snapshot cargado por UN único punto (el proveedor
// del shell) y cualquier componente la consume aquí sin hardcodear
// símbolo ni separadores; todo sale del catálogo de src/domain.
import { createContext, useContext } from 'react';
import type { Moneda } from '../domain/entities/moneda.ts';

/**
 * Contexto de la moneda activa. El defecto MXN cubre consumos fuera del
 * proveedor y el camino de snapshots antiguos sin campo currency
 * (REQ-20-06); el shell lo fija siempre desde snapshot.strategy.currency.
 */
export const MonedaContext = createContext<Moneda>('MXN');

/** Moneda activa reactivo: 'MXN' | 'USD' | 'EUR'. */
export function usarMoneda(): Moneda {
  return useContext(MonedaContext);
}
