// REQ-06-02/03/05: tarjeta Ingresos|Gastos del formulario mensual:
// lista de campos por catálogo, subtotal EN VIVO y variante de color.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { ErrorCampo } from '../../domain/use-cases/validacion-importes.ts';
import { CampoImporte } from './CampoImporte.tsx';
import '../../styles/tarjeta-montos.css';

interface Props {
  /** Rótulo de la tarjeta: "Ingresos" o "Gastos". */
  readonly titulo: string;
  /** Prefijo para ids y claves de error (ingreso|gasto). */
  readonly prefijo: string;
  /** Claves del catálogo en su orden canónico. */
  readonly claves: readonly string[];
  /** Rótulos visibles en español por clave. */
  readonly etiquetas: Readonly<Record<string, string>>;
  /** Textos tecleados por clave. */
  readonly textos: Readonly<Record<string, string>>;
  /** Errores de validación indexados por clave de campo. */
  readonly errores: Readonly<Record<string, ErrorCampo['mensaje']>>;
  /** Subtotal recalculado en vivo mientras se escribe. */
  readonly subtotal: number;
  readonly alCambiar: (clave: string, texto: string) => void;
}

/** Tarjeta de una tarjeta de montos con su subtotal al pie. */
export function TarjetaMontos({
  titulo,
  prefijo,
  claves,
  etiquetas,
  textos,
  errores,
  subtotal,
  alCambiar,
}: Props) {
  const moneda = usarMoneda();
  return (
    <fieldset className="tarjeta-montos">
      <legend className="tarjeta-montos__titulo">{titulo}</legend>
      {claves.map((clave) => (
        <CampoImporte
          key={clave}
          prefijo={prefijo}
          clave={clave}
          etiqueta={etiquetas[clave]}
          texto={textos[clave] ?? ''}
          error={errores[`${prefijo}:${clave}`]}
          alCambiar={alCambiar}
        />
      ))}
      <p className={`tarjeta-montos__subtotal tarjeta-montos__subtotal--${prefijo}`}>
        Subtotal: <strong>{formatoMoneda(subtotal, moneda)}</strong>
      </p>
    </fieldset>
  );
}
