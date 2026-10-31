// Tabla editable de inversiones por familia.
import { INVESTMENT_FAMILY_LABELS } from '../../domain/entities/catalogs.ts';
import type { InvestmentFamily } from '../../domain/entities/catalogs.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import type { CampoInversion, FilaEditable } from './useInversiones';

interface Props {
  readonly filas: readonly FilaEditable[];
  readonly editar: (familia: InvestmentFamily, campo: CampoInversion, texto: string) => void;
}

const COLUMNAS: readonly { readonly campo: CampoInversion; readonly titulo: (s: string) => string; readonly max?: string }[] = [
  { campo: 'aporte_mensual', titulo: (s) => `Aporte mensual (${s})` },
  { campo: 'valor_actual', titulo: (s) => `Valor actual (${s})` },
  { campo: 'tasa_esperada_anual', titulo: () => 'Rentabilidad anual (%)', max: '30' },
];

export function TablaInversiones({ filas, editar }: Props) {
  const simbolo = simboloDe(usarMoneda());
  return (
    <div className="tabla-contenedor">
      <table className="tabla inversiones-tabla">
        <thead>
          <tr>
            <th>Familia</th>
            {COLUMNAS.map((c) => <th key={c.campo} className="num">{c.titulo(simbolo)}</th>)}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => {
            const nombre = INVESTMENT_FAMILY_LABELS[fila.familia];
            return (
              <tr key={fila.familia}>
                <th scope="row">{nombre}</th>
                {COLUMNAS.map((c) => (
                  <td key={c.campo} className="num">
                    <input type="number" inputMode="decimal" step="0.01" min="0" max={c.max}
                      className="inversiones-tabla__input" value={fila[c.campo]}
                      aria-label={`${c.titulo(simbolo)} · ${nombre}`}
                      onChange={(e) => editar(fila.familia, c.campo, e.target.value)} />
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
