// REQ-12-04: panel de subida múltiple de PDFs con input nativo y botón
// Analizar. Solo presentación: los bytes van al puerto como transporte.
import type { ComprobanteSubida } from '../../domain/entities/diagnostico.ts';
import '../../styles/diagnostico-subida.css';

interface Props {
  readonly seleccionados: readonly ComprobanteSubida[];
  readonly preparando: boolean;
  readonly analizando: boolean;
  readonly alElegirArchivos: (archivos: FileList | null) => void;
  readonly alAnalizar: () => void;
}

/** Subida múltiple de comprobantes PDF del mes seleccionado. */
export function DiagnosticoSubida({
  seleccionados, preparando, analizando, alElegirArchivos, alAnalizar,
}: Props) {
  const sinArchivos = seleccionados.length === 0;
  return (
    <div className="diagnostico-subida">
      <label className="diagnostico-subida__campo">
        <span className="diagnostico-subida__etiqueta">
          Extractos PDF del mes
        </span>
        <input
          type="file"
          className="diagnostico-subida__input"
          accept="application/pdf,.pdf"
          multiple
          disabled={preparando || analizando}
          onChange={(evento) => {
            alElegirArchivos(evento.target.files);
            evento.target.value = '';
          }}
        />
      </label>
      {sinArchivos ? (
        <p className="estado-vacio diagnostico-subida__vacio">
          Todavía no hay PDFs seleccionados para este mes.
        </p>
      ) : (
        <ul className="diagnostico-subida__lista">
          {seleccionados.map((archivo) => (
            <li key={archivo.nombre} className="diagnostico-subida__item">
              {archivo.nombre}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="diagnostico-subida__analizar"
        onClick={alAnalizar}
        disabled={sinArchivos || preparando || analizando}
      >
        Analizar
      </button>
      {preparando && (
        <p className="estado-carga">Preparando los archivos…</p>
      )}
    </div>
  );
}
