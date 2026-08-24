//! Cuota mensual del sistema francés: pago constante que amortiza
//! importe e intereses al vencimiento del plazo.

/// Cuota del sistema francés; con tasa cero reparte el importe en el plazo.
pub fn cuota_mensual(importe: f64, plazo_meses: u32, tasa_interes_anual: f64) -> f64 {
    let i = tasa_interes_anual / 100.0 / 12.0;
    if i == 0.0 {
        return importe / plazo_meses as f64;
    }
    let descuento = 1.0 - (1.0 + i).powi(-(plazo_meses as i32));
    importe * i / descuento
}
