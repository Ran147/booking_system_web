# Service selection — KAN-135 / KAN-134

| Field | Value |
| --- | --- |
| Portal | customer |
| Feature folder | `src/modules/customer/features/service-selection/` |
| Stories | KAN-135 — Seleccionar el servicio que deseo recibir para iniciar el proceso de reservación |
| Epic | KAN-134 — Selección de servicio y colaborador |
| Branch | `KAN-134/HU-135-service-selection` |
| Reference | HEAD y origin/develop: `02019d44fc101280766e49f7a3218fbe9d48661b` |
| Date | 2026-11-23, America/Costa_Rica |
| Status | Contratos SS-D1/SS-D2/SS-D3 APPROVED por revisión humana; alcance propio especificado; AC-13 PARTIAL por integración externa; HU no completada |
| Depends on | KAN-113/116 (entrada pública); KAN-58 (estado del servicio); KAN-49 (negocio); KAN-61 (modalidad); KAN-139/140 (disponibilidad); KAN-145 (checkout) |

## Intent

Como cliente quiero seleccionar el servicio que deseo recibir para iniciar el proceso de reservación. Se especifica exclusivamente KAN-135: un servicio del negocio actual, sin consultar personal, elegir colaborador ni añadir la opción de cualquier disponible.

El mapeo oficial comunicado por la revisión humana coincide con `docs/backlog/jira-export.csv:59-63`: KAN-135 selecciona servicio, KAN-136 consulta colaboradores, KAN-137 elige uno y KAN-138 continúa sin elegirlo. No se consultó Jira en línea. No se añaden ni renumeran AC; este documento analiza los históricos de la SPEC de KAN-134.

## Referencia e instrucciones consultadas

Antes de modificar se ejecutaron los cinco comandos solicitados: rama coincidente, HEAD y origin/develop idénticos, status vacío y último commit `02019d4 Merge pull request #89 from Ran147/US-145-checkout`. No se hizo fetch, checkout ni actualización de referencias: se analiza el develop local disponible, idéntico al HEAD.

Se aplican los documentos obligatorios ya leídos en esta sesión en orden: AGENTS.md, `docs/CONTEXTO-APP.md`, `docs/ERRORES-Y-LECCIONES.md`, `docs/decisions/open-questions.md` y revisor-agente. La búsqueda de AGENTS.md solo encontró el raíz. Se inspeccionó `.agents/` y se consultaron backlog-to-spec, domain-glossary, component-architecture, component-standards, auth-and-roles, api-query-standards, api-mutation-standards, cloud-functions-standards, unit-testing-standards, i18n-standards y state-management en esta sesión; se volvió a consultar backlog-to-spec para este documento. No se activó auditoría de PR ni subagentes.

`graphify query "service selection customer booking flow"` falló con CommandNotFoundException: ejecutable no disponible en PATH. Se continuó con rg y lecturas dirigidas. No se instaló ni generó un grafo.

Por instrucción expresa esta SPEC independiente vive en docs/specs; no reemplaza la SPEC histórica de la épica. `docs/backlog/epic-map.md` todavía cita portals/customer, mientras el código y la SPEC histórica viven en src/modules/customer. Se usa la ruta comprobada sin corregir documentación ajena.

## Arquitectura comprobada

En las referencias abreviadas siguientes, SS significa `src/modules/customer/features/service-selection/`, AV significa `src/modules/customer/features/availability/` y BC significa `src/modules/customer/features/booking-checkout/`.

| Archivo / símbolo | Evidencia real |
| --- | --- |
| `src/modules/customer/customer.routes.tsx`, `src/constants/routes/RoutePath.constants.ts` | Rutas bajo /:businessSlug: book monta ServiceSelectionPage; book/:serviceId monta AvailabilityPage; book/:serviceId/confirm y book/done/:bookingId montan checkout/confirmación. RequireRole protege la rama y admite customer y el alias legacy client. |
| SS `components/ServiceSelectionPage/ServiceSelectionPage.tsx` | Vista con PageTemplate, RadioGroup, Button, Spinner, Alert, ErrorState y EmptyState comunes. Presenta nombre, duración y precio formateado por idioma y moneda. No tiene controles HTML crudos ni lógica de Firestore. |
| SS `hooks/useServiceSelectionViewModel.ts` | useQuery por businesses, businessSlug, services. selectedServiceId empieza vacío en useState; seleccionar cambia un único string y limpia validación. Continuar solo comprueba string no vacío y navega a book/:serviceId sin query params. Retry llama refetch. No relee servicio ni estado del negocio al continuar. |
| SS `api/fetchBookableCatalog.ts` | Consulta businesses por slug con limit(1), luego services por status == active. Zod valida nombre no vacío, precio entero no negativo y duración positiva. Documentos inválidos se omiten; negocio inexistente devuelve lista vacía con CRC. Solo adapta currency del negocio y usa CRC si falta. No pagina, no ordena explícitamente ni lee status de negocio. |
| SS `models/serviceSelection.model.ts` | BookableService: id, name, priceInCents, durationMinutes. BookableCatalog: currency y services. No incluye businessId, estado del negocio, preselección, modalidad ni cursor. El tipo de validación solo permite serviceRequired. |
| `src/modules/customer/layout/api/fetchBusinessPublicProfileBySlug.ts` | Lee perfil por slug y excluye pending/rejected, devolviendo null. No excluye inactive/suspended. CustomerLayout usa ViewStateSwitch y Outlet; no hay gate para inactive/suspended que complete el AC 07. |
| `src/modules/auth/components/RequireRole.tsx`, hooks/useRedirectAfterSignIn.ts | Guard espera sesión o redirige según rol. El login vuelve al redirectTo seguro; esto no crea una preselección de servicio inexistente en el paso. |
| AV `api/fetchBookingContext.ts`, hooks/useAvailabilityViewModel.ts | URL identifica servicio sin exigir pasar por el catálogo; lee negocio y servicio, trata servicio denegado/inexistente como no disponible. El horario elegido vive localmente. Volver a servicios navega a book sin selección transportada. |
| BC `hooks/useBookingCheckoutViewModel.ts`, api/fetchCheckoutSummary.ts | Recibe serviceId y startsAt; relee negocio/servicio y exige active en resumen. Cambiar servicio vuelve a book. No restaura la selección de SS. |
| `functions/src/bookings/handlers/handleGetAvailability.ts`, handleCreateBooking.ts | Validan en servidor negocio y servicio active; la creación deriva identidad del caller y revalida turno, snapshot y restricciones. Son protección posterior, no satisfacen quedarse en selección ante desactivación según AC 05. |

