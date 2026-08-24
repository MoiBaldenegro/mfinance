# Requisitos — onboarding-paso-deuda-proyeccion (feature 26)

REQ-26-01 El sistema SHALL crear componente OnboardingPasoDeudaProyeccion.tsx con dos secciones: Estrategia Deuda y Supuestos Proyección.
REQ-26-02 El sistema SHALL renderizar en sección Deuda selector radio Avalancha/Bola de nieve (default Avalancha); elección persiste en onboarding_data.deuda.estrategia.
REQ-26-03 El sistema SHALL renderizar campo pago extra mensual ≥0 (default 0) formateado moneda; validar número no negativo; persiste en onboarding_data.deuda.pago_extra_mensual.
REQ-26-04 El sistema SHALL renderizar tabla supuestos % por variable (fuentes ingreso paso 1, categorías gasto paso 1, revalorización activos, interés pasivos) cada celda % default 0% rango -50% a +100%.
REQ-26-05 El sistema SHALL reutilizar motor plan-deuda (feature 9) para ordenar deudas según estrategia y calcular proyección con pago extra SIN duplicar lógica avalancha/bola de nieve.
REQ-26-06 El sistema SHALL reutilizar motor pyg-proyeccion-supuestos (feature 14) para aplicar supuestos % a 12 meses distinguir histórico/proyectado SIN duplicar lógica.
REQ-26-07 El sistema SHALL mostrar vista previa solo lectura bajo tabla supuestos: PyG proyectado 12 meses (ingresos, gastos, utilidad, ahorro acumulado) y patrimonio 12 meses; recalculo en vivo al cambiar supuestos.
REQ-26-08 El sistema SHALL guardar onboarding_data.deuda (estrategia, pago_extra) y onboarding_data.proyeccion (supuestos) en backend vía actualizarDatos con debounce 500ms o al cambiar paso.
REQ-26-09 El sistema SHALL permitir avanzar SIN datos obligatorios (usuario puede no tener deudas ni querer proyección); botón Siguiente siempre habilitado.
REQ-26-10 El sistema SHALL incluir tests node:test TDD rojo→verde para: caso uso valida/guarda deuda y proyección en onboarding_data, componente render 2 secciones, selector estrategia actualiza onboarding_data, campo pago extra valida ≥0, tabla supuestos edita y recalcula vista previa, mocks verifican delegación a puertos deuda/proyección.
REQ-26-11 El sistema SHALL colocar componente en components/onboarding/, estilos en styles/, casos uso en domain/use-cases/onboarding/, puertos en domain/ports/; domain sin react/@tauri-apps/api; invoke solo en adapter; ≤100 líneas/archivo; audit-design-tokens OK.