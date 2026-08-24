// REQ-05-04 + REQ-17-02/03 + REQ-20-01: sección Ajustes con resumen del
// snapshot, conmutador de tema y selector de moneda. Renderiza y delega:
// el tema vive en lib/estado-tema, la moneda se persiste vía
// use-cambio-moneda (save_state) y se propaga desde AppShell (usarMoneda).
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { resumenDeSeccion } from '../../domain/use-cases/resumenes-secciones.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import { conmutarTema } from '../../lib/estado-tema.ts';
import { SelectorMoneda } from './SelectorMoneda.tsx';
import { useCambioMoneda } from './use-cambio-moneda.ts';
import { GestionPerfiles } from './GestionPerfiles';
import { MisMetas } from './MisMetas';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import '../../styles/ajustes-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Sección Ajustes: datos reales, tema oscuro↔claro y moneda activa. */
export function AjustesSection({ snapshot }: Props) {
  const tema = usarTema();
  const siguiente = tema === 'oscuro' ? 'claro' : 'oscuro';
  const { aplicarSnapshot } = useSnapshot();
  const cambio = useCambioMoneda(snapshot, aplicarSnapshot);
  return (
    <section className="ajustes-section">
      <h2 className="ajustes-section__titulo">Ajustes</h2>
      <p className="ajustes-section__resumen">
        {resumenDeSeccion('ajustes', snapshot)}
      </p>
      <GestionPerfiles />
      <MisMetas />
      <SelectorMoneda alCambiar={(moneda) => void cambio.cambiar(moneda)} />
      {cambio.aviso ? (
        <p className="ajustes-section__aviso" role="alert">
          {cambio.aviso}
        </p>
      ) : null}
      <div className="ajustes-section__tema">
        <span className="ajustes-section__tema-etiqueta">
          Tema activo: {tema}
        </span>
        <button
          type="button"
          className="ajustes-section__conmutar"
          aria-label="Cambiar entre tema oscuro y tema claro"
          onClick={() => conmutarTema()}
        >
          Usar tema {siguiente}
        </button>
      </div>
    </section>
  );
}
