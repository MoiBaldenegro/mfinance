// Sección Inversiones: aportes y valor por familia (editables), KPIs y
// proyección compuesta a 5/10/20 años.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { useInversiones } from './useInversiones';
import { TablaInversiones } from './TablaInversiones';
import { ProyeccionResumen } from './ProyeccionResumen';
import { GraficaProyeccion } from './GraficaProyeccion';
import { TotalInvertido } from './TotalInvertido';
import { Pestanas } from '../ui/Pestanas.tsx';
import '../../styles/inversiones-section.css';

const DESCRIPCION = 'Registra cuánto aportas cada mes y proyecta el valor de tu cartera con interés compuesto.';

export function InversionesSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const inv = useInversiones(snapshot);
  return (
    <section className="pagina inversiones-section">
      <CabeceraPagina titulo="Inversiones" descripcion={DESCRIPCION} />
      <TotalInvertido filas={inv.numericas} proyeccion={inv.proyeccion} />
      <Pestanas id="inversiones" etiqueta="Vistas de inversiones" pestanas={[
        { id: 'cartera', titulo: 'Cartera', insignia: inv.cambios ? 'sin guardar' : undefined, contenido: (
            <section className="card" aria-label="Tus inversiones">
              <div className="card__cabecera">
                <h2 className="card__titulo">Tu cartera</h2>
                <div className="pagina__acciones">
                  {inv.cambios ? <span className="badge badge--aviso">Cambios sin guardar</span> : null}
                  <button type="button" className="btn btn--primario" onClick={() => void inv.guardar()}
                    disabled={inv.guardando || !inv.cambios}>
                    {inv.guardando ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </div>
              <TablaInversiones filas={inv.filas} editar={inv.editar} />
              {inv.error ? <p className="aviso aviso--error" role="alert">{inv.error}</p> : null}
            </section>
        ) },
        { id: 'proyeccion', titulo: 'Proyección', contenido: (
            <section className="card" aria-label="Proyección">
              <h2 className="card__titulo">Valor futuro proyectado</h2>
              <GraficaProyeccion proyeccion={inv.proyeccion} />
              <ProyeccionResumen proyeccion={inv.proyeccion} />
            </section>
        ) },
      ]} />
    </section>
  );
}
