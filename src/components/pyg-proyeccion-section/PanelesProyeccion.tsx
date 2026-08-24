// REQ-14-03/04/05: paneles de la vista de proyección: tarjeta de
// supuestos (editar → confirmar → refresca), tarjetas de resultados
// PyG y balance futuro, y mensaje en español si no hay histórico.
import type { SupuestosProyeccion } from '../../domain/entities/pyg-proyeccion.ts';
import type { EstadoProyeccion } from './use-pyg-proyeccion.ts';
import {
  filasDeTablaBalanceFuturo,
  balanceFuturoVacio,
} from '../../domain/use-cases/balance-futuro-tabla.ts';
import {
  filasDeTablaProyeccion,
  serieProyeccionVacia,
  MENSAJE_SIN_HISTORICO,
} from '../../domain/use-cases/pyg-proyeccion-tabla.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { BalanceFuturoChart } from './BalanceFuturoChart.tsx';
import { FormularioSupuestos } from './FormularioSupuestos.tsx';
import { ProyeccionChart } from './ProyeccionChart.tsx';
import { TablaBalanceFuturo } from './TablaBalanceFuturo.tsx';
import { TablaProyeccion } from './TablaProyeccion.tsx';
import '../../styles/proyeccion-section.css';

interface Props {
  readonly estado: EstadoProyeccion;
  readonly borrador: SupuestosProyeccion;
  /** Cambia al restablecer para remontar el formulario con campos limpios. */
  readonly claveFormulario: number;
  readonly onCambioBorrador: (borrador: SupuestosProyeccion) => void;
  readonly onConfirmar: () => void;
  readonly onRestablecer: () => void;
}

/** Tarjeta de supuestos con las acciones confirmar y restablecer. */
function TarjetaSupuestos({ borrador, claveFormulario, onCambioBorrador, onConfirmar, onRestablecer }: Props) {
  return (
    <section className="proyeccion-section__tarjeta" aria-label="Supuestos de proyección">
      <h3 className="proyeccion-section__subtitulo">Supuestos de variación mensual</h3>
      <FormularioSupuestos key={claveFormulario} supuestos={borrador} onCambio={onCambioBorrador} />
      <div className="formulario-supuestos__acciones">
        <button
          className="proyeccion-section__boton-reset"
          onClick={onRestablecer}
          aria-label="Restablecer supuestos a cero variación"
        >
          Restablecer a cero
        </button>
        <button
          className="formulario-supuestos__boton"
          onClick={onConfirmar}
          aria-label="Confirmar supuestos y recalcular la proyección"
        >
          Confirmar supuestos
        </button>
      </div>
    </section>
  );
}

/** Paneles completos de la sección según el estado de la proyección. */
export function PanelesProyeccion(props: Props) {
  const moneda = usarMoneda();
  const { estado } = props;
  if (estado.nombre === 'calculando') {
    return <p className="proyeccion-section__aviso">Calculando la proyección…</p>;
  }
  if (estado.nombre === 'error') {
    return (
      <p className="proyeccion-section__aviso" role="alert">
        No se pudo calcular la proyección: {estado.motivo}
      </p>
    );
  }
  const { proyeccion, balance } = estado;
  const sinHistorico = serieProyeccionVacia(proyeccion);
  return (
    <div className="proyeccion-section__paneles">
      {sinHistorico && (
        <p className="proyeccion-section__aviso">{MENSAJE_SIN_HISTORICO}</p>
      )}
      <TarjetaSupuestos {...props} />
      {!sinHistorico && (
        <section className="proyeccion-section__tarjeta" aria-label="Proyección PyG">
          <h3 className="proyeccion-section__subtitulo">Proyección PyG (12 meses)</h3>
          <TablaProyeccion filas={filasDeTablaProyeccion(proyeccion, moneda)} />
          <ProyeccionChart proyeccion={proyeccion} />
        </section>
      )}
      {!balanceFuturoVacio(balance) && (
        <section className="proyeccion-section__tarjeta" aria-label="Balance futuro">
          <h3 className="proyeccion-section__subtitulo">
            Balance futuro: patrimonio proyectado
          </h3>
          <TablaBalanceFuturo filas={filasDeTablaBalanceFuturo(balance, moneda)} />
          <BalanceFuturoChart balance={balance} />
        </section>
      )}
    </div>
  );
}
