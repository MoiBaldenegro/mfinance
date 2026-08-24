# Requisitos — perfiles-onboarding-modelo (feature 23)

REQ-23-01 El sistema SHALL extender la entidad Perfil en domain/perfil.rs con campo onboarding_status de tipo OnboardingStatus que tome valores NotStarted, InProgress { current_step: u8 }, Completed.
REQ-23-02 El sistema SHALL extender la entidad Perfil con campo onboarding_data de tipo OnboardingData que contenga los datos parciales del wizard (personales, moneda, fuentes, categorías, balance, deuda, proyección, indicadores).
REQ-23-03 El sistema SHALL extender la entidad Perfil con campo goals_journal de tipo Vec<GoalEntry> donde GoalEntry tenga id, titulo, descripcion, tags, creado_en.
REQ-23-04 El sistema SHALL extender la entidad Perfil con campo financial_profile de tipo FinancialProfile con fuentes_ingreso_activas, categorias_gasto_usadas, estrategia_deuda_preferida, pago_extra_mensual, familias_inversion_activas, tasas_esperadas, umbrales_indicadores.
REQ-23-05 El sistema SHALL actualizar el trait PerfilRepository para que sus métodos operen con la entidad Perfil extendida incluyendo onboarding_status, onboarding_data, goals_journal, financial_profile.
REQ-23-06 El sistema SHALL implementar en infrastructure/perfil_repository_json.rs la serialización de los nuevos campos en profiles.json y snapshot por perfil con compatibilidad hacia atrás (defaults).
REQ-23-07 El sistema SHALL proveer command actualizar_perfil_onboarding que reciba perfil_id y onboarding_data parcial y actualice el perfil devolviendo Result<(), PerfilError>.
REQ-23-08 El sistema SHALL proveer command completar_onboarding que reciba perfil_id, marque onboarding_status=Completed, consolide onboarding_data en StrategySettings/Investment/financial_profile y devuelva Result<Perfil, PerfilError>.
REQ-23-09 El sistema SHALL proveer command obtener_onboarding_status que reciba perfil_id y devuelva Result<OnboardingStatus, PerfilError>.
REQ-23-10 El sistema SHALL al cargar perfiles existentes sin nuevos campos asignar por defecto onboarding_status=Completed, onboarding_data=default, goals_journal=[], financial_profile=default sin alterar el resto.
REQ-23-11 El sistema SHALL validar GoalEntry: titulo no vacío ≤100 chars, descripcion ≤5000 chars, tags no vacíos ≤20 chars máx 5; si falla devolver error nombrado GoalEntryError.
REQ-23-12 El sistema SHALL garantizar que domain/perfil.rs y nuevos archivos domain/ no importen tauri (grep 0) siendo testeables con cargo test aislado.
REQ-23-13 El sistema SHALL incluir tests cargo test TDD rojo→verde para: creación Perfil extendido, round-trip JSON, migración legacy, validación GoalEntry, commands actualizar/completar/obtener_status.