// REQ-27-05: construye el resumen del paso 5 desde los datos capturados.
// Puro y determinista: totales calculados aquí, formato monetario con el
// núcleo multi-moneda (feature 19) usando la moneda del paso 1.
import type { OnboardingData, Paso2Data } from '../../entities/onboarding/index.ts';
import type { GoalEntry } from '../../entities/goal-entry.ts';
import { ETIQUETA_MONEDA } from '../../entities/moneda.ts';
import { EXPENSE_CATEGORY_LABELS, INCOME_SOURCE_LABELS } from '../../entities/catalogs.ts';
import { formatoMoneda } from '../formato-moneda.ts';

/** Una sección del resumen: check (completo), título y líneas de detalle. */
export interface ResumenSeccion {
  readonly id: string;
  readonly titulo: string;
  readonly completo: boolean;
  readonly lineas: readonly string[];
}

const ETIQUETA_ESTRATEGIA = { Avalanche: 'Avalancha', Snowball: 'Bola de nieve' } as const;

const suma = (valores: readonly number[]): number =>
  valores.reduce((total, valor) => total + valor, 0);

function lineasBalance(p2: Paso2Data, dinero: (v: number) => string): string[] {
  const activos = suma(p2.activos.map((a) => a.valor_actual));
  const pasivos = suma(p2.pasivos.map((p) => p.saldo_pendiente));
  return [
    `Activos: ${dinero(activos)}`,
    `Pasivos: ${dinero(pasivos)}`,
    `Patrimonio: ${dinero(activos - pasivos)}`,
    `Aportes mensuales: ${dinero(suma(p2.inversiones.map((i) => i.aporte_mensual)))}`,
  ];
}

function seccionListado(
  id: string,
  titulo: string,
  claves: readonly string[] | undefined,
  etiquetas: Record<string, string>,
): ResumenSeccion {
  const lista = claves ?? [];
  return {
    id,
    titulo,
    completo: lista.length > 0,
    lineas: [`Seleccionadas: ${lista.map((c) => etiquetas[c] ?? c).join(', ') || 'ninguna'}`],
  };
}

/** Construye las 8 secciones del resumen en orden fijo. */
export function construirResumenOnboarding(
  datos: OnboardingData,
  metas: readonly GoalEntry[],
): readonly ResumenSeccion[] {
  const moneda = datos.paso1?.moneda ?? 'MXN';
  const dinero = (valor: number): string => formatoMoneda(valor, moneda);
  const p3 = datos.paso3;
  return [
    {
      id: 'personales',
      titulo: 'Datos personales',
      completo: !!datos.paso1 && datos.paso1.nombre_completo.trim().length > 0,
      lineas: [`Nombre: ${datos.paso1?.nombre_completo ?? '—'}`, `Moneda: ${ETIQUETA_MONEDA[moneda]}`],
    },
    seccionListado('fuentes', 'Fuentes de ingreso', datos.paso1?.fuentes_ingreso_activas, INCOME_SOURCE_LABELS),
    seccionListado('categorias', 'Categorías de gasto', datos.paso1?.categorias_gasto_usadas, EXPENSE_CATEGORY_LABELS),
    {
      id: 'balance',
      titulo: 'Balance inicial',
      completo: datos.paso2 !== null,
      lineas: datos.paso2 === null ? ['Sin balance inicial'] : lineasBalance(datos.paso2, dinero),
    },
    {
      id: 'deuda',
      titulo: 'Deuda',
      completo: p3 !== null,
      lineas: p3 === null ? ['Sin estrategia configurada'] : [
        `Estrategia: ${ETIQUETA_ESTRATEGIA[p3.estrategia_deuda]}`,
        `Pago extra mensual: ${dinero(p3.pago_extra_mensual)}`,
      ],
    },
    {
      id: 'proyeccion',
      titulo: 'Proyección',
      completo: (p3?.supuestos_proyeccion.length ?? 0) > 0,
      lineas: [`${p3?.supuestos_proyeccion.length ?? 0} supuestos personalizados`],
    },
    {
      id: 'indicadores',
      titulo: 'Indicadores',
      completo: datos.paso4 !== null,
      lineas: [datos.paso4 ? 'Umbrales personalizados' : 'Umbrales por defecto del semáforo'],
    },
    {
      id: 'metas',
      titulo: 'Metas',
      completo: metas.length > 0,
      lineas: [`${metas.length} ${metas.length === 1 ? 'meta en tu journal' : 'metas en tu journal'}`],
    },
  ];
}
