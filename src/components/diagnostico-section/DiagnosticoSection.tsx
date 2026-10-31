// REQ-12-04/08/09: sección Diagnóstico — selector de mes, subida múltiple
// de PDFs, análisis del lote y tabla revisable. Renderiza y delega: el
// parseo ocurre íntegro en el backend (veredicto humano).
import { useState } from 'react';
import type { FinanceSnapshot } from '../../domain/entities/finance-snapshot.ts';
import { mesDeTrabajo } from '../../domain/use-cases/resumenes-flujo.ts';
import { CabeceraPagina } from '../ui/CabeceraPagina';
import { SelectorMes } from '../ui/SelectorMes';
import { useDiagnostico } from './use-diagnostico.ts';
import { DiagnosticoSubida } from './DiagnosticoSubida.tsx';
import { DiagnosticoInforme } from './DiagnosticoInforme.tsx';
import { DiagnosticoTabla } from './DiagnosticoTabla.tsx';
import '../../styles/diagnostico.css';

function mesActual(): string {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

/** Sección Diagnóstico: subir → analizar → revisar → actualizar. */
export function DiagnosticoSection({ snapshot }: { readonly snapshot: FinanceSnapshot }) {
  const [mes, setMes] = useState(() => mesDeTrabajo(snapshot) ?? mesActual());
  const diagnostico = useDiagnostico(mes);
  return (
    <section className="pagina diagnostico-section">
      <CabeceraPagina titulo="Diagnóstico"
        descripcion="Sube los extractos PDF del banco: extraemos fecha, comercio e importe y tú revisas cada movimiento antes de incorporarlo.">
        <SelectorMes mes={mes} alCambiar={setMes} etiqueta="Mes de los extractos" />
      </CabeceraPagina>
      <DiagnosticoSubida
        seleccionados={diagnostico.seleccionados}
        preparando={diagnostico.preparando}
        analizando={diagnostico.analizando}
        alElegirArchivos={diagnostico.alElegirArchivos}
        alAnalizar={diagnostico.analizar}
      />
      {diagnostico.error !== null && (
        <p className="aviso aviso--error" role="alert">
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
