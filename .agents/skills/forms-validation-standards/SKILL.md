---
name: forms-validation-standards
description: Use when building or changing any form — sign-in, sign-up, contact, service, booking, plan, profile or settings — or when adding validation rules, password rules, reCAPTCHA to a public form, or showing field and server errors. Covers React Hook Form + Zod schemas, translated messages and submit handling.
---

# Forms and Validation Standards

This skill is the **single source of truth** for forms: schemas, field components, error display and submit flow.

## Precedence

| Topic | Owner |
| --- | --- |
| Schemas, field wiring, error display, submit flow | **this skill** |
| Message text (`validation` namespace) | `i18n-standards` |
| Sending the data and mapping server errors | `api-mutation-standards` |
| reCAPTCHA verification and which forms are public | `auth-and-roles` |
| Field components available | `component-standards` |
| Where the form logic lives (ViewModel) | `component-architecture` |

---

## 1. Stack

- **React Hook Form** holds the form state. **Zod** defines the rules. `@hookform/resolvers/zod` connects them.
- Fields use the shadcn `Form` components from `@/shared/components`; `FormMessage` is ours and translates the error.
- Values are never mirrored into `useState` (`state-management`).

## 2. Schemas

- One schema per form in `<feature>/models/<FormName>.schema.ts`, exporting the schema and its inferred type (`z.infer`).
- Every message is a `VALIDATION_MESSAGE_KEY` (`i18n-standards`), never text.
- Limits (lengths, ranges) come from constants, never from literals in the schema.
- Default values live in a constant typed with `satisfies <FormName>Values`.
- The same rule is checked again on the server (function or `firestore.rules`). The client check is for user experience only.

## 3. Behavior

| Rule | Detail |
| --- | --- |
| Validation timing | `mode: "onBlur"`, then re-validate on change once a field has an error |
| Submit | `form.handleSubmit` → mutation (`api-mutation-standards`) |
| Double submit | Submit button disabled while the mutation `isPending` |
| Server field errors | `form.setError("<field>", { message: <key> })` |
| Server general errors | Toast with the translated `MutationError.messageKey` |
| Success | Toast with a `…Success` key, then navigate or reset |
| Unsaved changes | Forms in dialogs ask before closing when `formState.isDirty` |
| Passwords | `PasswordInput` with show / hide (KAN-35) and `PasswordStrengthMeter` driven by `PASSWORD_RULE` (KAN-37) |
| Public forms | Sign-in, sign-up, contact and password recovery include `RecaptchaField`; submit stays disabled until there is a token (`auth-and-roles`) |
| Money | Shown in currency units, stored as `priceInCents` (`domain-glossary`) |
| Dates and times | Picked in the business `timeZone` |

String values such as `"onBlur"` and field names are typed parts of the React Hook Form API, so they stay inline.

## 4. Correct example: create service (KAN-54)

```ts
// src/portals/business/features/services/constants/ServiceForm.constants.ts
export const SERVICE_FIELD_LIMIT = {
  DESCRIPTION_MAX_LENGTH: 500,
  DURATION_MAX_MINUTES: 480,
  DURATION_MIN_MINUTES: 5,
  NAME_MAX_LENGTH: 80,
} as const;
```

```ts
// src/portals/business/features/services/models/ServiceForm.schema.ts
import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/shared/constants";
import { SERVICE_FIELD_LIMIT } from "../constants/ServiceForm.constants";

export const serviceFormSchema = z.object({
  description: z
    .string()
    .trim()
    .max(
      SERVICE_FIELD_LIMIT.DESCRIPTION_MAX_LENGTH,
      VALIDATION_MESSAGE_KEY.TOO_LONG,
    ),
  durationMinutes: z
    .number()
    .int()
    .min(
      SERVICE_FIELD_LIMIT.DURATION_MIN_MINUTES,
      VALIDATION_MESSAGE_KEY.OUT_OF_RANGE,
    )
    .max(
      SERVICE_FIELD_LIMIT.DURATION_MAX_MINUTES,
      VALIDATION_MESSAGE_KEY.OUT_OF_RANGE,
    ),
  name: z
    .string()
    .trim()
    .min(1, VALIDATION_MESSAGE_KEY.REQUIRED)
    .max(SERVICE_FIELD_LIMIT.NAME_MAX_LENGTH, VALIDATION_MESSAGE_KEY.TOO_LONG),
  priceInCents: z
    .number()
    .int()
    .nonnegative(VALIDATION_MESSAGE_KEY.OUT_OF_RANGE),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;
```

