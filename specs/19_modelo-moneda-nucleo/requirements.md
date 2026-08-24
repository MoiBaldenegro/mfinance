# Requisitos — modelo-moneda-nucleo (feature 19)

## Requisitos

REQ-19-01 El agregado FinanceSnapshot SHALL declarar la moneda de visualización dentro de StrategySettings con MXN como valor por defecto.
REQ-19-02 IF el archivo de estado carece del campo currency, THEN la deserialización SHALL completarlo con MXN sin alterar el resto del snapshot.
REQ-19-03 El catálogo de monedas SHALL definir las divisas cerradas MXN USD y EUR con símbolo separadores de miles y decimales y posición del símbolo con espejo exacto entre el enum Rust y la entidad TS.
REQ-19-04 El núcleo de formateo del dominio frontend SHALL producir cadenas monetarias deterministas para cualquier valor y moneda del catálogo sin depender de Intl ni ICU.
REQ-19-05 IF la moneda recibida no pertenece al catálogo, THEN el núcleo de formateo SHALL lanzar un error nombrado del dominio sin devolver cadena.
