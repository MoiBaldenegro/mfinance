//! Tests del decodificador base64 mínimo (stdlib): casos felices,
//! padding, whitespace y errores nombrados. ANTES de la implementación.

use super::base64_min::decodificar;

#[test]
fn decodifica_cadenas_base64_basicas() {
    assert_eq!(decodificar("").expect("vacío"), Vec::<u8>::new());
    assert_eq!(decodificar("aGVsbG8=").expect("hello"), b"hello".to_vec());
    assert_eq!(
        decodificar("SGVsbG8sIFdvcmxkIQ==").expect("hello world"),
        b"Hello, World!".to_vec()
    );
}

#[test]
fn ignora_saltos_de_linea_y_espacios() {
    assert_eq!(
        decodificar("aGVs\nbG8=\r\n").expect("con saltos"),
        b"hello".to_vec()
    );
}

#[test]
fn decodifica_bytes_binarios_de_un_pdf_pequeno() {
    let original = b"%PDF-1.4\n1 0 obj\n".to_vec();
    let codificado = "JVBERi0xLjQKMSAwIG9iago=";
    assert_eq!(
        decodificar(codificado).expect("pdf header"),
        original
    );
}

#[test]
fn rechaza_caracteres_invalidos_y_padding_roto_con_error_nombrado() {
    assert!(decodificar("no***valido").is_err());
    assert!(decodificar("aGVsbG8").is_err(), "longitud no múltiplo de 4");
}
