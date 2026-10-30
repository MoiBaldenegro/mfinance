// REQ-25-04: Sección Inversiones del Paso 2. Una entrada por familia (renta
// fija, variable, finca raíz): se añade, edita o quita desde su fila.
// Validación delegada a dominio (validarInversion + validarTasa).
import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { validarTasa, validarInversion } from '../../domain/use-cases/inversiones-proyeccion.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import type { Paso2Data, OnboardingInversion } from '../../domain/entities/onboarding/index.ts';
import { AcordeonSeccion } from './AcordeonSeccion.tsx';
import { ListaBalance, ResumenBalance } from './BalanceComun.tsx';
import '../../styles/onboarding-paso-balance.css';

type Familia = OnboardingInversion['familia'];
const FA: readonly Familia[] = ['renta_fija', 'renta_variable', 'finca_raiz'];
const LB: Record<Familia, string> = { renta_fija: 'Renta fija', renta_variable: 'Renta variable', finca_raiz: 'Finca raíz' };
const VACIO = { aporte: '', valor: '', tasa: '' };

interface Props { readonly datos: Paso2Data; readonly alCambiar: (p: Paso2Data) => void; readonly moneda: Moneda; readonly deshabilitado: boolean; }

export function InversionesSection({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<Familia | null>(null);
  const [f, setF] = useState(VACIO);
  const [abiertoInicial] = useState(datos.inversiones.length > 0);
  const reiniciar = () => { setF(VACIO); setEditando(null); setError(null); };
  const getInv = (fam: string) => datos.inversiones.find((i) => i.familia === fam);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!editando) return;
    const a = Number(f.aporte), v = Number(f.valor), t = Number(f.tasa);
    const errInv = validarInversion(a, v);
    if (errInv) { setError(errInv); return; }
    const et = validarTasa(t);
    if (!et.valida) { setError(et.mensaje); return; }
    const n: OnboardingInversion = { familia: editando, aporte_mensual: a, valor_actual: v, tasa_esperada_anual: t };
    // Upsert por familia, conservando el orden canónico de FA.
    const inversiones = [...datos.inversiones.filter((i) => i.familia !== editando), n]
      .sort((x, y) => FA.indexOf(x.familia) - FA.indexOf(y.familia));
    alCambiar({ ...datos, inversiones });
    reiniciar();
  };

  const editar = (clave: string) => {
    const inv = getInv(clave);
    setF(inv ? { aporte: String(inv.aporte_mensual), valor: String(inv.valor_actual), tasa: String(inv.tasa_esperada_anual) } : VACIO);
    setEditando(clave as Familia); setError(null);
  };
  const eliminar = (clave: string) => {
    alCambiar({ ...datos, inversiones: datos.inversiones.filter((i) => i.familia !== clave) });
    if (editando === clave) reiniciar();
  };
  const total = datos.inversiones.reduce((s, i) => s + i.valor_actual, 0);
  const filas = FA.map((fam) => {
    const inv = getInv(fam);
    return inv
      ? { clave: fam, titulo: LB[fam], detalle: `${inv.tasa_esperada_anual}% anual esperado`, valor: formatoMoneda(inv.valor_actual, moneda), nota: `+${formatoMoneda(inv.aporte_mensual, moneda)}/mes` }
      : { clave: fam, titulo: LB[fam], detalle: 'Sin registrar' };
  });

  return (
    <AcordeonSeccion className="ob-balance" abiertoInicial={abiertoInicial} resumen={
      <ResumenBalance titulo="Inversiones" cantidad={`${datos.inversiones.length}/${FA.length}`} total={formatoMoneda(total, moneda)} />
    }>
      <div className="ob-balance__cuerpo">
        <ListaBalance vacio="" filas={filas} editando={editando} deshabilitado={deshabilitado}
          alEditar={editar} alEliminar={eliminar} etiquetaAlta="Añadir" />
        {editando && (
          <form className="ob-balance__form" onSubmit={submit} aria-label={`Inversión en ${LB[editando]}`}>
            <p className="ob-balance__form-titulo">{LB[editando]}</p>
            <label className="campo">
              <span className="campo__etiqueta">Valor actual ({simboloDe(moneda)})</span>
              <input type="number" inputMode="decimal" step="0.01" min="0" value={f.valor} placeholder="0.00" autoFocus
                onChange={(e) => setF({ ...f, valor: e.target.value })} disabled={deshabilitado} required />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Aporte mensual ({simboloDe(moneda)})</span>
              <input type="number" inputMode="decimal" step="0.01" min="0" value={f.aporte} placeholder="0.00"
                onChange={(e) => setF({ ...f, aporte: e.target.value })} disabled={deshabilitado} required />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">Rendimiento anual (%)</span>
              <input type="number" inputMode="decimal" step="0.01" min="0" max="30" value={f.tasa} placeholder="0"
                onChange={(e) => setF({ ...f, tasa: e.target.value })} disabled={deshabilitado} required />
            </label>
            <div className="ob-balance__form-acciones">
              <button type="button" className="btn btn--fantasma" onClick={reiniciar} disabled={deshabilitado}>Cancelar</button>
              <button type="submit" className="btn btn--primario" disabled={deshabilitado}>Guardar</button>
            </div>
            {error && <p className="campo__error ob-balance__error" role="alert">{error}</p>}
          </form>
        )}
      </div>
    </AcordeonSeccion>
  );
}
