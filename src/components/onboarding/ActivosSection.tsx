// REQ-25-02: Sección Activos del Paso 2 — CRUD con validación delegada a
// dominio. El nombre identifica al activo: no se admiten duplicados.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { validarActivo } from '../../domain/use-cases/balance-validaciones.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import type { Paso2Data, OnboardingActivo } from '../../domain/entities/onboarding/index.ts';
import { AcordeonSeccion } from './AcordeonSeccion.tsx';
import { ListaBalance, ResumenBalance } from './BalanceComun.tsx';
import { Icono } from '../shell/Icono.tsx';
import '../../styles/onboarding-paso-balance.css';

type Categoria = OnboardingActivo['categoria'];
const CATS: readonly Categoria[] = ['liquido', 'inversion', 'propiedad'];
const LBL: Record<Categoria, string> = { liquido: 'Líquido', inversion: 'Inversión', propiedad: 'Propiedad' };
const VACIO = { nombre: '', categoria: 'liquido' as Categoria, valor: '' };

// Activos abre siempre (primer paso natural); el resto, solo si ya tiene datos.
const ABIERTO_INICIAL = true;

interface Props { readonly datos: Paso2Data; readonly alCambiar: (p: Paso2Data) => void; readonly moneda: Moneda; readonly deshabilitado: boolean; }

export function ActivosSection({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [f, setF] = useState(VACIO);
  // El formulario aparece al pulsar «Añadir» (o abierto si aún no hay ninguno).
  const [formAbierto, setFormAbierto] = useState(datos.activos.length === 0);
  const [abiertoInicial] = useState(ABIERTO_INICIAL || datos.activos.length > 0);
  const reiniciar = () => { setF(VACIO); setEditando(null); setError(null); setFormAbierto(false); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nombre = f.nombre.trim();
    const valor = Number(f.valor);
    const err = validarActivo(nombre, f.categoria, valor);
    if (err) { setError(err); return; }
    if (datos.activos.some((a) => a.nombre === nombre && a.nombre !== editando)) {
      setError(`Ya tienes un activo llamado «${nombre}».`); return;
    }
    const n: OnboardingActivo = { nombre, categoria: f.categoria, valor_actual: valor };
    alCambiar({ ...datos, activos: editando ? datos.activos.map((a) => (a.nombre === editando ? n : a)) : [...datos.activos, n] });
    reiniciar();
  };

  const editar = (clave: string) => {
    const a = datos.activos.find((x) => x.nombre === clave);
    if (a) { setF({ nombre: a.nombre, categoria: a.categoria, valor: String(a.valor_actual) }); setEditando(clave); setError(null); }
  };
  const eliminar = (clave: string) => {
    alCambiar({ ...datos, activos: datos.activos.filter((a) => a.nombre !== clave) });
    if (editando === clave) reiniciar();
  };
  const total = datos.activos.reduce((s, a) => s + a.valor_actual, 0);

  return (
    <AcordeonSeccion className="ob-balance" abiertoInicial={abiertoInicial} resumen={
      <ResumenBalance titulo="Activos" cantidad={String(datos.activos.length)} total={formatoMoneda(total, moneda)} />
    }>
      <div className="ob-balance__cuerpo">
        <ListaBalance vacio="Aún no has añadido activos: cuentas, efectivo, vehículos, inmuebles…"
          filas={datos.activos.map((a) => ({ clave: a.nombre, titulo: a.nombre, detalle: LBL[a.categoria], valor: formatoMoneda(a.valor_actual, moneda) }))}
          editando={editando} deshabilitado={deshabilitado} alEditar={editar} alEliminar={eliminar} />
        {!(formAbierto || editando) ? (
          <button type="button" className="btn btn--sm ob-balance__anadir" onClick={() => setFormAbierto(true)}
            disabled={deshabilitado}><Icono nombre="mas" tamano={14} /> Añadir activo</button>
        ) : (
        <form className="ob-balance__form" onSubmit={submit} aria-label={editando ? `Editar ${editando}` : 'Nuevo activo'}>
          <label className="campo">
            <span className="campo__etiqueta">Nombre</span>
            <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Cuenta de ahorro" disabled={deshabilitado} required />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Categoría</span>
            <select value={f.categoria} onChange={(e) => setF({ ...f, categoria: e.target.value as Categoria })} disabled={deshabilitado}>
              {CATS.map((c) => <option key={c} value={c}>{LBL[c]}</option>)}
            </select>
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Valor actual ({simboloDe(moneda)})</span>
            <input type="number" inputMode="decimal" step="0.01" min="0" value={f.valor} placeholder="0.00"
              onChange={(e) => setF({ ...f, valor: e.target.value })} disabled={deshabilitado} required />
          </label>
          <div className="ob-balance__form-acciones">
            <button type="button" className="btn btn--fantasma" onClick={reiniciar} disabled={deshabilitado}>Cancelar</button>
            <button type="submit" className="btn btn--primario" disabled={deshabilitado}>{editando ? 'Guardar' : 'Añadir activo'}</button>
          </div>
          {error && <p className="campo__error ob-balance__error" role="alert">{error}</p>}
        </form>
        )}
      </div>
    </AcordeonSeccion>
  );
}
