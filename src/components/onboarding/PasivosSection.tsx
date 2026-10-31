// REQ-25-03: Sección Pasivos del Paso 2 — CRUD con validación delegada a
// dominio (validarPasivo + validarTasa). Sin nombres duplicados.
import { useState } from 'react';
import type { FormEvent } from 'react';
import { formatoMoneda } from '../../domain/use-cases/formato-moneda.ts';
import { validarPasivo } from '../../domain/use-cases/balance-validaciones.ts';
import { validarTasa } from '../../domain/use-cases/inversiones-proyeccion.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import type { Moneda } from '../../domain/entities/moneda.ts';
import type { Paso2Data, OnboardingPasivo } from '../../domain/entities/onboarding/index.ts';
import { AcordeonSeccion } from './AcordeonSeccion.tsx';
import { ListaBalance, ResumenBalance } from './BalanceComun.tsx';
import { Icono } from '../shell/Icono.tsx';
import '../../styles/onboarding-paso-balance.css';

const VACIO = { nombre: '', saldo: '', tasa: '' };

// Activos abre siempre (primer paso natural); el resto, solo si ya tiene datos.
const ABIERTO_INICIAL = false;

interface Props { readonly datos: Paso2Data; readonly alCambiar: (p: Paso2Data) => void; readonly moneda: Moneda; readonly deshabilitado: boolean; }

export function PasivosSection({ datos, alCambiar, moneda, deshabilitado }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [editando, setEditando] = useState<string | null>(null);
  const [f, setF] = useState(VACIO);
  // El formulario aparece al pulsar «Añadir» (o abierto si aún no hay ninguno).
  const [formAbierto, setFormAbierto] = useState(datos.pasivos.length === 0);
  const [abiertoInicial] = useState(ABIERTO_INICIAL || datos.pasivos.length > 0);
  const reiniciar = () => { setF(VACIO); setEditando(null); setError(null); setFormAbierto(false); };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const nombre = f.nombre.trim();
    const saldo = Number(f.saldo), tasa = Number(f.tasa);
    const err = validarPasivo(nombre, saldo, tasa);
    if (err) { setError(err); return; }
    const et = validarTasa(tasa);
    if (!et.valida) { setError(et.mensaje); return; }
    if (datos.pasivos.some((p) => p.nombre === nombre && p.nombre !== editando)) {
      setError(`Ya tienes un pasivo llamado «${nombre}».`); return;
    }
    const n: OnboardingPasivo = { nombre, saldo_pendiente: saldo, tasa_interes_anual: tasa };
    alCambiar({ ...datos, pasivos: editando ? datos.pasivos.map((p) => (p.nombre === editando ? n : p)) : [...datos.pasivos, n] });
    reiniciar();
  };

  const editar = (clave: string) => {
    const p = datos.pasivos.find((x) => x.nombre === clave);
    if (p) { setF({ nombre: p.nombre, saldo: String(p.saldo_pendiente), tasa: String(p.tasa_interes_anual) }); setEditando(clave); setError(null); }
  };
  const eliminar = (clave: string) => {
    alCambiar({ ...datos, pasivos: datos.pasivos.filter((p) => p.nombre !== clave) });
    if (editando === clave) reiniciar();
  };
  const total = datos.pasivos.reduce((s, p) => s + p.saldo_pendiente, 0);

  return (
    <AcordeonSeccion className="ob-balance" abiertoInicial={abiertoInicial} resumen={
      <ResumenBalance titulo="Pasivos" cantidad={String(datos.pasivos.length)} total={formatoMoneda(total, moneda)} />
    }>
      <div className="ob-balance__cuerpo">
        <ListaBalance vacio="Aún no has añadido deudas: tarjetas, préstamos, hipoteca…"
          filas={datos.pasivos.map((p) => ({ clave: p.nombre, titulo: p.nombre, detalle: `${p.tasa_interes_anual}% anual`, valor: formatoMoneda(p.saldo_pendiente, moneda) }))}
          editando={editando} deshabilitado={deshabilitado} alEditar={editar} alEliminar={eliminar} />
        {!(formAbierto || editando) ? (
          <button type="button" className="btn btn--sm ob-balance__anadir" onClick={() => setFormAbierto(true)}
            disabled={deshabilitado}><Icono nombre="mas" tamano={14} /> Añadir pasivo</button>
        ) : (
        <form className="ob-balance__form" onSubmit={submit} aria-label={editando ? `Editar ${editando}` : 'Nuevo pasivo'}>
          <label className="campo">
            <span className="campo__etiqueta">Nombre</span>
            <input value={f.nombre} onChange={(e) => setF({ ...f, nombre: e.target.value })} placeholder="Tarjeta de crédito" disabled={deshabilitado} required />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Saldo pendiente ({simboloDe(moneda)})</span>
            <input type="number" inputMode="decimal" step="0.01" min="0" value={f.saldo} placeholder="0.00"
              onChange={(e) => setF({ ...f, saldo: e.target.value })} disabled={deshabilitado} required />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">Tasa anual (%)</span>
            <input type="number" inputMode="decimal" step="0.01" min="0" max="30" value={f.tasa} placeholder="0"
              onChange={(e) => setF({ ...f, tasa: e.target.value })} disabled={deshabilitado} required />
          </label>
          <div className="ob-balance__form-acciones">
            <button type="button" className="btn btn--fantasma" onClick={reiniciar} disabled={deshabilitado}>Cancelar</button>
            <button type="submit" className="btn btn--primario" disabled={deshabilitado}>{editando ? 'Guardar' : 'Añadir pasivo'}</button>
          </div>
          {error && <p className="campo__error ob-balance__error" role="alert">{error}</p>}
        </form>
        )}
      </div>
    </AcordeonSeccion>
  );
}
