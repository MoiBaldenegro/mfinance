// Métricas resumen del plan de deuda.
import '../../styles/deuda-metricas.css';

interface Metricas {
  readonly mesesHastaLibre: string;
  readonly interesesTotales: string;
  readonly interesesAhorrados: string;
  readonly totalPagado: string;
}

interface Props {
  readonly metricas: Metricas;
}

export function MetricasPlan({ metricas }: Props) {
  return (
    <section className="deuda-section__tarjeta" aria-label="Métricas del plan">
      <h3 className="deuda-section__subtitulo">Resumen del plan</h3>
      <div className="deuda-section__metricas">
        <div className="deuda-section__metrica">
          <span className="deuda-section__metrica-label">Meses hasta libre</span>
          <span className="deuda-section__metrica-valor">{metricas.mesesHastaLibre}</span>
        </div>
        <div className="deuda-section__metrica">
          <span className="deuda-section__metrica-label">Intereses totales</span>
          <span className="deuda-section__metrica-valor">{metricas.interesesTotales}</span>
        </div>
        <div className="deuda-section__metrica">
          <span className="deuda-section__metrica-label">Intereses ahorrados</span>
          <span className="deuda-section__metrica-valor">{metricas.interesesAhorrados}</span>
        </div>
        <div className="deuda-section__metrica">
          <span className="deuda-section__metrica-label">Total pagado</span>
          <span className="deuda-section__metrica-valor">{metricas.totalPagado}</span>
        </div>
      </div>
    </section>
  );
}