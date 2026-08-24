// REQ-27-02: sección «Umbrales de indicadores» del paso 4. Presentacional:
// los defaults, la validación cruzada y la restauración viven en el caso
// de uso onboarding-paso4; aquí solo se renderizan campos y avisos.
import type { Paso4Data } from '../../domain/entities/onboarding/index.ts';
import {
  cambiarUmbral,
  restaurarUmbralesDefecto,
  validarUmbrales,
} from '../../domain/use-cases/onboarding/onboarding-paso4.ts';
import '../../styles/indicadores-umbrales.css';

const INDICADORES = [
  { id: 'endeudamiento', nombre: 'Endeudamiento', unidad: '%', verde: 'Verde si ≤', rojo: 'Rojo si ≥', campoVerde: 'endeudamiento_verde', campoRojo: 'endeudamiento_rojo', ayuda: 'Deuda total respecto a tu patrimonio.' },
  { id: 'ahorro', nombre: 'Tasa de ahorro', unidad: '%', verde: 'Verde si ≥', rojo: 'Rojo si <', campoVerde: 'ahorro_verde', campoRojo: 'ahorro_rojo', ayuda: 'Parte de tus ingresos que logras ahorrar.' },
  { id: 'fondo_emergencia', nombre: 'Fondo de emergencia', unidad: 'meses', verde: 'Verde si ≥', rojo: 'Rojo si <', campoVerde: 'fondo_verde', campoRojo: 'fondo_rojo', ayuda: 'Meses de gastos cubiertos sin ingresos.' },
  { id: 'ingreso_pasivo', nombre: 'Ingreso pasivo', unidad: '%', verde: 'Verde si ≥', rojo: 'Referencia si ≥', campoVerde: 'ingreso_pasivo_verde', campoRojo: 'ingreso_pasivo_amarillo', ayuda: 'Ingresos pasivos respecto a tus gastos.' },
] as const;

interface Props {
  readonly paso4: Paso4Data;
  readonly alCambiar: (paso4: Paso4Data) => void;
  readonly deshabilitado: boolean;
}

/** Cuatro tarjetas con umbral verde/rojo editables + restaurar defectos. */
export function IndicadoresUmbralesSection({ paso4, alCambiar, deshabilitado }: Props) {
  const avisos = validarUmbrales(paso4.umbrales);
  return (
    <fieldset className="indicadores-umbrales">
      <legend className="indicadores-umbrales__titulo">Umbrales de indicadores</legend>
      <p className="indicadores-umbrales__ayuda">
        Personaliza cuándo cada semáforo se pone verde o rojo. Los valores por defecto son los estándar.
      </p>
      <div className="indicadores-umbrales__tarjetas">
        {INDICADORES.map((ind) => (
          <TarjetaUmbral key={ind.id} ind={ind} paso4={paso4} alCambiar={alCambiar}
            deshabilitado={deshabilitado} avisos={avisos.filter((a) => a.campo === ind.id)} />
        ))}
      </div>
      <button
        type="button" className="indicadores-umbrales__restaurar"
        onClick={() => alCambiar({ umbrales: restaurarUmbralesDefecto() })}
        disabled={deshabilitado}
      >
        Restaurar valores por defecto
      </button>
    </fieldset>
  );
}

type Indicador = (typeof INDICADORES)[number];

function TarjetaUmbral({ ind, paso4, alCambiar, deshabilitado, avisos }: {
  readonly ind: Indicador;
  readonly paso4: Paso4Data;
  readonly alCambiar: (paso4: Paso4Data) => void;
  readonly deshabilitado: boolean;
  readonly avisos: readonly { readonly mensaje: string }[];
}) {
  return (
    <article className="indicadores-umbrales__tarjeta">
      <h4 className="indicadores-umbrales__nombre">{ind.nombre}</h4>
      <p className="indicadores-umbrales__descripcion">{ind.ayuda}</p>
      {([['verde', ind.verde, ind.campoVerde], ['rojo', ind.rojo, ind.campoRojo]] as const).map(([clave, etiqueta, campo]) => (
        <label key={clave} className="indicadores-umbrales__campo">
          <span>{etiqueta}</span>
          <input
            type="number" inputMode="decimal" className="indicadores-umbrales__input"
            aria-label={`${ind.nombre}: ${etiqueta}`}
            value={paso4.umbrales[campo] ?? ''}
            onChange={(e) => {
              const bruto = e.target.value === '' ? null : Number(e.target.value);
              alCambiar(cambiarUmbral(paso4, campo, bruto === null || Number.isNaN(bruto) ? null : bruto));
            }}
            disabled={deshabilitado}
          />
          <span>{ind.unidad}</span>
        </label>
      ))}
      {avisos.map((a) => (
        <p key={a.mensaje} className="indicadores-umbrales__error" role="alert">{a.mensaje}</p>
      ))}
    </article>
  );
}
