// Formulario de pasivo (alta/edición). En edición el nombre es la clave
// del upsert y no se puede cambiar (evita duplicados al «renombrar»).
import { useState } from 'react';
import type { FormEvent } from 'react';
import type { Liability } from '../../domain/entities/liability.ts';
import { validarPasivo } from '../../domain/use-cases/balance-validaciones.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/balance-tablas.css';

interface Props {
  readonly inicial: Liability | null;
  readonly onSubmit: (nombre: string, saldoPendiente: number, tasaInteresAnual: number) => Promise<void>;
  readonly onCancel: () => void;
  readonly ocupando: boolean;
}

export function PasivoForm({ inicial, onSubmit, onCancel, ocupando }: Props) {
  const simbolo = simboloDe(usarMoneda());
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [saldo, setSaldo] = useState(inicial ? String(inicial.saldo_pendiente) : '');
  const [tasa, setTasa] = useState(inicial ? String(inicial.tasa_interes_anual) : '');
  const [error, setError] = useState<string | undefined>();

  const enviar = (e: FormEvent) => {
    e.preventDefault();
    const importe = Number(saldo);
    const anual = Number(tasa);
    const fallo = validarPasivo(nombre.trim(), importe, anual);
    setError(fallo ?? undefined);
    if (!fallo) void onSubmit(nombre.trim(), importe, anual);
  };

  return (
    <form className="balance-form" onSubmit={enviar}
      aria-label={inicial ? `Editar ${inicial.nombre}` : 'Nuevo pasivo'}>
      <label className="campo">
        <span className="campo__etiqueta">Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus
          disabled={ocupando || inicial !== null} placeholder="Tarjeta de crédito" />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Saldo pendiente ({simbolo})</span>
        <input type="number" step="0.01" min="0" value={saldo} required disabled={ocupando}
          onChange={(e) => setSaldo(e.target.value)} />
      </label>
      <label className="campo">
        <span className="campo__etiqueta">Tasa anual (%)</span>
        <input type="number" step="0.01" min="0" value={tasa} required disabled={ocupando}
          onChange={(e) => setTasa(e.target.value)} />
      </label>
      {error ? <p className="campo__error balance-form__error" role="alert">{error}</p> : null}
      <div className="balance-form__acciones">
        <button type="button" className="btn btn--fantasma" onClick={onCancel} disabled={ocupando}>Cancelar</button>
        <button type="submit" className="btn btn--primario" disabled={ocupando}>{inicial ? 'Guardar' : 'Añadir'}</button>
      </div>
    </form>
  );
}
