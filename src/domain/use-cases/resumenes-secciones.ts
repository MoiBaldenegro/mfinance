// Despachador de resúmenes por sección (REQ-05-04): dado el id de la
// sección activa y el snapshot cargado, devuelve su resumen en español.
import type { FinanceSnapshot } from '../entities/finance-snapshot.ts';
import {
  resumenCierre,
  resumenDiagnostico,
  resumenIndicadores,
  resumenPyg,
  resumenRegistro,
} from './resumenes-flujo.ts';
import {
  resumenAjustes,
  resumenBalance,
  resumenConciliacion,
  resumenDeuda,
  resumenInversiones,
} from './resumenes-patrimonio.ts';

export { mesDeTrabajo } from './resumenes-flujo.ts';

/** Resumen breve y coherente con los datos reales del snapshot. */
export function resumenDeSeccion(
  id: string,
  snapshot: FinanceSnapshot,
): string {
  switch (id) {
    case 'registro': return resumenRegistro(snapshot);
    case 'pyg': return resumenPyg(snapshot);
    case 'balance': return resumenBalance(snapshot);
    case 'deuda': return resumenDeuda(snapshot);
    case 'inversiones': return resumenInversiones(snapshot);
    case 'indicadores': return resumenIndicadores(snapshot);
    case 'conciliacion': return resumenConciliacion(snapshot);
    case 'cierre': return resumenCierre(snapshot);
    case 'diagnostico': return resumenDiagnostico(snapshot);
    case 'ajustes': return resumenAjustes(snapshot);
    default: return '';
  }
}
