//! Tests REQ-30: onboarding-defer-seed-until-complete
//! TDD rojo→verde: arranque_frio sin seed, completar_onboarding siembra
//! snapshot vacío mínimo si no existe, no resiembra si existe, reinicio carga.

use crate::application::arranque_perfiles::preparar_arranque;
use crate::application::perfiles::{crear, seleccionar};
use crate::application::perfiles_onboarding;
use crate::commands::perfiles_onboarding_commands::completar_onboarding_core;
use crate::domain::currency::Currency;
use crate::domain::investment::InvestmentFamily;
use crate::domain::onboarding::{
    OnboardingData, OnboardingInversion, OnboardingStatus, Paso1Data, Paso2Data, Paso3Data,
};
use crate::domain::perfil_repository::PerfilRepository;
use crate::domain::repository::SnapshotRepository;
use crate::domain::snapshot::{DebtStrategy, FinanceSnapshot};
use crate::infrastructure::json_repository::JsonSnapshotRepository;
use crate::infrastructure::test_support::{cleanup, temp_dir};
use crate::seed;

/// Datos mínimos del wizard (pasos 1-3) para las rutas probadas.
fn datos_onboarding(nombre: &str, moneda: Currency, estrategia: &str) -> OnboardingData {
    OnboardingData {
        paso1: Some(Paso1Data {
            nombre_completo: nombre.into(),
            moneda,
            fuentes_ingreso_activas: vec!["salario".into()],
            categorias_gasto_usadas: vec!["vivienda".into()],
        }),
        paso2: Some(Paso2Data {
            activos: vec![],
            pasivos: vec![],
            inversiones: vec![OnboardingInversion {
                familia: "renta_fija".into(),
                aporte_mensual: 500.0,
                valor_actual: 5000.0,
                tasa_esperada_anual: 7.5,
            }],
        }),
        paso3: Some(Paso3Data {
            estrategia_deuda: Some(estrategia.into()),
            pago_extra_mensual: Some(250.0),
            supuestos_proyeccion: Vec::new(),
        }),
        ..Default::default()
    }
}

#[test]
fn arranque_frio_crea_perfil_sin_snapshot_ni_seed() {
    // REQ-30-01: arranque_frio crea perfil Personal NotStarted SIN llamar ensure_seed
    // → NO existe perfiles/<id>/mfinance.json
    let base = temp_dir("f30_arranque_frio_sin_seed");
    let mut store = JsonSnapshotRepository::new(base.clone());

    // Sin profiles.json → flujo frío
    let fue_frio = preparar_arranque(&mut store).expect("preparar_arranque ok");
    assert!(fue_frio, "debe ser flujo frío (alta inicial)");

    let registro = store.cargar_registro().expect("cargar registro").expect("registro existe");
    assert_eq!(registro.perfiles.len(), 1);
    assert_eq!(registro.perfiles[0].nombre, "Personal");
    assert_eq!(
        registro.perfiles[0].onboarding_status,
        OnboardingStatus::NotStarted
    );
    let id = registro.activa.expect("activo").clone();
    assert_eq!(registro.perfiles[0].id, id);

    // Verificar que NO existe snapshot (ni seed)
    let ruta_snapshot = crate::infrastructure::rutas_mfinance::snapshot_de(&base, &id);
    assert!(
        !ruta_snapshot.exists(),
        "REQ-30-01: NO debe existir snapshot tras arranque_frio (sin seed)"
    );

    // load_state debe fallar con SnapshotLoadError (archivo no existe)
    // REQ-30-06: el error "sin perfil activo..." es cuando NO hay activo;
    // aquí HAY activo pero no existe su archivo → error de archivo no encontrado
    let err = store.load().expect_err("load debe fallar sin snapshot");
    let msg = err.to_string();
    assert!(
        msg.contains("no se pudo leer") || msg.contains("no se pudo cargar el snapshot"),
        "error debe ser de archivo no encontrado o carga fallida, got: {}",
        msg
    );

    cleanup(&base);
}

