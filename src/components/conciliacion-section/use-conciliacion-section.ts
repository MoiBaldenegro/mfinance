// REQ-13-01..07: hooks para conciliación — extrae lógica de ConciliacionSection.
import { useEffect, useState, useCallback } from 'react';
import type { Movement } from '../../domain/entities/account-statement.ts';
import type { ConciliacionMensual } from '../../domain/entities/conciliacion-mensual.ts';
import { useConciliacion, useHistoricoConciliacion, useAgregarMovimientoConciliacion } from '../../hooks/use-conciliacion.ts';
import { todasConciliadas } from '../../domain/use-cases/conciliacion-logic.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';

interface UseConciliacionSectionReturn {
  mesSeleccionado: string;
  setMesSeleccionado: (mes: string) => void;
  mostrarHistorico: boolean;
  setMostrarHistorico: (mostrar: boolean) => void;
  estadoConciliacion: ReturnType<typeof useConciliacion>['estado'];
  recargarConciliacion: ReturnType<typeof useConciliacion>['recargar'];
  estadoHistorico: ReturnType<typeof useHistoricoConciliacion>['estado'];
  recargarHistorico: ReturnType<typeof useHistoricoConciliacion>['recargar'];
  agregarMovimiento: (e: React.FormEvent<HTMLFormElement>, cuenta: string) => void;
  guardando: boolean;
  errorAgregar: string | null;
  todasConciliadas: boolean;
  conciliacion: ConciliacionMensual;
}

export function useConciliacionSection(): UseConciliacionSectionReturn {
  const { aplicarSnapshot } = useSnapshot();
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(() => {
    const hoy = new Date();
    return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  });
  const [mostrarHistorico, setMostrarHistorico] = useState(false);

  const { estado, recargar: recargarConciliacion } = useConciliacion(mesSeleccionado);
  const { estado: estadoHistorico, recargar: recargarHistorico } = useHistoricoConciliacion();
  const { agregar, guardando, error: errorAgregar } = useAgregarMovimientoConciliacion(
    mesSeleccionado,
    (nuevoSnapshot) => aplicarSnapshot(nuevoSnapshot),
  );

  useEffect(() => { recargarConciliacion(); }, [mesSeleccionado, recargarConciliacion]);
  useEffect(() => { if (mostrarHistorico) recargarHistorico(); }, [mostrarHistorico, recargarHistorico]);

  const conciliacion: ConciliacionMensual = estado.nombre === 'listo'
    ? estado.conciliacion
    : { mes: '', cuentas: [], todas_conciliadas: true };
  const todasOk = todasConciliadas(conciliacion);

  const handleAgregarMovimiento = useCallback((
    e: React.FormEvent<HTMLFormElement>,
    cuenta: string,
  ) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fecha = (form.elements.namedItem('fecha') as HTMLInputElement).value;
    const concepto = (form.elements.namedItem('concepto') as HTMLInputElement).value;
    const importe = parseFloat((form.elements.namedItem('importe') as HTMLInputElement).value);
    const movimiento: Movement = { fecha, concepto, importe };
    agregar(cuenta, movimiento);
    form.reset();
  }, [agregar]);

  return {
    mesSeleccionado,
    setMesSeleccionado,
    mostrarHistorico,
    setMostrarHistorico,
    estadoConciliacion: estado,
    recargarConciliacion,
    estadoHistorico,
    recargarHistorico,
    agregarMovimiento: handleAgregarMovimiento,
    guardando,
    errorAgregar,
    todasConciliadas: todasOk,
    conciliacion,
  };
}