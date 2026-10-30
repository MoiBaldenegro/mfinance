// Shell principal: barra lateral fija + área de contenido de la sección
// activa. Punto único de propagación de la moneda del snapshot.
import { useCallback } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-secciones.ts';
import { monedaDeSnapshot } from '../../domain/use-cases/moneda-snapshot.ts';
import { MonedaContext } from '../../hooks/use-moneda.ts';
import { usarBusUi } from '../../hooks/usar-bus-ui.ts';
import { usarSeccionActiva } from '../../hooks/use-seccion-activa.ts';
import { ToastAviso } from './ToastAviso';
import { AjustesSection } from '../ajustes-section/AjustesSection';
import { BalanceSection } from '../balance-section/BalanceSection';
import { CierreSection } from '../cierre-section/CierreSection';
import { ConciliacionSection } from '../conciliacion-section/ConciliacionSection';
import { DeudaSection } from '../deuda-section/DeudaSection';
import { DiagnosticoSection } from '../diagnostico-section/DiagnosticoSection';
import { IndicadoresSection } from '../indicadores-section/IndicadoresSection';
import { InversionesSection } from '../inversiones-section/InversionesSection';
import { PygSection } from '../pyg-section/PygSection';
import { RegistroSection } from '../registro-section/RegistroSection';
import { BarraLateral } from './BarraLateral';
import { seccionPorId } from './secciones.ts';
import '../../styles/app-shell.css';

/** Cuerpo de la sección activa sobre datos reales del snapshot cargado. */
function cuerpo(id: string, snapshot: FinanceSnapshot) {
  switch (id) {
    case 'registro': return <RegistroSection snapshot={snapshot} />;
    case 'pyg': return <PygSection snapshot={snapshot} />;
    case 'balance': return <BalanceSection snapshot={snapshot} />;
    case 'deuda': return <DeudaSection snapshot={snapshot} />;
    case 'inversiones': return <InversionesSection snapshot={snapshot} />;
    case 'indicadores': return <IndicadoresSection snapshot={snapshot} />;
    case 'conciliacion': return <ConciliacionSection snapshot={snapshot} />;
    case 'cierre': return <CierreSection snapshot={snapshot} />;
    case 'diagnostico': return <DiagnosticoSection snapshot={snapshot} />;
    case 'ajustes': return <AjustesSection snapshot={snapshot} />;
    default: return null;
  }
}

/** Esqueleto navegable de mfinance en español. */
export function AppShell({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const { activa, elegir } = usarSeccionActiva();
  // REQ-27-07/08: navegación programática (post-onboarding → Registro)
  // y toasts globales publicados desde cualquier sección.
  const toast = usarBusUi(useCallback(elegir, [elegir]));
  const actual = seccionPorId(activa);
  return (
    <MonedaContext.Provider value={monedaDeSnapshot(snapshot)}>
      <div className="app-shell">
        <BarraLateral activa={actual.id} mesTrabajo={mesDeTrabajo(snapshot)} alElegir={elegir} />
        <main className="app-shell__contenido">
          {cuerpo(actual.id, snapshot)}
        </main>
        <ToastAviso mensaje={toast} />
      </div>
    </MonedaContext.Provider>
  );
}
