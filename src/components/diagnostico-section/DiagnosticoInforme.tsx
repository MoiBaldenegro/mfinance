// REQ-12-13..17: informe por archivo del lote (estado + golden rule
// informativa). Informativo: jamás bloquea la revisión fila a fila.
import type {
  Coherencia,
  EstadoArchivo,
  ResultadoLote,
} from '../../domain/entities/diagnostico.ts';
import { resumenLote } from '../../domain/use-cases/diagnostico-informe-resumen.ts';
import '../../styles/diagnostico.css';

interface Props {
  readonly informe: ResultadoLote;
}

const CLASES_ESTADO: Record<EstadoArchivo, string> = {
  Analizado: 'badge--positivo',
  Ilegible: 'badge--aviso',
  Corrupto: 'badge--negativo',
  Fallido: 'badge--negativo',
};

const CLASES_COHERENCIA: Record<Coherencia, string> = {
  Verificada: 'badge--positivo',
  Discrepancia: 'badge--aviso',
  NoVerificable: '',
};

const ETIQUETAS_COHERENCIA: Record<Coherencia, string> = {
  Verificada: 'Saldos verificados',
  Discrepancia: 'Discrepancia de saldos',
  NoVerificable: 'Sin saldos para verificar',
};

/** Informe por archivo con badge de coherencia informativa. */
export function DiagnosticoInforme({ informe }: Props) {
  const resumen = resumenLote(informe);
  return (
    <section className="card diagnostico-informe" aria-label="Resultado del análisis">
      <h2 className="card__titulo">
        Informe del lote ({resumen.analizados}/{resumen.total} analizados)
      </h2>
      <ul className="diagnostico-informe__lista">
        {informe.archivos.map((archivo) => (
          <li key={archivo.archivo} className="diagnostico-informe__item">
            <span className={`badge ${CLASES_ESTADO[archivo.estado]}`}>
              {archivo.estado}
            </span>
            <span className="diagnostico-informe__nombre">{archivo.archivo}</span>
            <span className="diagnostico-informe__mensaje">{archivo.mensaje}</span>
            {archivo.coherencia !== null && (
              <span
                className={`badge ${CLASES_COHERENCIA[archivo.coherencia]}`}
              >
                {ETIQUETAS_COHERENCIA[archivo.coherencia]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
