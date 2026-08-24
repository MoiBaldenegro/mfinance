// REQ-11-01/03/04/06/07: sección Inversiones con tabla editable por familia,
// proyección compuesta 5/10/20 años, gráfica Chart.js, total aportes y formateo.
import type { InvestmentFamily } from '../../domain/entities/catalogs.ts';
import { useInversiones } from './useInversiones';
import { TablaInversiones } from './TablaInversiones';
import { ProyeccionResumen } from './ProyeccionResumen';
import { GraficaProyeccion } from './GraficaProyeccion';
import { TotalInvertido } from './TotalInvertido';
import '../../styles/inversiones-section.css';

const FAMILIAS: readonly InvestmentFamily[] = ['RentaFija', 'RentaVariable', 'FincaRaiz'];

interface FilaTabla {
  familia: InvestmentFamily;
  aporte_mensual: number;
  valor_actual: number;
  tasa_esperada_anual: number;
}

interface Props {
  readonly snapshot: {
    readonly investments: readonly {
      readonly familia: InvestmentFamily;
      readonly aporte_mensual: number;
      readonly valor_actual: number;
      readonly tasa_esperada_anual: number;
    }[];
  };
}

export function InversionesSection({ snapshot }: Props) {
  const inversionesIniciales: FilaTabla[] = FAMILIAS.map((fam) => {
    const inv = snapshot.investments.find((i) => i.familia === fam);
    return inv
      ? { ...inv }
      : { familia: fam, aporte_mensual: 0, valor_actual: 0, tasa_esperada_anual: 0 };
  });

  const {
    filas,
    proyeccion,
    cargando,
    error,
    guardando,
    confirmar,
    actualizarCampo,
    totalAportes,
  } = useInversiones(inversionesIniciales);

  if (cargando) return <p className="inversiones-section__cargando estado-carga">Cargando…</p>;

  return (
    <section className="inversiones-section">
      <h2 className="inversiones-section__titulo">Inversiones</h2>

      <TotalInvertido total={totalAportes} />

      <TablaInversiones
        filas={filas}
        actualizarCampo={actualizarCampo}
        error={error}
      />

      <button
        className="inversiones-section__btn"
        onClick={confirmar}
        disabled={guardando}
      >
        {guardando ? 'Guardando…' : 'Confirmar cambios'}
      </button>

      <ProyeccionResumen proyeccion={proyeccion} />
      <GraficaProyeccion proyeccion={proyeccion} />
    </section>
  );
}