// REQ-14-03/06: formulario de supuestos editables (variación % mensual
// por fuente de ingreso y por categoría de gasto). Componente controlado:
// cada cambio actualiza el borrador del padre; solo al confirmar se
// recalcula la proyección (design.md: no en vivo mientras se escribe).
import type { SupuestosProyeccion } from '../../domain/entities/pyg-proyeccion.ts';
import {
  aplicarSupuestos,
  clavesGastos,
  clavesIngresos,
  etiquetaGasto,
  etiquetaIngreso,
} from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import { CampoVariacion } from './CampoVariacion.tsx';
import '../../styles/formulario-supuestos.css';

interface Props {
  /** Borrador vigente de supuestos, propiedad del padre. */
  readonly supuestos: SupuestosProyeccion;
  /** Notifica el borrador actualizado (sin recalcular todavía). */
  readonly onCambio: (borrador: SupuestosProyeccion) => void;
}

/** Un grupo de campos (Ingresos o Gastos) sobre claves canónicas. */
function Grupo({
  titulo,
  tipo,
  claves,
  etiquetaDe,
  supuestos,
  onCambio,
}: {
  readonly titulo: string;
  readonly tipo: 'ingreso' | 'gasto';
  readonly claves: readonly string[];
  readonly etiquetaDe: (clave: string) => string;
  readonly supuestos: SupuestosProyeccion;
  readonly onCambio: Props['onCambio'];
}) {
  return (
    <fieldset className="formulario-supuestos__grupo">
      <legend className="formulario-supuestos__leyenda">{titulo}</legend>
      <div className="formulario-supuestos__grid">
        {claves.map((clave) => (
          <CampoVariacion
            key={clave}
            etiqueta={etiquetaDe(clave)}
            valor={(tipo === 'ingreso'
              ? supuestos.variacionIngresos[clave]
              : supuestos.variacionGastos[clave]) ?? 0}
            onCambio={(v) => onCambio(aplicarSupuestos(supuestos, tipo, clave, v))}
          />
        ))}
      </div>
    </fieldset>
  );
}

/** Formulario de supuestos de variación mensual para la proyección. */
export function FormularioSupuestos({ supuestos, onCambio }: Props) {
  return (
    <div className="formulario-supuestos">
      <Grupo
        titulo="Ingresos"
        tipo="ingreso"
        claves={clavesIngresos()}
        etiquetaDe={etiquetaIngreso}
        supuestos={supuestos}
        onCambio={onCambio}
      />
      <Grupo
        titulo="Gastos"
        tipo="gasto"
        claves={clavesGastos()}
        etiquetaDe={etiquetaGasto}
        supuestos={supuestos}
        onCambio={onCambio}
      />
      <p className="formulario-supuestos__ayuda">
        Variación % aplicada cada mes. Positivo = crecimiento, negativo =
        decrecimiento. Vacío o 0% = continuación plana del último mes real.
        Pulsa Confirmar para recalcular tablas y gráficas.
      </p>
    </div>
  );
}
