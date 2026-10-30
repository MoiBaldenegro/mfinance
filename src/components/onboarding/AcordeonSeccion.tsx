// Feature 34 (REQ-34-01/02): acordeón <details> NO controlado compartido por
// las secciones del Paso 2. El estado abierto/cerrado vive en el DOM (atributo
// open inicial, sin prop re-aplicada por React ni estado React de por medio):
// sin bucle de toggle ante re-renders del padre.
interface Props {
  readonly className: string;
  /** Cabecera <summary>; debe ser el primer hijo de <details>. */
  readonly resumen: React.ReactNode;
  readonly children: React.ReactNode;
  /** Estado inicial; el padre lo congela al montar para que no cambie entre renders. */
  readonly abiertoInicial?: boolean;
}

export function AcordeonSeccion({ className, resumen, children, abiertoInicial = true }: Props) {
  return (
    <details className={className} open={abiertoInicial}>
      {resumen}
      {children}
    </details>
  );
}
