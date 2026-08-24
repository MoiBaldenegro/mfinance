// REQ-14-03: campo editable de una variación % mensual. El texto es
// libre mientras se escribe (permite teclear "-" o borrar) y solo se
// normaliza al perder el foco; el padre decide cuándo recalcular.
import { useState } from 'react';
import {
  formatearVariacion,
  parsearVariacion,
} from '../../domain/use-cases/pyg-proyeccion-supuestos.ts';
import '../../styles/formulario-supuestos.css';

interface Props {
  readonly etiqueta: string;
  readonly valor: number;
  readonly onCambio: (nuevo: number) => void;
}

export function CampoVariacion({ etiqueta, valor, onCambio }: Props) {
  const [texto, setTexto] = useState(() => formatearVariacion(valor));

  const handleChange = (evento: React.ChangeEvent<HTMLInputElement>) => {
    setTexto(evento.target.value);
    onCambio(parsearVariacion(evento.target.value));
  };

  const handleBlur = () => {
    const normalizado = formatearVariacion(parsearVariacion(texto));
    setTexto(normalizado);
    onCambio(parsearVariacion(normalizado));
  };

  const id = `supuesto-${etiqueta.toLowerCase().replace(/\s+/g, '-')}`;

  return (
    <div className="formulario-supuestos__campo">
      <label className="formulario-supuestos__etiqueta" htmlFor={id}>
        {etiqueta}
      </label>
      <input
        id={id}
        type="text"
        inputMode="text"
        className="formulario-supuestos__input"
        value={texto}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder="+0,0%"
        aria-label={`Variación mensual para ${etiqueta}`}
      />
    </div>
  );
}
