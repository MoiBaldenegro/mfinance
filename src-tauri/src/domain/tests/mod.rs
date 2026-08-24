//! Tests del dominio (REQ-03-10): corren con `cargo test`, sin framework,
//! sin red y sin sistema de archivos. Un archivo por entidad/puerto.

mod account_statement_tests;
mod asset_tests;
mod catalogs_tests;
mod currency_tests;
mod fake_repository;
mod investment_tests;
mod liability_tests;
mod monthly_record_tests;
mod monthly_assessment_tests;
mod onboarding_goal_entry_tests;
mod perfil_tests;
mod repository_tests;
mod snapshot_tests;
mod tiempo_tests;
