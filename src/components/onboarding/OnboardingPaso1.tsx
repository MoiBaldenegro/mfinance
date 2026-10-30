// REQ-24-06/07/08/09: Paso 1 del wizard de onboarding: nombre, moneda
// (segmentado), fuentes de ingreso y categorías de gasto (chips con
// checkbox nativo). Valida ≥1 fuente y ≥1 categoría; el «Saltar» vive en
// el pie del asistente.
import { useState } from 'react';
import type { Paso1Data } from '../../domain/entities/onboarding/index.ts';
import { INCOME_SOURCES, INCOME_SOURCE_LABELS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '../../domain/entities/catalogs.ts';
import { MONEDAS, ETIQUETA_MONEDA } from '../../domain/entities/moneda.ts';
import { Icono } from '../shell/Icono.tsx';
import '../../styles/onboarding-paso1.css';

interface Props {
  readonly datos: Paso1Data;
  readonly alCambiar: (campo: keyof Paso1Data, valor: Paso1Data[keyof Paso1Data]) => void;
  readonly deshabilitado: boolean;
}

type CampoLista = 'fuentes_ingreso_activas' | 'categorias_gasto_usadas';

export function OnboardingPaso1({ datos, alCambiar, deshabilitado }: Props) {
  // Los avisos de campo aparecen tras interactuar con él, no al abrir el paso.
  const [tocado, setTocado] = useState({ nombre: false, fuentes: false, categorias: false });
  const tocar = (campo: keyof typeof tocado) => setTocado((t) => ({ ...t, [campo]: true }));

  const nombreValido = datos.nombre_completo.trim().length > 0;
  const tieneFuentes = datos.fuentes_ingreso_activas.length > 0;
  const tieneCategorias = datos.categorias_gasto_usadas.length > 0;
  const pasoValido = nombreValido && tieneFuentes && tieneCategorias;

  const alternar = (campo: CampoLista, valor: string) => {
    const actuales = datos[campo];
    alCambiar(campo, actuales.includes(valor) ? actuales.filter((v) => v !== valor) : [...actuales, valor]);
    tocar(campo === 'fuentes_ingreso_activas' ? 'fuentes' : 'categorias');
  };

  return (
    <div className="onboarding-paso1">
      <div className="rejilla rejilla--2">
        <label className="campo" htmlFor="nombre-completo">
          <span className="campo__etiqueta">Nombre completo</span>
          <input id="nombre-completo" type="text" value={datos.nombre_completo} autoFocus
            onChange={(e) => alCambiar('nombre_completo', e.target.value)} onBlur={() => tocar('nombre')}
            placeholder="Ana López" disabled={deshabilitado} aria-required="true"
            aria-invalid={tocado.nombre && !nombreValido ? true : undefined} />
          {tocado.nombre && !nombreValido && <span className="campo__error" role="alert">El nombre es obligatorio.</span>}
        </label>

        <fieldset className="campo">
          <legend className="campo__etiqueta onboarding-paso1__leyenda">Moneda de visualización</legend>
          <div className="segmentado onboarding-paso1__monedas">
            {MONEDAS.map((m) => (
              <label key={m} className="segmentado__opcion onboarding-paso1__moneda">
                <input type="radio" name="moneda" value={m} className="solo-lectores" checked={datos.moneda === m}
                  onChange={() => alCambiar('moneda', m)} disabled={deshabilitado} />
                <strong>{m}</strong> <span className="onboarding-paso1__moneda-nombre">{ETIQUETA_MONEDA[m]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <GrupoChips leyenda="¿De dónde vienen tus ingresos?" ayuda="Elige al menos una fuente."
        opciones={INCOME_SOURCES.map((f) => ({ valor: f.toLowerCase(), label: INCOME_SOURCE_LABELS[f] }))}
        seleccion={datos.fuentes_ingreso_activas} alAlternar={(v) => alternar('fuentes_ingreso_activas', v)}
        deshabilitado={deshabilitado}
        error={tocado.fuentes && !tieneFuentes ? 'Selecciona al menos una fuente de ingreso.' : null} />

      <GrupoChips leyenda="¿En qué gastas normalmente?" ayuda="Elige al menos una categoría."
        opciones={EXPENSE_CATEGORIES.map((c) => ({ valor: c.toLowerCase(), label: EXPENSE_CATEGORY_LABELS[c] }))}
        seleccion={datos.categorias_gasto_usadas} alAlternar={(v) => alternar('categorias_gasto_usadas', v)}
        deshabilitado={deshabilitado}
        error={tocado.categorias && !tieneCategorias ? 'Selecciona al menos una categoría de gasto.' : null} />

      <p className={`onboarding-paso1__validez ${pasoValido ? 'onboarding-paso1__validez--ok' : ''}`} role="status">
        {pasoValido
          ? <><Icono nombre="check" tamano={16} /> Todo listo, puedes continuar.</>
          : 'Completa tu nombre y elige al menos una fuente de ingreso y una categoría de gasto.'}
      </p>
    </div>
  );
}

interface GrupoChipsProps {
  readonly leyenda: string;
  readonly ayuda: string;
  readonly opciones: readonly { readonly valor: string; readonly label: string }[];
  readonly seleccion: readonly string[];
  readonly alAlternar: (valor: string) => void;
  readonly deshabilitado: boolean;
  readonly error: string | null;
}

/** Grupo de chips seleccionables respaldados por checkbox nativos. */
function GrupoChips({ leyenda, ayuda, opciones, seleccion, alAlternar, deshabilitado, error }: GrupoChipsProps) {
  return (
    <fieldset className="onboarding-paso1__grupo">
      <legend className="onboarding-paso1__leyenda">{leyenda}</legend>
      <p className="campo__ayuda">{ayuda}</p>
      <div className="onboarding-paso1__chips">
        {opciones.map((o) => (
          <label key={o.valor} className="onboarding-paso1__chip">
            <input type="checkbox" className="solo-lectores" checked={seleccion.includes(o.valor)}
              onChange={() => alAlternar(o.valor)} disabled={deshabilitado} />
            <span className="onboarding-paso1__chip-marca" aria-hidden="true"><Icono nombre="check" tamano={12} /></span>
            {o.label}
          </label>
        ))}
      </div>
      {error && <p className="campo__error" role="alert">{error}</p>}
    </fieldset>
  );
}
