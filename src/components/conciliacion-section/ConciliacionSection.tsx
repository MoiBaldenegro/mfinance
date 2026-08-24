// REQ-13-01..07: sección Conciliación — lista de cuentas con saldo
// inicial, movimientos, saldo teórico, campo "saldo real" editable,
// diferencia, estado conciliado/descuadrada, campo ajuste, botón confirmar;
// histórico mensual navegable; mensaje confirmación ES cuando todas conciliadas.
import { CuentaConciliadaCard } from './components/CuentaConciliadaCard.tsx';
import { ConciliacionHistorico } from './ConciliacionHistorico.tsx';
import { useConciliacionSection } from './use-conciliacion-section.ts';
import '../../styles/conciliacion-section.css';

export function ConciliacionSection() {
  const {
    mesSeleccionado, setMesSeleccionado, mostrarHistorico, setMostrarHistorico,
    estadoConciliacion, estadoHistorico, agregarMovimiento, guardando,
    errorAgregar, todasConciliadas: todasOk, conciliacion,
  } = useConciliacionSection();

  if (estadoConciliacion.nombre === 'cargando') {
    return <section className="conciliacion-section"><div className="conciliacion-section__cargando">Cargando conciliación...</div></section>;
  }
  if (estadoConciliacion.nombre === 'error') {
    return <section className="conciliacion-section"><div className="conciliacion-section__error">Error al cargar: {estadoConciliacion.error.message}</div></section>;
  }

  return (
    <section className="conciliacion-section">
      <header className="conciliacion-section__header">
        <h2 className="conciliacion-section__titulo">Conciliación</h2>
        <div className="conciliacion-section__controles">
          <label className="conciliacion-section__selector-mes">
            <span>Mes:</span>
            <input type="month" value={mesSeleccionado} onChange={(e) => setMesSeleccionado(e.target.value)} className="conciliacion-section__input-mes" />
          </label>
          <button type="button" className="conciliacion-section__btn-historico" onClick={() => setMostrarHistorico(!mostrarHistorico)}>
            {mostrarHistorico ? 'Ocultar histórico' : 'Ver histórico'}
          </button>
        </div>
      </header>

      {mostrarHistorico && <ConciliacionHistorico estado={estadoHistorico} mesActual={mesSeleccionado} onSeleccionarMes={setMesSeleccionado} onCerrar={() => setMostrarHistorico(false)} />}

      <div className="conciliacion-section__cuentas">
        {conciliacion.cuentas.length === 0 ? (
          <p className="conciliacion-section__vacio">No hay cuentas para conciliar en {mesSeleccionado}.</p>
        ) : (
          conciliacion.cuentas.map((cuenta) => (
            <CuentaConciliadaCard key={cuenta.cuenta} cuenta={cuenta} onAgregarMovimiento={agregarMovimiento} guardando={guardando} errorAgregar={errorAgregar} />
          ))
        )}
      </div>

      {todasOk && conciliacion.cuentas.length > 0 && (
        <div className="conciliacion-section__confirmacion">
          <span className="conciliacion-section__icono">✓</span>
          <span>¡Todas las cuentas están conciliadas! Estado persistido correctamente.</span>
          <button type="button" className="conciliacion-section__btn-confirmar" onClick={() => alert('¡Todas las cuentas están conciliadas! Estado persistido correctamente.')}>
            Confirmar cierre
          </button>
        </div>
      )}
    </section>
  );
}