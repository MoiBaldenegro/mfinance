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
import { VistaGraficaTabla } from '../ui/VistaGraficaTabla.tsx';

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
    <section className="card" aria-label="Supuestos de proyección">
      <div className="card__cabecera">
        <h3 className="card__titulo">Supuestos de variación mensual</h3>
        <div className="pagina__acciones">
        <button
          type="button"
          className="btn btn--fantasma"
          onClick={onRestablecer}
          aria-label="Restablecer supuestos a cero variación"
        >
          Restablecer a cero
        </button>
        <button
          type="button"
          className="btn btn--primario"
          onClick={onConfirmar}
          aria-label="Confirmar supuestos y recalcular la proyección"
        >
          Recalcular
        </button>
        </div>
      </div>
      <FormularioSupuestos key={claveFormulario} supuestos={borrador} onCambio={onCambioBorrador} />
    </section>
  );
}

/** Paneles completos de la sección según el estado de la proyección. */
export function PanelesProyeccion(props: Props) {
  const moneda = usarMoneda();
  const { estado } = props;
  if (estado.nombre === 'calculando') {
    return <p className="estado-carga">Calculando la proyección…</p>;
  }
  if (estado.nombre === 'error') {
    return (
      <p className="aviso aviso--error" role="alert">
        No se pudo calcular la proyección: {estado.motivo}
      </p>
    );
  }
  const { proyeccion, balance } = estado;
  const sinHistorico = serieProyeccionVacia(proyeccion);
  return (
    <div className="rejilla">
      {sinHistorico && (
        <p className="estado-vacio">{MENSAJE_SIN_HISTORICO}</p>
      )}
      <TarjetaSupuestos {...props} />
      {!sinHistorico && (
        <VistaGraficaTabla titulo="PyG proyectado" grafica={<ProyeccionChart proyeccion={proyeccion} />}
          tabla={<TablaProyeccion filas={filasDeTablaProyeccion(proyeccion, moneda)} />} />
      )}
      {!balanceFuturoVacio(balance) && (
        <VistaGraficaTabla titulo="Patrimonio proyectado" grafica={<BalanceFuturoChart balance={balance} />}
          tabla={<TablaBalanceFuturo filas={filasDeTablaBalanceFuturo(balance, moneda)} />} />
      )}
    </div>
  );
}
