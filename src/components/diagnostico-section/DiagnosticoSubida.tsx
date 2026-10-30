// REQ-12-04: panel de subida múltiple de PDFs con input nativo y botón
// Analizar. Solo presentación: los bytes van al puerto como transporte.
import type { ComprobanteSubida } from '../../domain/entities/diagnostico.ts';
import '../../styles/diagnostico.css';

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
    <section className="card diagnostico-subida" aria-label="Extractos PDF">
      <div className="card__cabecera">
        <h2 className="card__titulo">Extractos del mes</h2>
        <span className="card__descripcion">Solo PDF con texto (no escaneados)</span>
      </div>
      <label className="diagnostico-subida__zona">
        <span className="btn">Elegir PDFs…</span>
        <span className="card__descripcion">Puedes seleccionar varios archivos a la vez.</span>
        <input
          type="file"
          className="solo-lectores"
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
        <p className="card__descripcion">Todavía no hay PDFs seleccionados para este mes.</p>
      ) : (
        <ul className="diagnostico-subida__lista">
          {seleccionados.map((archivo) => (
            <li key={archivo.nombre} className="badge diagnostico-subida__item">
              {archivo.nombre}
            </li>
          ))}
        </ul>
      )}
      <button
        type="button"
        className="btn btn--primario diagnostico-subida__analizar"
        onClick={alAnalizar}
        disabled={sinArchivos || preparando || analizando}
      >
        Analizar
      </button>
      {preparando && (
        <p className="estado-carga">Preparando los archivos…</p>
      )}
    </section>
  );
}
