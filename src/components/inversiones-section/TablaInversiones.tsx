// Tabla de inversiones editable (REQ-11-01).
import type { InvestmentFamily } from '../../domain/entities/catalogs.ts';
import { INVESTMENT_FAMILY_LABELS } from '../../domain/entities/catalogs.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/inversiones-tabla.css';

interface FilaTabla {
  readonly familia: InvestmentFamily;
  readonly aporte_mensual: number;
  readonly valor_actual: number;
  readonly tasa_esperada_anual: number;
}

interface Props {
  readonly filas: readonly FilaTabla[];
  readonly actualizarCampo: (
    familia: InvestmentFamily,
    campo: keyof Omit<FilaTabla, 'familia'>,
    valor: number,
  ) => void;
  readonly error: string | null;
}

export function TablaInversiones({ filas, actualizarCampo, error }: Props) {
  const simbolo = simboloDe(usarMoneda());
  return (
    <div className="inversiones-tabla-wrap">
      <table className="inversiones-tabla">
        <thead>
          <tr>
            <th>Familia</th>
            <th>Aporte mensual ({simbolo})</th>
            <th>Valor actual ({simbolo})</th>
            <th>Tasa esperada (% anual)</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={fila.familia}>
              <td className="inversiones-tabla__familia">{INVESTMENT_FAMILY_LABELS[fila.familia]}</td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fila.aporte_mensual}
                  onChange={(e) => actualizarCampo(fila.familia, 'aporte_mensual', parseFloat(e.target.value) || 0)}
                  className="inversiones-tabla__input"
                  aria-label={`Aporte mensual ${fila.familia}`}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fila.valor_actual}
                  onChange={(e) => actualizarCampo(fila.familia, 'valor_actual', parseFloat(e.target.value) || 0)}
                  className="inversiones-tabla__input"
                  aria-label={`Valor actual ${fila.familia}`}
                />
              </td>
              <td>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="30"
                  value={fila.tasa_esperada_anual}
                  onChange={(e) => actualizarCampo(fila.familia, 'tasa_esperada_anual', parseFloat(e.target.value) || 0)}
                  className="inversiones-tabla__input"
                  aria-label={`Tasa esperada ${fila.familia}`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {error && (
        <div className="inversiones-tabla__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}