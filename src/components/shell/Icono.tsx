// Iconos de trazo (24×24, currentColor) dibujados para la app: sin
// dependencias externas. Decorativos: aria-hidden siempre.
const TRAZOS: Readonly<Record<string, string>> = {
  registro: 'M4 5h16v14H4zM8 3v4M16 3v4M4 10h16M8 14h3M8 17h6',
  pyg: 'M4 20V10M10 20V4M16 20v-7M22 20H2',
  balance: 'M12 3v18M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0zM8 21h8',
  deuda: 'M3 6h18v12H3zM3 10h18M7 15h4',
  inversiones: 'M3 17l6-6 4 4 8-8M15 7h6v6',
  indicadores: 'M12 21a9 9 0 1 1 9-9M12 12l5-5M12 3v2M3 12h2',
  conciliacion: 'M4 7h13l-3-3M20 17H7l3 3',
  cierre: 'M5 12l5 5L20 7',
  diagnostico: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h4',
  ajustes: 'M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6',
  sol: 'M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10zM12 1v2M12 21v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M1 12h2M21 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4',
  luna: 'M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10z',
  anterior: 'M15 18l-6-6 6-6',
  siguiente: 'M9 18l6-6-6-6',
  check: 'M5 12l5 5L20 7',
  editar: 'M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4',
  eliminar: 'M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3',
  mas: 'M12 5v14M5 12h14',
  abajo: 'M6 9l6 6 6-6',
  cerrar: 'M6 6l12 12M18 6L6 18',
  alerta: 'M12 3l10 18H2zM12 10v5M12 18v.01',
};

interface Props {
  readonly nombre: string;
  readonly tamano?: number;
}

/** Icono SVG por nombre; nombres desconocidos no pintan nada. */
export function Icono({ nombre, tamano = 18 }: Props) {
  const trazo = TRAZOS[nombre];
  if (!trazo) return null;
  return (
    <svg width={tamano} height={tamano} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={trazo} />
    </svg>
  );
}
