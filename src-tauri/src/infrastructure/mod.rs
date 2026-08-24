//! Adapters de salida que implementan los puertos definidos por el
//! núcleo (persistencia en fs). Las dependencias apuntan al dominio.

pub mod base64_min;
pub mod comprobantes_fs;
pub mod json_file;
pub mod json_repository;
pub mod pdf_extractor;
pub mod pdf_nombre;
pub mod perfil_registry;
pub mod rutas_mfinance;

#[cfg(test)]
mod base64_min_tests;
#[cfg(test)]
mod arranque28_soporte;
#[cfg(test)]
mod arranque_migracion_tests;
#[cfg(test)]
mod arranque_guarda_tests;
#[cfg(test)]
mod aislamiento_perfiles_tests;
#[cfg(test)]
mod comprobantes_fs_tests;
#[cfg(test)]
mod comprobantes_perfil_tests;
#[cfg(test)]
mod conservacion_datos_tests;
#[cfg(test)]
mod estado_inicial_tests;
#[cfg(test)]
mod json_repository_tests;
#[cfg(test)]
mod pdf_extractor_tests;
#[cfg(test)]
mod obtener_perfil_activo_con_onboarding_tests;
#[cfg(test)]
mod perfil_registry_tests;
#[cfg(test)]
mod recuperacion_deadend_tests;
#[cfg(test)]
mod recuperacion_flujo_frio_tests;
#[cfg(test)]
mod reinicio_tests;
#[cfg(test)]
mod onboarding_defer_seed_tests;
#[cfg(test)]
pub(crate) mod test_support;
#[cfg(test)]
mod transfer_import_tests;
#[cfg(test)]
mod transfer_tests;