La implementación mínima está documentada expresamente en `docs/specs/2026-11-15-US-KAN-139-pantalla-horarios.md`: se incluyeron AC 01, 04, 06 y 08 para hacer utilizable disponibilidad. Esto explica el alcance parcial del código fusionado, sin convertir todo KAN-135 en completado.

## Datos, consultas, permisos y contratos

- Service se almacena en businesses/{businessId}/services/{serviceId}; `src/domain/service/Service.interface.ts` define entidad, precio en centavos, duración en minutos, estado y modalidad. Aquí se consume una proyección pública mínima, sin escrituras ni reservas antes de confirmar.
- Business se resuelve por slug del portal customer; no se toma identidad del negocio del portal business desde un formulario o URL. No añadir colecciones, campos persistidos ni claims para conservar una selección.
- `firestore.rules:122-159` permite lectura pública del negocio y de servicios active; esa lectura de servicio no exige negocio active. Por ello un negocio inactive/suspended con servicios active puede entregar catálogo. El guard de rol no lo impide.
- `tests/rules/customerServices.rules.test.ts` comprueba lectura de servicio active y denegación de inactive/inexistente por id. No prueba la consulta completa del catálogo ni negocio no disponible. No confundir autorización de lectura pública con autorización de reserva.
- `firestore.indexes.json` declara services por status/searchName; la consulta actual solo filtra status. No se acredita despliegue. El refinamiento propone reutilizar cursor y orden por documento sin añadir búsquedas o infraestructura incidental; cualquier necesidad adicional de índice debe justificarse y revisarse antes de implementarse.
- `Service.collaboratorSelection` y Collaborator.serviceIds pertenecen al contrato de KAN-61 y a las historias de personal; SS no los transporta hoy. No abrir lectura de documentos privados de colaboradores para completar KAN-135.
- La ausencia de collaboratorId permite disponibilidad agregada y asignación posterior ya existentes. Es comportamiento downstream observado, no una implementación de KAN-138 dentro de esta HU.

## Acceptance criteria históricos y matriz de cumplimiento

Fuente normativa: `src/modules/customer/features/service-selection/specs/SPEC.md:40-53`. Se conservan 13 ids AC-KAN-135-01 a AC-KAN-135-13; **12 vigentes**, pues el 02 está tachado y sustituido por 13. La tabla resume requisitos sin crear copias normativas o nuevos criterios. Cada fila cubre [KAN-135].

IMPLEMENTED significa código y prueba pertinente existentes por inspección; **no significa ejecución exitosa**. PARTIAL significa implementación o cobertura incompleta; MISSING, comportamiento ausente; BLOCKED, resolución externa necesaria. RETIRED/SUPERSEDED identifica exclusivamente el AC histórico sustituido, que no es un criterio vigente ni bloqueado.

