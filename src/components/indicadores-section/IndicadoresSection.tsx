// Sección Indicadores real: 4 tarjetas con semáforo (REQ-10-06, 10-07, 10-08).
// Cada tarjeta muestra: nombre, valor calculado, punto de color semántico
// y estado "sin datos" en gris con explicación en español.
import { useMemo } from 'react';
import type { Indicadores } from '../../domain/entities/indicadores.ts';
import { useIndicadores } from './use-indicadores.ts';
import '../../styles/indicadores-section.css';

/** Componente individual de tarjeta de indicador. */
function TarjetaIndicador({ indicador }: { readonly indicador: Indicadores[keyof Indicadores] }) {
  const { nombre, valor, clasificacion, sin_datos, explicacion } = indicador;

  if (sin_datos) {
    return (
      <article className="indicador-tarjeta indicador-tarjeta--sin-datos">
        <header className="indicador-tarjeta__header">
          <h3 className="indicador-tarjeta__nombre">{nombre}</h3>
          <span className="indicador-tarjeta__punto indicador-tarjeta__punto--gris" aria-hidden="true" />
        </header>
        <p className="indicador-tarjeta__sin-datos">{explicacion ?? 'Sin datos disponibles'}</p>
      </article>
    );
  }

  // Mapear clasificación a clase CSS de token semántico
  const clasePunto = `indicador-tarjeta__punto--${clasificacion}`;

  // Formatear valor según el indicador
  const valorFormateado = useMemo(() => {
    if (nombre === 'Fondo de emergencia') {
      return `${valor.toFixed(1).replace('.', ',')} meses`;
    }
    return `${valor.toFixed(1).replace('.', ',')} %`;
  }, [nombre, valor]);

  return (
    <article className="indicador-tarjeta">
      <header className="indicador-tarjeta__header">
        <h3 className="indicador-tarjeta__nombre">{nombre}</h3>
        <span className={`indicador-tarjeta__punto ${clasePunto}`} aria-label={`Semáforo ${clasificacion}`} />
      </header>
      <div className="indicador-tarjeta__valor">
        <span className="indicador-tarjeta__numero">{valorFormateado}</span>
        <span className="indicador-tarjeta__clasificacion">{clasificacion}</span>
      </div>
    </article>
  );
}

/** Sección Indicadores: 4 tarjetas con semáforo verde/amarillo/rojo. */
export function IndicadoresSection() {
  const indicadores = useIndicadores();

  // Orden fijo de los 4 indicadores
  const orden = [
    'endeudamiento',
    'tasa_ahorro',
    'fondo_emergencia',
    'ingreso_pasivo',
  ] as const;

  return (
    <section className="indicadores-section">
      <h2 className="indicadores-section__titulo">Indicadores</h2>
      <div className="indicadores-section__grid">
        {orden.map((clave) => (
          <TarjetaIndicador key={clave} indicador={indicadores[clave]} />
        ))}
      </div>
    </section>
  );
}