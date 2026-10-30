// KPIs del plan de deuda.
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
  const kpis = [
    ['Meses hasta quedar libre', metricas.mesesHastaLibre, ''],
    ['Intereses totales', metricas.interesesTotales, ''],
    ['Intereses ahorrados', metricas.interesesAhorrados, 'positivo'],
    ['Total a pagar', metricas.totalPagado, ''],
  ] as const;
  return (
    <div className="rejilla rejilla--4" aria-label="Resumen del plan">
      {kpis.map(([etiqueta, valor, tono]) => (
        <div key={etiqueta} className="kpi">
          <span className="kpi__etiqueta">{etiqueta}</span>
          <strong className={tono ? `kpi__valor ${tono}` : 'kpi__valor'}>{valor}</strong>
        </div>
      ))}
    </div>
  );
}
