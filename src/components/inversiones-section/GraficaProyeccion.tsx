// Gráfica Chart.js de proyección (REQ-11-04) adaptada al tema (REQ-17-06):
// los colores de tokens se pasan a Chart.js RESUELTOS vía lib/chart-colores
// (el canvas no resuelve custom properties CSS por sí solo) y el efecto
// depende del tema y de la moneda activa (REQ-20-02) para redibujar.
import { useEffect, useRef } from 'react';
import { Chart } from '../../lib/chart-setup.ts';
import { coloresDeEjes, token } from '../../lib/chart-colores.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { ProyeccionInversiones } from '../../domain/entities/proyeccion-inversiones.ts';
import '../../styles/inversiones-grafica.css';

interface Props {
  readonly proyeccion: ProyeccionInversiones | null;
}

export function GraficaProyeccion({ proyeccion }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tema = usarTema();
  const moneda = usarMoneda();

  useEffect(() => {
    if (!proyeccion || !canvasRef.current) return undefined;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return undefined;

    const labels = ['5 años', '10 años', '20 años'];
    const fondos = [
      token('--chart-color-1'),
      token('--chart-color-2'),
      token('--chart-color-3'),
    ];
    const ejes = coloresDeEjes();
    const datasets = proyeccion.familias.map((fam, i) => ({
      label: fam.familia.replace('_', ' '),
      data: [fam.valor_futuro_5, fam.valor_futuro_10, fam.valor_futuro_20],
      backgroundColor: fondos[i],
      borderColor: token('--chart-border'),
      borderWidth: 1,
    }));

    const chart = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: { color: ejes.ticks },
          },
          title: {
            display: true,
            text: 'Valor futuro proyectado por familia',
            color: ejes.ticks,
          },
        },
        scales: {
          x: { grid: { color: ejes.grid }, ticks: { color: ejes.ticks } },
          y: {
            beginAtZero: true,
            grid: { color: ejes.grid },
            ticks: {
              color: ejes.ticks,
              callback: (value: number | string) =>
                formatoMoneda(Number(value), moneda, 0),
            },
          },
        },
      },
    });

    return () => { chart.destroy(); };
  }, [proyeccion, tema, moneda]);

  if (!proyeccion) return <p className="inversiones-grafica__vacia estado-carga">Cargando proyección…</p>;

  return (
    <div className="inversiones-grafica-wrap">
      <canvas ref={canvasRef} className="inversiones-grafica" />
    </div>
  );
}
