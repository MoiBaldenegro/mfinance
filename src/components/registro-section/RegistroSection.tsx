// REQ-06: sección Registro completa: selector de mes, tarjetas
// Ingresos|Gastos con subtotales en vivo, totales del mes y botón
// Confirmar que persiste por el caso de uso → puerto IPC.
// REQ-16-07: con el mes cerrado, todo queda solo lectura (BloqueoCierre).
import {
  EXPENSE_CATEGORIES,
  EXPENSE_CATEGORY_LABELS,
  INCOME_SOURCES,
  INCOME_SOURCE_LABELS,
} from '../../domain/entities/catalogs.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { mesEstaCerrado } from '../../domain/use-cases/mes-cerrado.ts';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { useSnapshot } from '../shell/SnapshotProvider.tsx';
import { BloqueoCierre } from './BloqueoCierre.tsx';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { SelectorMes } from '../ui/SelectorMes';
import { TarjetaMontos } from './TarjetaMontos.tsx';
import { useRegistroMensual } from './use-registro-mensual.ts';
import '../../styles/registro-section.css';

interface Props {
  readonly snapshot: FinanceSnapshot;
}

/** Formulario mensual completo de la sección Registro. */
export function RegistroSection({ snapshot }: Props) {
  const { aplicarSnapshot } = useSnapshot();
  const moneda = usarMoneda();
  const formulario = useRegistroMensual(snapshot, aplicarSnapshot);
  // REQ-16-07: mes cerrado = registro solo lectura hasta reabrirlo.
  const cerrado = mesEstaCerrado(snapshot, formulario.mes);
  return (
    <section className="pagina registro-section">
      <CabeceraPagina titulo="Registro"
        descripcion="Captura tus ingresos y gastos del mes y confirma para guardarlos.">
        <SelectorMes mes={formulario.mes} alCambiar={formulario.alCambiarMes} etiqueta="Mes del registro" />
      </CabeceraPagina>
      {cerrado ? <BloqueoCierre mes={formulario.mes} /> : null}
      <fieldset
        className="rejilla rejilla--2 registro-section__tarjetas"
        disabled={cerrado}
      >
        <TarjetaMontos
          titulo="Ingresos"
          prefijo="ingreso"
          claves={INCOME_SOURCES}
          etiquetas={INCOME_SOURCE_LABELS}
          textos={formulario.ingresos}
          errores={formulario.erroresPorClave}
          subtotal={formulario.totales.ingresos}
          alCambiar={formulario.alCambiarIngreso}
        />
        <TarjetaMontos
          titulo="Gastos"
          prefijo="gasto"
          claves={EXPENSE_CATEGORIES}
          etiquetas={EXPENSE_CATEGORY_LABELS}
          textos={formulario.gastos}
          errores={formulario.erroresPorClave}
          subtotal={formulario.totales.gastos}
          alCambiar={formulario.alCambiarGasto}
        />
      </fieldset>
      {formulario.aviso ? (
        <p className="aviso aviso--error" role="alert">
          {formulario.aviso}
        </p>
      ) : null}
      <footer className="card registro-section__resumen">
        <dl className="registro-section__totales">
          <div><dt>Ingresos</dt><dd className="num">{formatoMoneda(formulario.totales.ingresos, moneda)}</dd></div>
          <div><dt>Gastos</dt><dd className="num">{formatoMoneda(formulario.totales.gastos, moneda)}</dd></div>
          <div><dt>Utilidad del mes</dt>
            <dd className={formulario.totales.utilidad < 0 ? 'num negativo' : 'num positivo'}>
              {formatoMoneda(formulario.totales.utilidad, moneda)}</dd></div>
        </dl>
        <button type="button" className="btn btn--primario registro-section__confirmar"
          disabled={formulario.ocupado || cerrado}
          onClick={() => void formulario.confirmar()}>
          {formulario.ocupado ? 'Guardando…' : 'Confirmar mes'}
        </button>
      </footer>
    </section>
  );
}
