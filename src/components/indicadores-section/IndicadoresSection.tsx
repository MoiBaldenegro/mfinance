// Sección Indicadores: cuatro tarjetas con semáforo, qué mide cada una y
// la meta recomendada.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { IndicadorResultado, Indicadores } from '../../domain/entities/indicadores.ts';
import {
  estadoIndicador,
  guiaIndicador,
  ORDEN_INDICADORES,
  valorIndicador,
} from '../../domain/use-cases/indicadores-presentacion.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { useIndicadores } from './use-indicadores.ts';
import '../../styles/indicadores-section.css';

const TONO = { verde: 'positivo', amarillo: 'aviso', rojo: 'negativo' } as const;

function Tarjeta({ clave, indicador }: { readonly clave: keyof Indicadores; readonly indicador: IndicadorResultado }) {
  const moneda = usarMoneda();
  const guia = guiaIndicador(clave);
  const tono = indicador.sin_datos ? null : TONO[indicador.clasificacion];
  return (
    <article className={tono ? `card indicador indicador--${tono}` : 'card indicador'}>
      <div className="card__cabecera">
        <h2 className="card__titulo">{indicador.nombre}</h2>
        {tono
          ? <span className={`badge badge--${tono}`}>{estadoIndicador(indicador.clasificacion)}</span>
          : <span className="badge">Sin datos</span>}
      </div>
      <p className="indicador__valor num">
        {indicador.sin_datos ? '—' : valorIndicador(clave, indicador, moneda)}
      </p>
      <p className="card__descripcion">
        {indicador.sin_datos ? indicador.explicacion ?? 'Faltan datos para calcularlo.' : guia.mide}
      </p>
      <p className="indicador__meta">{guia.meta}</p>
    </article>
  );
}

export function IndicadoresSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const estado = useIndicadores(snapshot);
  return (
    <section className="pagina indicadores-section">
      <CabeceraPagina titulo="Indicadores"
        descripcion="La salud de tus finanzas en cuatro números, calculados con tu último mes registrado." />
      {estado.nombre === 'cargando' ? <p className="estado-carga">Calculando indicadores…</p> : null}
      {estado.nombre === 'error'
        ? <p className="aviso aviso--error" role="alert">No se pudieron calcular los indicadores: {estado.motivo}</p>
        : null}
      {estado.nombre === 'listo' ? (
        <div className="rejilla rejilla--2">
          {ORDEN_INDICADORES.map((clave) => (
            <Tarjeta key={clave} clave={clave} indicador={estado.indicadores[clave]} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