```ts
// src/portals/business/features/services/constants/ServiceFormDefaults.constants.ts
import { STRING } from "@/shared/constants";
import { SERVICE_FIELD_LIMIT } from "./ServiceForm.constants";
import type { ServiceFormValues } from "../models/ServiceForm.schema";

export const DEFAULT_SERVICE_FORM_VALUES = {
  description: STRING.EMPTY,
  durationMinutes: SERVICE_FIELD_LIMIT.DURATION_MIN_MINUTES,
  name: STRING.EMPTY,
  priceInCents: 0,
} as const satisfies ServiceFormValues;
```

```ts
// src/portals/business/features/services/models/ServiceFormViewModel.interface.ts
import type { FormEvent } from "react";
import type { UseFormReturn } from "react-hook-form";
import type { ServiceFormValues } from "./ServiceForm.schema";

export interface ServiceFormViewModel {
  form: UseFormReturn<ServiceFormValues>;
  handleSubmit: (event?: FormEvent<HTMLFormElement>) => Promise<void>;
  isSubmitting: boolean;
}
```

```ts
// src/portals/business/features/services/hooks/useServiceFormViewModel.ts
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";
import { useCurrentBusiness } from "@/features/auth";
import { toast } from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { useCreateServiceMutation } from "../api/useCreateServiceMutation";
import { DEFAULT_SERVICE_FORM_VALUES } from "../constants/ServiceFormDefaults.constants";
import {
  serviceFormSchema,
  type ServiceFormValues,
} from "../models/ServiceForm.schema";
import type { ServiceFormViewModel } from "../models/ServiceFormViewModel.interface";

export const useServiceFormViewModel = (): ServiceFormViewModel => {
  const { t } = useTranslation([
    I18N_NAMESPACE.BUSINESS,
    I18N_NAMESPACE.COMMON,
  ]);
  const { businessId } = useCurrentBusiness();
  const createServiceMutation = useCreateServiceMutation();
  const form = useForm<ServiceFormValues>({
    defaultValues: DEFAULT_SERVICE_FORM_VALUES,
    mode: "onBlur",
    resolver: zodResolver(serviceFormSchema),
  });

  const submitServiceForm = (serviceFormValues: ServiceFormValues): void => {
    createServiceMutation.mutate(
      { businessId, serviceFormValues },
      {
        onError: (mutationError) => {
          toast.error(t(`common:${mutationError.messageKey}`));
        },
        onSuccess: () => {
          toast.success(t("business:services.form.createSuccess"));
          form.reset(DEFAULT_SERVICE_FORM_VALUES);
        },
      },
    );
  };

  return {
    form,
    handleSubmit: form.handleSubmit(submitServiceForm),
    isSubmitting: createServiceMutation.isPending,
  };
};
```

```tsx
// src/portals/business/features/services/components/ServiceForm.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@/shared/components";
import { I18N_NAMESPACE } from "@/shared/constants";
import { useServiceFormViewModel } from "../hooks/useServiceFormViewModel";

export const ServiceForm = (): ReactElement => {
  const { t } = useTranslation(I18N_NAMESPACE.BUSINESS);
  const { form, handleSubmit, isSubmitting } = useServiceFormViewModel();

  return (
    <Form {...form}>
      <form className="flex flex-col gap-4" noValidate onSubmit={handleSubmit}>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("services.form.nameLabel")}</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button disabled={isSubmitting} type="submit">
          {t("services.form.submitAction")}
        </Button>
      </form>
    </Form>
  );
};
```

The other fields (`description`, `durationMinutes`, `priceInCents`) follow the same `FormField` pattern.

