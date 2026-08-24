// Tarjeta de escenario Base u Optimizado (REQ-15-04): métricas grandes
// formateadas en euros por el use-case comparativo.
import type { MetricasEscenarioVista } from '../../../domain/use-cases/simulador-comparativa.ts';
import '../../../styles/simulador-tarjetas.css';

interface Props {
  readonly titulo: string;
  readonly metricas: MetricasEscenarioVista;
  readonly destacada: boolean;
}

export function TarjetaEscenario({ titulo, metricas, destacada }: Props) {
  return (
    <article
      className={`simulador-tarjeta${destacada ? ' simulador-tarjeta--optimizada' : ''}`}
      aria-label={`Escenario ${titulo}`}
    >
      <h4 className="simulador-tarjeta__titulo">{titulo}</h4>
      <p className="simulador-tarjeta__metrica">
        <span className="simulador-tarjeta__etiqueta">Cuota mensual</span>
        <strong className="simulador-tarjeta__valor">{metricas.cuota}</strong>
      </p>
      <p className="simulador-tarjeta__metrica">
        <span className="simulador-tarjeta__etiqueta">Meses hasta liquidar</span>
        <strong className="simulador-tarjeta__valor">{metricas.meses}</strong>
      </p>
      <p className="simulador-tarjeta__metrica">
        <span className="simulador-tarjeta__etiqueta">Intereses totales</span>
        <strong className="simulador-tarjeta__valor">{metricas.intereses}</strong>
      </p>
      <p className="simulador-tarjeta__metrica">
        <span className="simulador-tarjeta__etiqueta">Total pagado</span>
        <strong className="simulador-tarjeta__valor">{metricas.totalPagado}</strong>
      </p>
    </article>
  );
}
