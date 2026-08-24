// Hook de la sección Registro (REQ-06): estado local del borrador del
// mes, subtotales en vivo y confirmación vía caso de uso → puerto IPC.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { EXPENSE_CATEGORIES, INCOME_SOURCES } from '../../domain/entities/catalogs.ts';
import { parseMonthKey } from '../../domain/entities/month-key.ts';
import {
  avisoGlobal, erroresPorClave, numeroSeguro, type ErrorCampo,
} from '../../domain/use-cases/validacion-importes.ts';
import { buscarRegistroMes } from '../../domain/use-cases/upsert-registro.ts';
import {
  CLAVE_ERROR_GUARDADO, guardarRegistroMes,
} from '../../domain/use-cases/guardar-registro.ts';
import { textosDelMes, type Textos } from '../../domain/use-cases/textos-registro.ts';
import { mesActualDesde } from '../../domain/use-cases/navegacion-meses.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-flujo.ts';
import { snapshotPort } from '../../adapters/snapshot-ipc-adapter.ts';

const CLAVES_GLOBALES = [CLAVE_ERROR_GUARDADO, 'mes'] as const;

export function useRegistroMensual(
  snapshot: FinanceSnapshot,
  aplicarSnapshot: (snapshot: FinanceSnapshot) => void,
) {
  const [mes, setMes] = useState(
    () => mesDeTrabajo(snapshot) ?? mesActualDesde(new Date()),
  );
  const [ingresos, setIngresos] = useState<Textos>({});
  const [gastos, setGastos] = useState<Textos>({});
  const [errores, setErrores] = useState<ReadonlyArray<ErrorCampo>>([]);
  const [ocupado, setOcupado] = useState(false);

  // REQ-06-08: al elegir un mes el formulario abre con sus datos o a ceros.
  useEffect(() => {
    const textos = textosDelMes(buscarRegistroMes(snapshot, mes));
    setIngresos(textos.ingresos);
    setGastos(textos.gastos);
    setErrores([]);
  }, [mes, snapshot]);

  const alCambiarMes = useCallback((nuevo: string) => {
    try {
      parseMonthKey(nuevo);
      setMes(nuevo);
    } catch {
      // El selector solo emite claves válidas o cadenas vacías.
    }
  }, []);

  const cambiarImporte =
    (mapa: 'ingresos' | 'gastos', prefijo: string) =>
    (clave: string, texto: string) => {
      const fijar = mapa === 'ingresos' ? setIngresos : setGastos;
      fijar((previos) => ({ ...previos, [clave]: texto }));
      setErrores((previos) =>
        previos.filter((error) => error.clave !== `${prefijo}:${clave}`),
      );
    };

  const alCambiarIngreso = useMemo(() => cambiarImporte('ingresos', 'ingreso'), []);
  const alCambiarGasto = useMemo(() => cambiarImporte('gastos', 'gasto'), []);

  // REQ-06-05: subtotales EN VIVO recalculados con cada pulsación.
  const totales = useMemo(() => {
    const suma = (textos: Textos, claves: readonly string[]) =>
      claves.reduce((total, clave) => total + numeroSeguro(textos[clave] ?? ''), 0);
    const totalIngresos = suma(ingresos, INCOME_SOURCES);
    const totalGastos = suma(gastos, EXPENSE_CATEGORIES);
    return {
      ingresos: totalIngresos,
      gastos: totalGastos,
      utilidad: totalIngresos - totalGastos,
    };
  }, [gastos, ingresos]);

  // REQ-06-04/07: persiste por IPC; el botón queda ocupado mientras tanto.
  const confirmar = useCallback(async () => {
    if (ocupado) return;
    setOcupado(true);
    const borrador = { mes, ingresos, gastos };
    const resultado = await guardarRegistroMes(snapshotPort, snapshot, borrador);
    setOcupado(false);
    if (resultado.ok) aplicarSnapshot(resultado.snapshot);
    else setErrores(resultado.errores);
  }, [aplicarSnapshot, gastos, ingresos, mes, ocupado, snapshot]);

  return {
    mes,
    alCambiarMes,
    ingresos,
    gastos,
    alCambiarIngreso,
    alCambiarGasto,
    totales,
    erroresPorClave: erroresPorClave(errores),
    aviso: avisoGlobal(errores, [...CLAVES_GLOBALES]),
    ocupado,
    confirmar,
  };
}
