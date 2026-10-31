// Sección Cierre: asistente de cierre mensual, consejos vigentes e
// histórico de cierres.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-flujo.ts';
import { mesEstaCerrado } from '../../domain/use-cases/mes-cerrado.ts';
import { navegarA } from '../../lib/bus-ui.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { PanelMesCerrado } from './PanelMesCerrado.tsx';
import { WizardCierre } from './WizardCierre.tsx';
import { ConsejosPanel } from './ConsejosPanel.tsx';
import { HistoricoCierres } from './HistoricoCierres.tsx';
import { resumenesHistorico } from '../../domain/use-cases/cierre-historico.ts';
import { Pestanas } from '../ui/Pestanas.tsx';
import '../../styles/cierre-section.css';

const DESCRIPCION = 'Unos minutos al final de cada mes: repasa, presupuesta el siguiente y guarda tu evaluación.';

export function CierreSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const mes = mesDeTrabajo(snapshot);
  const cerrados = resumenesHistorico(snapshot).length;
  const delMes = (
    <div className="rejilla cierre-section__fila">
      {!mes ? (
        <div className="estado-vacio">
          <p>Aún no hay meses registrados. Registra tu primer mes para poder cerrarlo.</p>
          <button type="button" className="btn btn--sm" onClick={() => navegarA('registro')}>Ir a Registro</button>
        </div>
      ) : mesEstaCerrado(snapshot, mes) ? (
        <PanelMesCerrado mes={mes} snapshot={snapshot} />
      ) : (
        <WizardCierre snapshot={snapshot} />
      )}
      <ConsejosPanel />
    </div>
  );
  return (
    <section className="pagina cierre-section">
      <CabeceraPagina titulo="Cierre de mes" descripcion={DESCRIPCION} />
      <Pestanas id="cierre" etiqueta="Vistas del cierre" pestanas={[
        { id: 'mes', titulo: 'Cierre del mes', contenido: delMes },
        { id: 'historico', titulo: 'Cierres anteriores', insignia: cerrados ? String(cerrados) : undefined,
          contenido: <HistoricoCierres snapshot={snapshot} /> },
      ]} />
    </section>
  );
}