| AC | Requisito histórico | Evidencia de código | Evidencia de tests | Estado | Brecha |
| --- | --- | --- | --- | --- | --- |
| AC-KAN-135-01 | Ver servicios active con nombre, precio, duración; elegir exactamente uno | fetchBookableCatalog filtra y adapta; vista formatea y RadioGroup selecciona uno | ServiceSelectionPage.test.tsx elige Barba y comprueba navegación y presencia de Corte; catálogo está mockeado | PARTIAL | Falta acreditar filtrado/adaptación real, precio/duración y exclusividad al cambiar; no basta el nombre del test |
| AC-KAN-135-02 | Continuar a disponibilidad | Navegación directa existente | Primer test verifica ruta de servicio | RETIRED/SUPERSEDED | Histórico sustituido por 13; no ejecutar ni implementar como requisito independiente |
| AC-KAN-135-03 | Entrada desde servicio público con servicio preseleccionado y editable | SS no lee entrada/preselección; home de customer es placeholder | No se encontró prueba del caso | MISSING | Contrato de entrada con KAN-116 y carga de selección inicial |
| AC-KAN-135-04 | Continuar sin elegir permanece y muestra serviceRequired | handleContinue valida string vacío; Alert traducido | Test hace click, verifica mensaje y ruta sin cambio | IMPLEMENTED | Verificación de ejecución pendiente; conservar comportamiento |
| AC-KAN-135-05 | Desactivado/eliminado tras cargar: permanecer, avisar y refrescar catálogo | handleContinue no relee ni valida pertenencia/estado; backend rechaza después | Reglas de servicio por id son evidencia parcial de protección posterior, sin prueba del requisito en SS | MISSING | Revalidación al continuar y selección invalidada; falta clave serviceUnavailable en SS |
| AC-KAN-135-06 | Fallo de red muestra error/reintento y no permite continuar | ErrorState/refetch; no hay gate si caché retiene servicios y selección durante error de refetch | Test falla primera carga y recupera catálogo al reintentar | PARTIAL | Probar/bloquear avance tras error con datos previos; la carga inicial sí tiene cobertura |
| AC-KAN-135-07 | Negocio inactive/suspended impide seleccionar y muestra businessUnavailable | Catálogo no lee status; layout solo excluye pending/rejected | No hay test de SS para negocio no disponible | MISSING | Gate de negocio y mensaje; no cambiar reglas incidentalmente |
| AC-KAN-135-08 | Sin active muestra vacío y no hay acción continuar | isEmpty y bloque de servicios condicionado a length > 0 | Test verifica mensaje vacío, no ausencia de acción | PARTIAL | Completar aserción de ausencia del botón y consulta real de solo inactive |
| AC-KAN-135-09 | Volver desde disponibilidad conserva servicio elegido | Estado local se pierde al desmontar; retorno no incluye selección | Sin prueba del recorrido | MISSING | Persistencia de progreso limitada al flujo, conforme al contrato acordado |
| AC-KAN-135-10 | Cambiar servicio limpia fecha/turno anterior | Navegación a nuevo serviceId sin query; slots locales de AV | Suites de AV existen, sin test del recorrido completo de cambio de servicio en SS | PARTIAL | Verificar montaje y retorno; conservar limpieza explícita sin restaurar turno viejo |
| AC-KAN-135-11 | Visitante vuelve de login/registro al mismo negocio y servicio preseleccionado | Guard/login conservan destino; SS no recupera servicio; falta entrada pública real | RequireRole.test.tsx prueba guard de otros portales, no este recorrido; no test de registro y preselección | PARTIAL | Entrada de KAN-116 y contrato de preselección, sin reescribir autenticación |
| AC-KAN-135-12 | Visitante directo no ve catálogo y va a sign-in con redirectTo | customerRoutes monta SS bajo RequireRole; guard no renderiza Outlet si deniega | RequireRole.test.tsx prueba redirección genérica; ServiceSelectionPage.test.tsx monta ruta aislada sin guard | PARTIAL | Integración de ruta real de customer y query del destino |
| AC-KAN-135-13 | Servicio elegido lleva a personal si aplica; en otro caso a disponibilidad | SS siempre navega directo; no lee modalidad ni existen pantalla/ruta de personal | Test actual solo navegación directa | PARTIAL | Rama directa implementada; rama de personal depende de KAN-136/137/138 y contrato de integración pendiente |

Balance sobre los 13 ids: 1 IMPLEMENTED, 7 PARTIAL, 4 MISSING y 1 RETIRED/SUPERSEDED. Sobre los **12 vigentes: 1 IMPLEMENTED, 7 PARTIAL y 4 MISSING**. No todos los AC están cubiertos. No se deduce cumplimiento por comentarios o ids en tests. No se han ejecutado pruebas.

## Comportamiento por escenario

1. Con catálogo válido se presentan radios; seleccionar B después de A sustituye el id, limpia el mensaje y continuar navega a B. No se guarda una reserva.
2. Sin servicios, o si todos fallan Zod, aparece vacío. Negocio inexistente produce vacío en la API del catálogo, aunque el layout de ruta real puede mostrar negocio no encontrado antes de montar SS.
3. Servicio inactive queda fuera de consulta inicial. Si se desactiva tras cargar, la selección local aún permite navegar; la siguiente pantalla/servidor rechaza después. No cumple AC 05.
4. Negocio inactive/suspended no es excluido por el adaptador/layout ni por reglas de lectura de servicio; puede aparecer elegible hasta una validación downstream. Pending/rejected se ocultan por layout; no confundir los estados.
5. Fallo inicial muestra error y retry sin catálogo. Fallo de refetch puede conservar datos; la vista no excluye esos controles por error y handleContinue no lo comprueba.
6. Continuar sin elegir muestra serviceRequired y permanece. Recarga/abandono desmonta SS y pierde selección; caché de catálogo no restaura selectedServiceId.
7. URL directa book/:serviceId abre AV bajo guard; no requiere una selección previa en SS. AV consulta el servicio y backend valida antes de reservar. No bloquear enlaces directos legítimos inventando un requisito de visita previa.

## In scope — brechas propias bajo los contratos aprobados

- Mantener lista y controles existentes; reforzar cobertura de 01/04/06/08 sin reimplementarlos.
- Estado de negocio y revalidación de servicio/selección al continuar, con estados de carga y error que impidan avanzar con datos inválidos.
- Contrato mínimo para preselección y conservación del servicio al volver; limpiar fecha, turno y elección de personal obsoletos al cambiar servicio.
- Integración de guard y retorno de autenticación existentes, sin modificar su modelo de permisos.
- Entregar contexto de servicio y negocio al siguiente paso acordado. Implementar únicamente el enlace cuando exista un contrato aprobado, sin construir personal en esta HU.

## Out of scope

