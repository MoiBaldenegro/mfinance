// REQ-14-02/07: gráfica Chart.js del balance futuro: líneas de
// activos/pasivos/patrimonio distinguiendo el histórico real (puntos
// grandes y relleno marcado) del proyectado (tono apagado). Canvas +
// useEffect con destroy en cleanup; redibuja por tema y moneda activa.
import { useEffect, useRef } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { datosDeGraficaBalanceFuturo, type SerieGraficaBalanceFuturo } from '../../domain/use-cases/balance-futuro-grafica.ts';
import type { BalanceFuturo } from '../../domain/entities/pyg-proyeccion.ts';
import { Chart } from '../../lib/chart-setup.ts';
import { conAlpha, coloresDeEjes, token } from '../../lib/chart-colores.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/grafica-balance-futuro.css';

interface Props {
  readonly balance: BalanceFuturo;
}

/** Dataset por serie: cada punto lleva su propio color según sea histórico o proyectado. */
function dataset(serie: SerieGraficaBalanceFuturo, totalHistoricas: number) {
  const esHistorico = serie.valores.map((_, i) => i < totalHistoricas);
  return {
    label: serie.nombre,
    data: [...serie.valores],
    borderColor: serie.color,
    backgroundColor: esHistorico.map((h) => conAlpha(serie.color, h ? 0.22 : 0.06)),
    pointRadius: esHistorico.map((h) => (h ? 4 : 3)),
    pointBackgroundColor: esHistorico.map((h) => (h ? serie.color : conAlpha(serie.color, 0.55))),
    borderWidth: 2,
    fill: true,
    tension: 0.3,
  };
}

export function BalanceFuturoChart({ balance }: Props) {
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const tema = usarTema();
  const moneda = usarMoneda();

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return undefined;
    const totalHistoricas = balance.filas_historicas.length;
    const ultimaHistorica = totalHistoricas - 1;
    const ejes = coloresDeEjes();
    const datos = datosDeGraficaBalanceFuturo(balance, {
      activos: token('--color-primary'),
      pasivos: token('--color-negative'),
      patrimonio: token('--color-warn'),
      historico: token('--color-primary'),
      proyectado: token('--color-primary'),
    });
    const chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: [...datos.etiquetas],
        datasets: datos.series.map((s) => dataset(s, totalHistoricas)),
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: true, position: 'top' },
          tooltip: {
            callbacks: {
              label: (item) => `${item.dataset.label ?? ''}: ${formatoMoneda(Number(item.raw), moneda)}`,
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            // Marca visualmente la frontera histórico → proyectado.
            ticks: {
              color: ejes.ticks,
              callback: (valor, index) =>
                index === ultimaHistorica ? `${String(valor)} ★` : String(valor),
            },
          },
          y: {
            grid: { color: ejes.grid },
            ticks: {
              color: ejes.ticks,
              callback: (valor) => formatoMoneda(Number(valor), moneda),
            },
          },
        },
      },
    });
    return () => chart.destroy();
  }, [balance, tema, moneda]);

  return (
    <div className="grafica-balance-futuro">
      <canvas ref={lienzo} role="img"
        aria-label="Gráfica de balance futuro: activos, pasivos y patrimonio por mes" />
    </div>
  );
}
