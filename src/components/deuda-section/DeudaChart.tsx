// REQ-09-05: gráfica Chart.js de la sección Deuda: barras apiladas
// (principal + intereses) + línea de saldo restante.
// Canvas + useEffect; el destroy en el cleanup evita canvases huérfanos
// al refrescar la proyección o desmontar la sección. El efecto depende
// del tema (REQ-17-06) y de la moneda activa (REQ-20-02).
import { useEffect, useRef } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import {
  datosDeGraficaDeuda,
} from '../../domain/use-cases/deuda-grafica.ts';
import type { ProyeccionDeuda } from '../../domain/entities/plan-deuda.ts';
import { Chart } from '../../lib/chart-setup.ts';
import { coloresDeEjes, token } from '../../lib/chart-colores.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import '../../styles/deuda-chart.css';

interface Props {
  readonly proyeccion: ProyeccionDeuda;
}

export function DeudaChart({ proyeccion }: Props) {
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const tema = usarTema();
  const moneda = usarMoneda();

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return undefined;
    const ejes = coloresDeEjes();
    const datos = datosDeGraficaDeuda(proyeccion, {
      pago: token('--color-primary'),
      interes: token('--color-negative'),
      saldo: token('--color-warn'),
    });
    const chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: [...datos.etiquetas],
        datasets: datos.series.map((serieDatos) => ({
          label: serieDatos.nombre,
          data: [...serieDatos.valores],
          backgroundColor: serieDatos.color,
          borderColor: serieDatos.color,
          yAxisID: serieDatos.yAxisID ?? 'y',
          ...(serieDatos.tipo === 'linea'
            ? { type: 'line' as const, tension: 0.3, borderWidth: 2, fill: false, pointRadius: 3 }
            : { type: 'bar' as const, borderWidth: 0 }),
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index' as const, intersect: false },
        scales: {
          y: {
            type: 'linear',
            position: 'left',
            stacked: true,
            grid: { color: ejes.grid },
            ticks: {
              color: ejes.ticks,
              callback: (valor) => formatoMoneda(Number(valor), moneda),
            },
          },
          y1: {
            type: 'linear',
            position: 'right',
            stacked: false,
            grid: { drawOnChartArea: false },
            ticks: {
              color: ejes.ticks,
              callback: (valor) => formatoMoneda(Number(valor), moneda),
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [proyeccion, tema, moneda]);

  return (
    <div className="deuda-chart">
      <canvas ref={lienzo} role="img"
        aria-label="Gráfica de pagos (principal e intereses) y saldo restante por mes" />
    </div>
  );
}
