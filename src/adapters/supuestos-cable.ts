// REQ-14-01/02: traducción de supuestos entre el lenguaje de la app
// (camelCase) y el cable serde del backend (snake_case), igual que el
// resto de comandos del adapter. Vive solo bajo src/adapters/.
import type { SupuestosProyeccion } from '../domain/entities/pyg-proyeccion.ts';

/** Supuestos tal y como los deserializa SupuestosProyeccion en Rust. */
export interface SupuestosProyeccionCable {
  readonly variacion_ingresos: Record<string, number>;
  readonly variacion_gastos: Record<string, number>;
}

/** Mapea los supuestos de la app al formato exacto del cable serde. */
export function supuestosACable(
  supuestos: SupuestosProyeccion,
): SupuestosProyeccionCable {
  return {
    variacion_ingresos: { ...supuestos.variacionIngresos },
    variacion_gastos: { ...supuestos.variacionGastos },
  };
}
