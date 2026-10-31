// REQ-26-01: Sección Proyección — tabla de supuestos (% de variación) y
// botón restablecer. Cada campo conserva el texto libre mientras se
// escribe (permite «-», «2.» o borrar) y solo se normaliza al salir.
import { useState } from 'react';
import { formatearVariacion, parsearVariacion } from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import type { Paso3Data, SupuestoProyeccion } from '../../domain/entities/onboarding/index.ts';
import '../../styles/onboarding-proyeccion.css';

export interface VariableProyeccion {
  readonly id: string;
  readonly etiqueta: string;
  readonly tipo: 'ingreso' | 'gasto' | 'balance';
}

const TIPO = { ingreso: ['Ingreso', 'badge--positivo'], gasto: ['Gasto', 'badge--negativo'], balance: ['Balance', 'badge--info'] } as const;

interface Props {
  readonly paso3: Paso3Data;
  readonly alCambiar: (paso3: Paso3Data) => void;
  readonly variables: readonly VariableProyeccion[];
  readonly deshabilitado: boolean;
}

function obtenerSupuesto(supuestos: readonly SupuestoProyeccion[], id: string): number {
  return supuestos.find((s) => s.variable === id)?.porcentaje ?? 0;
}

function actualizarSupuesto(supuestos: readonly SupuestoProyeccion[], id: string, valor: number): SupuestoProyeccion[] {
  const nuevo: SupuestoProyeccion = { variable: id, porcentaje: Math.max(-0.5, Math.min(1, valor)) };
  return supuestos.some((s) => s.variable === id)
    ? supuestos.map((s) => (s.variable === id ? nuevo : s))
    : [...supuestos, nuevo];
}

export function ProyeccionSection({ paso3, alCambiar, variables, deshabilitado }: Props) {
  // La clave fuerza a remontar los campos tras «Restablecer» para que
  // muestren el nuevo valor normalizado.
  const [version, setVersion] = useState(0);
  const cambiar = (id: string, valor: number) =>
    alCambiar({ ...paso3, supuestos_proyeccion: actualizarSupuesto(paso3.supuestos_proyeccion, id, valor) });
  const restablecer = () => {
    alCambiar({ ...paso3, supuestos_proyeccion: variables.map((v) => ({ variable: v.id, porcentaje: 0 })) });
    setVersion((n) => n + 1);
  };

  return (
    <section className="ob-proyeccion" aria-labelledby="ob-proyeccion-titulo">
      <div className="ob-proyeccion__cabecera">
        <div>
          <h3 id="ob-proyeccion-titulo" className="ob-proyeccion__subtitulo">Supuestos de proyección</h3>
          <p className="campo__ayuda">Variación mensual esperada, de −50% a +100%. 0% mantiene la tendencia actual.</p>
        </div>
        <button type="button" className="btn btn--fantasma btn--sm" onClick={restablecer} disabled={deshabilitado}>
          Restablecer a 0%
        </button>
      </div>
      <div className="tabla-contenedor">
        <table className="tabla">
          <thead>
            <tr><th>Variable</th><th>Tipo</th><th className="num">Variación</th></tr>
          </thead>
          <tbody>
            {variables.map((v) => (
              <tr key={`${v.id}-${version}`}>
                <td>{v.etiqueta}</td>
                <td><span className={`badge ${TIPO[v.tipo][1]}`}>{TIPO[v.tipo][0]}</span></td>
                <td className="num">
                  <CampoPorcentaje etiqueta={v.etiqueta} valor={obtenerSupuesto(paso3.supuestos_proyeccion, v.id)}
                    alCambiar={(n) => cambiar(v.id, n)} deshabilitado={deshabilitado} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CampoPorcentaje({ etiqueta, valor, alCambiar, deshabilitado }: {
  readonly etiqueta: string; readonly valor: number;
  readonly alCambiar: (n: number) => void; readonly deshabilitado: boolean;
}) {
  const [texto, setTexto] = useState(() => formatearVariacion(valor));
  return (
    <input type="text" inputMode="decimal" className="ob-proyeccion__input" value={texto}
      aria-label={`Variación ${etiqueta}`} disabled={deshabilitado} placeholder="+0.0%"
      onChange={(e) => { setTexto(e.target.value); alCambiar(parsearVariacion(e.target.value)); }}
      onBlur={() => setTexto(formatearVariacion(Math.max(-0.5, Math.min(1, parsearVariacion(texto)))))} />
  );
}