#[test]
fn recuperar_r3_no_llama_ensure_seed_solo_persiste_activo() {
    // REQ-30-02: recuperar regla R3 (nadie tiene snapshot legible) → NO llama ensure_seed
    // Persiste el activo elegido (el primero) y devuelve Ok(false) sin sembrar
    let base = temp_dir("f30_recuperar_r3_sin_seed");
    let perfiles = vec![
        crate::infrastructure::arranque28_soporte::perfil("p_uno", "Uno"),
        crate::infrastructure::arranque28_soporte::perfil("p_dos", "Dos"),
    ];
    crate::infrastructure::arranque28_soporte::escribir_registro(
        &base,
        &crate::domain::registro_perfiles::RegistroPerfiles {
            activa: None,
            perfiles,
        },
    );

    let mut store = JsonSnapshotRepository::new(base.clone());
    let fue_frio = preparar_arranque(&mut store).expect("autorecuperación");
    assert!(!fue_frio, "NO es flujo frío, es autorecuperación R3");

    // Debe haber elegido el primero como activo y persistido
    assert_eq!(store.activo(), Some("p_uno"));
    let registro = store.cargar_registro().expect("cargar registro").unwrap();
    assert_eq!(registro.activa.as_deref(), Some("p_uno"));

    // PERO no debe haber sembrado snapshot (no existe archivo)
    let ruta_snapshot = crate::infrastructure::rutas_mfinance::snapshot_de(&base, "p_uno");
    assert!(
        !ruta_snapshot.exists(),
        "REQ-30-02: R3 NO debe sembrar snapshot (no ensure_seed)"
    );

    // load_state debe fallar con error de archivo no encontrado
    // (hay activo pero no existe su archivo snapshot)
    let err = store.load().expect_err("load debe fallar sin snapshot");
    let msg = err.to_string();
    assert!(
        msg.contains("no se pudo leer") || msg.contains("no se pudo cargar el snapshot"),
        "error debe ser de archivo no encontrado o carga fallida, got: {}",
        msg
    );

    cleanup(&base);
}

#[test]
fn completar_onboarding_siembra_snapshot_vacio_minimo_si_no_existe() {
    // REQ-30-03: completar_onboarding siembra snapshot base (vacío mínimo) una sola vez si no existe
    let base = temp_dir("f30_completar_siembra_vacio");
    let mut repo = JsonSnapshotRepository::new(base.clone());

    // Crear perfil fresco (NotStarted) SIN snapshot previo
    let nuevo = crear(&mut repo, "Nuevo Usuario").expect("crear perfil");
    assert_eq!(nuevo.onboarding_status, OnboardingStatus::NotStarted);

    // Rellenar datos de onboarding
    perfiles_onboarding::actualizar_onboarding(
        &mut repo,
        &nuevo.id,
        datos_onboarding("Nuevo Usuario", Currency::Mxn, "Avalanche"),
    )
    .expect("actualizar onboarding");

    // Completar onboarding → debe sembrar snapshot vacío + aplicar onboarding
    let perfil = completar_onboarding_core(&mut repo, &nuevo.id).expect("completar onboarding");

    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);

    // Verificar que AHORA existe snapshot
    let snapshot = repo.load().expect("load snapshot tras completar onboarding");
    // Debe ser snapshot vacío mínimo (no el seed real): sin monthly_records, assets, liabilities, account_statements, assessments
    // PERO con las inversiones del onboarding (paso2)
    assert_eq!(
        snapshot.monthly_records.len(),
        0,
        "REQ-30-03/05: snapshot sembrado debe ser vacío mínimo (sin monthly_records)"
    );
    assert_eq!(snapshot.assets.len(), 0, "sin assets (no vienen en onboarding paso2 de este test)");
    assert_eq!(snapshot.liabilities.len(), 0, "sin liabilities (no vienen en onboarding paso2 de este test)");
    assert_eq!(snapshot.investments.len(), 1, "con la inversión del onboarding paso2");
    assert_eq!(snapshot.account_statements.len(), 0);
    assert_eq!(snapshot.assessments.len(), 0);

    // Pero SÍ debe tener la configuración del onboarding aplicada
    assert_eq!(snapshot.strategy.currency, Currency::Mxn);
    assert_eq!(snapshot.strategy.debt_strategy, DebtStrategy::Avalanche);
    assert_eq!(snapshot.strategy.extra_monthly_payment, 250.0);
    let inv = snapshot
        .investments
        .iter()
        .find(|i| i.familia() == InvestmentFamily::RentaFija)
        .expect("inversión renta_fija debe existir tras consolidar");
    assert_eq!(inv.tasa_esperada_anual(), 7.5);

    cleanup(&base);
}

