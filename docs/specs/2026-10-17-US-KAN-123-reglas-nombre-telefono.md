# Software Design Document (SDD) — KAN-123 (reglas comunes)

## Reglas comunes de nombre completo y teléfono

| Metadato | Valor |
| --- | --- |
| **Historia de Usuario** | KAN-123 (registro del cliente con nombre completo y teléfono). Este PR solo trae las reglas que el registro necesita; el formulario va en un PR propio |
| **Épica** | KAN-122 (registro del cliente) |
| **Portal** | Compartido (`src/domain/user/`, `src/modules/auth/models/`, `functions/src/shared/constants/`) |
| **Spec funcional** | `src/modules/customer/features/customer-sign-up/specs/SPEC.md` (AS-3) |
| **Rama** | `KAN-123-name-phone-rules`, desde `develop` |
| **Fecha de Especificación** | 2026-10-17 |
| **Estado** | Borrador — la regla única del teléfono se confirma con el equipo (§5) |
| **Fuera de alcance** | Cambiar los formularios que ya validan el teléfono a su manera (§4), el formulario del registro del cliente, la función del servidor |

---

### 1. Problema

Hoy cada formulario define su propio teléfono:

| Dónde | Regla |
| --- | --- |
| Registro del suscriptor (KAN-25), código | Dígitos, espacios, `+` y `-`; 7 a 20 caracteres |
| Perfil del negocio (PROP-4 / KAN-199), código | `+` opcional, dígitos, espacios, `()` y `-`; 7 a 25 caracteres |
| Perfil del cliente (KAN-170), PR #10 sin fusionar | Dígitos, espacios, `+`, `()` y `-`; 7 a 15 dígitos; hasta 20 caracteres |
| Colaboradores (KAN-78), SPEC AS-10 | Dígitos, espacios, `+` y `-`; 7 a 20 caracteres |
| Clientes del negocio (KAN-88), SPEC AS-1 | `+` opcional; 7 a 15 dígitos |
| Registro del cliente (KAN-123), SPEC AS-3 | Igual que el perfil del cliente |

Las reglas que cuentan caracteres y no dígitos aceptan valores como `-------` o `(((((((`. La SPEC del perfil del negocio (AS-4) ya pide "el formato compartido de `forms-validation-standards`", que nunca se escribió. Y el registro del cliente (KAN-123) y su perfil (KAN-170) escriben los mismos `User.fullName` y `User.phone`: si cada uno valida distinto, un teléfono aceptado al registrarse puede ser rechazado al editar el perfil.

### 2. Solución

Una sola regla, tomada de la del perfil del cliente (PR #10, KAN-170), que es la de la SPEC del registro del cliente (AS-3), con el `+` cerrado al inicio (P-2):

| Campo | Regla |
| --- | --- |
| Nombre completo | 2 a 80 caracteres, sin espacios al inicio ni al final |
| Teléfono | Solo dígitos, espacios, `-` y paréntesis, con un `+` opcional solo al inicio; de 7 a 15 dígitos (15 es el máximo de un número internacional, E.164); hasta 20 caracteres |

Que el campo sea obligatorio u opcional lo decide cada formulario; la regla solo dice si el formato es válido.

| Archivo | Contenido |
| --- | --- |
| `src/domain/user/FullNameRule.constants.ts` | `FULL_NAME_RULE` (`MAX_LENGTH`, `MIN_LENGTH`) |
| `src/domain/user/PhoneRule.constants.ts` | `PHONE_RULE` (`MAX_DIGITS`, `MAX_LENGTH`, `MIN_DIGITS`, `PATTERN.ALLOWED_CHARACTERS`, `PATTERN.DIGIT`) |
| `src/domain/user/isValidPhone.ts` | Función pura: caracteres permitidos, `+` solo al inicio, conteo de dígitos y largo. La pueden usar formularios que no usan los esquemas de abajo |
| `src/modules/auth/models/FullNameField.schema.ts` | `fullNameFieldSchema`: `required`, `tooShort`, `tooLong` |
| `src/modules/auth/models/PhoneField.schema.ts` | `phoneFieldSchema`: `required`, `tooLong`, `validation:phoneInvalid`. `optionalPhoneFieldSchema`: lo mismo, pero vacío, solo espacios o sin valor (`undefined`) se guarda como `""` |
| `functions/src/shared/constants/` | Copias de `FULL_NAME_RULE` y `PHONE_RULE` para el servidor (`// Mirror of … — keep in sync.`) |
| `.agents/skills/forms-validation-standards/SKILL.md` | §6 nueva: la regla y cómo usarla |

Los esquemas viven junto a `passwordFieldSchema` y `emailFieldSchema` en `@/modules/auth`, que es donde el proyecto ya pone los campos que comparten varios formularios. Un formulario con teléfono opcional usa `optionalPhoneFieldSchema`, que recorta antes de decidir si está vacío: armarlo a mano con `z.union([z.literal(STRING.EMPTY), phoneFieldSchema])` rechaza un campo con solo espacios como `required`.

El mensaje del formato es `validation:phoneInvalid`, que ya existe en los dos idiomas y es el que pide la SPEC del registro del cliente.

### 3. Pruebas

| Archivo | Casos |
| --- | --- |
| `src/domain/tests/isValidPhone.test.ts` | Acepta `(506) 8888-8888`, `+1 555 123 4567`, 7 y 15 dígitos; rechaza `-------`, `(((((((`, 6 y 16 dígitos, letras, `+` después del primer carácter, más de 20 caracteres |
| `src/modules/auth/tests/personFieldSchemas.test.ts` | Mensaje de cada caso: vacío → `required`, nombre corto → `tooShort`, largo → `tooLong`, formato → `phoneInvalid`; recorta los espacios; el teléfono opcional acepta vacío, solo espacios y `undefined`, y con más de 20 dígitos da `tooLong` |

### 4. Adopción (cada uno en su propio PR)

| Formulario | Quién | Cuándo |
| --- | --- | --- |
| Perfil del cliente (KAN-170, PR #10) | Alejandro al resolver sus conflictos con `develop`, o Marco después | Cuando este PR esté en `develop` |
| Registro del cliente (KAN-123) | Marco | En el PR del formulario |
| Registro del suscriptor (KAN-25) | Marco | PR aparte; cambia AS-3 de su SPEC |
| Perfil del negocio (KAN-199) | Flxwing | Cuando pueda |
| Colaboradores (KAN-78) y clientes del negocio (KAN-88, KAN-91) | Quien las tome | Desde el inicio |

Este PR no cambia ningún formulario existente: solo agrega la regla.

### 5. Pendiente de confirmar

| Id | Pregunta | Supuesto |
| --- | --- | --- |
| P-1 | ¿Todo el equipo usa esta regla del teléfono? | Sí; se propuso por mensaje el 2026-10-17 (la reunión se canceló) y se confirma en el PR #43 |
| P-2 | ¿El `+` solo puede ir al inicio? | **Resuelto (revisión del PR #43):** sí, como en E.164 y en el perfil del negocio. El perfil del cliente (PR #10) coincide al adoptar `phoneFieldSchema` (§4) |
| P-3 | ¿El nombre completo valida algo más que el largo? | No: acepta `12`, `!!` o varios espacios seguidos para no rechazar nombres reales; solo se recortan los espacios del inicio y del final |
