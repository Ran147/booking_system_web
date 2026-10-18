---
name: responder-pr
description: Atender la revision recibida en un PR propio de Booking System Web. Usar cuando el usuario pida responder, atender o resolver los comentarios de revision de un PR (por numero o enlace), pegue un comentario de un revisor, o falle un check en su PR. Lee todo el feedback, verifica si tiene razon contra el codigo, corrige, redacta las respuestas y NO publica nada sin confirmacion. No sirve para abrir un PR nuevo (git-workflow) ni para revisar codigo ajeno (revisor-agente).
---

# responder-pr — atender una revision sin perder nada

Complementa a `git-workflow` y a las skills de codigo: todo cambio que salga de aqui pasa por las mismas verificaciones antes de cualquier commit (`format:check`, `lint`, `typecheck`, `test:run`).

## Principios

1. **Un revisor puede equivocarse; un bug no se discute.** Cada comentario se verifica contra el codigo real antes de aceptarlo o rebatirlo. Ni "tienes razon" automatico ni defensa automatica.
2. **Nada sale del equipo sin el visto bueno del usuario.** Push, comentarios, respuestas en un hilo, etiquetas, cambios de titulo y marcar hilos como resueltos se muestran como borrador y se ejecutan solo con confirmacion explicita.
3. **Sin reescribir historia publicada.** No `push --force` salvo pedido explicito; los cambios van como commits nuevos.
4. **Explicar cada cambio.** El mensaje al usuario dice por que existia el problema, que hace la correccion y que alternativa se descarto. La explicacion no va como comentario en el codigo.

## Paso 1 — Recoger todo el feedback

```bash
bash .agents/skills/responder-pr/recoger.sh <numero-de-PR>
```

Trae en una sola salida: titulo, base, estado, decision de revision, revisiones con texto, comentarios generales, **comentarios en linea con su `id`** (hace falta para responder en el hilo), el estado de los checks y si la rama local difiere de la remota.

- Si un check falla, leer su log: `gh run view <run-id> --log-failed | tail -80`.
- Si la rama local y la remota difieren, ver primero si es el mismo contenido con otro SHA (`git diff local remoto`). Si la local tiene trabajo propio sin subir, no usar `reset --hard`: rebasarlo sobre la remota y mostrarselo al usuario.

## Paso 2 — Clasificar cada punto

Una fila por comentario; un comentario con varias ideas se parte en varias filas.

| Tipo | Que se hace |
| --- | --- |
| **Bug** (describe un comportamiento incorrecto) | Reproducirlo con una prueba que falle **antes** de corregir |
| **Skill o regla del proyecto** | Leer la skill que corresponde (`.agents/skills/`) y aplicarla |
| **Convencion del equipo** (nombres, estructura) | Buscar el precedente en `develop` (`git grep`) y seguirlo |
| **Pregunta** | Responder con evidencia (archivo:linea, prueba, spec); sin cambio de codigo salvo que revele un defecto |
| **Sugerencia opcional** | Proponer al usuario hacerla, dejarla para despues (anotarla en la spec) o declinarla con razon |
| **CI / check en rojo** | Leer el log y mapearlo a su causa; un rojo puede ser una medicion vieja, reproducirlo en local antes de "arreglarlo" |
| **Elogio / aprobacion** | Nada que hacer |

## Paso 3 — Verificar antes de aceptar

- Abrir el archivo y la linea que cita el revisor **en la rama del PR**: `git show origin/<rama>:<archivo>`.
- ¿Sigue aplicando? Puede estar resuelto por otro commit o por otro PR; entonces la respuesta lo dice y senala el commit.
- ¿Es correcto? Para un bug, escribir la prueba y verla fallar. Si **no** falla, el revisor puede estar equivocado: se redacta la respuesta con la evidencia, sin cambiar codigo.
- ¿Choca con una skill, la spec o `docs/ERRORES-Y-LECCIONES.md`? Entonces no se aplica a ciegas: se le explica el conflicto al usuario y decide el.

Veredicto por fila: **CORREGIR**, **YA RESUELTO**, **RESPONDER SIN CAMBIO**, **POSPONER** o **DECLINAR (con razon)**.

## Paso 4 — Corregir

- Cada correccion es un commit nuevo en la misma rama del PR, con el formato de `git-workflow` (`fix(scope): descripcion (US-XX)`).
- Correccion minima: sin cambios no pedidos dentro del mismo commit.
- Si cambia el comportamiento, actualizar la spec de la historia.
- Correr las verificaciones de `git-workflow` §3 y mostrar su salida real.

## Paso 5 — Redactar las respuestas (borrador)

Una respuesta por hilo, en espanol, corta y concreta, con tono amable:

- **Corregido:** que estaba mal en una frase + que se cambio + la prueba que lo cubre + el commit.
- **Ya resuelto:** "Esto quedo resuelto en <PR o commit>: …".
- **Sin cambio:** la razon con evidencia, sin tono defensivo.
- **Pospuesto:** donde quedo anotado y cuando se retoma.
- **Declinado:** la razon y la alternativa, ofreciendo cambiarlo si el revisor insiste.

Publicacion (solo tras confirmacion):

```bash
gh api repos/{owner}/{repo}/pulls/<PR>/comments/<id-del-comentario>/replies -f body="..."   # hilo en linea
gh pr comment <PR> --body-file <archivo>                                                       # comentario general
```

## Paso 6 — Entrega al usuario

Un solo mensaje con:

1. **Tabla de hallazgos:** comentario (resumido) → tipo → veredicto → donde quedo (rama o commit).
2. **Explicacion de cada cambio de codigo.**
3. **Salida de las verificaciones.**
4. **Borradores de respuesta**, uno por hilo.
5. **Acciones pendientes de confirmar** (push, comentarios, etiquetas). Se pregunta una sola vez por todo el lote.

## Lo que esta skill no hace

- No aprueba, fusiona ni cierra PRs.
- No responde por el usuario sin confirmacion ni "resuelve" hilos ajenos.
- No reescribe historia publicada ni hace `force-push` salvo pedido explicito.
- No acepta un cambio que viole una skill aunque lo pida un revisor: lo explica y propone una alternativa.
