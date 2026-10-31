// KPIs de inversiones: aporte mensual, valor actual y valor a 20 años.
import type { ProyeccionInversiones } from '../../domain/entities/proyeccion-inversiones.ts';
import { formatearProyeccion, sumarAportes } from '../../domain/use-cases/inversiones-proyeccion.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { InvestmentFamily } from '../../domain/entities/catalogs.ts';

interface Props {
  readonly filas: readonly { readonly familia: InvestmentFamily; readonly aporte_mensual: number; readonly valor_actual: number }[];
  readonly proyeccion: ProyeccionInversiones | null;
}

export function TotalInvertido({ filas, proyeccion }: Props) {
  const moneda = usarMoneda();
  const valorActual = filas.reduce((total, f) => total + f.valor_actual, 0);
  const a20 = proyeccion?.familias.reduce((total, f) => total + f.valor_futuro_20, 0) ?? 0;
  return (
    <div className="rejilla rejilla--3">
      <div className="kpi">
        <span className="kpi__etiqueta">Aporte mensual</span>
        <strong className="kpi__valor">{formatearProyeccion(sumarAportes(filas), moneda)}</strong>
      </div>
      <div className="kpi">
        <span className="kpi__etiqueta">Valor actual de la cartera</span>
        <strong className="kpi__valor">{formatearProyeccion(valorActual, moneda)}</strong>
      </div>
      <div className="kpi">
        <span className="kpi__etiqueta">Valor estimado a 20 años</span>
        <strong className="kpi__valor positivo">{formatearProyeccion(a20, moneda)}</strong>
        <span className="kpi__nota">Con los datos guardados</span>
      </div>
    </div>
  );
}