KAN-136, KAN-137 y KAN-138 quedan como dependencias, no criterios nuevos ni funcionalidades a implementar. También quedan fuera algoritmo de asignación, reconstrucción de disponibilidad/checkout, creación de home pública KAN-111/116, migración de roles, infraestructura, datos de producción y cambios generales de reglas. Ninguna historia se declara Deferred del MVP por esta delimitación.

## Decisiones confirmadas y abiertas

Confirmadas: Q1 incorpora colaborador; Q4 establece slug en el portal público; Q6 requiere cuenta customer; Q8 exige lógica servidor compartida y Q10 nombres canónicos. Q9 sigue abierta para emails/recordatorios y no afecta selección. Una selección es solo progreso: no crea Booking hasta KAN-148. La SPEC histórica mantiene AS-1 a AS-7 como supuestos; no se presentan automáticamente como decisiones aprobadas.

| Id local | Estado de revisión humana | Contrato aprobado / límite |
| --- | --- | --- |
| SS-D1 | APPROVED | `/:businessSlug/book?serviceId=...`, validación de pertenencia al negocio, conservación al regresar y recargar, limpieza de fecha/turno/colaborador al cambiar servicio. Sin productor KAN-116 ni cambios de auth global. |
| SS-D2 | APPROVED — integración incremental | Conservar destino actual de disponibilidad y entregar negocio/servicio validados. No implementar KAN-136/137/138; AC-13 PARTIAL y dependencias KAN-116 de AC-03/11 permanecen. |
| SS-D3 | APPROVED | Default 20, orden por id, cursor servidor, hooks/controles existentes, selección fuera de página y conteo estándar de active con semántica diferenciada de elementos válidos Zod. Sin búsqueda, filtros adicionales ni selector de tamaño. |

## Dependencias externas y límites del cierre

SS-D1, SS-D2 y SS-D3 están aprobadas por revisión humana; no quedan bloqueos de aprobación sobre estos contratos. Subsisten las integraciones externas de KAN-116 y KAN-136/137/138. Son decisiones locales de esta SPEC, no nuevas Q registradas. Si aparece una necesidad real de modificar índices o infraestructura, detener esa parte y reportarla para revisión; no cambiarla incidentalmente.

La documentación de KAN-139 declara implementación mínima de 01/04/06/08 mientras la SPEC histórica exige 13 condicional: son alcance mínimo fusionado frente a objetivo completo, no permiso para eliminar 13. La revisión humana aprobó la frontera incremental de SS-D2 y el contrato de conservación de SS-D1. El 02 sigue sustituido. No se modifica ningún documento histórico para resolver estas diferencias.

## Flujos objetivo y errores

Principal: customer abre book → catálogo válido del negocio disponible → elige un servicio → revalidar pertenencia, estado y negocio → entregar serviceId al siguiente paso aprobado. Mientras se revalida no se avanza dos veces.

Alternativos: entrada con servicio válido conserva preselección editable; volver del siguiente paso conserva servicio sin conservar turno de otro servicio; cambiar selección limpia información dependiente. Si no hay active, vacío sin continuación. El tratamiento preciso de entrada/persistencia se define en SS-D1.

Errores: sin selección, serviceRequired; servicio desaparecido, serviceUnavailable y refetch permaneciendo en SS; negocio unavailable, businessUnavailable sin elección; error de red, common:errors.network y retry sin avance con datos inválidos. Claves serviceUnavailable/businessUnavailable están en el requisito histórico, pero aún faltan en customer.json ES/EN. Una URL o id no confiable nunca autoriza reservar. Sesión ausente sigue guard/login y retorno seguro existentes.

## Non-functional, i18n y accesibilidad

`src/i18n/locales/{es,en}/customer.json` contiene serviceSelection.continueAction, groupLabel, list.empty, serviceDetail, subtitle, title y errors.serviceRequired. El precio usa formatPrice e idioma activo; no concatenar textos ni introducir copias en TSX. Añadir las claves históricas faltantes solo durante implementación aprobada y comprobar paridad.

`src/components/common/radio-group/RadioGroup.tsx` usa Radix, fieldset/legend, label, control único y tokens semánticos con foco. Hay soporte estructural de teclado y selección, pero no se ejecutó una auditoría de accesibilidad. Validar grupo con nombre accesible, foco, flechas/espacio, anuncio de selección y mensajes en ES/EN, light/dark y móvil. Mantener Button/Spinner/ErrorState y contratos en models, lógica en ViewModel y datos remotos en TanStack Query; no crear otro Context de catálogo.

## Traceability — pruebas y verificaciones por AC

Ninguna suite se ejecutó en esta fase; todos los resultados están pendientes. Las cuatro pruebas de SS existen y se inspeccionaron sus aserciones. No se encontró E2E dedicado a selección; smoke prueba guard del portal business y no acredita el recorrido customer.

