// REQ-12-13..17: informe por archivo del lote (estado + golden rule
// informativa). Informativo: jamás bloquea la revisión fila a fila.
import type {
  Coherencia,
  EstadoArchivo,
  ResultadoLote,
} from '../../domain/entities/diagnostico.ts';
import { resumenLote } from '../../domain/use-cases/diagnostico-informe-resumen.ts';
import '../../styles/diagnostico-informe.css';

interface Props {
  readonly informe: ResultadoLote;
}

const CLASES_ESTADO: Record<EstadoArchivo, string> = {
  Analizado: 'diagnostico-informe__estado--ok',
  Ilegible: 'diagnostico-informe__estado--aviso',
  Corrupto: 'diagnostico-informe__estado--mal',
  Fallido: 'diagnostico-informe__estado--mal',
};

const CLASES_COHERENCIA: Record<Coherencia, string> = {
  Verificada: 'diagnostico-informe__coherencia--verificada',
  Discrepancia: 'diagnostico-informe__coherencia--discrepancia',
  NoVerificable: 'diagnostico-informe__coherencia--no-verificable',
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
    <div className="diagnostico-informe">
      <h3 className="diagnostico-informe__titulo">
        Informe del lote ({resumen.analizados}/{resumen.total} analizados)
      </h3>
      <ul className="diagnostico-informe__lista">
        {informe.archivos.map((archivo) => (
          <li key={archivo.archivo} className="diagnostico-informe__item">
            <span className={`diagnostico-informe__estado ${CLASES_ESTADO[archivo.estado]}`}>
              {archivo.estado}
            </span>
            <span className="diagnostico-informe__nombre">{archivo.archivo}</span>
            <span className="diagnostico-informe__mensaje">{archivo.mensaje}</span>
            {archivo.coherencia !== null && (
              <span
                className={`diagnostico-informe__coherencia ${CLASES_COHERENCIA[archivo.coherencia]}`}
              >
                {ETIQUETAS_COHERENCIA[archivo.coherencia]}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
