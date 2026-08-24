// Hook del wizard de cierre (REQ-16): carga resumen y consejos por el
// puerto IPC, gobierna los pasos del wizard y confirma el cierre
// publicando el snapshot persistido en el provider.
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import type { Recomendacion, ResumenCierre } from '../../domain/entities/cierre.ts';
import { avanzar, crearWizard, retroceder } from '../../domain/use-cases/wizard-cierre.ts';
import {
  construirPresupuesto,
  textosDesdeSugerido,
  totalPresupuesto,
} from '../../domain/use-cases/presupuesto-siguiente.ts';
import {
  erroresPorClave,
  type ErrorCampo,
} from '../../domain/use-cases/validacion-importes.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-flujo.ts';
import { cierrePort } from '../../adapters/cierre-ipc-adapter.ts';

type EstadoCarga =
  | { readonly nombre: 'cargando' }
  | { readonly nombre: 'listo'; readonly resumen: ResumenCierre }
  | { readonly nombre: 'error'; readonly motivo: string };

export function useCierreWizard(
  snapshot: FinanceSnapshot,
  aplicarSnapshot: (nuevo: FinanceSnapshot) => void,
) {
  const mes = mesDeTrabajo(snapshot);
  const [estado, setEstado] = useState<EstadoCarga>({ nombre: 'cargando' });
  const [wizard, setWizard] = useState(crearWizard());
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [consejos, setConsejos] = useState<readonly Recomendacion[]>([]);
  const [errores, setErrores] = useState<readonly ErrorCampo[]>([]);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    if (!mes) return undefined;
    let vigente = true;
    setEstado({ nombre: 'cargando' });
    Promise.all([cierrePort.resumenCierre(mes), cierrePort.consejosVigentes()])
      .then(([resumen, consejosVigentes]) => {
        if (!vigente) return;
        setEstado({ nombre: 'listo', resumen });
        setTextos(textosDesdeSugerido(resumen.presupuesto_sugerido));
        setConsejos(consejosVigentes);
      })
      .catch((error: unknown) => {
        if (vigente) {
          setEstado({ nombre: 'error', motivo: (error as Error).message });
        }
      });
    return () => { vigente = false; };
  }, [mes]);

  const alCambiarTexto = useCallback((clave: string, texto: string) => {
    setTextos((previos) => ({ ...previos, [clave]: texto }));
  }, []);

  const total = useMemo(() => totalPresupuesto(textos), [textos]);
  const continuar = useCallback(() => setWizard(avanzar), []);
  const atras = useCallback(() => setWizard(retroceder), []);

  const confirmar = useCallback(async () => {
    if (!mes || ocupado || estado.nombre !== 'listo') return;
    const resultado = construirPresupuesto(mes, textos);
    if (!resultado.ok) {
      setErrores(resultado.errores);
      setAviso('Hay importes inválidos en el presupuesto: revisa los campos marcados.');
      return;
    }
    setErrores([]);
    setOcupado(true);
    setAviso(null);
    try {
      const nuevo = await cierrePort.confirmarCierre({
        mes,
        presupuesto_siguiente: resultado.presupuesto,
      });
      aplicarSnapshot(nuevo);
    } catch (error: unknown) {
      setAviso(`No se pudo cerrar el mes: ${(error as Error).message}`);
    } finally {
      setOcupado(false);
    }
  }, [aplicarSnapshot, estado, mes, ocupado, textos]);

  return {
    mes, estado, paso: wizard.paso, continuar, atras,
    textos, alCambiarTexto, total, erroresPorClave: erroresPorClave(errores),
    consejos, ocupado, aviso, confirmar,
  };
}
