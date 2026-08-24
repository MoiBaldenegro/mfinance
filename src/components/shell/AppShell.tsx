// REQ-05-04 + REQ-20-02 + REQ-22-01..03: shell con cabecera fija
// (indicador permanente del titular), pestañas horizontales y el área
// central de la sección activa. PUNTO ÚNICO de propagación de la moneda
// activa desde el snapshot (patrón use-tema) y del estado compartido de
// perfiles: la cabecera y Ajustes lo leen vía usarPerfiles().
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { Perfil } from '../../domain/entities/perfil.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-secciones.ts';
import { monedaDeSnapshot } from '../../domain/use-cases/moneda-snapshot.ts';
import { cargarPerfiles } from '../../domain/use-cases/cargar-perfiles.ts';
import { MonedaContext } from '../../hooks/use-moneda.ts';
import { PerfilContext } from '../../hooks/use-perfil.ts';
import type { ValorPerfiles } from '../../hooks/use-perfil.ts';
import { perfilPort } from '../../adapters/perfil-ipc-adapter.ts';
import { usarBusUi } from '../../hooks/usar-bus-ui.ts';
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
import HeaderBar from './HeaderBar';
import SectionTabs from './SectionTabs';
import { SECCIONES, primeraSeccion } from './secciones.ts';
import '../../styles/app-shell.css';

/** Cuerpo de la sección activa sobre datos reales del snapshot cargado. */
function cuerpo(id: string, snapshot: FinanceSnapshot) {
  switch (id) {
    case 'registro': return <RegistroSection snapshot={snapshot} />;
    case 'pyg': return <PygSection snapshot={snapshot} />;
    case 'balance': return <BalanceSection snapshot={snapshot} />;
    case 'deuda': return <DeudaSection snapshot={snapshot} />;
    case 'inversiones': return <InversionesSection snapshot={snapshot} />;
    case 'indicadores': return <IndicadoresSection />;
    case 'conciliacion': return <ConciliacionSection />;
    case 'cierre': return <CierreSection snapshot={snapshot} />;
    case 'diagnostico': return <DiagnosticoSection />;
    case 'ajustes': return <AjustesSection snapshot={snapshot} />;
    default: return null;
  }
}

/** Esqueleto navegable de mfinance en español. */
export function AppShell({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const [activa, setActiva] = useState(primeraSeccion());
  const [perfiles, setPerfiles] = useState<readonly Perfil[]>([]);
  const [activo, setActivo] = useState<Perfil | null>(null);
  const [avisoCarga, setAvisoCarga] = useState<string | null>(null);

  // REQ-22-02: carga inicial del registro. Tras un cambio de perfil la
  // shell se remonta (recarga del snapshot), así que esto también trae
  // el registro fresco con el nuevo titular.
  const refrescar = useCallback(() => {
    void cargarPerfiles(perfilPort).then((resultado) => {
      if (!resultado.ok) {
        setAvisoCarga(resultado.error.message);
        return;
      }
      setAvisoCarga(null);
      setPerfiles(resultado.perfiles);
      setActivo(resultado.activo);
    });
  }, []);
  useEffect(() => {
    refrescar();
  }, [refrescar]);

  const valorPerfiles = useMemo<ValorPerfiles>(
    () => ({ perfiles, activo, avisoCarga, fijarActivo: setActivo, refrescar }),
    [perfiles, activo, avisoCarga, refrescar],
  );
  // REQ-27-07/08: navegación programática (post-onboarding → Registro)
  // y toasts globales publicados desde cualquier sección.
  const toast = usarBusUi(useCallback((seccion: string) => setActiva(seccion), []));
  const actual = SECCIONES.find((seccion) => seccion.id === activa)
    ?? SECCIONES[0];
  return (
    <MonedaContext.Provider value={monedaDeSnapshot(snapshot)}>
      <PerfilContext.Provider value={valorPerfiles}>
        <div className="app-shell">
          <HeaderBar mesTrabajo={mesDeTrabajo(snapshot)} />
          <SectionTabs activa={activa} alElegir={setActiva} />
          <main className="app-shell__contenido">
            {cuerpo(actual.id, snapshot)}
          </main>
          <ToastAviso mensaje={toast} />
        </div>
      </PerfilContext.Provider>
    </MonedaContext.Provider>
  );
}
