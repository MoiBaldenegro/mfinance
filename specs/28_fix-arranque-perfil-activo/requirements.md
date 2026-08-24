# Requisitos — fix-arranque-perfil-activo (feature 28)

## Requisitos

REQ-28-01 WHEN el adaptador de persistencia lee desde disco un registro de perfiles válido, el adaptador SHALL restaurar en su memoria interna el id del perfil activo persistido antes de devolver el registro.
REQ-28-02 WHEN la preparación del arranque encuentra un registro ya existente, el backend SHALL dejar el repositorio operativo sobre el perfil activo sin repetir alta de perfiles ni siembra ni migración del legado.
REQ-28-03 WHEN la aplicación se reinicia sobre una base con registro válido y snapshot del activo presente en disco, load_state SHALL devolver el snapshot del perfil activo sin error.
REQ-28-04 WHEN el composition root construye el estado inicial, la sesión de comprobantes SHALL operar bajo el mismo id del perfil activo restaurado en el repositorio.
REQ-28-05 WHEN el registro persistido existe con indicador de activo nulo, el arranque SHALL seleccionar el primer perfil registrado cuyo snapshot exista en disco y persistir esa elección en profiles.json.
REQ-28-06 WHEN el indicador de activo apunta a un perfil ausente del registro o sin snapshot en disco, el arranque SHALL seleccionar el primer perfil registrado cuyo snapshot exista y persistir esa elección en profiles.json.
REQ-28-07 IF ningún perfil registrado tiene snapshot legible en disco, THEN el arranque SHALL sembrar únicamente el snapshot del primer perfil registrado aplicando el guard vigente de ensure_seed.
REQ-28-08 IF el registro persistido existe sin ningún perfil, THEN el arranque SHALL reproducir el flujo frío vigente dando de alta el perfil inicial con adopción del legado pendiente o siembra del seed según corresponda.
REQ-28-09 La autorecuperación del arranque SHALL conservar íntegros los perfiles no afectados y sus snapshots, WHERE ninguna regla de recuperación elimina o reescribe datos de otros perfiles.
