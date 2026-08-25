import { createContext, createElement, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { primeraSeccion } from '../components/shell/secciones.ts';

interface ValorSeccion {
  readonly activa: string;
  readonly elegir: (id: string) => void;
}

const SeccionContext = createContext<ValorSeccion | null>(null);

export function SeccionActivaProvider({ children, inicial = primeraSeccion() }: {
  readonly children: ReactNode; readonly inicial?: string;
}) {
  const [activa, elegir] = useState(inicial);
  const valor = useMemo(() => ({ activa, elegir }), [activa]);
  return createElement(SeccionContext.Provider, { value: valor }, children);
}

export function usarSeccionActiva(): ValorSeccion {
  const valor = useContext(SeccionContext);
  if (!valor) throw new Error('usarSeccionActiva debe usarse dentro de su proveedor');
  return valor;
}
