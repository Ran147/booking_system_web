# Errores y Lecciones Aprendidas — Booking System Web

Este registro documenta fallos detectados, antipatrones encontrados y lecciones arquitectonicas clave en el proyecto. **No repetir estos errores.**

---

## 1. Aislamiento de Tests y Montaje de Features en Placeholders

- **Error:** Montar un hook asincrono real (`usePlanCatalogViewModel`) dentro de una pagina placeholder (`LandingPlaceholderPage.tsx`), rompiendo pruebas de integracion globales de rutas (`App.test.tsx` y `appRoutes.test.tsx`) que esperaban renderizados sincronos o timeouts cortos sin mocks globales.
- **Leccion:** Los componentes placeholder compartidos deben permanecer ligeros y estables. Las features de historias de usuario se prueban en sus suites dedicadas con mocks especificos en su propio entorno o bajo sus rutas definitivas.

---

## 2. Orden de Importaciones (`import-x/order`)

- **Error:** Mezclar imports relativos con imports absolutos (`@/`) o imports de librerias de terceros, provocando fallos en `eslint .`.
- **Leccion:** Mantener siempre el orden estricto:
  1. Dependencias externas de `node_modules` (React, React Router, TanStack Query, Zod).
  2. Modulos internos usando alias `@/` (`@/components/common`, `@/constants`, `@/services`, `@/utils`).
  3. Rutas relativas a directorios superiores (`../`).
  4. Rutas relativas locales en el mismo nivel (`./`).
  5. Imports de tipos (`import type { ... }`).

---

## 3. Tipado con `Nullable<T>`

- **Error:** Usar uniones manuales como `HTMLElement | null` o `string | null` en vez de la utilidad transversal del proyecto.
- **Leccion:** Utilizar siempre el tipo generico `Nullable<T>` (`Nullable<HTMLElement>`, `Nullable<string>`) definido en `@/types`.

---

## 4. Formato de Commits en Git

- **Error:** Commits con mensajes genericos (`update`, `fix`), en ingles o con tildes en el asunto que causan inconsistencias en el historial.
- **Leccion:** Seguir el estandar `git-workflow`: espanol, imperativo, sin tildes en el asunto: `tipo(scope): descripcion (US-XX)`.

---

## 5. Reglas de Firestore aflojadas para que algo funcione sin Cloud Functions (Sprint 1)

- **Error:** Un commit `fix(services)` (`53c2751`) cambio `firestore.rules` para que un fallback en el cliente pudiera escribir lo que hacen las Cloud Functions (crear usuarios, negocios, slugs y suscripciones; crear servicios activos en un negocio no habilitado). Rompio 4 tests de `test:rules` y habria dejado a un dueno escribir su propio `planId` sin pagar.
- **Causa:** Las Cloud Functions requieren plan Blaze; la funcionalidad solo se probo en el emulador y al integrarla no funcionaba sin pagar.
- **Leccion:** Nunca se debilitan las reglas para que una funcionalidad pase (`AGENTS.md` seccion 7). Se prueba contra los emuladores (`firebase emulators:start`), que corren las funciones reales. Si de verdad hace falta una excepcion, se registra en `docs/decisions/open-questions.md`, se escribe su test de reglas y se revisa en un PR aparte.

---

## 6. Roles y claims con nombres distintos segun quien programa (Sprint 1)

- **Error:** Conviven `client` y `customer`, `subscriber` y `business_owner`, `businessId` y `business_id`. Cada historia uso uno y los arreglos finales tuvieron que aceptar todos en reglas, rutas y sidebar.
- **Leccion:** Antes de usar un rol o un claim nuevo se confirma el canonico en `src/domain/user/UserRole.constants.ts` y en `docs/CONTEXTO-APP.md`. Si hay dudas, se pregunta al equipo y se anota la decision; no se aceptan los dos nombres "por si acaso".

---

## 7. Cambios de varias historias en un solo commit o PR (Sprint 1)

- **Error:** Un commit `fix(services)` de 106 archivos incluyo contacto, checkout de plan, mis reservas y subida de imagenes. Choca con PRs abiertos de otras personas y no se puede revisar.
- **Leccion:** Un PR por historia (`US-XX`), sin refactors ni funcionalidad ajena (`AGENTS.md` seccion 2). Los PRs apilados sobre otro se abren solo cuando el anterior esta fusionado, o se declara el orden en la descripcion.

---

## 8. Commits directos a la rama de integracion y verificaciones que nadie corre (Sprint 1)

- **Error:** Hubo commits directos a `Sprint_1` sin PR ni revision, y no existe CI (se quito en `ad09466`). Se fusionaron PRs con `format:check` fallando y con `test:rules` en rojo sin que nadie lo notara.
- **Leccion:** Nada va directo a `develop` ni a `Sprint_1`; todo entra por PR. Tras cada merge a `develop`, quien fusiona corre `format:check`, `lint`, `typecheck`, `test:run` y `test:rules`. Antes de abrir el PR se corre ademas `test:e2e`. Un rojo no se descarta como "flaky" sin comprobarlo.

---

## 9. Bloques duplicados de `match /users/{userId}` en `firestore.rules`

- **Error:** Cada PR de perfil de cliente (#10, #13, #14, #15) agrega su propio `match /users/{userId}`. Las reglas se suman (OR): un `allow create, delete: if false` en un bloque no impide lo que permite otro.
- **Leccion:** Cada coleccion tiene un solo bloque `match` en `firestore.rules`. Quien llega despues anade su regla dentro del bloque existente y escribe su test en el mismo archivo de `tests/rules/`.

---

## 10. Entorno de verificacion local

- **Error:** `functions/lib` desactualizado, Java 17 por defecto y un primer `test:e2e` que siempre se agota hacen fallar pruebas que no estan rotas, y se acostumbra a ignorar los rojos.
- **Leccion:** Antes de levantar los emuladores se corre `npm --prefix functions run build`. `test:rules` y `test:e2e` necesitan JDK 24 (`JAVA_HOME`). Si el primer `test:e2e` agota el tiempo, se levantan los emuladores a mano (`npx firebase emulators:start --only auth,firestore,functions --project demo-booking-system`) y se repite; AC-KAN-36-02 puede fallar solo la primera vez tras un arranque en frio. La suite completa de Vitest se corre con `--maxWorkers=4`.
