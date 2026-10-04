---
name: git-workflow
description: Convenciones de ramas, mensajes de commit en espanol, verificacion previa y apertura de pull requests contra develop para Booking System Web.
---

# Git Workflow Standards

Este skill define el flujo de trabajo con Git en **Booking System Web**, asegurando consistencia, trazabilidad de historias de usuario (KAN / US-XX) y una historia de commits limpia y profesional.

---

## 1. Convencion de Ramas

| Tipo de Rama | Nombre | Origen | Destino PR |
| --- | --- | --- | --- |
| Principal estable | `main` | — | Produccion |
| Integracion continua | `develop` | `main` | `main` |
| Historia de usuario | `US-XX` (o `feat/US-XX`) | `develop` | `develop` |
| Correccion urgente | `hotfix/US-XX` o `fix/XX` | `main` | `main` y `develop` |

**Regla de oro:** Toda rama de funcionalidad se crea desde `develop` y su Pull Request se abre contra `develop`. Nunca directamente contra `main`.

---

## 2. Formato de Mensajes de Commit

Los commits deben ser **atomicos**, redactados en **espanol**, en modo **imperativo** y **sin tildes en la linea de asunto**.

### Estructura
```text
tipo(alcance): descripcion breve en minusculas y sin punto final (US-XX)

[Cuerpo opcional explicando el por que del cambio si no es trivial]
```

### Tipos Permitidos
- `feat`: Nueva funcionalidad para el usuario.
- `fix`: Correccion de un bug.
- `docs`: Modificaciones en documentacion, especificaciones o contratos.
- `style`: Formateo de codigo, orden de imports, sin cambio de logica.
- `refactor`: Reestructuracion de codigo sin alterar comportamiento externo.
- `test`: Creacion o modificacion de pruebas unitarias o de integracion.
- `chore`: Tareas de configuracion, scripts, dependencias o tooling.

### Ejemplos Correctos
```text
feat(landing): catalogo de planes de suscripcion para visitantes (US-07)
docs(specs): especificacion tecnica de planes en landing (US-07)
test(landing): agregar pruebas unitarias del viewmodel de planes (US-07)
chore(arch): reestructurar arquitectura a modulos limpios
```

### Ejemplos Incorrectos
```text
❌ git commit -m "update"
❌ git commit -m "Fix bugs en el botón de login" (contiene tildes y mayúsculas desordenadas)
❌ git commit -m "WIP"
```

---

## 3. Puertas de Verificacion Previas al Commit / PR

Antes de hacer commit o crear un Pull Request, ejecutar y pasar con **0 errores**:

```bash
npm run format:check   # Verificacion de Prettier
npm run lint           # Verificacion de ESLint (0 errores, 0 advertencias)
npm run typecheck      # Compilacion TypeScript (tsc -b --noEmit)
npm run test:run       # Suite completa de Vitest
```

---

## 4. Checklist para Pull Requests

- [ ] La rama se origino en `develop` y apunta a `develop`.
- [ ] Todos los commits siguen el formato `tipo(scope): descripcion (US-XX)`.
- [ ] La PR incluye la plantilla de PR completa (`.github/pull_request_template.md`).
- [ ] Todos los comandos de verificacion pasan al 100%.
- [ ] No contiene secretos ni archivos generados en cache (`graphify-out/`, `.env*`).
