// REQ-06-01: navegación de meses para el selector ‹ › del formulario,
// con validación de claves y derivación del mes actual en formato local.
import { parseMonthKey } from '../entities/month-key.ts';
import type { MonthKey } from '../entities/month-key.ts';

function desplazar(mes: MonthKey, salto: number): MonthKey {
  const clave = parseMonthKey(mes);
  const [anioTexto, mesTexto] = clave.split('-');
  const indice = Number(anioTexto) * 12 + (Number(mesTexto) - 1) + salto;
  const anio = Math.floor(indice / 12);
  const mesNuevo = String((indice % 12) + 1).padStart(2, '0');
  return `${String(anio).padStart(4, '0')}-${mesNuevo}`;
}

/** Mes siguiente al dado; cruza de año sin sorpresas. */
export function mesSiguiente(mes: MonthKey): MonthKey {
  return desplazar(mes, 1);
}

/** Mes anterior al dado; cruza de año sin sorpresas. */
export function mesAnterior(mes: MonthKey): MonthKey {
  return desplazar(mes, -1);
}

/** Mes (YYYY-MM) de una fecha local, para abrir el último mes vivo. */
export function mesActualDesde(fecha: Date): MonthKey {
  const anio = String(fecha.getFullYear()).padStart(4, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${anio}-${mes}`;
}
