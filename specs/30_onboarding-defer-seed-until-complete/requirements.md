REQ-30-01 EL arranque_frio SHALL crear el perfil inicial Personal con onboarding_status NotStarted y NO llamar a ensure_seed
REQ-30-02 LA funcion recuperar regla R3 SHALL NO llamar a ensure_seed y persistir el activo elegido y devolver Ok(false) sin sembrar
REQ-30-03 EL caso de uso completar_onboarding SHALL al consolidar el perfil y marcar onboarding_status Completed sembrar el snapshot base una sola vez si no existe usando seed::example_snapshot o snapshot vacio minimo segun decision REQ-30-05
REQ-30-04 CUANDO completar_onboarding se ejecuta y el snapshot YA existe ENTONCES el sistema SHALL NO sobrescribir ni resembrar
REQ-30-05 LA decision de diseño SHALL documentar en design.md si el snapshot post-onboarding contiene datos de ejemplo (A) o snapshot vacio minimo (B) y sera validada con el humano
REQ-30-06 EL comando load_state SHALL poder cargar un snapshot que no exista y devolver error nombrado SnapshotLoadError con mensaje sin perfil activo no hay snapshot que operar
REQ-30-07 LOS tests cargo TDD SHALL cubrir arranque_frio crea perfil sin snapshot completar_onboarding siembra si no existe completar_onboarding no resiembra si existe reinicio posterior carga snapshot sembrado
REQ-30-08 LA migracion legacy SHALL mantener onboarding_status Completed y su snapshot intacto recuperar regla R1 no toca seed