#[test]
fn completar_onboarding_no_resiembra_si_snapshot_ya_existe() {
    // REQ-30-04: si completar_onboarding se ejecuta y el snapshot YA existe → NO sobrescribir ni resembrar
    let base = temp_dir("f30_completar_no_resiembra");
    let mut repo = JsonSnapshotRepository::new(base.clone());

    // Crear perfil y activar
    let nuevo = crear(&mut repo, "Usuario Existente").expect("crear perfil");
    seleccionar(&mut repo, &nuevo.id).expect("activar perfil");

    // Sembrar un snapshot PREVIO (simula perfil migrado o usuario que hizo Saltar)
    let mut snapshot_previo = FinanceSnapshot::default();
    snapshot_previo.monthly_records.push(
        crate::domain::monthly_record::MonthlyRecord::new(
            crate::domain::month_key::MonthKey::parse("2026-01").unwrap(),
            [(crate::domain::catalogs::IncomeSource::Salario, 3000.0)],
            [(crate::domain::catalogs::ExpenseCategory::Vivienda, 1000.0)],
        )
    );
    snapshot_previo.strategy.currency = Currency::Usd; // Moneda distinta a la del onboarding
    repo.save(&snapshot_previo).expect("guardar snapshot previo");

    // Rellenar onboarding con moneda distinta (EUR)
    perfiles_onboarding::actualizar_onboarding(
        &mut repo,
        &nuevo.id,
        datos_onboarding("Usuario Existente", Currency::Eur, "Snowball"),
    )
    .expect("actualizar onboarding");

    // Completar onboarding
    let perfil = completar_onboarding_core(&mut repo, &nuevo.id).expect("completar onboarding");
    assert_eq!(perfil.onboarding_status, OnboardingStatus::Completed);

    // Verificar: snapshot PREVIO conservado (monthly_records intacto), PERO onboarding aplicado encima
    let snapshot = repo.load().expect("load snapshot tras completar");
    assert_eq!(
        snapshot.monthly_records.len(),
        1,
        "REQ-30-04: snapshot previo NO debe sobrescribirse (monthly_records conservados)"
    );
    // La moneda del onboarding (EUR) debe haber sobrescrito la del snapshot previo (USD)
    // porque aplicar_onboarding_a_snapshot SIEMPRE aplica currency del paso1
    assert_eq!(
        snapshot.strategy.currency,
        Currency::Eur,
        "onboarding aplica currency sobre snapshot existente"
    );
    assert_eq!(snapshot.strategy.debt_strategy, DebtStrategy::Snowball);
    assert_eq!(snapshot.strategy.extra_monthly_payment, 250.0);

    cleanup(&base);
}

#[test]
fn reinicio_post_onboarding_carga_snapshot_sembrado() {
    // REQ-30-07: reinicio posterior a completar onboarding → preparar_arranque → recuperar R1 → load_state carga snapshot sembrado
    let base = temp_dir("f30_reinicio_post_onboarding");
    {
        // Primera sesión: crear perfil, completar onboarding
        let mut repo = JsonSnapshotRepository::new(base.clone());
        let nuevo = crear(&mut repo, "Usuario Reinicio").expect("crear perfil");
        perfiles_onboarding::actualizar_onboarding(
            &mut repo,
            &nuevo.id,
            datos_onboarding("Usuario Reinicio", Currency::Mxn, "Avalanche"),
        )
        .expect("actualizar onboarding");
        completar_onboarding_core(&mut repo, &nuevo.id).expect("completar onboarding");
        let id = nuevo.id.clone();
        // Verificar que snapshot existe y tiene datos
        let snap = repo.load().expect("snapshot tras onboarding");
        assert_eq!(snap.strategy.currency, Currency::Mxn);
        assert_eq!(snap.monthly_records.len(), 0); // vacío mínimo
    } // repo se dropea → simula reinicio de app

    // Segunda sesión (reinicio): nuevo adapter, preparar_arranque, load_state
    let mut repo2 = JsonSnapshotRepository::new(base.clone());
    let fue_frio = preparar_arranque(&mut repo2).expect("preparar_arranque tras reinicio");
    assert!(!fue_frio, "no es flujo frío, registro ya existe");

    // Recuperar R1: activo presente con snapshot en disco → nada que hacer
    let activo_id = repo2.activo().expect("activo");
    assert!(activo_id.starts_with("p_"), "id del perfil debe empezar con p_, got: {}", activo_id);
    let snapshot = repo2.load().expect("load_state tras reinicio debe cargar snapshot sembrado");
    assert_eq!(snapshot.strategy.currency, Currency::Mxn);
    assert_eq!(snapshot.monthly_records.len(), 0);
    assert_eq!(snapshot.strategy.debt_strategy, DebtStrategy::Avalanche);
    assert_eq!(snapshot.strategy.extra_monthly_payment, 250.0);

    cleanup(&base);
}