**`src/i18n/locales/es/validation.json`**

```json
{
  "emailInvalid": "Ingresa un correo válido.",
  "outOfRange": "El valor está fuera del rango permitido.",
  "passwordTooWeak": "La contraseña no cumple los requisitos.",
  "recaptchaRequired": "Confirma que no eres un robot.",
  "required": "Este campo es obligatorio.",
  "tooLong": "El texto es demasiado largo.",
  "tooShort": "El texto es demasiado corto."
}
```

**`src/i18n/locales/en/validation.json`**

```json
{
  "emailInvalid": "Enter a valid email.",
  "outOfRange": "The value is out of the allowed range.",
  "passwordTooWeak": "The password does not meet the requirements.",
  "recaptchaRequired": "Confirm you are not a robot.",
  "required": "This field is required.",
  "tooLong": "The text is too long.",
  "tooShort": "The text is too short."
}
```

**`src/i18n/locales/es/business.json`**

```json
{
  "services": {
    "form": {
      "createSuccess": "Servicio creado.",
      "nameLabel": "Nombre del servicio",
      "submitAction": "Guardar servicio"
    }
  }
}
```

**`src/i18n/locales/en/business.json`**

```json
{
  "services": {
    "form": {
      "createSuccess": "Service created.",
      "nameLabel": "Service name",
      "submitAction": "Save service"
    }
  }
}
```

### Incorrect

```tsx
// State per field, hand-written checks, Spanish text in code, no server re-check
const [name, setName] = useState("");
const [error, setError] = useState("");

const onSubmit = async () => {
  if (name.length === 0) return setError("El nombre es obligatorio");
  if (name.length > 80) return setError("Muy largo");
  await addDoc(collection(firestore, "services"), { name });
};
```

## 5. Password rules (KAN-25, KAN-36, KAN-37)

```ts
// src/features/auth/constants/PasswordRule.constants.ts
export const PASSWORD_RULE = {
  MIN_LENGTH: 8,
  PATTERN: {
    DIGIT: /\d/,
    LOWERCASE: /[a-z]/,
    SYMBOL: /[^A-Za-z0-9]/,
    UPPERCASE: /[A-Z]/,
  },
} as const;
```

```ts
// src/features/auth/models/PasswordField.schema.ts
import { z } from "zod";
import { VALIDATION_MESSAGE_KEY } from "@/shared/constants";
import { PASSWORD_RULE } from "../constants/PasswordRule.constants";

export const passwordFieldSchema = z
  .string()
  .min(PASSWORD_RULE.MIN_LENGTH, VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK)
  .refine(
    (password) =>
      Object.values(PASSWORD_RULE.PATTERN).every((pattern) =>
        pattern.test(password),
      ),
    VALIDATION_MESSAGE_KEY.PASSWORD_TOO_WEAK,
  );
```

`PasswordStrengthMeter` uses the same `PASSWORD_RULE` to show which rules are met, so the meter and the validation never disagree.

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| Messages are keys, not text | `tsc` (`VALIDATION_MESSAGE_KEY` values) and `i18next/no-literal-string` |
| Magic numbers in schemas | `@typescript-eslint/no-magic-numbers` |
| No `useState` per field in `.tsx` | ESLint rule from `component-architecture` |
| Server re-validation | `firestore.rules` / function tests (`unit-testing-standards`) |

## 7. Checklist

- [ ] The form uses React Hook Form + Zod; the schema lives in `models/<FormName>.schema.ts` with its inferred type.
- [ ] Messages are `VALIDATION_MESSAGE_KEY` values; limits come from constants; defaults use `satisfies`.
- [ ] Every field uses `FormField` + `FormMessage`; labels are translated.
- [ ] Submit goes through a mutation hook; the button is disabled while pending.
- [ ] Server field errors are mapped with `setError`; general errors show a translated toast.
- [ ] Public forms include `RecaptchaField`.
- [ ] Passwords use `PasswordInput`, `PasswordStrengthMeter` and `passwordFieldSchema`.
- [ ] The same rules are enforced on the server.
