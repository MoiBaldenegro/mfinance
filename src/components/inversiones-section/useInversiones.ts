// Hook de Inversiones: edición por familia como TEXTO (permite decimales
// y campos vacíos mientras se escribe), validación al guardar, guardado
// en el snapshot publicado y recarga de la proyección.
import { useEffect, useMemo, useState } from 'react';
import { useSnapshot } from '../shell/SnapshotProvider';
import { usarPuertos } from '../../app/puertos.ts';
import { cargarProyeccionInversiones } from '../../domain/use-cases/cargar-proyeccion-inversiones.ts';
import { INVESTMENT_FAMILY_LABELS } from '../../domain/entities/catalogs.ts';
import type { InvestmentFamily } from '../../domain/entities/catalogs.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { ProyeccionInversiones } from '../../domain/entities/proyeccion-inversiones.ts';
import { importeDeTexto, validarTasa } from '../../domain/use-cases/inversiones-proyeccion.ts';

export const FAMILIAS: readonly InvestmentFamily[] = ['RentaFija', 'RentaVariable', 'FincaRaiz'];
export type CampoInversion = 'aporte_mensual' | 'valor_actual' | 'tasa_esperada_anual';
export type FilaEditable = { readonly familia: InvestmentFamily } & Readonly<Record<CampoInversion, string>>;

function filasDesde(snapshot: FinanceSnapshot): FilaEditable[] {
  return FAMILIAS.map((familia) => {
    const inv = snapshot.investments.find((i) => i.familia === familia);
    return {
      familia,
      aporte_mensual: String(inv?.aporte_mensual ?? 0),
      valor_actual: String(inv?.valor_actual ?? 0),
      tasa_esperada_anual: String(inv?.tasa_esperada_anual ?? 0),
    };
  });
}

const aNumeros = (f: FilaEditable) => ({
  familia: f.familia,
  aporte_mensual: importeDeTexto(f.aporte_mensual),
  valor_actual: importeDeTexto(f.valor_actual),
  tasa_esperada_anual: importeDeTexto(f.tasa_esperada_anual),
});

export function useInversiones(snapshot: FinanceSnapshot) {
  const { snapshot: snapshotPort } = usarPuertos();
  const { aplicarSnapshot } = useSnapshot();
  const [filas, setFilas] = useState<FilaEditable[]>(() => filasDesde(snapshot));
  const [proyeccion, setProyeccion] = useState<ProyeccionInversiones | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [cambios, setCambios] = useState(false);

  useEffect(() => {
    let vigente = true;
    cargarProyeccionInversiones(snapshotPort)
      .then((p) => { if (vigente) setProyeccion(p); })
      .catch((e: unknown) => { if (vigente) setError(e instanceof Error ? e.message : 'No se pudo calcular la proyección'); });
    return () => { vigente = false; };
  }, [snapshot]);

  const numericas = useMemo(() => filas.map(aNumeros), [filas]);

  const guardar = async () => {
    const invalida = numericas.find((f) => !validarTasa(f.tasa_esperada_anual).valida);
    if (invalida) {
      setError(`${INVESTMENT_FAMILY_LABELS[invalida.familia]}: ${validarTasa(invalida.tasa_esperada_anual).mensaje}`);
      return;
    }
    setError(null);
    setGuardando(true);
    try {
      const nuevo = { ...snapshot, investments: numericas };
      await snapshotPort.save(nuevo);
      aplicarSnapshot(nuevo);
      setCambios(false);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudieron guardar las inversiones');
    } finally {
      setGuardando(false);
    }
  };

  const editar = (familia: InvestmentFamily, campo: CampoInversion, texto: string) => {
    setFilas((prev) => prev.map((f) => (f.familia === familia ? { ...f, [campo]: texto } : f)));
    setCambios(true);
    setError(null);
  };

  return { filas, numericas, proyeccion, error, guardando, cambios, guardar, editar };
}
