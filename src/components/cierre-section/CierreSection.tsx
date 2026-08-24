// REQ-16: sección Cierre: ritual guiado de cierre mensual (wizard de
// cuatro pasos), panel independiente de consejos e histórico de cierres.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-flujo.ts';
import { mesEstaCerrado } from '../../domain/use-cases/mes-cerrado.ts';
import { PanelMesCerrado } from './PanelMesCerrado.tsx';
import { WizardCierre } from './WizardCierre.tsx';
import { ConsejosPanel } from './ConsejosPanel.tsx';
import { HistoricoCierres } from './HistoricoCierres.tsx';
import '../../styles/cierre-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Contenedor de la sección Cierre sobre los datos del snapshot cargado. */
export function CierreSection({ snapshot }: Props) {
  const mes = mesDeTrabajo(snapshot);
  return (
    <section className="cierre-section">
      <h2 className="cierre-section__titulo">Cierre</h2>
      <p className="cierre-section__ayuda">
        Ritual guiado de unos diez minutos: repasa el mes, presupuesta el
        siguiente y guarda tu assessment con recomendaciones.
      </p>
      {!mes ? (
        <p className="cierre-section__vacio">
          Aún no hay meses registrados: registra tu primer mes en la sección
          Registro para poder cerrarlo.
        </p>
      ) : mesEstaCerrado(snapshot, mes) ? (
        <PanelMesCerrado mes={mes} snapshot={snapshot} />
      ) : (
        <WizardCierre snapshot={snapshot} />
      )}
      <ConsejosPanel />
      <HistoricoCierres snapshot={snapshot} />
    </section>
  );
}
