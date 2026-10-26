# Software Design Document (SDD) — US-05 (KAN-5)
## Formulario de Contacto Validado con reCAPTCHA

| Metadato | Valor |
|---|---|
| **Historia de Usuario** | US-05 / KAN-5 ("Como visitante quiero enviar mis consultas mediante un formulario de contacto validado con recaptcha para comunicarme de forma segura") |
| **Épica** | KAN-14 ([Landing] Sobre nosotros y ayuda) |
| **Portal** | Landing (`src/modules/landing/features/contact`) |
| **Fecha de Especificación** | 2026-10-18 |
| **Estado** | Aprobada para Implementación |
| **Requerimientos Relacionados** | RF-01 (Landing Page), RNF-04 (Usabilidad), RNF-05 (Tema Dinámico), RNF-07 (Seguridad y Prevención de Spam), RNF-08 (Accesibilidad WCAG AA) |

---

### 1. Resumen y Propósito

Proveer en la página de Contacto del portal público (`/contact`) un formulario accesible, validado y seguro contra ataques de spam y bots automatizados mediante Google reCAPTCHA. A través de este formulario (`ContactForm`), cualquier visitante o usuario interesado puede enviar dudas comerciales, solicitudes de demostración o consultas generales al equipo de soporte de Booking System sin necesidad de registrarse previamente.

El formulario implementa el patrón MVVM (`useContactFormViewModel`), validación con Zod y React Hook Form (`forms-validation-standards`), consume componentes atómicos de `src/components/common/` (`Input`, `TextareaField`, `Button`, `RecaptchaField`), e interactúa con la Cloud Function invocable `sendContactMessage` (`functions/src/notifications/sendContactMessage.ts`). La Cloud Function valida el esquema de entrada, comprueba el token reCAPTCHA mediante `assertRecaptcha` en el backend (`cloud-functions-standards` §2) y persiste el mensaje con marca de tiempo en la colección Firestore `contactMessages` de forma segura mediante el SDK Admin. Incluye estados claros de carga (`isSubmitting`), éxito tras el envío con reseteo de campos, y recuperación ante fallos de red.

---

### 2. Criterios de Aceptación Medibles

* **AC-KAN-5-01 [Happy Path - Envío Exitoso de Formulario]:** Dado que un visitante diligencia el formulario con datos válidos (`name`, `email`, `subject`, `message`) y completa exitosamente el reCAPTCHA, cuando hace clic en "Enviar mensaje", entonces:
  - Se ejecuta la mutación de envío de contacto.
  - El botón muestra estado de carga (`isSubmitting` / spinner).
  - Al completar la solicitud, se muestra un mensaje de confirmación de éxito (`landing:contact.form.success`).
  - Se restablecen los campos del formulario y el reCAPTCHA para permitir futuros envíos.
* **AC-KAN-5-02 [Error - Validación de Campos en Cliente]:** Dado que el visitante interactúa con el formulario dejando campos obligatorios en blanco o ingresa un formato de correo inválido, cuando se valida el formulario, entonces:
  - Se visualizan los mensajes de error correspondientes (`validation:required`, `validation:emailInvalid`).
  - El formulario previene el envío y no despacha ninguna petición a la red.
* **AC-KAN-5-03 [Error - Bloqueo por Falta de reCAPTCHA]:** Dado que los datos de entrada son válidos pero el visitante no ha resuelto la casilla de reCAPTCHA, cuando intenta enviar el formulario, entonces:
  - El botón de envío permanece inhabilitado o muestra el error de reCAPTCHA obligatorio (`landing:contact.form.recaptchaRequired`).
  - No se envía ninguna consulta hasta que se obtenga un token válido.
* **AC-KAN-5-04 [Error - Manejo de Errores de Red o Servidor]:** Dado que la solicitud de contacto falla por caída de red o error inesperado del servidor, cuando el servicio responde con fallo, entonces:
  - Se muestra un mensaje de error accesible (`common:errors.network` o `landing:contact.form.serverError`).
  - Se preservan los datos diligenciados por el visitante para no perder su mensaje.
  - Se emite señal de reset al widget de reCAPTCHA para exigir nueva verificación de seguridad.
* **AC-KAN-5-05 [Accesibilidad WCAG AA y Dynamic Theming (RNF-05, RNF-08)]:**
  - Los campos cuentan con etiquetas explícitas (`<label>`) y descripciones de error asociadas mediante `aria-describedby` y `aria-invalid`.
  - Empleo exclusivo de tokens semánticos de Tailwind v4 (`bg-card`, `text-card-foreground`, `border-border`, `text-foreground`).
  - Adaptabilidad total en viewports móviles (desde 360 px) sin desbordamiento horizontal.

