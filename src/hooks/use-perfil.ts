// Hook React del estado compartido de perfiles (patrón use-moneda):
// el shell publica lista, activo, avisos y acciones en UN contexto y la
// cabecera (indicador permanente) junto al bloque de Ajustes lo consumen.
import { createContext, useContext } from 'react';
import type { Perfil } from '../domain/entities/perfil.ts';

/** Valor publicado por el proveedor del shell. */
export interface ValorPerfiles {
  readonly perfiles: readonly Perfil[];
  readonly activo: Perfil | null;
  /** Aviso de carga del registro (registro corrupto u otro fallo). */
  readonly avisoCarga: string | null;
  /** Publica al titular activado durante un cambio de perfil. */
  readonly fijarActivo: (perfil: Perfil) => void;
  /** Vuelve a pedir lista y activo al puerto (tras una alta). */
  readonly refrescar: () => void;
}

const VALOR_POR_DEFECTO: ValorPerfiles = {
  perfiles: [],
  activo: null,
  avisoCarga: null,
  fijarActivo: () => {},
  refrescar: () => {},
};

export const PerfilContext = createContext<ValorPerfiles>(VALOR_POR_DEFECTO);

/** Estado de perfiles reactivo para cabecera y gestión en Ajustes. */
export function usarPerfiles(): ValorPerfiles {
  return useContext(PerfilContext);
}
