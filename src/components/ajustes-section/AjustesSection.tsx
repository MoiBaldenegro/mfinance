// Sección Ajustes: perfiles, apariencia, moneda y journal de metas.
// Renderiza y delega: el tema vive en lib/estado-tema y la moneda se
// persiste con use-cambio-moneda.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import { conmutarTema } from '../../lib/estado-tema.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { SelectorMoneda } from './SelectorMoneda.tsx';
import { useCambioMoneda } from './use-cambio-moneda.ts';
import { GestionPerfiles } from './GestionPerfiles';
import { MisMetas } from './MisMetas';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import { Pestanas } from '../ui/Pestanas.tsx';
import '../../styles/ajustes-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

export function AjustesSection({ snapshot }: Props) {
  const tema = usarTema();
  const { aplicarSnapshot } = useSnapshot();
  const cambio = useCambioMoneda(snapshot, aplicarSnapshot);
  const preferencias = (
    <div className="rejilla rejilla--2 ajustes-section__preferencias">
      <section className="card" aria-label="Apariencia">
        <h2 className="card__titulo">Apariencia</h2>
        <div className="segmentado" role="radiogroup" aria-label="Tema de color">
          {(['oscuro', 'claro'] as const).map((opcion) => (
            <button key={opcion} type="button" role="radio" className="segmentado__opcion"
              aria-checked={tema === opcion} onClick={() => { if (tema !== opcion) conmutarTema(); }}>
              {opcion === 'oscuro' ? 'Oscuro' : 'Claro'}
            </button>
          ))}
        </div>
      </section>
      <section className="card" aria-label="Moneda">
        <h2 className="card__titulo">Moneda</h2>
        <p className="card__descripcion">Cómo se muestran los importes. No convierte valores.</p>
        <SelectorMoneda alCambiar={(moneda) => void cambio.cambiar(moneda)} />
        {cambio.aviso ? <p className="aviso aviso--error" role="alert">{cambio.aviso}</p> : null}
      </section>
    </div>
  );
  return (
    <section className="pagina ajustes-section">
      <CabeceraPagina titulo="Ajustes" descripcion="Perfiles, apariencia y preferencias de la aplicación." />
      <Pestanas id="ajustes" etiqueta="Apartados de ajustes" pestanas={[
        { id: 'perfiles', titulo: 'Perfiles', contenido: <GestionPerfiles /> },
        { id: 'preferencias', titulo: 'Preferencias', contenido: preferencias },
        { id: 'metas', titulo: 'Mis metas', contenido: <MisMetas /> },
      ]} />
    </section>
  );
}
