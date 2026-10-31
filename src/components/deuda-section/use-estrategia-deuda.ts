// Estrategia de deuda y pago extra: se guardan en el snapshot y el
// snapshot resultante se publica, de modo que el plan se recalcula y la
// UI nunca vuelve al valor anterior. El pago extra se edita como texto y
// solo se guarda al confirmarlo (blur/Enter), no en cada tecla.
import { useState } from 'react';
import { usarPuertos } from '../../app/puertos.ts';
import type { DebtStrategy } from '../../domain/entities/catalogs.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';

export function useEstrategiaDeuda(snapshot: FinanceSnapshot) {
  const { snapshot: snapshotPort } = usarPuertos();
  const { aplicarSnapshot } = useSnapshot();
  const { debt_strategy: estrategia, extra_monthly_payment: extra } = snapshot.strategy;
  const [textoExtra, setTextoExtra] = useState(String(extra));
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async (cambios: Partial<FinanceSnapshot['strategy']>) => {
    const nuevo = { ...snapshot, strategy: { ...snapshot.strategy, ...cambios } };
    setGuardando(true);
    setError(null);
    try {
      await snapshotPort.save(nuevo);
      aplicarSnapshot(nuevo);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar la estrategia');
    } finally {
      setGuardando(false);
    }
  };

  const confirmarExtra = () => {
    const valor = Math.max(0, Number(textoExtra.replace(',', '.')) || 0);
    setTextoExtra(String(valor));
    if (valor !== extra) void guardar({ extra_monthly_payment: valor });
  };

  return {
    estrategia,
    textoExtra,
    guardando,
    error,
    cambiarEstrategia: (nueva: DebtStrategy) => {
      if (nueva !== estrategia) void guardar({ debt_strategy: nueva });
    },
    editarExtra: setTextoExtra,
    confirmarExtra,
  };
}
