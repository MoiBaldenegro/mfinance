// REQ-08-02/06: formulario de Pasivo (crear/editar) con validación inline.
import { useState, FormEvent } from 'react';
import { validarPasivo } from '../../domain/use-cases/balance-validaciones.ts';
import { simboloDe } from '../../domain/entities/moneda.ts';
import { usarMoneda } from '../../hooks/use-moneda.ts';
import '../../styles/pasivos-table.css';

interface Props {
  readonly modo: { tipo: 'crear' } | { tipo: 'editar'; nombreOriginal: string };
  readonly initialData: { nombre: string; saldoPendiente: string; tasaInteresAnual: string };
  readonly onSubmit: (nombre: string, saldoPendiente: number, tasaInteresAnual: number) => Promise<void>;
  readonly onCancel: () => void;
  readonly ocupando: boolean;
}

export function PasivoForm({
  modo,
  initialData,
  onSubmit,
  onCancel,
  ocupando,
}: Props) {
  const simbolo = simboloDe(usarMoneda());
  const [form, setForm] = useState(initialData);
  const [error, setError] = useState<string | undefined>();

  const manejarSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const saldo = Number(form.saldoPendiente);
    const tasa = Number(form.tasaInteresAnual);
    const errorVal = validarPasivo(form.nombre, saldo, tasa);
    if (errorVal) {
      setError(errorVal);
      return;
    }
    try {
      await onSubmit(form.nombre, saldo, tasa);
      onCancel();
    } catch {
      // error manejado en hook
    }
  };

  return (
    <form className="balance-form" onSubmit={manejarSubmit}>
      <div className="balance-form__fila">
        <label className="balance-form__label">
          Nombre
          <input
            type="text"
            className="balance-form__input"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
            required
            disabled={ocupando}
          />
        </label>
        <label className="balance-form__label">
          Saldo pendiente ({simbolo})
          <input
            type="number"
            step="0.01"
            min="0"
            className="balance-form__input"
            value={form.saldoPendiente}
            onChange={(e) => setForm({ ...form, saldoPendiente: e.target.value })}
            required
            disabled={ocupando}
          />
        </label>
        <label className="balance-form__label">
          Tasa interés anual (%)
          <input
            type="number"
            step="0.01"
            min="0"
            className="balance-form__input"
            value={form.tasaInteresAnual}
            onChange={(e) => setForm({ ...form, tasaInteresAnual: e.target.value })}
            required
            disabled={ocupando}
          />
        </label>
      </div>
      {error && <p className="balance-form__error" role="alert">{error}</p>}
      <div className="balance-form__acciones">
        <button type="submit" className="btn btn--primario" disabled={ocupando}>
          {modo.tipo === 'crear' ? 'Crear' : 'Guardar'}
        </button>
        <button type="button" className="btn btn--secundario" onClick={onCancel} disabled={ocupando}>
          Cancelar
        </button>
      </div>
    </form>
  );
}