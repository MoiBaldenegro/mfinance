// Navegación principal: marca, titular del perfil activo, mes de trabajo,
// secciones agrupadas y, al pie, Ajustes y el conmutador de tema.
import { etiquetaMesCorta } from '../../domain/use-cases/etiqueta-mes.ts';
import { usarPerfiles } from '../../hooks/use-perfil.ts';
import { usarTema } from '../../hooks/use-tema.ts';
import { conmutarTema } from '../../lib/estado-tema.ts';
import { Icono } from './Icono';
import { Marca } from '../ui/Marca.tsx';
import { GRUPOS_NAVEGACION, seccionPorId } from './secciones.ts';
import '../../styles/barra-lateral.css';

interface Props {
  readonly activa: string;
  readonly mesTrabajo: string | null;
  readonly alElegir: (id: string) => void;
}

function Enlace({ id, activa, alElegir }: { readonly id: string } & Omit<Props, 'mesTrabajo'>) {
  const actual = id === activa;
  return (
    <li>
      <button type="button" onClick={() => alElegir(id)}
        aria-current={actual ? 'page' : undefined}
        className={actual ? 'barra-lateral__enlace barra-lateral__enlace--activo' : 'barra-lateral__enlace'}>
        <Icono nombre={id} />
        <span>{seccionPorId(id).titulo}</span>
      </button>
    </li>
  );
}

/** Barra lateral fija del shell. */
export function BarraLateral({ activa, mesTrabajo, alElegir }: Props) {
  const { activo } = usarPerfiles();
  const tema = usarTema();
  const nombre = activo ? activo.nombre : '…';
  return (
    <aside className="barra-lateral">
      <div className="barra-lateral__marca"><Marca tamano={30} /></div>
      <button type="button" className="barra-lateral__perfil" onClick={() => alElegir('ajustes')}
        title="Gestionar perfiles">
        <span className="barra-lateral__avatar" aria-hidden="true">{nombre.charAt(0).toUpperCase()}</span>
        <span className="barra-lateral__perfil-texto">
          <span className="barra-lateral__perfil-nombre">Perfil: {nombre}</span>
          <span className="barra-lateral__perfil-mes">
            {mesTrabajo ? `Mes de trabajo · ${etiquetaMesCorta(mesTrabajo)}` : 'Sin mes registrado'}
          </span>
        </span>
      </button>
      <nav className="barra-lateral__nav" aria-label="Secciones de mfinance">
        {GRUPOS_NAVEGACION.map((grupo) => (
          <div key={grupo.titulo} className="barra-lateral__grupo">
            <p className="barra-lateral__grupo-titulo">{grupo.titulo}</p>
            <ul className="barra-lateral__lista">
              {grupo.ids.map((id) => <Enlace key={id} id={id} activa={activa} alElegir={alElegir} />)}
            </ul>
          </div>
        ))}
      </nav>
      <div className="barra-lateral__pie">
        <ul className="barra-lateral__lista"><Enlace id="ajustes" activa={activa} alElegir={alElegir} /></ul>
        <button type="button" className="barra-lateral__enlace" onClick={() => conmutarTema()}>
          <Icono nombre={tema === 'oscuro' ? 'sol' : 'luna'} />
          <span>{tema === 'oscuro' ? 'Tema claro' : 'Tema oscuro'}</span>
        </button>
      </div>
    </aside>
  );
}
