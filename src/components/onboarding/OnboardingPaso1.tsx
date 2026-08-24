// REQ-24-06/07/08/09: Paso 1 del wizard de onboarding.
// Renderiza: nombre completo, selector moneda, fuentes ingreso (checkboxes),
// categorías gasto (checkboxes), botón Saltar. Valida ≥1 fuente y ≥1 categoría.
import { useMemo } from 'react';
import type { Paso1Data } from '../../domain/entities/onboarding/index.ts';
import { INCOME_SOURCES, INCOME_SOURCE_LABELS, EXPENSE_CATEGORIES, EXPENSE_CATEGORY_LABELS } from '../../domain/entities/catalogs.ts';
import { MONEDAS, ETIQUETA_MONEDA } from '../../domain/entities/moneda.ts';
import '../../styles/onboarding-paso1.css';

interface Props {
  readonly datos: Paso1Data;
  readonly alCambiar: (campo: keyof Paso1Data, valor: Paso1Data[keyof Paso1Data]) => void;
  readonly alSaltar: () => void;
  readonly deshabilitado: boolean;
}

export function OnboardingPaso1({ datos, alCambiar, alSaltar, deshabilitado }: Props) {
  const fuentesIngreso = useMemo(() => INCOME_SOURCES.map((fuente) => ({
    valor: fuente,
    label: INCOME_SOURCE_LABELS[fuente],
    activa: datos.fuentes_ingreso_activas.includes(fuente.toLowerCase()),
  })), [datos.fuentes_ingreso_activas]);

  const categoriasGasto = useMemo(() => EXPENSE_CATEGORIES.map((cat) => ({
    valor: cat,
    label: EXPENSE_CATEGORY_LABELS[cat],
    activa: datos.categorias_gasto_usadas.includes(cat.toLowerCase()),
  })), [datos.categorias_gasto_usadas]);

  const tieneFuentes = fuentesIngreso.some((f) => f.activa);
  const tieneCategorias = categoriasGasto.some((c) => c.activa);
  const nombreValido = datos.nombre_completo.trim().length > 0;
  const pasoValido = nombreValido && tieneFuentes && tieneCategorias;

  const toggleFuente = (valor: string) => {
    const nuevas = datos.fuentes_ingreso_activas.includes(valor)
      ? datos.fuentes_ingreso_activas.filter((v: string) => v !== valor)
      : [...datos.fuentes_ingreso_activas, valor];
    alCambiar('fuentes_ingreso_activas', nuevas);
  };

  const toggleCategoria = (valor: string) => {
    const nuevas = datos.categorias_gasto_usadas.includes(valor)
      ? datos.categorias_gasto_usadas.filter((v: string) => v !== valor)
      : [...datos.categorias_gasto_usadas, valor];
    alCambiar('categorias_gasto_usadas', nuevas);
  };

  return (
    <section className="onboarding-paso1">
      <h3 className="onboarding-paso1__titulo">Paso 1: Datos personales y configuración base</h3>

      {/* Nombre completo */}
      <div className="onboarding-paso1__campo">
        <label htmlFor="nombre-completo" className="onboarding-paso1__etiqueta">
          Nombre completo <span className="onboarding-paso1__requerido">*</span>
        </label>
        <input
          id="nombre-completo"
          type="text"
          className="onboarding-paso1__input"
          value={datos.nombre_completo}
          onChange={(e) => alCambiar('nombre_completo', e.target.value)}
          placeholder="Tu nombre completo"
          disabled={deshabilitado}
          aria-required="true"
        />
        {!nombreValido && (
          <p className="onboarding-paso1__error" role="alert">el nombre es obligatorio</p>
        )}
      </div>

      {/* Selector de moneda */}
      <div className="onboarding-paso1__campo">
        <label htmlFor="moneda" className="onboarding-paso1__etiqueta">
          Moneda de visualización
        </label>
        <select
          id="moneda"
          className="onboarding-paso1__select"
          value={datos.moneda}
          onChange={(e) => alCambiar('moneda', e.target.value as typeof MONEDAS[number])}
          disabled={deshabilitado}
        >
          {MONEDAS.map((m: typeof MONEDAS[number]) => (
            <option key={m} value={m}>{ETIQUETA_MONEDA[m]}</option>
          ))}
        </select>
      </div>

      {/* Fuentes de ingreso */}
      <fieldset className="onboarding-paso1__grupo">
        <legend className="onboarding-paso1__legend">Fuentes de ingreso <span className="onboarding-paso1__requerido">*</span></legend>
        <p className="onboarding-paso1__ayuda">Selecciona al menos una</p>
        <div className="onboarding-paso1__checkboxes">
          {fuentesIngreso.map((fuente) => (
            <label key={fuente.valor} className="onboarding-paso1__checkbox-label">
              <input
                type="checkbox"
                checked={fuente.activa}
                onChange={() => toggleFuente(fuente.valor.toLowerCase())}
                disabled={deshabilitado}
              />
              <span>{fuente.label}</span>
            </label>
          ))}
        </div>
        {!tieneFuentes && (
          <p className="onboarding-paso1__error" role="alert">selecciona al menos una fuente de ingreso</p>
        )}
      </fieldset>

      {/* Categorías de gasto */}
      <fieldset className="onboarding-paso1__grupo">
        <legend className="onboarding-paso1__legend">Categorías de gasto <span className="onboarding-paso1__requerido">*</span></legend>
        <p className="onboarding-paso1__ayuda">Selecciona al menos una</p>
        <div className="onboarding-paso1__checkboxes">
          {categoriasGasto.map((cat) => (
            <label key={cat.valor} className="onboarding-paso1__checkbox-label">
              <input
                type="checkbox"
                checked={cat.activa}
                onChange={() => toggleCategoria(cat.valor.toLowerCase())}
                disabled={deshabilitado}
              />
              <span>{cat.label}</span>
            </label>
          ))}
        </div>
        {!tieneCategorias && (
          <p className="onboarding-paso1__error" role="alert">selecciona al menos una categoría de gasto</p>
        )}
      </fieldset>

      {/* Botón Saltar */}
      <div className="onboarding-paso1__saltar">
        <button
          type="button"
          className="onboarding-paso1__btn-saltar"
          onClick={alSaltar}
          disabled={deshabilitado}
        >
          Saltar onboarding
        </button>
        <p className="onboarding-paso1__saltar-ayuda">
          Crea un perfil mínimo (nombre + pesos mexicanos) y accede directo a la app.
        </p>
      </div>

      {/* Indicador de validez del paso */}
      <div className={`onboarding-paso1__validez ${pasoValido ? 'onboarding-paso1__validez--ok' : ''}`}>
        {pasoValido ? (
          <span className="onboarding-paso1__validez-ok">✓ Paso 1 completo — puedes continuar</span>
        ) : (
          <span className="onboarding-paso1__validez-falta">Completa los campos obligatorios para continuar</span>
        )}
      </div>
    </section>
  );
}