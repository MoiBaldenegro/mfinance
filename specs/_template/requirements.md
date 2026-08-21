# Plantilla de requisitos (EARS estricto)

> Copia esta plantilla a `specs/<NN>_<name>/requirements.md` para **cada**
> feature del backlog. `<NN>` = id de la feature con padding a 2 dígitos
> (`padStart(2, '0')`, p. ej. `07`); `<name>` = slug kebab-case del `name` de
> la feature (p. ej. `cards-section`). Este archivo se crea SIEMPRE, antes del
> alta en `feature_list.json`. Si la feature toca UI, además se crea
> `design.md` (ver `specs/_template/design.md`).

## Patrones EARS (una línea = un requerimiento = exactamente un SHALL)

| Patrón | Forma | Cuándo usarlo |
|--------|-------|---------------|
| Ubicuo | `<sujeto> SHALL <respuesta>` | Comportamiento permanente del sistema |
| Evento | `WHEN <trigger>, <sujeto> SHALL <respuesta>` | Comportamiento ante un estímulo |
| Estado | `WHILE <estado>, <sujeto> SHALL <respuesta>` | Comportamiento que se mantiene mientras hay un estado |
| Condicional | `IF <condición>, THEN <sujeto> SHALL <respuesta>` | Comportamiento ante una condición indeseada o excepcional |
| Calificador | `..., WHERE <condición>` (opcional, al final) | Restringe el alcance del requerimiento |

## Reglas

- Una línea = un requerimiento = exactamente un `SHALL`.
- IDs: `REQ-<NN>-<xx>`; `<NN>` = id de la feature con padding a 2 dígitos;
  `<xx>` = secuencial de 2 dígitos (01, 02, ...).
- Mínimo 3-4 REQ por feature; en español.
- Sin verbos vagos: prohibidos `soportar`, `mejorar` y "debe ser".
- Keywords (SHALL/WHEN/WHILE/IF/THEN/WHERE) en mayúsculas.
- El sujeto no contiene comas: la primera coma separa trigger/condición del
  sujeto (por eso `IF <condición>, THEN <sujeto> SHALL <respuesta>` lleva
  `THEN`).
- Este archivo solo admite encabezados (`#`), líneas vacías y líneas REQ:
  sin prosa, listas ni tablas fuera de esta plantilla.

## Requisitos

REQ-<NN>-01 <sujeto> SHALL <respuesta>.
REQ-<NN>-02 WHEN <trigger>, <sujeto> SHALL <respuesta>.
REQ-<NN>-03 WHILE <estado>, <sujeto> SHALL <respuesta>.
REQ-<NN>-04 IF <condición>, THEN <sujeto> SHALL <respuesta>.
REQ-<NN>-05 <sujeto> SHALL <respuesta>, WHERE <condición>.

## Ejemplos de referencia (un ejemplo por patrón; no forman parte de la spec)

REQ-<NN>-06 El formulario SHALL validar el correo antes del envío.
REQ-<NN>-07 WHEN el usuario envía el formulario, el sitio SHALL mostrar un mensaje de confirmación.
REQ-<NN>-08 WHILE el envío está en curso, el botón SHALL permanecer deshabilitado.
REQ-<NN>-09 IF el correo no es válido, THEN el sitio SHALL mostrar un error junto al campo.
REQ-<NN>-10 El mensaje de error SHALL mostrarse en español, WHERE el idioma del sitio es español.

## Criterios de trazabilidad

Los `acceptance` de la feature en `feature_list.json` se derivan de los REQ de
este archivo (trazabilidad REQ → acceptance). Al escribir la spec:

1. Redacta primero los REQ: qué debe hacer el sistema (una línea, un SHALL).
2. Deriva después los `acceptance`: cómo se verifica que el sistema cumple
   cada REQ.
3. Verifica que cada `acceptance` se asocia a al menos un REQ y que cada REQ
   queda cubierto por algún `acceptance`.
