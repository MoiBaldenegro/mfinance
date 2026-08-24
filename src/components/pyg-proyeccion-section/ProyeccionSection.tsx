// REQ-14: sección Proyección PyG y balance futuro según supuestos
// editables. Orquestadora: guarda el borrador de supuestos, confirma
// (recalcula tablas/gráficas) o restablece a cero variación; el
// detalle vive en PanelesProyeccion y los motores en el backend.
import { useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { SupuestosProyeccion } from '../../domain/entities/pyg-proyeccion.ts';
import { usePygProyeccion } from './use-pyg-proyeccion.ts';
import { PanelesProyeccion } from './PanelesProyeccion.tsx';
import { supuestosPorDefecto } from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import '../../styles/proyeccion-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Sección Proyección: 12 meses de PyG y balance futuro por supuestos. */
export function ProyeccionSection({ snapshot }: Props) {
  // Borrador editable en el formulario; solo al confirmar se recalcula.
  const [borrador, setBorrador] = useState<SupuestosProyeccion>(supuestosPorDefecto);
  const [supuestos, setSupuestos] = useState<SupuestosProyeccion>(supuestosPorDefecto);
  // Versión del borrador: remonta el formulario al restablecer (campos limpios).
  const [versionBorrador, setVersionBorrador] = useState(0);
  const { estado } = usePygProyeccion(snapshot, supuestos);

  const confirmar = () => setSupuestos(borrador);
  const restablecer = () => {
    const cero = supuestosPorDefecto();
    setBorrador(cero);
    setSupuestos(cero);
    setVersionBorrador((v) => v + 1);
  };

  return (
    <section className="proyeccion-section">
      <h2 className="proyeccion-section__titulo">Proyección</h2>
      <p className="proyeccion-section__ayuda">
        Proyecta 12 meses de PyG y balance futuro aplicando variaciones
        porcentuales mensuales sobre cada fuente de ingreso y categoría de
        gasto, partiendo de tu histórico real.
      </p>
      <PanelesProyeccion
        estado={estado}
        borrador={borrador}
        claveFormulario={versionBorrador}
        onCambioBorrador={setBorrador}
        onConfirmar={confirmar}
        onRestablecer={restablecer}
      />
    </section>
  );
}
