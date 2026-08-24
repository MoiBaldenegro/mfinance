// REQ-26-01: Sección Proyección — tabla supuestos + botón restablecer (≤100 líneas)
import { formatearVariacion, parsearVariacion } from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import type { Paso3Data, SupuestoProyeccion } from '../../domain/entities/onboarding/index.ts';
import '../../styles/proyeccion-section.css';

interface Props {
  readonly paso3: Paso3Data;
  readonly alCambiar: (paso3: Paso3Data) => void;
  readonly variables: readonly { id: string; etiqueta: string; tipo: 'ingreso' | 'gasto' | 'balance' }[];
  readonly deshabilitado: boolean;
}

function obtenerSupuesto(supuestos: readonly SupuestoProyeccion[], id: string): number {
  return supuestos.find((s) => s.variable === id)?.porcentaje ?? 0;
}

function actualizarSupuesto(supuestos: readonly SupuestoProyeccion[], id: string, valor: number): SupuestoProyeccion[] {
  const clamp = Math.max(-0.5, Math.min(1, valor));
  const idx = supuestos.findIndex((s) => s.variable === id);
  const nuevo: SupuestoProyeccion = { variable: id, porcentaje: clamp };
  if (idx >= 0) return supuestos.map((s, i) => (i === idx ? nuevo : s));
  return [...supuestos, nuevo];
}

export function ProyeccionSection({ paso3, alCambiar, variables, deshabilitado }: Props) {
  const manejarCambio = (id: string, valor: string) => {
    const variacion = parsearVariacion(valor);
    const nuevos = actualizarSupuesto(paso3.supuestos_proyeccion, id, variacion);
    alCambiar({ ...paso3, supuestos_proyeccion: nuevos });
  };

  const manejarRestablecer = () => {
    const supuestosCero = variables.map((v) => ({ variable: v.id, porcentaje: 0 }));
    alCambiar({ ...paso3, supuestos_proyeccion: supuestosCero });
  };

  return (
    <section className="proyeccion-section">
      <h4 className="proyeccion-section__subtitulo">Supuestos de proyección (% variación mensual)</h4>
      <p className="proyeccion-section__ayuda">Rango: -50% a +100%. 0% = continuación plana.</p>
      <div className="proyeccion-section__tabla-wrap">
        <table className="proyeccion-section__tabla">
          <thead>
            <tr>
              <th>Variable</th>
              <th>% Variación</th>
            </tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <tr key={v.id}>
                <td>{v.etiqueta}</td>
                <td>
                  <input
                    type="text"
                    value={formatearVariacion(obtenerSupuesto(paso3.supuestos_proyeccion, v.id))}
                    onChange={(e) => manejarCambio(v.id, e.target.value)}
                    disabled={deshabilitado}
                    className="proyeccion-section__input"
                    aria-label={`Variación ${v.etiqueta}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button type="button" className="proyeccion-section__btn-restablecer" onClick={manejarRestablecer} disabled={deshabilitado}>
        Restablecer a 0%
      </button>
    </section>
  );
}