| AC histórico | Estrategia de comprobación futura |
| --- | --- |
| AC-KAN-135-01 | Ampliar SS/tests/ServiceSelectionPage.test.tsx para nombre/precio/duración y exclusividad; tests del adaptador fetchBookableCatalog con activos, inactivos, datos inválidos y moneda; reglas para consulta real de catálogo. |
| AC-KAN-135-02 | Sin test nuevo: retirado y sustituido por 13. |
| AC-KAN-135-03 | Test de ruta con preselección del contrato SS-D1, posibilidad de cambiarla y rechazo de id de otro negocio. Entrada pública se prueba al integrarse KAN-116, sin implementarla aquí. |
| AC-KAN-135-04 | Ejecutar test existente sin rehacer validación; verificar recuperación del mensaje al seleccionar. |
| AC-KAN-135-05 | Prueba de deactivación/eliminación entre carga y continuar: misma ruta, mensaje, catálogo actualizado y selección invalidada; regla/backend preservados. |
| AC-KAN-135-06 | Ejecutar fallo/retry existente y añadir refetch fallido con catálogo previo, selección y botón bloqueado; recuperación sin avanzar automáticamente. |
| AC-KAN-135-07 | Pruebas de catálogo/ruta para inactive/suspended y cambio de estado tras cargar; no confundir con pending/rejected o negocio inexistente. |
| AC-KAN-135-08 | Ejecutar vacío existente; añadir ausencia de acción y catálogo con solo inactive. |
| AC-KAN-135-09 | Integración SS→AV→volver y recarga según SS-D1; verificar seleccionado por rol/estado, no solo texto. |
| AC-KAN-135-10 | Elegir fecha/turno para A, volver, elegir B: ruta y contexto de B sin fecha/turno/id de colaborador anterior; probar ida y vuelta real. |
| AC-KAN-135-11 | Entrada, sign-in y sign-up/retorno seguros con negocio/servicio del contrato acordado; pruebas de integración y E2E con emulador. |
| AC-KAN-135-12 | Montar customerRoutes real con visitante, no la ruta aislada del test mínimo; catálogo no consultado y redirectTo correcto; repetir con sesión customer y rol no permitido. |
| AC-KAN-135-13 | Tras SS-D2 probar solo entrega de contexto/destino por modalidad, mediante contrato de integración; las pruebas de listar/elegir personal pertenecen a sus historias. |

Tests UI mediante Page Object sin expect, roles y nombres de testI18n; Firebase simulado en API para unitarias y emulador para reglas/contratos. El test mínimo actual usa screen directamente y rutas aisladas: documentar la necesidad de Page Object si se modifica bajo estándares vigentes, sin refactor fuera del alcance.

E2E propuesto, no creado: `e2e/service-selection.spec.ts`, con selección/cambio, retorno, visitante, vacío y error recuperable. Manual: teclado, móvil, contraste, ES/EN, recarga y retorno. No basta un mock de catálogo para acreditar filtrado real o permisos.

## Archivos probablemente afectados después de aprobación

- SS/api/fetchBookableCatalog.ts y models/serviceSelection.model.ts: estado/contexto, entrada y contratos aprobados; tests del adaptador propuestos dentro de SS/tests.
- SS/hooks/useServiceSelectionViewModel.ts y components/ServiceSelectionPage/ServiceSelectionPage.tsx: revalidación, progreso y bloqueo de avance; extender controles actuales.
- SS/tests/ServiceSelectionPage.test.tsx y Page Object propuesto: completar cobertura por AC; pruebas de ruta real y E2E propuesto.
- `src/i18n/locales/{es,en}/customer.json`: mensajes históricos faltantes; comprobar `src/i18n/tests/localeParity.test.ts`.
- Rutas y retorno de AV solo si SS-D1/SS-D2 lo requieren; no modificar checkout, auth, reglas ni infraestructura por defecto. Esas áreas aportan regresión e integración.

## Riesgos, compatibilidad y regresiones

La caché puede mantener catálogo tras error y servicio ya inválido; no duplicar estado remoto ni confiar solo en string seleccionado. Dos consultas de negocio (layout y catálogo) pueden observar estados distintos; la revalidación al avanzar no reemplaza el servidor al reservar. Evitar que una preselección por URL fuerce ids ajenos/inactive. Cambiar servicio debe limpiar datos dependientes sin perder el negocio.

No reimplementar disponibilidad ni asignación por resolver 13. No cerrar AC 11 solo porque login conserva redirectTo. No debilitar reglas para facilitar consultas; los servicios públicos active y las reservas privadas mantienen sus permisos. Los alias legacy observados se registran como deuda Q10, sin migrarlos aquí. El fetch sin paginación incumple el estándar de listas paginadas; concretar su corrección según SS-D3 sin añadir otros filtros o búsquedas.

## Revisión humana — refinamiento de SS-D1, SS-D2 y SS-D3

### Observaciones recibidas y verificación

La revisión valida la investigación principal y solicita contratos exactos para preselección/retorno, entrega al siguiente paso y paginación, sin reescribir los requisitos históricos. Solicita clasificar 02 como RETIRED/SUPERSEDED y conservar el balance de los 12 vigentes. Estos cambios refinan propuestas; no son una autorización de implementación ni una decisión histórica sustituida.

Git al iniciar este refinamiento: rama `KAN-134/HU-135-service-selection`, HEAD y origin/develop en `02019d44fc101280766e49f7a3218fbe9d48661b`; únicamente esta SPEC aparece sin seguimiento. Se releyeron AGENTS.md, la SPEC actual y las secciones relevantes de state-management y api-query-standards; se conservan las skills ya consultadas y backlog-to-spec como norma de trazabilidad. `Get-Command graphify -ErrorAction SilentlyContinue` no encontró el ejecutable: continúa la limitación documentada y se usaron búsquedas dirigidas, sin repetir toda la investigación.

Evidencia adicional:

- `src/modules/customer/features/my-bookings/hooks/useMyBookingsFilters.ts` usa useSearchParams/setSearchParams; AV usa el mismo mecanismo para date y collaboratorId. Se reutiliza React Router, sin un sistema nuevo de navegación.
- `src/modules/auth/hooks/useRoleGateTargets.ts` construye signInPath a partir de location.pathname + location.search; `useRedirectAfterSignIn.ts` recupera redirectTo seguro. La URL propuesta cabe en este contrato existente. Esto acredita compatibilidad con sign-in, no el recorrido completo de registro de KAN-116.
- AV define parámetros date, startsAt y collaboratorId en `constants/Availability.constants.ts`; los nombres exactos a limpiar son esos. El checkout ya usa servicio en el path.
- `src/constants/numbers/Pagination.constants.ts` define DEFAULT_PAGE_SIZE 20 y PAGE_SIZE_OPTIONS 10/20/50; `.agents/skills/api-query-standards/SKILL.md` §5 indica que el tamaño procede de PAGINATION, el servidor devuelve una página y no se pagina una colección completa en memoria.
- Existen `src/hooks/useCursorPagination.ts`, `src/types/` para contratos transversales y `src/components/common/cursor-pagination/CursorPagination.tsx`; su contrato de controles recibe hasNextPage, hasPreviousPage, onNextPageClick, onPreviousPageClick, pageNumber y totalCount.

### SS-D1 — APPROVED: contrato exacto de entrada, conservación y salida

**APPROVED por revisión humana.** No se añade pantalla. La fuente de intención de selección es el parámetro serviceId de SS; el objeto Service sigue en TanStack Query, sin copiar datos remotos a Context/useState.

| Operación | Contrato aprobado |
| --- | --- |
| Entrada normal | `/:businessSlug/book` abre sin preselección; nunca elige arbitrariamente el primero. |
| Entrada preseleccionada | `/:businessSlug/book?serviceId=<id codificado>`; el productor futuro KAN-116 debe generar esta URL usando generatePath y URLSearchParams. Esta HU solo implementaría el receptor. |
| Selección y cambio de radio | Actualizar el serviceId de la misma ruta mediante setSearchParams con replace; conservar parámetros ajenos al flujo y eliminar date, startsAt y collaboratorId. No añadir un historial por cada radio. El id de selección se deriva de URL más validación, no de un segundo estado independiente. |
| Validación del parámetro | Aceptar como candidato un único valor no vacío que represente un segmento de documento válido; rechazar valores repetidos/ambiguos o con separador de path. El dato decodificado nunca se concatena como ruta arbitraria. La autoridad es el documento services/{serviceId} bajo el businessId resuelto por el slug actual. |
| Servicio fuera de la página visible | Resolverlo por id dentro del negocio actual y validar active; no declararlo inválido solo por no estar en la página actual. Mostrar su selección/resumen fuera de la lista paginada cuando no esté visible, sin duplicar radios ni el objeto remoto. |
| Id inválido, ajeno, borrado o inactive | No seleccionar otro servicio automáticamente. Quitar el parámetro inválido con replace, dejar selección vacía y mostrar serviceSelection.errors.serviceUnavailable; un fallo de red no se confunde con inexistencia ni borra intención. No mostrar datos privados ni datos obtenidos desde otro negocio. |
| Avanzar | Bloquear mientras carga/revalida o hay error, aunque haya caché. Resolver de nuevo negocio y servicio desde servidor con los lectores existentes de Firestore, verificando negocio active y documento active bajo el negocio; no basar esta decisión únicamente en caché o regla de lectura pública. Tras éxito entregar contexto al path existente `/:businessSlug/book/:serviceId`, sin date/startsAt/collaboratorId heredados. |
| Desactivación/eliminación después de cargar | Permanecer en SS, limpiar selección inválida, mostrar serviceUnavailable y refrescar catálogo. Si el negocio pasó a inactive/suspended, impedir elección/avance y mostrar businessUnavailable. La validación final al reservar sigue siendo obligatoria por posibles carreras posteriores. |
| Volver desde AV | El enlace explícito de retorno del servicio S será `/:businessSlug/book?serviceId=S`, sin fecha/turno/colaborador. Es un ajuste mínimo de navegación de AV para AC-09, no un cambio de su motor ni una reestructuración. El historial atrás del navegador conserva la URL de SS ya actualizada. |
| Recargar/abandonar | Recargar el enlace de SS vuelve a validar y recuperar el id. No se garantiza restaurar una selección al abrir después una URL limpia; no se usa localStorage ni persistencia de perfil. No se conservan datos de una reserva ni se añade almacenamiento global. |
| Enlaces directos existentes | `book/:serviceId`, con sus parámetros actuales, sigue abierto a AV bajo guard; no se exige visitar SS ni se reinterpreta su path como la nueva query de selección. La limpieza se limita a seleccionar/cambiar/continuar desde SS o al retorno explícito acordado. |

Un id igual en dos negocios identifica documentos distintos: se valida siempre el documento del negocio actual. No inferir procedencia a partir del string ni realizar búsquedas globales por id. El cambio del slug invalida el contexto/cursor/selección efectiva del negocio anterior; una query nueva solo puede recuperar un servicio válido del nuevo negocio. Las claves de consulta incluyen negocio e id y, para páginas, cursor/tamaño.

El retorno de autenticación debe conservar exactamente el destino seguro con query. Pruebas de sign-in pueden usar el guard existente; registrar/volver desde la página pública sigue necesitando KAN-116. Si el registro no conserva el contrato, se registra su dependencia y se prueba al integrarlo, sin modificar auth global en esta HU.

