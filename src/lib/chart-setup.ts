// Registro ÚNICO de Chart.js (bar + line) y estilo común de todas las
// gráficas. Los componentes importan el Chart ya configurado desde aquí.
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

Chart.register(
  BarController, BarElement, CategoryScale, Filler, Legend,
  LinearScale, LineController, LineElement, PointElement, Tooltip,
);

Chart.defaults.font.size = 12;
Chart.defaults.maintainAspectRatio = false;
Chart.defaults.animation = { duration: 250 };
Chart.defaults.plugins.legend.position = 'top';
Chart.defaults.plugins.legend.align = 'end';
Chart.defaults.plugins.legend.labels.usePointStyle = true;
Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
Chart.defaults.plugins.legend.labels.boxWidth = 8;
Chart.defaults.plugins.legend.labels.boxHeight = 8;
Chart.defaults.plugins.legend.labels.padding = 16;
Chart.defaults.plugins.tooltip.padding = 10;
Chart.defaults.plugins.tooltip.cornerRadius = 8;
Chart.defaults.plugins.tooltip.boxPadding = 4;
Chart.defaults.plugins.tooltip.usePointStyle = true;
Chart.defaults.elements.bar.borderRadius = 4;
Chart.defaults.elements.bar.borderWidth = 0;
Chart.defaults.elements.line.borderWidth = 2;
Chart.defaults.elements.point.radius = 3;
Chart.defaults.elements.point.hoverRadius = 5;
Chart.defaults.scales.linear.border = { ...Chart.defaults.scales.linear.border, display: false };
Chart.defaults.scales.category.border = { ...Chart.defaults.scales.category.border, display: false };

Chart.defaults.scales.category.ticks = { ...Chart.defaults.scales.category.ticks, maxRotation: 0, autoSkipPadding: 12 };
export { Chart };
