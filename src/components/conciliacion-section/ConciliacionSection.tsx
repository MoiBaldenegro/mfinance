// Sección Conciliación: por cuenta, saldo inicial + movimientos frente al
// saldo real del banco, con diferencia y estado; histórico por meses.
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { etiquetaMes } from '../../domain/use-cases/etiqueta-mes.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { SelectorMes } from '../ui/SelectorMes';
import { CuentaConciliadaCard } from './components/CuentaConciliadaCard.tsx';
import { ConciliacionHistorico } from './ConciliacionHistorico.tsx';
import { useConciliacionSection } from './use-conciliacion-section.ts';
import '../../styles/conciliacion.css';

const DESCRIPCION = 'Comprueba que lo registrado cuadra con el saldo real de cada cuenta en el banco.';

export function ConciliacionSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const c = useConciliacionSection(snapshot);
  const { cuentas } = c.conciliacion;
  return (
    <section className="pagina conciliacion">
      <CabeceraPagina titulo="Conciliación" descripcion={DESCRIPCION}>
        <button type="button" className="btn" onClick={() => c.setMostrarHistorico(!c.mostrarHistorico)}
          aria-expanded={c.mostrarHistorico}>
          {c.mostrarHistorico ? 'Ocultar histórico' : 'Histórico'}
        </button>
        <SelectorMes mes={c.mesSeleccionado} alCambiar={c.setMesSeleccionado} etiqueta="Mes a conciliar" />
      </CabeceraPagina>
      {c.mostrarHistorico ? (
        <ConciliacionHistorico estado={c.estadoHistorico} mesActual={c.mesSeleccionado}
          onSeleccionarMes={c.setMesSeleccionado} onCerrar={() => c.setMostrarHistorico(false)} />
      ) : null}
      {c.estadoConciliacion.nombre === 'cargando' ? <p className="estado-carga">Cargando conciliación…</p> : null}
      {c.estadoConciliacion.nombre === 'error' ? (
        <p className="aviso aviso--error" role="alert">No se pudo cargar la conciliación: {c.estadoConciliacion.error.message}</p>
      ) : null}
      {c.estadoConciliacion.nombre === 'listo' && cuentas.length === 0 ? (
        <p className="estado-vacio">No hay extractos de cuenta que conciliar en {etiquetaMes(c.mesSeleccionado)}.</p>
      ) : null}
      {c.todasConciliadas && cuentas.length > 0 ? (
        <p className="aviso aviso--exito" role="status">
          Todas las cuentas de {etiquetaMes(c.mesSeleccionado)} están conciliadas.
        </p>
      ) : null}
      {cuentas.length > 0 ? (
        <div className="rejilla rejilla--2 conciliacion__cuentas">
          {cuentas.map((cuenta) => (
            <CuentaConciliadaCard key={cuenta.cuenta} cuenta={cuenta} onAgregarMovimiento={c.agregarMovimiento}
              guardando={c.guardando} errorAgregar={c.errorAgregar} />
          ))}
        </div>
      ) : null}
    </section>
  );
}
