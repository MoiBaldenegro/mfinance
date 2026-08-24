// REQ-27-02: lógica del paso 4 — umbrales de indicadores con validación
// cruzada y restauración de defectos. Puro: sin framework ni IPC.
// Sentido de la validación (coherente con el layout de design.md y con
// que los defaults deban ser válidos): endeudamiento exige
// verde < rojo; ahorro, fondo e ingreso pasivo exigen verde > rojo.
import type { OnboardingData, Paso4Data, UmbralesIndicadores } from '../../entities/onboarding/index.ts';

/** Indicador afectado por un aviso de coherencia. */
export type IndicadorUmbral = 'endeudamiento' | 'ahorro' | 'fondo_emergencia' | 'ingreso_pasivo';

/** Aviso ligado a un indicador, en español. */
export interface AvisoUmbral {
  readonly campo: IndicadorUmbral;
  readonly mensaje: string;
}

/** Defaults idénticos a las constantes del semáforo (feature 10). */
export function umbralesPorDefecto(): UmbralesIndicadores {
  return {
    endeudamiento_verde: 15, endeudamiento_rojo: 30,
    ahorro_verde: 15, ahorro_rojo: 5,
    fondo_verde: 3, fondo_rojo: 1,
    ingreso_pasivo_verde: 100, ingreso_pasivo_amarillo: 25,
  };
}

/** Botón «Restaurar valores por defecto»: nueva instancia limpia. */
export function restaurarUmbralesDefecto(): UmbralesIndicadores {
  return umbralesPorDefecto();
}

/** Actualiza el paso 4 completo en los datos del onboarding. */
export function actualizarPaso4(datos: OnboardingData, paso4: Paso4Data): OnboardingData {
  return { ...datos, paso4 };
}

/** Cambia un umbral concreto sin mutar el resto (inmutabilidad). */
export function cambiarUmbral(
  paso4: Paso4Data,
  campo: keyof UmbralesIndicadores,
  valor: number | null,
): Paso4Data {
  return { ...paso4, umbrales: { ...paso4.umbrales, [campo]: valor } };
}

function avisoSiIncoherente(
  avisos: AvisoUmbral[],
  campo: IndicadorUmbral,
  verde: number | null,
  rojo: number | null,
  verdeDebeSerMayor: boolean,
): void {
  if (verde === null || rojo === null) return;
  const incoherente = verdeDebeSerMayor ? verde <= rojo : verde >= rojo;
  const direccion = verdeDebeSerMayor ? 'mayor' : 'menor';
  const nombre: Record<IndicadorUmbral, string> = {
    endeudamiento: 'endeudamiento', ahorro: 'tasa de ahorro',
    fondo_emergencia: 'fondo de emergencia', ingreso_pasivo: 'ingreso pasivo',
  };
  if (incoherente) {
    avisos.push({
      campo,
      mensaje: `en ${nombre[campo]} el umbral verde debe ser ${direccion} que el rojo`,
    });
  }
}

/**
 * Valida la coherencia cruzada de los cuatro indicadores: los pares
 * «cuanto menos mejor» (endeudamiento) exigen verde < rojo; el resto,
 * verde > rojo. Los campos vacíos no avisan (el backend usa Option).
 */
export function validarUmbrales(u: UmbralesIndicadores): readonly AvisoUmbral[] {
  const avisos: AvisoUmbral[] = [];
  avisoSiIncoherente(avisos, 'endeudamiento', u.endeudamiento_verde, u.endeudamiento_rojo, false);
  avisoSiIncoherente(avisos, 'ahorro', u.ahorro_verde, u.ahorro_rojo, true);
  avisoSiIncoherente(avisos, 'fondo_emergencia', u.fondo_verde, u.fondo_rojo, true);
  avisoSiIncoherente(avisos, 'ingreso_pasivo', u.ingreso_pasivo_verde, u.ingreso_pasivo_amarillo, true);
  return avisos;
}
