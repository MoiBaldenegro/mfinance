// REQ-13-07: componente de histórico mensual de conciliación.
import { HistoricoPanel } from './components/HistoricoPanel.tsx';
import '../../styles/conciliacion-historico-wrapper.css';

interface Props {
  readonly estado: ReturnType<typeof import('../../hooks/use-conciliacion.ts').useHistoricoConciliacion>['estado'];
  readonly mesActual: string;
  readonly onSeleccionarMes: (mes: string) => void;
  readonly onCerrar: () => void;
}

export function ConciliacionHistorico({ estado, mesActual, onSeleccionarMes, onCerrar }: Props) {
  return (
    <HistoricoPanel
      estado={estado}
      mesActual={mesActual}
      onSeleccionarMes={onSeleccionarMes}
      onCerrar={onCerrar}
    />
  );
}