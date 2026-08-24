// REQ-13-07: panel de histórico mensual de conciliación.
import '../../../styles/historico-panel.css';

interface Props {
  readonly estado: {
    readonly nombre: 'cargando' | 'listo' | 'error';
    readonly historico?: {
      readonly meses: readonly string[];
      readonly por_mes_data: Record<string, { readonly mes: string; readonly cuentas: readonly any[]; readonly todas_conciliadas: boolean }>;
    };
    readonly error?: { readonly message: string };
  };
  readonly mesActual: string;
  readonly onSeleccionarMes: (mes: string) => void;
  readonly onCerrar: () => void;
}

export function HistoricoPanel({ estado, mesActual, onSeleccionarMes, onCerrar }: Props) {
  if (estado.nombre === 'cargando') {
    return <div className="historico-panel__cargando">Cargando histórico...</div>;
  }

  if (estado.nombre === 'error') {
    return (
      <div className="historico-panel__error">
        Error al cargar histórico: {estado.error?.message}
      </div>
    );
  }

  const historico = estado.historico!;
  const meses = historico.meses;

  return (
    <div className="historico-panel">
      <header className="historico-panel__header">
        <h3>Histórico mensual de conciliación</h3>
        <button type="button" className="historico-panel__btn-cerrar" onClick={onCerrar}>
          ×
        </button>
      </header>
      <nav className="historico-panel__meses">
        {meses.map((mes) => (
          <button
            key={mes}
            className={`historico-panel__mes ${mes === mesActual ? 'actual' : ''}`}
            onClick={() => onSeleccionarMes(mes)}
          >
            {mes}
            {historico.por_mes_data[mes]?.todas_conciliadas && (
              <span className="historico-panel__ok">✓</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}