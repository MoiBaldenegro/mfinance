//! Soporte de los tests de reinicio/autorecuperación (feature 28):
//! fixtures de registro y snapshots escritos DIRECTAMENTE en disco para
//! simular el estado dejado por una sesión anterior que el adapter
//! actual nunca ha leído (el escenario exacto del reinicio roto).

use std::fs;
use std::path::Path;

use crate::domain::onboarding::{
    FinancialProfile, OnboardingData, OnboardingStatus,
};
use crate::domain::perfil::Perfil;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::snapshot::FinanceSnapshot;
use crate::infrastructure::rutas_mfinance;
use crate::seed;

/// Perfil con id fijo para los fixtures.
pub(crate) fn perfil(id: &str, nombre: &str) -> Perfil {
    Perfil {
        id: id.to_string(),
        nombre: nombre.to_string(),
        creado_en: "2026-08-23T00:00:00Z".to_string(),
        onboarding_status: OnboardingStatus::Completed,
        onboarding_data: OnboardingData::default(),
        goals_journal: Vec::new(),
        financial_profile: FinancialProfile::default(),
    }
}

/// Snapshot distinguible del seed según la marca indicada.
pub(crate) fn snapshot_con(marca: f64) -> FinanceSnapshot {
    let mut snapshot = seed::example_snapshot();
    snapshot.strategy.extra_monthly_payment = marca;
    snapshot
}

/// Escribe profiles.json a mano: archivo dejado por una sesión previa.
pub(crate) fn escribir_registro(base: &Path, registro: &RegistroPerfiles) {
    let ruta = rutas_mfinance::registro(base);
    fs::create_dir_all(base).expect("crear base temporal");
    fs::write(
        ruta,
        serde_json::to_string_pretty(registro).expect("serializar registro"),
    )
    .expect("escribir profiles.json");
}

/// Escribe perfiles/<id>/mfinance.json con el snapshot dado.
pub(crate) fn escribir_snapshot(
    base: &Path,
    id: &str,
    snapshot: &FinanceSnapshot,
) {
    let ruta = rutas_mfinance::snapshot_de(base, id);
    fs::create_dir_all(ruta.parent().expect("ruta con padre"))
        .expect("crear carpeta del perfil");
    fs::write(
        ruta,
        serde_json::to_string_pretty(snapshot).expect("serializar snapshot"),
    )
    .expect("escribir snapshot del perfil");
}

/// Lee y deserializa el profiles.json vigente en disco.
pub(crate) fn leer_registro(base: &Path) -> RegistroPerfiles {
    serde_json::from_str(
        &fs::read_to_string(rutas_mfinance::registro(base))
            .expect("leer profiles.json"),
    )
    .expect("profiles.json debe seguir siendo válido")
}
