// Paso 4 del wizard (REQ-16-03): confirmación del cierre: resumen de las
// decisiones y botón «Cerrar mes» que persiste el assessment.
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/pasos-wizard.css';

interface Props {
  readonly mes: string;
  readonly totalPresupuesto: number;
  readonly riesgosRojos: number;
  readonly ocupado: boolean;
  readonly aviso: string | null;
  readonly confirmar: () => Promise<void>;
}

/** Resumen final y acción de cierre del ritual. */
export function PasoConfirmacion({
  mes,
  totalPresupuesto,
  riesgosRojos,
  ocupado,
  aviso,
  confirmar,
}: Props) {
  const moneda = usarMoneda();
  return (
    <div className="paso-confirmacion">
      <h3 className="paso-confirmacion__titulo">Confirmar cierre de {mes}</h3>
      <ul className="paso-confirmacion__resumen">
        <li>Se marcará {mes} como cerrado y su registro quedará solo lectura.</li>
        <li>
          Presupuesto decidido para el mes siguiente:{' '}
          <strong>{formatoMoneda(totalPresupuesto, moneda)}</strong>.
        </li>
        <li>
          Assessment con fecha e indicadores quedará guardado y consultable.
        </li>
        <li>{riesgosRojos > 0 ? `${riesgosRojos} riesgo(s) rojo(s) prioritario(s) detectados.` : 'Sin riesgos rojos detectados.'}</li>
      </ul>
      {aviso ? (
        <p className="paso-confirmacion__aviso" role="alert">{aviso}</p>
      ) : null}
      <button
        type="button"
        className="paso-confirmacion__boton"
        disabled={ocupado}
        onClick={() => void confirmar()}
      >
        {ocupado ? 'Cerrando…' : 'Cerrar mes'}
      </button>
    </div>
  );
}
