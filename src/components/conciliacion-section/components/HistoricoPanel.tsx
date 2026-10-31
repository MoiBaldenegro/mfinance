// Histórico de conciliación: meses con datos y su estado.
import { etiquetaMesCorta } from '../../../domain/use-cases/etiqueta-mes.ts';

interface Props {
  readonly estado: {
    readonly nombre: 'cargando' | 'listo' | 'error';
    readonly historico?: {
      readonly meses: readonly string[];
      readonly por_mes_data: Record<string, { readonly todas_conciliadas: boolean }>;
    };
    readonly error?: { readonly message: string };
  };
  readonly mesActual: string;
  readonly onSeleccionarMes: (mes: string) => void;
  readonly onCerrar: () => void;
}

export function HistoricoPanel({ estado, mesActual, onSeleccionarMes, onCerrar }: Props) {
  return (
    <section className="card card--compacta" aria-label="Histórico de conciliación">
      <div className="card__cabecera">
        <h2 className="card__titulo">Histórico</h2>
        <button type="button" className="btn btn--fantasma btn--sm" onClick={onCerrar}>Cerrar</button>
      </div>
      {estado.nombre === 'cargando' ? <p className="card__descripcion">Cargando histórico…</p> : null}
      {estado.nombre === 'error' ? (
        <p className="aviso aviso--error" role="alert">No se pudo cargar el histórico: {estado.error?.message}</p>
      ) : null}
      {estado.nombre === 'listo' && estado.historico ? (
        estado.historico.meses.length === 0 ? (
          <p className="card__descripcion">Todavía no hay meses conciliados.</p>
        ) : (
          <div className="historico-meses">
            {estado.historico.meses.map((mes) => {
              const ok = estado.historico?.por_mes_data[mes]?.todas_conciliadas;
              return (
                <button key={mes} type="button" aria-pressed={mes === mesActual}
                  className="btn btn--sm historico-meses__mes" onClick={() => onSeleccionarMes(mes)}>
                  {etiquetaMesCorta(mes)}
                  <span className={ok ? 'badge badge--positivo' : 'badge badge--aviso'}>{ok ? 'Cuadra' : 'Descuadre'}</span>
                </button>
              );
            })}
          </div>
        )
      ) : null}
    </section>
  );
}
