// REQ-14-03/04/07: gráfica Chart.js de la proyección PyG: líneas de
// ingresos/gastos/utilidad/patrimonio distinguiendo el histórico real
// (puntos grandes y relleno marcado) del proyectado. Canvas + useEffect
// con destroy en cleanup; redibuja por tema y por moneda activa.
import { useEffect, useRef } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { datosDeGraficaProyeccion, type SerieGraficaProyeccion } from '../../domain/use-cases/pyg-proyeccion-grafica.ts';
import type { ProyeccionPyg } from '../../domain/entities/pyg-proyeccion.ts';
import { Chart } from '../../lib/chart-setup.ts';
import { conAlpha, coloresDeEjes, token } from '../../lib/chart-colores.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/grafica-proyeccion.css';

interface Props {
  readonly proyeccion: ProyeccionPyg;
}

/** Dataset por serie: cada punto lleva su propio color según sea histórico o proyectado. */
function dataset(serie: SerieGraficaProyeccion, totalHistoricas: number) {
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

export function ProyeccionChart({ proyeccion }: Props) {
  const lienzo = useRef<HTMLCanvasElement | null>(null);
  const tema = usarTema();
  const moneda = usarMoneda();

  useEffect(() => {
    const canvas = lienzo.current;
    if (!canvas) return undefined;
    const totalHistoricas = proyeccion.filas_historicas.length;
    const ultimaHistorica = totalHistoricas - 1;
    const ejes = coloresDeEjes();
    const datos = datosDeGraficaProyeccion(proyeccion, {
      ingresos: token('--color-primary'),
      gastos: token('--color-negative'),
      utilidad: token('--color-positive'),
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
  }, [proyeccion, tema, moneda]);

  return (
    <div className="grafica-proyeccion">
      <canvas ref={lienzo} role="img" aria-label="Gráfica de proyección por mes" />
    </div>
  );
}
