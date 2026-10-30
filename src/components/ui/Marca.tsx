// Marca de mfinance: isotipo SVG (una «m» de dos arcos que sube hacia una
// moneda) y, opcionalmente, el nombre en la fuente de marca (Pacifico).
// Los colores salen de tokens vía CSS; el SVG solo dibuja formas.
interface Props {
  /** Lado del isotipo en px. */
  readonly tamano?: number;
  /** Muestra «mfinance» junto al isotipo. */
  readonly conNombre?: boolean;
  readonly className?: string;
}

export function Marca({ tamano = 32, conNombre = true, className }: Props) {
  return (
    <span className={className ? `marca ${className}` : 'marca'}>
      <svg className="marca__isotipo" width={tamano} height={tamano} viewBox="0 0 32 32"
        aria-hidden="true" focusable="false">
        <rect className="marca__fondo" width="32" height="32" rx="9" />
        <path className="marca__trazo" d="M8 23v-8.5a3.5 3.5 0 0 1 7 0V23m0-8.5a3.5 3.5 0 0 1 7 0V19l3.5-3.5"
          fill="none" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
        <circle className="marca__moneda" cx="24.5" cy="8.5" r="2.6" />
      </svg>
      {conNombre ? <span className="marca__nombre">mfinance</span> : <span className="solo-lectores">mfinance</span>}
    </span>
  );
}