---

### 3. Matriz de Fronteras de Equipo

| Recurso / Módulo | Estado | Permiso |
|---|---|---|
| `docs/specs/2026-10-18-US-05-formulario-contacto.md` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/contact/ContactPage.tsx` | Nuevo componente de página | **Permitido (Creador)** |
| `src/modules/landing/features/contact/components/ContactForm/ContactForm.tsx` | Nuevo componente | **Permitido (Creador)** |
| `src/modules/landing/features/contact/components/ContactForm/types.ts` | Nuevo archivo | **Permitido (Creador)** |
| `src/modules/landing/features/contact/models/contactForm.schema.ts` | Nuevo archivo (Zod) | **Permitido (Creador)** |
| `src/modules/landing/features/contact/models/contactForm.model.ts` | Nuevas interfaces | **Permitido (Creador)** |
| `src/modules/landing/features/contact/hooks/useContactFormViewModel.ts` | Nuevo hook ViewModel | **Permitido (Creador)** |
| `src/modules/landing/features/contact/constants/contactForm.constants.ts` | Nuevas constantes congeladas A-Z | **Permitido (Creador)** |
| `src/modules/landing/features/contact/api/sendContactMessage.ts` | Servicio / mutación de envío | **Permitido (Creador)** |
| `src/modules/landing/features/contact/tests/ContactPage.page.ts` | POM de pruebas | **Permitido (Creador)** |
| `src/modules/landing/features/contact/tests/ContactForm.test.tsx` | Pruebas de componente | **Permitido (Creador)** |
| `src/modules/landing/features/contact/tests/useContactFormViewModel.test.tsx` | Pruebas unitarias ViewModel | **Permitido (Creador)** |
| `src/modules/landing/features/contact/tests/contactForm.schema.test.ts` | Pruebas de schema Zod | **Permitido (Creador)** |
| `src/modules/landing/features/contact/index.ts` | Export barrel | **Permitido (Creador)** |
| `src/modules/landing/landing.routes.tsx` | Registro de ruta `/contact` | **Permitido (Aditivo)** |
| `src/i18n/locales/{es,en}/landing.json` | Claves bajo `contact.form.*` | **Permitido (Aditivo)** |
| `src/components/common/**` | Consumo de átomos (`Input`, `Button`, `RecaptchaField`) | **Solo Lectura / Consumo** |
| Otros módulos externos | Portal business, admin, customer | **PROHIBIDO MODIFICAR** |

---

### 4. Decisiones de Arquitectura y Contratos de Datos (MVVM)

#### 4.1. Esquema de Validación Zod (`contactForm.schema.ts`)
```typescript
export const contactFormSchema = z.object({
  email: z.string().trim().email(),
  message: z.string().trim().min(10).max(1000),
  name: z.string().trim().min(2).max(100),
  recaptchaToken: z.string().min(1),
  subject: z.string().trim().min(3).max(150),
});

export type ContactFormData = z.infer<typeof contactFormSchema>;
```

#### 4.2. Contrato del ViewModel (`ContactFormViewModel`)
```typescript
export interface ContactFormViewModel {
  readonly form: UseFormReturn<ContactFormData>;
  readonly handleRecaptchaTokenChange: (token: Nullable<string>) => void;
  readonly handleSubmit: (event?: BaseSyntheticEvent) => Promise<void>;
  readonly isSubmitDisabled: boolean;
  readonly isSubmitting: boolean;
  readonly isSuccess: boolean;
  readonly recaptchaResetSignal: number;
  readonly recaptchaSiteKey: string;
  readonly serverError: Nullable<string>;
}
```

---

### 5. Trazabilidad de Pruebas Automatizadas

| Criterio | Tipo | Archivo de Prueba | Estrategia |
|---|---|---|---|
| **AC-KAN-5-01** | Happy Path | `ContactForm.test.tsx` | Completa campos válidos, token reCAPTCHA, valida estado de éxito y reseteo. |
| **AC-KAN-5-02** | Error | `ContactForm.test.tsx` | Dispara submit sin campos obligatorios o email inválido y verifica errores de validación. |
| **AC-KAN-5-03** | Error | `ContactForm.test.tsx` | Valida campos válidos sin reCAPTCHA y comprueba bloqueo del botón de envío. |
| **AC-KAN-5-04** | Error | `ContactForm.test.tsx` | Simula fallo en mutación y verifica retención de valores y reset signal de reCAPTCHA. |
| **AC-KAN-5-05** | Accesibilidad / Theming | `ContactForm.test.tsx` | Comprueba `aria-describedby`, labels vinculadas y tokens semánticos dinámicos. |
