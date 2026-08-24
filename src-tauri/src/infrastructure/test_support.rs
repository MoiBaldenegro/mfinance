//! Soporte de tests del adapter: directorios temporales únicos bajo
//! std::env::temp_dir (REQ-04-09). NUNCA se toca Documents real.

use std::fs;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicU64, Ordering};

use crate::domain::perfil::Perfil;
use crate::domain::registro_perfiles::RegistroPerfiles;
use crate::domain::perfil_repository::PerfilRepository;
use crate::infrastructure::json_repository::JsonSnapshotRepository;

static TEMP_SEQ: AtomicU64 = AtomicU64::new(0);

/// Directorio temporal único por prueba.
pub(crate) fn temp_dir(tag: &str) -> PathBuf {
    let n = TEMP_SEQ.fetch_add(1, Ordering::SeqCst);
    let dir = std::env::temp_dir()
        .join(format!("mfinance_f4_{}_{}_{tag}", std::process::id(), n));
    fs::create_dir_all(&dir).expect("crear directorio temporal");
    dir
}

/// Almacén con un perfil activo registrado en profiles.json.
pub(crate) fn store_con_perfil(
    base: &Path,
    id: &str,
) -> JsonSnapshotRepository {
    let mut repo = JsonSnapshotRepository::new(base.to_path_buf());
    repo.guardar_registro(&RegistroPerfiles {
        activa: Some(id.to_string()),
        perfiles: vec![Perfil {
            id: id.to_string(),
            nombre: "Tests".to_string(),
            creado_en: "2026-08-23T00:00:00Z".to_string(),
            onboarding_status: crate::domain::onboarding::OnboardingStatus::Completed,
            onboarding_data: crate::domain::onboarding::OnboardingData::default(),
            goals_journal: Vec::new(),
            financial_profile: crate::domain::onboarding::FinancialProfile::default(),
        }],
    })
    .expect("registro de prueba");
    repo
}

/// Borrado best-effort del directorio temporal.
pub(crate) fn cleanup(dir: &Path) {
    fs::remove_dir_all(dir).ok();
}

/// Construye un PDF válido mínimo de una página (Helvetica) con una línea
/// de texto por elemento: fixture sintético determinista para los tests
/// del extractor real (design.md F12), sin crates de generación.
pub(crate) fn construir_pdf(lineas: &[&str]) -> Vec<u8> {
    let escapar = |texto: &str| {
        texto
            .replace('\\', "\\\\")
            .replace('(', "\\(")
            .replace(')', "\\)")
    };
    let mut contenido = String::from("BT\n/F1 11 Tf\n14 TL\n40 780 Td\n");
    for linea in lineas {
        contenido.push_str(&format!("({}) Tj T*\n", escapar(linea)));
    }
    contenido.push_str("ET\n");
    let objetos = [
        String::from("<< /Type /Catalog /Pages 2 0 R >>"),
        String::from("<< /Type /Pages /Kids [3 0 R] /Count 1 >>"),
        String::from(
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] \
             /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
        ),
        format!(
            "<< /Length {} >>\nstream\n{}endstream",
            contenido.len(),
            contenido
        ),
        String::from(
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        ),
    ];
    let mut pdf: Vec<u8> = Vec::from(b"%PDF-1.4\n");
    let mut offsets: Vec<usize> = Vec::new();
    for (indice, cuerpo) in objetos.iter().enumerate() {
        offsets.push(pdf.len());
        pdf.extend_from_slice(
            format!("{} 0 obj\n{}\nendobj\n", indice + 1, cuerpo).as_bytes(),
        );
    }
    let xref_pos = pdf.len();
    pdf.extend_from_slice(format!("xref\n0 {}\n", objetos.len() + 1).as_bytes());
    pdf.extend_from_slice(b"0000000000 65535 f \n");
    for offset in &offsets {
        pdf.extend_from_slice(format!("{offset:010} 00000 n \n").as_bytes());
    }
    pdf.extend_from_slice(
        format!(
            "trailer\n<< /Size {} /Root 1 0 R >>\nstartxref\n{}\n%%EOF\n",
            objetos.len() + 1, xref_pos
        )
        .as_bytes(),
    );
    pdf
}
