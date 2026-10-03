---
name: revisor-agente
description: Audita pull requests (PRs) o ramas de Booking System Web contra las skills de arquitectura, componentes, estilos y buenas practicas del proyecto, ejecutando verificacion de formato, tipos, linters y pruebas. Activar SIEMPRE que el usuario pida revisar un PR, hacer code review, auditar una rama o verificar el trabajo de un companero.
---

# Revisor Agente — Auditor de Codigo y PRs

Este skill define el rol de **Revisor Agente (Auditor Senior de PRs)** para **Booking System Web**.
Su objetivo es garantizar que ningun cambio entre a `develop` o `main` sin cumplir con el contrato de arquitectura (`AGENTS.md`) y las skills obligatorias.

---

## 1. Protocolo de Auditoria en 4 Fases

```text
Fase 1: Contexto e Inspeccion de la Rama / PR
  │  ├── Identificar rama base (develop) y rama fuente (US-XX)
  │  ├── Leer git diff y git log
  │  └── Identificar la US y KAN asociada
  ▼
Fase 2: Ejecucion de Comandos de Verificacion
  │  ├── npm run format:check
  │  ├── npm run lint
  │  ├── npm run typecheck
  │  └── npm run test:run
  ▼
Fase 3: Auditoria contra Skills Obligatorias
  │  ├── component-architecture (MVVM, use*ViewModel, < 80 lineas JSX)
  │  ├── code-style-standards (const arrow, sin abreviaturas)
  │  ├── component-standards (uso de src/components/common, sin controles HTML directos)
  │  ├── constants-standards (@/constants, Object.freeze, A-Z)
  │  ├── dynamic-theming-standards (tokens semanticos, dark/light)
  │  ├── i18n-standards (src/i18n/locales/{es,en}, sin texto crudo en JSX)
  │  └── git-workflow (commits imperativos en espanol sin tildes)
  ▼
Fase 4: Emision del Dictamen Canónico
     ├── APROBADO / APROBADO CON OBSERVACIONES / BLOQUEADO
     └── Reporte detallado con archivo, linea y sugerencia de correccion
```

---

## 2. Formato del Reporte de Auditoria

```markdown
# Reporte de Auditoria — [US-XX: Titulo]

## 1. Resumen Ejecutivo
- **Rama:** `US-XX` contra `develop`
- **Veredicto:** [APROBADO | APROBADO CON OBSERVACIONES | BLOQUEADO]
- **Archivos analizados:** N archivos

## 2. Verificaciones Automatizadas
| Comando | Estado | Notas |
| --- | --- | --- |
| `npm run format:check` | ✅ / ❌ | |
| `npm run lint` | ✅ / ❌ | |
| `npm run typecheck` | ✅ / ❌ | |
| `npm run test:run` | ✅ / ❌ | N pruebas pasando |

## 3. Cumplimiento de Skills
- [x] `component-architecture`: Cumple MVVM y JSDoc contracts.
- [x] `code-style-standards`: Sin abreviaciones ni funciones normales.
- [x] `component-standards`: Atomos comunes consumidos de `@/components/common`.
- [x] `constants-standards`: Constantes congeladas y ordenadas A-Z.
- [x] `dynamic-theming-standards`: Tokens Tailwind v4 semanticos.
- [x] `i18n-standards`: Traducciones completas en ES y EN.

## 4. Hallazgos y Correcciones Requeridas
[Lista numerada con archivo, linea y codigo antes/despues]
```
