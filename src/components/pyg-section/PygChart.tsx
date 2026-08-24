// REQ-07-03: gráfica Chart.js de la sección P&G: barras de ingresos
// contra gastos por mes con línea superpuesta de ahorro acumulado.
// Canvas + useEffect; el destroy en el cleanup evita canvases huérfanos
// al refrescar la serie (REQ-07-05) o desmontar la sección. El efecto
// depende del tema (REQ-17-06) y de la moneda activa (REQ-20-02).
import { useEffect, useRef } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import {
  datosDeGrafica,
} from '../../domain/use-cases/pyg-grafica.ts';
import type { SeriePyg } from '../../domain/entities/pyg-serie.ts';
import { Chart } from '../../lib/chart-setup.ts';
import { coloresDeEjes, token } from '../../lib/chart-colores.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import '../../styles/grafica-pyg.css';

interface Props {
  readonly serie: SeriePyg;
}

export function PygChart({ serie }: Props) {
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const tema = usarTema();
  const moneda = usarMoneda();

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return undefined;
    const ejes = coloresDeEjes();
    const datos = datosDeGrafica(serie, {
      ingresos: token('--color-primary'),
      gastos: token('--color-negative'),
      ahorro: token('--color-warn'),
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
          ...(serieDatos.tipo === 'linea'
            ? { type: 'line' as const, tension: 0.3, borderWidth: 2 }
            : {}),
        })),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            grid: { color: ejes.grid },
            ticks: {
              color: ejes.ticks,
              callback: (valor) => formatoMoneda(Number(valor), moneda),
            },
          },
          x: { grid: { color: ejes.grid }, ticks: { color: ejes.ticks } },
        },
      },
    });
    return () => chart.destroy();
  }, [serie, tema, moneda]);

  return (
    <div className="grafica-pyg">
      <canvas ref={lienzo} role="img"
        aria-label="Gráfica de ingresos, gastos y ahorro acumulado por mes" />
    </div>
  );
}
