// REQ-25-03: Sección Pasivos del Paso 2 - CRUD con validación delegada a dominio
import { useState } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { validarPasivo } from '../../domain/use-cases/balance-validaciones.ts';
import { validarTasa } from '../../domain/use-cases/inversiones-proyeccion.ts';
import type { Paso2Data, OnboardingPasivo } from '../../domain/entities/onboarding/index.ts';
import { AcordeonSeccion } from './AcordeonSeccion.tsx';
import '../../styles/pasivos-section.css';

interface Props { readonly datos: Paso2Data; readonly alCambiar: (p: Paso2Data) => void; readonly moneda: string; readonly deshabilitado: boolean; }

export function PasivosSection({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [f, setF] = useState({ nombre: '', saldo: '', tasa: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = parseFloat(f.saldo), t = parseFloat(f.tasa);
    if (isNaN(s) || isNaN(t)) { setError('Saldo y tasa deben ser números'); return; }
    const err = validarPasivo(f.nombre.trim(), s, t);
    if (err) { setError(err); return; }
    const et = validarTasa(t);
    if (!et.valida) { setError(et.mensaje); return; }
    const n: OnboardingPasivo = { nombre: f.nombre.trim(), saldo_pendiente: s, tasa_interes_anual: t };
    alCambiar({ ...datos, pasivos: editando ? datos.pasivos.map(p => p.nombre===editando?n:p) : [...datos.pasivos, n] });
    setF({ nombre: '', saldo: '', tasa: '' }); setEditando(null); setError(null);
  };

  const editar = (p: OnboardingPasivo) => { setF({ nombre: p.nombre, saldo: String(p.saldo_pendiente), tasa: String(p.tasa_interes_anual) }); setEditando(p.nombre); setError(null); };
  const eliminar = (n: string) => alCambiar({ ...datos, pasivos: datos.pasivos.filter(p => p.nombre!==n) });
  const cancelar = () => { setF({ nombre: '', saldo: '', tasa: '' }); setEditando(null); setError(null); };
  const total = datos.pasivos.reduce((s, p) => s + p.saldo_pendiente, 0);

  return (
    <AcordeonSeccion className="pasivos-section__seccion" resumen={
      <summary className="pasivos-section__resumen"><span className="pasivos-section__titulo">Pasivos</span><span className="pasivos-section__total">{formatoMoneda(total, moneda as 'MXN'|'USD'|'EUR')}</span><span className="pasivos-section__count">({datos.pasivos.length})</span></summary>
    }>
      <div className="pasivos-section__contenido">
        <form className="pasivos-section__form" onSubmit={submit}>
          <div className="pasivos-section__fila">
            <input className="pasivos-section__input" placeholder="Nombre del pasivo" value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})} disabled={deshabilitado} required/>
            <input type="number" step="0.01" min="0.01" className="pasivos-section__input pasivos-section__input--valor" placeholder="Saldo pendiente" value={f.saldo} onChange={e=>setF({...f,saldo:e.target.value})} disabled={deshabilitado} required/>
            <input type="number" step="0.01" min="0" max="30" className="pasivos-section__input pasivos-section__input--tasa" placeholder="Tasa %" value={f.tasa} onChange={e=>setF({...f,tasa:e.target.value})} disabled={deshabilitado} required/>
            <button type="submit" className="pasivos-section__btn" disabled={deshabilitado}>{editando?'Guardar':'Añadir'}</button>
            {editando && <button type="button" className="pasivos-section__btn pasivos-section__btn--cancelar" onClick={cancelar} disabled={deshabilitado}>Cancelar</button>}
          </div>
          {error && <p className="pasivos-section__error" role="alert">{error}</p>}
        </form>
        <ul className="pasivos-section__lista">
          {datos.pasivos.map(p=>(<li key={p.nombre} className="pasivos-section__item"><div className="pasivos-section__item-info"><span className="pasivos-section__item-nombre">{p.nombre}</span><span className="pasivos-section__item-tasa">{p.tasa_interes_anual}%</span></div><div className="pasivos-section__item-acciones"><span className="pasivos-section__item-valor">{formatoMoneda(p.saldo_pendiente, moneda as 'MXN'|'USD'|'EUR')}</span><button className="pasivos-section__btn-icon" onClick={()=>editar(p)} disabled={deshabilitado} aria-label={`Editar ${p.nombre}`}>✎</button><button className="pasivos-section__btn-icon" onClick={()=>eliminar(p.nombre)} disabled={deshabilitado} aria-label={`Eliminar ${p.nombre}`}>✕</button></div></li>))}
          {datos.pasivos.length===0 && <li className="pasivos-section__vacio">Sin pasivos registrados</li>}
        </ul>
      </div>
    </AcordeonSeccion>
  );
}