// design.md F7: registro ÚNICO de los controladores de Chart.js que usa
// la app (bar + line), para mantener los bundles pequeños. Los
// componentes importan el Chart ya configurado desde aquí.
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  BarController,
  BarElement,
  CategoryScale,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
);

export { Chart };