#[test]
fn migracion_legacy_mantiene_completed_y_snapshot_intacto_recuperar_r1_no_toca_seed() {
    // REQ-30-08: migración legacy (perfiles pre-onboarding) mantiene onboarding_status=Completed
    // y su snapshot intacto; recuperar R1 no toca seed
    let base = temp_dir("f30_legacy_migracion");
    let mut repo = JsonSnapshotRepository::new(base.clone());

    // Simular perfil legacy migrado (feature 23): onboarding_status = Completed por defecto
    let legacy_id = "p_legacy_123";
    repo.guardar_registro(&crate::domain::registro_perfiles::RegistroPerfiles {
        activa: Some(legacy_id.to_string()),
        perfiles: vec![crate::domain::perfil::Perfil {
            id: legacy_id.to_string(),
            nombre: "Usuario Legacy".to_string(),
            creado_en: "2026-01-01T00:00:00Z".to_string(),
            onboarding_status: OnboardingStatus::Completed, // Migración feature 23
            onboarding_data: crate::domain::onboarding::OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: crate::domain::onboarding::FinancialProfile::default(),
        }],
    })
    .expect("guardar registro legacy");

    // Cargar registro para restaurar el activo en el adapter
    repo.cargar_registro().expect("cargar registro restaura activo");

    // Ahora guardar el snapshot legacy (con activo ya resuelto)
    let mut snapshot_legacy = seed::example_snapshot(); // Snapshot CON datos reales (seed)
    snapshot_legacy.strategy.currency = Currency::Usd;
    repo.save(&snapshot_legacy).expect("guardar snapshot legacy");

    // Reinicio: preparar_arranque → recuperar R1 (activo con snapshot) → no toca seed
    let mut repo2 = JsonSnapshotRepository::new(base.clone());
    let fue_frio = preparar_arranque(&mut repo2).expect("preparar_arranque legacy");
    assert!(!fue_frio, "legacy no es flujo frío");

    // Verificar: snapshot legacy INTACTO (con sus 12 meses de datos)
    let snapshot = repo2.load().expect("load snapshot legacy");
    assert_eq!(snapshot.strategy.currency, Currency::Usd);
    assert!(
        snapshot.monthly_records.len() > 0,
        "REQ-30-08: snapshot legacy debe conservar sus datos (monthly_records > 0)"
    );
    assert_eq!(snapshot.assets.len(), 3); // seed tiene 3 activos
    assert_eq!(snapshot.liabilities.len(), 3); // seed tiene 3 pasivos

    // onboarding_status sigue Completed
    let status = perfiles_onboarding::obtener_onboarding_status(&mut repo2, legacy_id)
        .expect("obtener status legacy");
    assert!(matches!(status, OnboardingStatus::Completed));

    cleanup(&base);
}

#[test]
fn load_state_error_sin_perfil_activo_mensaje_exacto() {
    // REQ-30-06: load_state debe devolver SnapshotLoadError con mensaje "sin perfil activo no hay snapshot que operar"
    let base = temp_dir("f30_load_state_error");
    let repo = JsonSnapshotRepository::new(base.clone());

    // Sin cargar registro → no hay activo
    let err = repo.load().expect_err("load debe fallar sin activo");
    let msg = err.to_string();
    assert!(
        msg.contains("sin perfil activo no hay snapshot que operar"),
        "REQ-30-06: mensaje debe contener 'sin perfil activo no hay snapshot que operar', got: {}",
        msg
    );

    cleanup(&base);
}