### SS-D2 — APPROVED: entrega incremental y frontera de AC-13

Modalidades comprobadas: Service.collaboratorSelection tiene automatic/customer_choice en el tipo opcional; updateServiceCollaborators guarda null cuando no hay asignados. La relación real vive en Collaborator.serviceIds. Campo ausente/null por sí solo no prueba ausencia de asignaciones, y un truthy de modalidad no demuestra disponibilidad de personal. No introducir una inferencia nueva para cerrar 13.

Contrato de salida de KAN-135: negocio identificado por businessSlug/businessId resuelto y servicio active del mismo negocio identificado por serviceId. El destinatario relee datos remotos; no confía en nombre, precio, estado, duración o modo serializados en URL. No se requiere elegir ni enviar collaboratorId en SS.

Se reutiliza `/:businessSlug/book/:serviceId` como entrega actual a disponibilidad y las rutas de checkout existentes como consumidoras posteriores. Ninguna ruta nueva ni placeholder se propone. Mientras no exista un paso real de personal, se conserva el destino actual y se declara su límite: **no satisface la rama condicional de AC-13 para customer_choice con colaboradores**.

| Responsabilidad | Entregable / verificación |
| --- | --- |
| KAN-135 propia | Servicio validado, contexto del negocio y navegación a ruta real; probar negocio/servicio correctos y ausencia de datos dependientes obsoletos. La rama directa existente puede verificarse ahora sin reimplementarla. |
| KAN-136 | Proveer consulta pública permitida de personal elegible y, junto con el contrato de integración, determinar si procede la lista. No consultar la colección privada desde SS. |
| KAN-137 | Proveer elección específica y contrato de transporte a disponibilidad; su vista/lista y validación de elección no pertenecen a KAN-135. |
| KAN-138 | Proveer continuación sin elección según modalidad y política; reutiliza motor existente, sin diseñar otro algoritmo en KAN-135. |
| Integración futura | Acordar entre historias dónde se decide la transición una vez que exista el paso real, sin fijar aquí una ruta ficticia. Probar customer_choice con personal, automatic y negocio como recurso sin personal; verificar destino real y contexto íntegro hasta AV/checkout. |

AC-KAN-135-13 continúa **PARTIAL**. No atribuir su cumplimiento a un test que navega siempre a disponibilidad. La revisión humana aprobó conservar esa entrega incremental de negocio/servicio validados; el enlace al paso real sigue dependiendo de KAN-136/137/138. La aceptación final de AC-13 requiere la prueba de integración completa, no un mock que simule una pantalla inexistente.

### SS-D3 — APPROVED: obligatoriedad, tamaño y páginas restantes

La SPEC histórica, sección Non-functional, exige cursor cuando la lista supera una página y api-query-standards exige listas paginadas en servidor. Por tanto la paginación **sí es requisito aplicable**; no queda como mejora opcional ni se modifica el requisito histórico. La revisión humana aprobó aplicar **PAGINATION.DEFAULT_PAGE_SIZE = 20** a este catálogo, sin selector nuevo de tamaño, búsqueda ni filtros adicionales.

Contrato aprobado:

- Página de services del negocio actual con status active, orden estable por id de documento, cursor Firestore y tamaño tomado de PAGINATION.DEFAULT_PAGE_SIZE. No añadir búsqueda ni ordenar por un campo opcional que excluya documentos legacy. Verificar soporte de consulta/reglas en emulador antes de afirmar que no necesita cambios de índice. Si se requiere modificar índices o infraestructura, detener esa parte y reportarla para revisión; no se autoriza cambiarla incidentalmente.
- Mantener forma CursorPage<Item> del estándar: items, nextCursor y totalCount; contar con getCountFromServer sobre la misma consulta filtrada sin cursor/límite. Reutilizar useCursorPagination y CursorPagination, y distinguir fin de páginas de página sin elementos válidos.
- Servicios posteriores siguen accesibles con siguiente/anterior; nunca truncar a los primeros 20 ni descargar todo para paginar en memoria. Revalidar selección por documento aunque no esté visible; cambiar de página no cambia ni invalida el servicio elegido. Cambio de negocio reinicia cursor e intención anterior.
- Un documento que falla el adaptador puede seguir omitiéndose como comportamiento actual; el cursor avanza por documentos consultados, no por la lista ya adaptada. Una página sin items válidos con nextCursor no significa catálogo agotado. Mantener controles para alcanzar páginas posteriores. totalCount representa documentos active consultables; no mostrarlo como cantidad exacta de servicios seleccionables cuando difiera de los elementos válidos tras Zod. La presentación del conteo debe expresar esa distinción, incluso al reutilizar CursorPagination.
- Quedan aprobados orden por documento, default, selección válida fuera de página y semántica de conteo. Cualquier cambio futuro de esos contratos necesita una nueva decisión expresa.

SS-D3 queda cerrada como APPROVED por revisión humana para esos contratos concretos. La aprobación documental no acredita implementación ni ejecución exitosa de sus pruebas.

### Impacto por AC: trabajo propio, dependencia y pruebas

Esta tabla agrega trazabilidad de implementación; no duplica ni redefine los AC normativos ni altera sus estados actuales.

