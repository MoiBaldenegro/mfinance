//! Saneo de nombres de archivo para el almacén de comprobantes
//! (REQ-12-05): conserva el nombre original eliminando cualquier
//! componente de ruta (protección contra rutas traversal).

use std::path::Path;

/// Nombre seguro determinista; fallback `comprobante.pdf`.
pub fn nombre_seguro(nombre_original: &str) -> String {
    let plano = nombre_original.replace('\\', "/");
    Path::new(&plano)
        .file_name()
        .and_then(|n| n.to_str())
        .filter(|n| !n.trim().is_empty())
        .map(str::to_string)
        .unwrap_or_else(|| "comprobante.pdf".to_string())
}

#[cfg(test)]
mod tests {
    use super::nombre_seguro;

    #[test]
    fn elimina_rutas_traversal_y_conserva_el_nombre_original() {
        assert_eq!(nombre_seguro("../../evil.pdf"), "evil.pdf");
        assert_eq!(nombre_seguro("..\\..\\win.pdf"), "win.pdf");
        assert_eq!(nombre_seguro("extracto.pdf"), "extracto.pdf");
        assert_eq!(nombre_seguro("   "), "comprobante.pdf");
    }
}
