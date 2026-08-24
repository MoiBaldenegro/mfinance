// REQ-22-02: cabecera fija con la marca, el indicador PERMANENTE del
// titular del perfil activo y el mes de trabajo. Sin lógica: consume el
// contexto de perfiles como SelectorMoneda consume la moneda.
import { usarPerfiles } from '../../hooks/use-perfil.ts';
import '../../styles/header-bar.css';

interface Props {
  readonly mesTrabajo: string | null;
}

/** Cabecera fija: mfinance, titular activo y mes de trabajo. */
export default function HeaderBar({ mesTrabajo }: Props) {
  const { activo } = usarPerfiles();
  const titular = activo ? activo.nombre : '…';
  return (
    <header className="header-bar">
      <span className="header-bar__marca">mfinance</span>
      <span className="header-bar__perfil">Perfil: {titular}</span>
      <span className="header-bar__mes">
        {mesTrabajo ? `Mes de trabajo: ${mesTrabajo}` : 'Sin mes registrado'}
      </span>
    </header>
  );
}
