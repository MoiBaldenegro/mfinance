// REQ-27-03/10: hook React del journal de metas. Enlaza el caso de uso
// gestionarMetas con el adapter singleton; la lista vive aquí para que
// wizard (paso 4) y Ajustes («Mis metas») compartan el mismo flujo.
import { useCallback, useState } from 'react';
import type { EntradaMeta, GoalEntry, AvisoCampoMeta } from '../domain/entities/goal-entry.ts';
import { onboardingPort } from '../adapters/onboarding-adapter.ts';
import {
  agregarMeta,
  actualizarMeta,
  eliminarMeta,
} from '../domain/use-cases/onboarding/gestionar-metas.ts';

const puertos = { onboarding: onboardingPort };

export interface UseMetasReturn {
  readonly metas: readonly GoalEntry[];
  readonly ocupado: boolean;
  readonly aviso: string | null;
  readonly avisos: readonly AvisoCampoMeta[];
  readonly agregar: (entrada: EntradaMeta) => Promise<boolean>;
  readonly guardar: (metaId: string, entrada: EntradaMeta) => Promise<boolean>;
  readonly eliminar: (metaId: string) => Promise<void>;
}

/** Gestiona el journal del perfil dado (o del activo si es undefined). */
export function useMetas(
  perfilId: string | undefined,
  metasIniciales: readonly GoalEntry[] = [],
): UseMetasReturn {
  const [metas, setMetas] = useState<readonly GoalEntry[]>(metasIniciales);
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [avisos, setAvisos] = useState<readonly AvisoCampoMeta[]>([]);

  const ejecutar = useCallback(async (
    operacion: () => Promise<{ ok: true; meta: GoalEntry } | { ok: false; aviso?: string; avisos?: readonly AvisoCampoMeta[] }>,
  ): Promise<boolean> => {
    setOcupado(true); setAviso(null); setAvisos([]);
    const r = await operacion();
    setOcupado(false);
    if (!r.ok) {
      setAviso(r.aviso ?? 'revisa los campos marcados');
      setAvisos(r.avisos ?? []);
      return false;
    }
    setMetas((actuales) => {
      const otras = actuales.filter((m) => m.id !== r.meta.id);
      return [...otras, r.meta];
    });
    return true;
  }, []);

  const agregar = useCallback((entrada: EntradaMeta) => (
    ejecutar(() => agregarMeta(puertos, perfilId, entrada))
  ), [ejecutar, perfilId]);

  const guardar = useCallback((metaId: string, entrada: EntradaMeta) => (
    ejecutar(() => actualizarMeta(puertos, perfilId, metaId, entrada))
  ), [ejecutar, perfilId]);

  const eliminar = useCallback(async (metaId: string) => {
    setOcupado(true); setAviso(null); setAvisos([]);
    const r = await eliminarMeta(puertos, perfilId, metaId);
    setOcupado(false);
    if (!r.ok) { setAviso(r.aviso); return; }
    setMetas((actuales) => actuales.filter((m) => m.id !== metaId));
  }, [perfilId]);

  return { metas, ocupado, aviso, avisos, agregar, guardar, eliminar };
}
