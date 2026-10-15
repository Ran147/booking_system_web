# Software Design Document (SDD) — Refactor: limpiar carpetas y archivos duplicados

| Metadato | Valor |
| --- | --- |
| **Tipo** | Refactor técnico, sin cambio de comportamiento (no es una historia de usuario) |
| **Rama** | `chore/refactor-duplicados`, desde `develop` |
| **Fecha** | 2026-10-14 |
| **Estado** | Borrador — pendiente de aprobación |
| **Fuera de alcance** | Cualquier cambio de comportamiento, reglas de Firestore, Cloud Functions, i18n |

---

## 1. Problema

La reestructuración a módulos (`67b405d`) dejó el código viejo al lado del nuevo. Hoy hay dos copias de casi todo:

| Duplicado | Estado real |
| --- | --- |
| `src/shared/{components,constants,domain,types,utils,hooks,lib}` frente a `src/{components/common,constants,domain,types,utils,hooks,services}` | 53 archivos idénticos, 18 distintos (los de `src/` están más nuevos) y 23 sin equivalente directo. Ningún archivo importa estas copias por su ruta: solo se usan sus `index.ts`, que ya son **reexportaciones** (`export * from "@/constants"`) |
| `src/shared/test-utils` frente a `src/test-utils` | Los 6 archivos eran idénticos (hoy difieren en `renderRoutesWithProviders`, que solo se actualizó en `src/test-utils`). `vitest.config.ts` usa la copia de `shared` |
| `src/features/auth` | 2 archivos que reexportan `@/modules/auth`; lo usan `admin.routes.tsx`, dos copias de test-utils y un test |
| `src/portals/*.routes.tsx` | 4 reexportaciones que nadie importa (`appRoutes.tsx` usa `@/modules/*`). Dos `SPEC.md` viven aquí y no en `modules` |
| `src/context/` | Nadie importa `@/context`. Los contextos reales están en `modules/auth/context` y `app/providers/theme` |

Consecuencias: se edita el archivo equivocado (el PR #11 cambió `STORAGE_KEY` en dos copias), los PRs importan de `@/shared/...` o de `@/...` según quién los escribió, y la configuración (`eslint`, `vitest`, `components.json`, `.prettierignore`, el script de la semilla) apunta a rutas viejas.

## 2. Restricción importante: los PRs abiertos

Hay PRs abiertos (#5, #11, #12 al #15, #26, #27 y otros) escritos con imports de `@/shared/...`. Si se borra `src/shared/` por completo, **todos fallarían al compilar** al fusionarse, aunque Git no marque conflicto de texto. Y reescribir los imports en cientos de archivos chocaría con casi cualquier PR.

Por eso el refactor va en **dos fases**.

## 3. Fase 1 (este PR): quitar lo muerto y dejar un puente

Solo borra copias que nadie usa y deja los reexports que sí se usan.

| Acción | Detalle |
| --- | --- |
| Borrar copias muertas de `src/shared/` | `components/*`, `constants/*`, `domain/*`, `types/*`, `hooks/*`, `lib/firebase/*` y `utils/*`, **excepto** los `index.ts` y los archivos que otros importan por ruta |
| Dejar como reexportación | `src/shared/utils/cn.ts`, `utils/resolveViewState.ts`, `utils/format/index.ts` y `test-utils/*` pasan a una línea (`export * from "@/utils/cn"`, etc.). Así `@/shared/...` sigue funcionando sin duplicar código |
| `vitest.config.ts` | `setupFiles` apunta a `src/test-utils/setupTests.ts`; se quita `src/shared/domain/**` y `src/portals/**` de la cobertura excluida |
| `src/features/auth` | Los 3 imports pasan a `@/modules/auth`; se borra `src/features/` |
| `src/portals/` | Se borran los 4 `*.routes.tsx`. Los dos `SPEC.md` se mueven a `src/modules/business/features/...` |
| `src/context/` | Se borra (sin usos) |
| Configuración | `eslint.config.js`, `components.json`, `.prettierignore` y `scripts/seed-emulator.ts` dejan de nombrar rutas que ya no existen |
| Documentación | Se corrige la estructura de `AGENTS.md` §3 y las referencias en `README.md` y `docs/setup/tooling.md` |

**Resultado:** unos 85 archivos menos, `src/shared/` reducido a unos 12 reexports pequeños, y una sola copia real de cada cosa. No cambia el comportamiento.

**Riesgo para los otros PRs:** quien haya editado una copia borrada (por ejemplo el PR #11, que tocó `StorageKey` en `src/shared/`) verá un conflicto "modificado / borrado". Se resuelve aceptando el borrado; su cambio en la copia de `src/` es el que cuenta.

## 4. Fase 2 (después): migrar los imports y borrar el puente

Cuando los PRs abiertos hayan entrado o se hayan actualizado:
- Cambiar `@/shared/constants` → `@/constants`, `@/shared/types` → `@/types`, `@/shared/domain` → `@/domain`, `@/shared/components` → `@/components/common`, `@/shared/utils/*` → `@/utils/*`, `@/shared/test-utils/*` → `@/test-utils/*`, `@/shared/lib/firebase` → `@/services/firebase`.
- Borrar `src/shared/` por completo. Es mecánico (búsqueda y reemplazo) y se verifica con `typecheck`.
- Mientras tanto, el código nuevo debería importar ya de las rutas sin `shared` (se avisa al equipo).

## 5. Qué NO se toca

- `src/hooks/` y `src/types/`: son carpetas transversales reales según `AGENTS.md`.
- Cualquier archivo de `src/modules/` salvo lo indicado (imports de `features/auth`).
- Los componentes de `src/components/common/ui/` (shadcn).

## 6. Verificación

`format:check`, `lint`, `typecheck`, `test:run` y `build`. Además, comparar que **no cambia el número de tests** (hoy 287 en `develop`, sin contar US-36 ni US-38) y que `git grep "src/shared"` solo encuentra los reexports que quedan.

## 7. Commits previstos

```text
docs(specs): especificacion tecnica del refactor de duplicados
refactor(arch): pasar src/features/auth a @/modules/auth y borrar portals y context sin uso
refactor(arch): reemplazar las copias de src/shared por reexportaciones
chore(config): quitar rutas viejas de eslint, vitest, components.json y la semilla
docs(arch): actualizar la estructura de carpetas en AGENTS.md y el README
```

## 8. Preguntas

| Id | Pregunta | Recomendación |
| --- | --- | --- |
| **P-1** | ¿Fase 1 ahora y Fase 2 cuando entren los PRs abiertos? | **Sí.** Borrar todo `src/shared/` de una vez rompería los PRs del equipo |
| **P-2** | ¿Borrar `src/context/` y `src/portals/`? Nadie los importa, pero `AGENTS.md` los menciona como estructura | **Sí**, y corregir `AGENTS.md` |
