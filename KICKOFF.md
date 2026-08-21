# KICKOFF — Prompt inicial para arrancar la secuencia de trabajo

> Pega este prompt al agente `leader` (`@leader`) para iniciar una sesión con
> el harness. Si quieres una tarea concreta, completa `<tema o feature>`; si
> lo dejas vacío, el líder elige la feature `pending` de menor `id` cuyas dependencias estén todas en `done`.
> Los `id` se refieren SIEMPRE al backlog actual (no al histórico): tras una
> regeneración limpia (esqueleto + solo features nuevas, sin histórico) la
> numeración **arranca en 1**, así que la primera feature del ciclo nuevo es la id 1.

---

## Prompt a pegar al líder

```
Arranca la secuencia de trabajo siguiendo tu protocolo:

1. Ejecuta ./init.sh y confirma que el entorno está perfecto. Si falla, para
   y reporta qué hay que resolver.
2. Lee progress/current.md y feature_list.json.
3. Elige la feature pending de menor id cuyas dependencias estén todas en done (<tema o feature>).
4. Si requiere investigación previa, lanza 2-3 explorers en paralelo y espera
   sus informes en progress/research/.
5. Lanza el implementer con la instrucción estándar (informe en
   progress/impl_<feature>.md y respuesta de una sola línea).
6. Cuando el implementer termina y responde la señal `done -> ...; LISTO PARA
   QUE EL LÍDER LANCE AL REVIEWER` (o, ante silencio, verifica el artefacto
   en `progress/impl_<feature>.md`), LANZA al reviewer (nivel 1) — que valida
   contra `specs/<NN>_<name>/requirements.md` (`design.md` si existe) y la
   coherencia acceptance↔REQ — y verifica en disco que deja
   `progress/review_<feature>.md` con veredicto APPROVED antes de dar la tarea
   por cerrada; luego instruye al implementer para
   marcar `done` (su respuesta de cierre es `done -> feature <id> cerrada`).
   Si el veredicto es CHANGES_REQUESTED, re-lanza al implementer con los
   "Cambios requeridos" y repite implementer → reviewer (máx. 3 rondas).
7. Responde con el resumen final: feature, veredicto del reviewer y
   referencias a los artefactos en progress/.
```

## Instrucción estándar al implementer

> Copia esto en la Task que el líder lanza al implementer.

```
Implementa exactamente la feature <id> de feature_list.json. Cambia su estado
a in_progress, anota el plan en progress/current.md y LEE la spec en
specs/<NN>_<name>/requirements.md (y design.md si existe) ANTES de
implementar — los acceptance de feature_list.json se derivan de sus REQ —.
Escribe PRIMERO los tests contra la spec (design.md si existe) y obsérvalos
en rojo; después implementa hasta que la suite de ./init.sh quede en verde.
NO lances subagentes: el líder lanza al reviewer. Al final, escribe el
informe en progress/impl_<feature>.md (incluyendo la evidencia del ciclo
rojo/verde) ANTES de devolver el control.
Tu respuesta a mí debe ser solo:
"done -> feature <id> implementada (informe en progress/impl_<feature>.md);
LISTO PARA QUE EL LÍDER LANCE AL REVIEWER"
Cuando el líder verifique el APPROVED de progress/review_<feature>.md en
disco y te re-lance para cerrar, responde "done -> feature <id> cerrada".
o un mensaje de bloqueo.
```

## Flujo de mensajes del arnés (contrato de comunicación)

Cada agente responde al líder con **un formato único** y deja su artefacto en
disco SIEMPRE antes de responder (los artefactos en `progress/` son la única
fuente de verdad):

| Emisor → Receptor | Mensaje en el chat | Artefacto en disco |
|-------------------|--------------------|--------------------|
| spec_author → líder | `backlog -> análisis en progress/research/<archivo>.md; feature(s) creadas: <ids y names>; spec: specs/<NN>_<name>/requirements.md; hallazgos` | `progress/research/<archivo>.md` + `specs/<NN>_<name>/requirements.md` (+ `design.md` si toca UI) + alta en `feature_list.json` |
| implementer → líder | `done -> feature <id> implementada (informe en progress/impl_<feature>.md); LISTO PARA QUE EL LÍDER LANCE AL REVIEWER` | `progress/impl_<feature>.md` |
| líder → reviewer | Task de revisión con el contexto y el informe de `progress/impl_<feature>.md` | `progress/review_<feature>.md` (lo escribe el reviewer) |
| reviewer → líder | `review -> feature <id>: APPROVED \| CHANGES_REQUESTED (veredicto en progress/review_<feature>.md)` | `progress/review_<feature>.md` |
| implementer → líder (cierre, tras el APPROVED) | `done -> feature <id> cerrada` | status `done` en `feature_list.json` |
| explorer → líder | `done -> progress/research/<tema>.md` | `progress/research/<tema>.md` |
| implementer → líder (bloqueo) | `blocked -> ver progress/current.md` | `progress/current.md` + status `blocked` en `feature_list.json` |

**Spec por feature:** cada feature tiene su spec en `specs/<NN>_<name>/`
(`requirements.md` siempre; `design.md` solo si toca UI). El spec_author la
referencia en su respuesta; el implementer la LEE antes de escribir tests y
código (los tests se escriben primero contra la spec) y el reviewer valida
contra ella y contra la coherencia acceptance↔REQ.

**Protocolo anti-silencio:** si un subagente responde vacío o no responde, el
líder verifica los artefactos en `progress/` (`progress/research/*.md`,
`progress/impl_<feature>.md`, `progress/review_<feature>.md`, `feature_list.json`)
y continúa el flujo desde la evidencia en disco.

## Reglas para quien lo usa

- Nunca arranques una sesión con más de una feature a la vez.
- Si el entorno falla, no se continúa: primero se resuelve lo reportado.
- Los artefactos de `progress/` son la única fuente de verdad del estado.
