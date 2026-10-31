// Etiqueta legible de un mes "YYYY-MM" en español («septiembre 2026»).
const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio',
  'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
] as const;

/** «2026-09» → «septiembre 2026»; si el formato no es válido, lo devuelve tal cual. */
export function etiquetaMes(mes: string): string {
  const partes = /^(\d{4})-(\d{2})$/.exec(mes);
  if (!partes) return mes;
  const indice = Number(partes[2]) - 1;
  const nombre = MESES[indice];
  return nombre ? `${nombre} ${partes[1]}` : mes;
}

/** «2026-09» → «sep 2026», para espacios estrechos. */
export function etiquetaMesCorta(mes: string): string {
  const larga = etiquetaMes(mes);
  if (larga === mes) return mes;
  const [nombre, anio] = larga.split(' ');
  return `${nombre.slice(0, 3)} ${anio}`;
}
