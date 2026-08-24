// REQ-08-05: gráfica Chart.js de evolución mensual del patrimonio
// (línea). Canvas + useEffect; destroy en cleanup para evitar
// canvases huérfanos al refrescar (REQ-08-07) o desmontar. El efecto
// depende del tema para redibujar con la paleta activa (REQ-17-06).
import { useEffect, useRef } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import {
  datosDeGraficaBalance,
} from '../../domain/use-cases/balance-grafica.ts';
import type { SerieBalance } from '../../domain/entities/balance-serie.ts';
import { Chart } from '../../lib/chart-setup.ts';
import { conAlpha, coloresDeEjes, token } from '../../lib/chart-colores.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import '../../styles/balance-chart.css';

interface Props {
  readonly serie: SerieBalance;
}

export function BalanceChart({ serie }: Props) {
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const tema = usarTema();
  const moneda = usarMoneda();

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return undefined;
    const ejes = coloresDeEjes();
    const datos = datosDeGraficaBalance(serie, {
      patrimonio: token('--color-primary'),
    });
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [...datos.etiquetas],
        datasets: datos.series.map((serieDatos) => ({
          label: serieDatos.nombre,
          data: [...serieDatos.valores],
          borderColor: serieDatos.color,
          backgroundColor: conAlpha(serieDatos.color, 0.2),
          tension: 0.3,
          borderWidth: 2,
          fill: true,
          pointRadius: 4,
          pointHoverRadius: 6,
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
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.dataset.label}: ${formatoMoneda(ctx.raw as number, moneda)}`,
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [serie, tema, moneda]);

  return (
    <div className="balance-chart">
      <canvas ref={lienzo} role="img"
        aria-label="Gráfica de evolución mensual del patrimonio" />
    </div>
  );
}