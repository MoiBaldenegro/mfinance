// REQ-37-02/03/08: pantalla independiente de Ajustes para recuperar perfiles.
import { GestionPerfiles } from '../ajustes-section/GestionPerfiles.tsx';
import '../../styles/ajustes-recuperacion.css';

/** Gestión de perfiles sin montar ninguna sección financiera ni snapshot. */
export function AjustesRecuperacion() {
  return (
    <main className="ajustes-recuperacion">
      <header className="ajustes-recuperacion__cabecera">
        <p className="ajustes-recuperacion__eyebrow">Configuración</p>
        <h1 className="ajustes-recuperacion__titulo">Ajustes</h1>
        <p className="ajustes-recuperacion__descripcion">
          Selecciona un perfil para volver a cargar sus datos.
        </p>
      </header>
      <section aria-labelledby="ajustes-recuperacion-perfiles">
        <h2 id="ajustes-recuperacion-perfiles" className="ajustes-recuperacion__subtitulo">
          Gestión de perfiles
        </h2>
        <GestionPerfiles />
      </section>
    </main>
  );
}
