// REQ-26-01: Vista previa solo lectura PyG 12m + Patrimonio 12m, plegable.
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
  if (cargando && !proyeccionPyg) return <p className="estado-carga">Calculando proyección…</p>;
  if (!proyeccionPyg) return <p className="estado-vacio">{MENSAJE_SIN_HISTORICO}</p>;

  const filasPyg = filasDeTablaProyeccion(proyeccionPyg, moneda);
  const historicos = new Set(balanceFuturo?.filas_historicas.map((h) => h.mes) ?? []);
  const filasBalance = balanceFuturo ? [...balanceFuturo.filas_historicas, ...balanceFuturo.filas_proyectadas] : [];

  return (
    <details className="preview-section">
      <summary className="preview-section__resumen">Vista previa de la proyección a 12 meses</summary>
      <div className="preview-section__cuerpo">
        <h4 className="preview-section__subtitulo">Ingresos y gastos</h4>
        <div className="tabla-contenedor preview-section__tabla">
          <table className="tabla">
            <thead>
              <tr><th>Mes</th><th className="num">Ingresos</th><th className="num">Gastos</th><th className="num">Utilidad</th><th className="num">Ahorro acumulado</th></tr>
            </thead>
            <tbody>
              {filasPyg.map((f) => (
                <tr key={f.mes} className={f.tipo === 'proyectado' ? 'preview-section__fila-proyectado' : ''}>
                  <td>{f.mes}</td><td className="num">{f.ingresos}</td><td className="num">{f.gastos}</td>
                  <td className="num">{f.utilidad}</td><td className="num">{f.ahorroAcumulado}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filasBalance.length > 0 && <>
          <h4 className="preview-section__subtitulo">Patrimonio</h4>
          <div className="tabla-contenedor preview-section__tabla">
            <table className="tabla">
              <thead>
                <tr><th>Mes</th><th className="num">Activos</th><th className="num">Pasivos</th><th className="num">Patrimonio</th></tr>
              </thead>
              <tbody>
                {filasBalance.map((f) => (
                  <tr key={f.mes} className={historicos.has(f.mes) ? '' : 'preview-section__fila-proyectado'}>
                    <td>{f.mes}</td><td className="num">{formatoMoneda(f.activos, moneda)}</td>
                    <td className="num">{formatoMoneda(f.pasivos, moneda)}</td><td className="num">{formatoMoneda(f.patrimonio, moneda)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>}
      </div>
    </details>
  );
}
