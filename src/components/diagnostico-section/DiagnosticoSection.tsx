// REQ-12-04/08/09: sección Diagnóstico — selector de mes, subida múltiple
// de PDFs, análisis del lote y tabla revisable. Renderiza y delega: el
// parseo ocurre íntegro en el backend (veredicto humano).
import { useState } from 'react';
import { MonthSelector } from '../registro-section/MonthSelector.tsx';
import { useDiagnostico } from './use-diagnostico.ts';
import { DiagnosticoSubida } from './DiagnosticoSubida.tsx';
import { DiagnosticoInforme } from './DiagnosticoInforme.tsx';
import { DiagnosticoTabla } from './DiagnosticoTabla.tsx';
import '../../styles/diagnostico-section.css';

function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

/** Sección Diagnóstico: subir → analizar → revisar → actualizar. */
export function DiagnosticoSection() {
  const [mes, setMes] = useState(mesActual());
  const diagnostico = useDiagnostico(mes);
  return (
    <section className="diagnostico-section">
      <h2 className="diagnostico-section__titulo">Diagnóstico</h2>
      <p className="diagnostico-section__ayuda">
        Sube los extractos PDF del mes y el backend extraerá fecha,
        comercio e importe; revisa cada movimiento antes de incorporarlo.
      </p>
      <div className="diagnostico-section__mes">
        <span className="diagnostico-section__mes-etiqueta">Mes</span>
        <MonthSelector mes={mes} alCambiar={setMes} />
      </div>
      <DiagnosticoSubida
        seleccionados={diagnostico.seleccionados}
        preparando={diagnostico.preparando}
        analizando={diagnostico.analizando}
        alElegirArchivos={diagnostico.alElegirArchivos}
        alAnalizar={diagnostico.analizar}
      />
      {diagnostico.error !== null && (
        <p className="estado-vacio diagnostico-section__error">
          {diagnostico.error}
        </p>
      )}
      {diagnostico.analizando && (
        <p className="estado-carga">Analizando los PDFs del mes…</p>
      )}
      {diagnostico.informe !== null && (
        <>
          <DiagnosticoInforme informe={diagnostico.informe} />
          <DiagnosticoTabla
            filas={diagnostico.filas}
            resumen={diagnostico.resumen}
            confirmando={diagnostico.confirmando}
            alEditar={diagnostico.editarFila}
            alConfirmar={diagnostico.confirmarFila}
            alDescartar={diagnostico.descartarFila}
            alReabrir={diagnostico.reabrirFila}
            alConfirmarSeleccion={diagnostico.confirmarSeleccion}
          />
        </>
      )}
    </section>
  );
}
