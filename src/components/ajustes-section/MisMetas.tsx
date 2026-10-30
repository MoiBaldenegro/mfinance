// REQ-27-10: sub-sección «Mis metas» de Ajustes. Reutiliza la MISMA
// MetasJournalSection del wizard (mismo puerto, caso de uso y adapter)
// sobre el perfil activo post-onboarding; persiste en goals_journal.
import type { GoalEntry } from '../../domain/entities/goal-entry.ts';
import { usarPerfiles } from '../../hooks/use-perfil.ts';
import { MetasJournalSection } from '../onboarding/MetasJournalSection.tsx';

/** Journal editable del titular activo dentro de Ajustes. */
export function MisMetas() {
  const { activo } = usarPerfiles();
  if (!activo) return null;
  const metasIniciales: readonly GoalEntry[] = activo.goals_journal ?? [];
  return (
    <section className="card" aria-label="Mis metas">
      <MetasJournalSection key={activo.id} perfilId={activo.id} metasIniciales={metasIniciales} />
    </section>
  );
}