| AC | Trabajo propio propuesto | Integración externa pendiente | Pruebas necesarias, todavía no ejecutadas |
| --- | --- | --- | --- |
| 03 | Receptor book?serviceId validado y editable, incluso fuera de página | Productor de enlace KAN-116 | Entrada válida, repetida, ajena, inactive, inexistente, error de red y cambio de radio; integración pública posterior |
| 05 | Lectura de servidor al avanzar, invalidación de selección y catálogo | Ninguna para corregir SS; conservar backend actual | Deactivar/borrar entre carga y click; permanecer, mensaje, limpieza y refetch; error de red no borra candidato |
| 06 | Gate ante carga/error de refetch con datos retenidos | Ninguna | Caché + selección + refetch fallido: sin navegación ni éxito aparente; retry recupera y exige acción explícita |
| 07 | Leer status de negocio y bloquear controles/avance si no active | Sin cambios de reglas/auth; layout se conserva | inactive/suspended iniciales y cambio posterior; mensajes; pending/rejected siguen tratamiento del layout |
| 09 | Query como intención y enlace de retorno explícito desde AV | Ajuste mínimo del enlace de AV, revisable dentro de esta integración | SS→AV→volver, atrás del navegador, recarga y seleccionado fuera de página; ningún turno restaurado para otro servicio |
| 10 | Limpiar date, startsAt, collaboratorId al cambiar/continuar; no alterar contexto de negocio | Verificar consumo existente de AV | Servicio A con datos previos→B: URL limpia, sin slot anterior; enlace directo de AV conserva contrato |
| 11 | Aceptar preselección tras redirectTo existente | Registro/entrada pública de KAN-116, sin rehacer auth | Guard conserva pathname+search, sign-in recupera mismo id validado; registro/entrada real se acredita al integrar |
| 13 | Entregar negocio y servicio validado a ruta real | KAN-136/137/138 y decisión de transición a personal | Rama directa ahora; matriz de modalidades y destino real al integrar; estado PARTIAL hasta entonces |

Además de la tabla original: probar paginación con más de una página, llegar al último activo, volver a página anterior sin perder selección, cambio de negocio, página inválida con cursor siguiente y selección válida no visible. Revisar en ES/EN y teclado resumen de selección/controles, sin crear componentes paralelos.

### Superficie mínima bajo los contratos aprobados

Propio de KAN-135: extender fetchBookableCatalog y sus modelos/queries para estado/página; lectura puntual del servicio limitada al negocio reutilizando lectores existentes cuando su semántica sea adecuada; refinar useServiceSelectionViewModel y ServiceSelectionPage, claves técnicas centralizadas, mensajes ES/EN y pruebas/Page Object del mismo feature. Añadir solo el estado de validación local necesario; selección derivada de URL y entidades en queries. No crear pantalla alternativa ni Context/reducer global para resolver una selección simple.

Integración mínima explícita: cambiar únicamente el destino del enlace handleBackToServices en AV para incluir serviceId, con prueba del retorno. No tocar cálculo de horarios, disponibilidad agregada, checkout ni rutas directas. KAN-116 produce el enlace y las historias de personal proveen la transición futura; son entregas externas separadas.

Los contratos refinados SS-D1/SS-D2/SS-D3 ya están aprobados. Las brechas propias 05/06/07 y cobertura no dependen de construir personal, pero no se declara cerrada toda la historia al resolverlas. La autorización de este turno se limita a registrar el cierre documental: no implementar ni escribir tests. No hay cambios de auth global, reglas sin justificación aprobada, dependencias, infraestructura, otras SPEC ni correcciones incidentales.

## Condiciones de salida

Fase actual: único archivo nuevo indicado, sin código, tests, backlog o documentación histórica modificados; git status y diff check reportados, sin commit/push/PR.

Salida de la implementación propia, cuando se autorice en un trabajo posterior: completar las brechas propias bajo SS-D1/SS-D2/SS-D3 aprobadas, preservar comportamientos existentes y AC-02 retirado, verificar contratos URL, validación, retorno, limpieza y paginación con pruebas reales y gates del repositorio. No implementar KAN-116 ni KAN-136/137/138. La clasificación actual de AC no cambia por aprobar esta SPEC: 1 IMPLEMENTED por inspección, 7 PARTIAL, 4 MISSING y 1 RETIRED/SUPERSEDED; no hay pruebas ejecutadas todavía.

Cierre integral de KAN-135: además de la salida propia, AC-13 requiere integración real con KAN-136/137/138 y AC-03/11 requieren la entrada pública y el recorrido completo dependientes de KAN-116. Cada AC vigente necesita evidencia suficiente y dependencias resueltas. No declarar completada toda KAN-135 mientras falten estas integraciones, aunque la implementación propia esté verificada.

Cierre documental por aprobación humana: SS-D1 APPROVED, SS-D2 APPROVED — integración incremental, SS-D3 APPROVED. Se conserva la investigación y la matriz sin reclasificar AC por falta de nueva evidencia. Rama y referencias verificadas sin cambios; solo se actualiza esta SPEC. No se autoriza implementación en este turno.

Verificación posterior: format:check, lint, typecheck, test:run con maxWorkers=4, test:rules y test:e2e según AGENTS.md, con resultados reales. Para emuladores seguir ERRORES-Y-LECCIONES (build functions y JDK adecuado). En este cierre documental no se ejecutan suites, build, dev o seed ni se certifica su éxito; solo se actualiza esta SPEC. Los contratos están aprobados, pero se espera autorización de trabajo de implementación posterior.
