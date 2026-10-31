// Indicadores del semáforo: se piden al backend y se recalculan cada vez
// que cambia el snapshot publicado. Errores visibles, nunca silenciosos.
import { useEffect, useState } from 'react';
import { usarPuertos } from '../../app/puertos.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { Indicadores } from '../../domain/entities/indicadores.ts';
import { cargarIndicadores } from '../../domain/use-cases/indicadores-logic.ts';

export type EstadoIndicadores =
  | { readonly nombre: 'cargando' }
  | { readonly nombre: 'listo'; readonly indicadores: Indicadores }
  | { readonly nombre: 'error'; readonly motivo: string };

export function useIndicadores(snapshot: FinanceSnapshot): EstadoIndicadores {
  const { snapshot: snapshotPort } = usarPuertos();
  const [estado, setEstado] = useState<EstadoIndicadores>({ nombre: 'cargando' });
  useEffect(() => {
    let vigente = true;
    cargarIndicadores(snapshotPort)
      .then((indicadores) => { if (vigente) setEstado({ nombre: 'listo', indicadores }); })
      .catch((e: unknown) => {
        if (vigente) setEstado({ nombre: 'error', motivo: e instanceof Error ? e.message : 'No se pudieron calcular los indicadores' });
      });
    return () => { vigente = false; };
  }, [snapshot]);
  return estado;
}
