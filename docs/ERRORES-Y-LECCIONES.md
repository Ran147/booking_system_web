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
