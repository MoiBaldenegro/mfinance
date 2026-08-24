//! Dominio financiero puro del backend: entidades, catálogos, errores
//! nombrados y trait-puerto de repositorio. Sin dependencia del framework
//! de escritorio: verificable con `cargo test` aislado (REQ-03-10).

pub mod account_statement;
pub mod asset;
pub mod catalogs;
pub mod comprobante_pdf;
pub mod currency;
pub mod errors;
pub mod investment;
pub mod liability;
pub mod month_key;
pub mod monthly_assessment;
pub mod monthly_record;
pub mod monthly_record_error;
pub mod negative_value;
pub mod pdf_error;
pub mod onboarding;
pub mod perfil;
pub mod perfil_errors;
pub mod perfil_repository;
pub mod puertos_pdf;
pub mod registro_perfiles;
pub mod repository;
pub mod repository_errors;
pub mod snapshot;
pub mod tiempo;

#[cfg(test)]
mod tests;
