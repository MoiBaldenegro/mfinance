// Orquestador del wizard de cierre (REQ-16-01): barra de progreso, cuerpo
// del paso activo y navegación atrás/continuar. Renderiza y delega.
import { PASOS_WIZARD } from '../../domain/use-cases/wizard-cierre.ts';
import { mesSiguiente } from '../../domain/use-cases/navegacion-meses.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import { BarraProgreso } from './BarraProgreso.tsx';
import { PasoRepaso } from './PasoRepaso.tsx';
import { PasoPresupuesto } from './PasoPresupuesto.tsx';
import { PasoAssessment } from './PasoAssessment.tsx';
import { PasoConfirmacion } from './PasoConfirmacion.tsx';
import { useCierreWizard } from './use-cierre-wizard.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import '../../styles/wizard-cierre.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Wizard multipaso del cierre mensual sobre datos reales. */
export function WizardCierre({ snapshot }: Props) {
  const { aplicarSnapshot } = useSnapshot();
  const wizard = useCierreWizard(snapshot, aplicarSnapshot);
  if (!wizard.mes) {
    return (
      <p className="cierre-wizard__vacio estado-vacio">
        Aún no hay meses registrados: registra tu primer mes en la sección
        Registro para poder cerrarlo.
      </p>
    );
  }
  if (wizard.estado.nombre === 'cargando') {
    return <p className="cierre-wizard__vacio estado-carga">Preparando el cierre de {wizard.mes}…</p>;
  }
  if (wizard.estado.nombre === 'error') {
    return <p className="cierre-wizard__vacio" role="alert">{wizard.estado.motivo}</p>;
  }
  const resumen = wizard.estado.resumen;
  return (
    <div className="cierre-wizard">
      <BarraProgreso paso={wizard.paso} />
      {wizard.paso === 0 && <PasoRepaso resumen={resumen} />}
      {wizard.paso === 1 && (
        <PasoPresupuesto
          mesSiguiente={mesSiguiente(wizard.mes)}
          textos={wizard.textos}
          errores={wizard.erroresPorClave}
          total={wizard.total}
          alCambiar={wizard.alCambiarTexto}
        />
      )}
      {wizard.paso === 2 && <PasoAssessment consejos={wizard.consejos} />}
      {wizard.paso === PASOS_WIZARD.length - 1 && (
        <PasoConfirmacion
          mes={wizard.mes}
          totalPresupuesto={wizard.total}
          riesgosRojos={wizard.consejos.filter((c) => c.severidad === 'rojo').length}
          ocupado={wizard.ocupado}
          aviso={wizard.aviso}
          confirmar={wizard.confirmar}
        />
      )}
      <nav className="cierre-wizard__navegacion">
        <button type="button" onClick={wizard.atras} disabled={wizard.paso === 0}>
          Atrás
        </button>
        {wizard.paso < PASOS_WIZARD.length - 1 ? (
          <button type="button" className="cierre-wizard__continuar" onClick={wizard.continuar}>
            Continuar
          </button>
        ) : null}
      </nav>
    </div>
  );
}
