// REQ-25-02: Sección Activos del Paso 2 - CRUD con validación delegada a dominio
import { useState } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { validarActivo } from '../../domain/use-cases/balance-validaciones.ts';
import type { Paso2Data, OnboardingActivo } from '../../domain/entities/onboarding/index.ts';
import { AcordeonSeccion } from './AcordeonSeccion.tsx';
import '../../styles/activos-section.css';

const CATS = ['liquido', 'inversion', 'propiedad'] as const;
const LBL = { liquido: 'Líquido', inversion: 'Inversión', propiedad: 'Propiedad' } as const;

interface Props { readonly datos: Paso2Data; readonly alCambiar: (p: Paso2Data) => void; readonly moneda: string; readonly deshabilitado: boolean; }

export function ActivosSection({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [f, setF] = useState({ nombre: '', categoria: 'liquido' as 'liquido'|'inversion'|'propiedad', valor: '' });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const v = parseFloat(f.valor);
    if (isNaN(v)) { setError('El valor debe ser un número'); return; }
    const err = validarActivo(f.nombre.trim(), f.categoria, v);
    if (err) { setError(err); return; }
    const n: OnboardingActivo = { nombre: f.nombre.trim(), categoria: f.categoria, valor_actual: v };
    alCambiar({ ...datos, activos: editando ? datos.activos.map(a => a.nombre===editando?n:a) : [...datos.activos, n] });
    setF({ nombre: '', categoria: 'liquido', valor: '' }); setEditando(null); setError(null);
  };

  const editar = (a: OnboardingActivo) => { setF({ nombre: a.nombre, categoria: a.categoria, valor: String(a.valor_actual) }); setEditando(a.nombre); setError(null); };
  const eliminar = (n: string) => alCambiar({ ...datos, activos: datos.activos.filter(a => a.nombre!==n) });
  const cancelar = () => { setF({ nombre: '', categoria: 'liquido', valor: '' }); setEditando(null); setError(null); };
  const total = datos.activos.reduce((s, a) => s + a.valor_actual, 0);

  return (
    <AcordeonSeccion className="activos-section__seccion" resumen={
      <summary className="activos-section__resumen"><span className="activos-section__titulo">Activos</span><span className="activos-section__total">{formatoMoneda(total, moneda as 'MXN'|'USD'|'EUR')}</span><span className="activos-section__count">({datos.activos.length})</span></summary>
    }>
      <div className="activos-section__contenido">
        <form className="activos-section__form" onSubmit={submit}>
          <div className="activos-section__fila">
            <input className="activos-section__input" placeholder="Nombre del activo" value={f.nombre} onChange={e=>setF({...f,nombre:e.target.value})} disabled={deshabilitado} required/>
            <select className="activos-section__select" value={f.categoria} onChange={e=>setF({...f,categoria:e.target.value as 'liquido'|'inversion'|'propiedad'})} disabled={deshabilitado}>{CATS.map(c=><option key={c} value={c}>{LBL[c]}</option>)}</select>
            <input type="number" step="0.01" min="0.01" className="activos-section__input activos-section__input--valor" placeholder="Valor" value={f.valor} onChange={e=>setF({...f,valor:e.target.value})} disabled={deshabilitado} required/>
            <button type="submit" className="activos-section__btn" disabled={deshabilitado}>{editando?'Guardar':'Añadir'}</button>
            {editando && <button type="button" className="activos-section__btn activos-section__btn--cancelar" onClick={cancelar} disabled={deshabilitado}>Cancelar</button>}
          </div>
          {error && <p className="activos-section__error" role="alert">{error}</p>}
        </form>
        <ul className="activos-section__lista">
          {datos.activos.map(a=>(<li key={a.nombre} className="activos-section__item"><div className="activos-section__item-info"><span className="activos-section__item-nombre">{a.nombre}</span><span className="activos-section__item-categoria">{LBL[a.categoria]}</span></div><div className="activos-section__item-acciones"><span className="activos-section__item-valor">{formatoMoneda(a.valor_actual, moneda as 'MXN'|'USD'|'EUR')}</span><button className="activos-section__btn-icon" onClick={()=>editar(a)} disabled={deshabilitado} aria-label={`Editar ${a.nombre}`}>✎</button><button className="activos-section__btn-icon" onClick={()=>eliminar(a.nombre)} disabled={deshabilitado} aria-label={`Eliminar ${a.nombre}`}>✕</button></div></li>))}
          {datos.activos.length===0 && <li className="activos-section__vacio">Sin activos registrados</li>}
        </ul>
      </div>
    </AcordeonSeccion>
  );
}