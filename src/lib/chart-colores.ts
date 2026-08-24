// Utilidades de color para las gráficas Chart.js de la app: lectura de
// tokens CSS de :root y derivación de variantes con alpha a partir de
// hex #rrggbb. Glue de UI: vive en lib/, nunca en el dominio.

/** Lee el valor resuelto de una custom property de :root (sin espacios). */
export function token(nombre: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(nombre)
    .trim();
}

/** "#rrggbb" → "rgba(r, g, b, alpha)"; si no es hex de 6 dígitos, lo devuelve tal cual. */
export function conAlpha(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color.trim());
  if (!hex) return color;
  const [r, g, b] = [1, 2, 3].map((i) => parseInt(hex[i], 16));
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** Colores de rejilla y etiquetas de los ejes según el tema activo. */
export function coloresDeEjes(): { readonly grid: string; readonly ticks: string } {
  return {
    grid: token('--chart-grid'),
    ticks: token('--chart-ticks'),
  };
}
