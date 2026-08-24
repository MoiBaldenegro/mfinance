// REQ-25-04: Sección Inversiones del Paso 2 - CRUD con validación delegada a dominio
import { useState } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { validarTasa, validarInversion } from '../../domain/use-cases/inversiones-proyeccion.ts';
import type { Paso2Data, OnboardingInversion } from '../../domain/entities/onboarding/index.ts';
import { AcordeonSeccion } from './AcordeonSeccion.tsx';
import '../../styles/inversiones-section.css';

const FA = ['renta_fija', 'renta_variable', 'finca_raiz'] as const;
const LB = { renta_fija: 'Renta fija', renta_variable: 'Renta variable', finca_raiz: 'Finca raíz' } as const;

interface Props { readonly datos: Paso2Data; readonly alCambiar: (p: Paso2Data) => void; readonly moneda: string; readonly deshabilitado: boolean; }

export function InversionesSection({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [f, setF] = useState({ familia: 'renta_fija' as 'renta_fija'|'renta_variable'|'finca_raiz', aporte: '', valor: '', tasa: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const a = parseFloat(f.aporte), v = parseFloat(f.valor), t = parseFloat(f.tasa);
    if (isNaN(a) || isNaN(v) || isNaN(t)) { setError('Aporte, valor y tasa deben ser números'); return; }
    // Validación delegada a dominio (REQ-25-05)
    const errInv = validarInversion(a, v);
    if (errInv) { setError(errInv); return; }
    const et = validarTasa(t);
    if (!et.valida) { setError(et.mensaje); return; }
    const n: OnboardingInversion = { familia: f.familia, aporte_mensual: a, valor_actual: v, tasa_esperada_anual: t };
    alCambiar({ ...datos, inversiones: datos.inversiones.map(i => i.familia===f.familia?n:i) });
    setF({ familia: 'renta_fija', aporte: '', valor: '', tasa: '' }); setEditando(null); setError(null);
  };

  const editar = (fam: string) => { const inv = datos.inversiones.find(i=>i.familia===fam); if(inv){setF({familia:inv.familia, aporte:String(inv.aporte_mensual), valor:String(inv.valor_actual), tasa:String(inv.tasa_esperada_anual)}); setEditando(fam); setError(null);} };
  const cancelar = () => { setF({ familia: 'renta_fija', aporte: '', valor: '', tasa: '' }); setEditando(null); setError(null); };

  // Helper para obtener la inversión actual de una familia
  const getInv = (fam: string) => datos.inversiones.find(i => i.familia === fam);

  return (
    <AcordeonSeccion className="inversiones-section__seccion" resumen={
      <summary className="inversiones-section__resumen"><span className="inversiones-section__titulo">Inversiones</span><span className="inversiones-section__count">({datos.inversiones.length}/3)</span></summary>
    }>
      <div className="inversiones-section__contenido">
        <form className="inversiones-section__form" onSubmit={submit}>
          <div className="inversiones-section__fila">
            <select className="inversiones-section__select" value={f.familia} onChange={e=>setF({...f,familia:e.target.value as 'renta_fija'|'renta_variable'|'finca_raiz'})} disabled={deshabilitado}>{FA.map(x=><option key={x} value={x}>{LB[x]}</option>)}</select>
            <input type="number" step="0.01" min="0" className="inversiones-section__input inversiones-section__input--valor" placeholder="Aporte mensual" value={f.aporte} onChange={e=>setF({...f,aporte:e.target.value})} disabled={deshabilitado} required/>
            <input type="number" step="0.01" min="0" className="inversiones-section__input inversiones-section__input--valor" placeholder="Valor actual" value={f.valor} onChange={e=>setF({...f,valor:e.target.value})} disabled={deshabilitado} required/>
            <input type="number" step="0.01" min="0" max="30" className="inversiones-section__input inversiones-section__input--tasa" placeholder="Tasa esperada %" value={f.tasa} onChange={e=>setF({...f,tasa:e.target.value})} disabled={deshabilitado} required/>
            <button type="submit" className="inversiones-section__btn" disabled={deshabilitado}>{editando?'Guardar':'Añadir'}</button>
            {editando && <button type="button" className="inversiones-section__btn inversiones-section__btn--cancelar" onClick={cancelar} disabled={deshabilitado}>Cancelar</button>}
          </div>
          {error && <p className="inversiones-section__error" role="alert">{error}</p>}
        </form>
        <ul className="inversiones-section__lista">
          {FA.map(fam=>{const inv=getInv(fam);return(<li key={fam} className="inversiones-section__item"><div className="inversiones-section__item-info"><span className="inversiones-section__item-nombre">{LB[fam]}</span>{inv?<span className="inversiones-section__item-tasa">{inv.tasa_esperada_anual}%</span>:null}</div><div className="inversiones-section__item-acciones">{inv&&(<><span className="inversiones-section__item-valor">{formatoMoneda(inv.valor_actual, moneda as 'MXN'|'USD'|'EUR')}</span><span className="inversiones-section__item-aporte">+{formatoMoneda(inv.aporte_mensual, moneda as 'MXN'|'USD'|'EUR')}/mes</span></>)}<button className="inversiones-section__btn-icon" onClick={()=>editar(fam)} disabled={deshabilitado} aria-label={`${inv?'Editar':'Añadir'} ${LB[fam]}`}>{inv?'✎':'+'}</button></div></li>);})}
        </ul>
      </div>
    </AcordeonSeccion>
  );
}