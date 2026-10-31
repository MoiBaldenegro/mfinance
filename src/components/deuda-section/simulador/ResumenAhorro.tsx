// Resumen de ahorro del escenario optimizado (REQ-15-04): meses e
// intereses ahorrados en euros, con color positivo de los tokens.

interface Props {
  readonly mesesAhorrados: number;
  readonly interesesAhorrados: string;
  readonly hayAhorro: boolean;
}

export function ResumenAhorro({ mesesAhorrados, interesesAhorrados, hayAhorro }: Props) {
  if (!hayAhorro) {
    return (
      <p className="aviso">
        Añade un extra mensual o extraordinario para comparar el ahorro.
      </p>
    );
  }
  return (
    <p className="aviso aviso--exito" role="status">
      Con la optimización liquidas <strong>{mesesAhorrados}</strong>{' '}
      {mesesAhorrados === 1 ? 'mes antes' : 'meses antes'} y ahorras{' '}
      <strong>{interesesAhorrados}</strong> en
      intereses.
    </p>
  );
}
