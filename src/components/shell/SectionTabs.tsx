// REQ-05-04: pestañas horizontales scrollables derivadas del array
// declarativo SECCIONES (diez secciones). Sin router externo.
import { SECCIONES } from './secciones.ts';
import '../../styles/section-tabs.css';

interface Props {
  readonly activa: string;
  readonly alElegir: (id: string) => void;
}

/** Navegación por pestañas de las diez secciones del producto. */
export default function SectionTabs({ activa, alElegir }: Props) {
  return (
    <nav className="section-tabs" aria-label="Secciones de mfinance">
      <ul className="section-tabs__lista">
        {SECCIONES.map(({ id, titulo }) => (
          <li key={id} className="section-tabs__item">
            <button
              type="button"
              onClick={() => alElegir(id)}
              aria-current={id === activa ? 'page' : undefined}
              className={
                id === activa
                  ? 'section-tabs__pestaña section-tabs__pestaña--activa'
                  : 'section-tabs__pestaña'
              }
            >
              {titulo}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
