// Hook para gestionar inversiones (REQ-11-01/03/06/07).
import { useEffect, useState } from 'react';
import { useSnapshot } from '../shell/SnapshotProvider';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';
import { cargarProyeccionInversiones } from '../../domain/use-cases/cargar-proyeccion-inversiones.ts';
import type { InvestmentFamily } from '../../domain/entities/catalogs.ts';
import type { ProyeccionInversiones } from '../../domain/entities/proyeccion-inversiones.ts';
import { validarTasa, sumarAportes } from '../../domain/use-cases/inversiones-proyeccion.ts';

interface FilaTabla {
  familia: InvestmentFamily;
  aporte_mensual: number;
  valor_actual: number;
  tasa_esperada_anual: number;
}

interface UseInversionesReturn {
  readonly filas: FilaTabla[];
  readonly proyeccion: ProyeccionInversiones | null;
  readonly cargando: boolean;
  readonly error: string | null;
  readonly guardando: boolean;
  readonly confirmar: () => Promise<void>;
  readonly actualizarCampo: (
    familia: InvestmentFamily,
    campo: keyof Omit<FilaTabla, 'familia'>,
    valor: number,
  ) => void;
  readonly totalAportes: number;
}

export function useInversiones(inversionesIniciales: readonly FilaTabla[]): UseInversionesReturn {
  const [filas, setFilas] = useState<FilaTabla[]>([...inversionesIniciales]);
  const [proyeccion, setProyeccion] = useState<ProyeccionInversiones | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { aplicarSnapshot } = useSnapshot();

  useEffect(() => {
    let vigente = true;
    cargarProyeccionInversiones(snapshotPort)
      .then((p) => { if (vigente) setProyeccion(p); })
      .catch((e) => { if (vigente) setError(e.message); })
      .finally(() => { if (vigente) setCargando(false); });
    return () => { vigente = false; };
  }, []);

  const confirmar = async () => {
    for (const fila of filas) {
      const validacion = validarTasa(fila.tasa_esperada_anual);
      if (!validacion.valida) {
        setError(`${fila.familia}: ${validacion.mensaje}`);
        return;
      }
    }
    setError(null);
    setGuardando(true);
    try {
      const snapshot = await snapshotPort.load();
      const inversionesActualizadas = filas.map((f) => ({
        familia: f.familia,
        aporte_mensual: f.aporte_mensual,
        valor_actual: f.valor_actual,
        tasa_esperada_anual: f.tasa_esperada_anual,
      }));
      const nuevoSnapshot = { ...snapshot, investments: inversionesActualizadas };
      await snapshotPort.save(nuevoSnapshot);
      const p = await cargarProyeccionInversiones(snapshotPort);
      setProyeccion(p);
      aplicarSnapshot(await snapshotPort.load());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar');
    } finally {
      setGuardando(false);
    }
  };

  const actualizarCampo = (
    familia: InvestmentFamily,
    campo: keyof Omit<FilaTabla, 'familia'>,
    valor: number,
  ) => {
    setFilas((prev) =>
      prev.map((f) =>
        f.familia === familia ? { ...f, [campo]: Math.max(0, valor) } : f,
      ),
    );
    setError(null);
  };

  const totalAportes = sumarAportes(filas);

  return { filas, proyeccion, cargando, error, guardando, confirmar, actualizarCampo, totalAportes };
}