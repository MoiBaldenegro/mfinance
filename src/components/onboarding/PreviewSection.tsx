// REQ-26-01: Vista previa solo lectura PyG 12m + Patrimonio 12m (≤100 líneas)
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { filasDeTablaProyeccion, MENSAJE_SIN_HISTORICO } from '../../domain/use-cases/pyg-proyeccion.ts';
import type { ProyeccionPyg, BalanceFuturo } from '../../domain/entities/pyg-proyeccion.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import '../../styles/preview-section.css';

interface Props {
  readonly proyeccionPyg: ProyeccionPyg | null;
  readonly balanceFuturo: BalanceFuturo | null;
  readonly moneda: Moneda;
  readonly cargando: boolean;
}

export function PreviewSection({ proyeccionPyg, balanceFuturo, moneda, cargando }: Props) {
  const filasPyg = proyeccionPyg ? filasDeTablaProyeccion(proyeccionPyg, moneda) : [];
  const filasBalance = balanceFuturo
    ? [...balanceFuturo.filas_historicas, ...balanceFuturo.filas_proyectadas].map((f) => ({
        mes: f.mes,
        tipo: balanceFuturo.filas_historicas.some((h) => h.mes === f.mes) ? 'historico' : 'proyectado',
        activos: formatoMoneda(f.activos, moneda),
        pasivos: formatoMoneda(f.pasivos, moneda),
        patrimonio: formatoMoneda(f.patrimonio, moneda),
      }))
    : [];

  if (cargando) return <p className="preview-section__cargando">Calculando proyección…</p>;
  if (!proyeccionPyg) return <p className="preview-section__vacio">{MENSAJE_SIN_HISTORICO}</p>;

  return (
    <section className="preview-section">
      <h4 className="preview-section__subtitulo">Vista previa: Proyección 12 meses</h4>
      <h5>PyG proyectado</h5>
      <div className="preview-section__tabla-wrap">
        <table className="preview-section__tabla">
          <thead>
            <tr>
              <th>Mes</th><th>Ingresos</th><th>Gastos</th><th>Utilidad</th><th>Ahorro acumulado</th>
            </tr>
          </thead>
          <tbody>
            {filasPyg.map((f) => (
              <tr key={f.mes} className={f.tipo === 'proyectado' ? 'preview-section__fila-proyectado' : ''}>
                <td>{f.mes}</td><td>{f.ingresos}</td><td>{f.gastos}</td><td>{f.utilidad}</td><td>{f.ahorroAcumulado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h5>Patrimonio proyectado</h5>
      <div className="preview-section__tabla-wrap">
        <table className="preview-section__tabla">
          <thead>
            <tr><th>Mes</th><th>Activos</th><th>Pasivos</th><th>Patrimonio</th></tr>
          </thead>
          <tbody>
            {filasBalance.map((f) => (
              <tr key={f.mes} className={f.tipo === 'proyectado' ? 'preview-section__fila-proyectado' : ''}>
                <td>{f.mes}</td><td>{f.activos}</td><td>{f.pasivos}</td><td>{f.patrimonio}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}