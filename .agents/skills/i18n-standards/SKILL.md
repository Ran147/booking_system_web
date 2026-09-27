---
name: i18n-standards
description: Use when adding or changing any text a person can read — UI labels, titles, buttons, placeholders, aria-labels, alt text, validation and error messages, emails — or when formatting dates, times, prices or numbers. Covers react-i18next namespaces, key naming, interpolation, plurals and Intl formatting in English and Spanish.
---

# i18n Standards

This skill is the **single source of truth** for user-visible text and locale formatting. The site ships in Spanish (`es`, default) and English (`en`).

## Precedence

| Topic | Owner |
| --- | --- |
| Any text a person reads (screen, email, file export headers) | **this skill** — it wins over `constants-standards` |
| Technical identifiers (routes, collections, storage keys, namespaces) | `constants-standards` |
| Names of domain concepts in keys (`booking`, not `appointment`) | `domain-glossary` |
| Validation rules and how a form shows errors | `forms-validation-standards` (messages come from here) |
| Mapping Firebase errors to message keys | `api-mutation-standards` |

---

## 1. Where text lives

```
src/i18n/
├── i18n.ts                       # i18next init (language detection, fallback)
├── resources.ts                  # imports every JSON file
├── i18next.d.ts                  # type-safe keys (see §4)
└── locales/
    ├── es/{common,validation,landing,business,customer,admin}.json
    └── en/{common,validation,landing,business,customer,admin}.json
```

| Namespace | Contents |
| --- | --- |
| `common` | Shared UI (actions, pagination, theme and language switchers, status labels, generic errors) |
| `validation` | Form validation messages |
| `landing`, `business`, `customer`, `admin` | One per portal, so six people rarely edit the same file |

- Default language `es`, fallback `es`. The detected or chosen language is stored under `STORAGE_KEY.LANGUAGE` and in the user's profile (`User.language`).
- Every key exists in **both** languages. Spanish is the reference file.
- Emails and exported files are translated in `functions/src/notifications/locales/{en,es}/` using the recipient's `User.language`.

## 2. Key naming

- Keys are nested objects in `camelCase`: `<feature>.<element>.<purpose>`.
- The last segment says what the text is for:

| Suffix | Use | Example |
| --- | --- | --- |
| `title`, `subtitle` | Headings | `services.list.title` |
| `…Label` | Field and column labels | `services.form.nameLabel` |
| `…Placeholder`, `…Hint` | Input helper text | `services.form.priceHint` |
| `…Action` | Buttons and links | `services.card.editAction` |
| `…Empty` | Empty states | `services.list.empty` |
| `…Error` | Feature-specific errors | `services.delete.hasBookingsError` |
| `…Confirm` | Confirmation dialogs | `services.delete.confirm` |
| `…Success` | Success toasts | `services.form.createSuccess` |

- Status labels live in `common` keyed by the **status value** from `domain-glossary`: `bookingStatus.no_show`.
- Do not reuse a key because the Spanish text happens to match. Two meanings, two keys.

## 3. Writing messages

- **No concatenation.** Use interpolation: `"{{customerName}} reservó {{serviceName}}"`. Word order changes between languages.
- **Plurals** use i18next suffixes `_one` / `_other` with `count`.
- **No formatting inside the JSON.** Dates, prices and numbers are formatted in code (§5) and passed as interpolation values.
- **No HTML in JSON.** When a message needs a link or bold text, use `<Trans>` with named components.
- Accessibility text (`aria-label`, `alt`, `title`) is translated too.

### Incorrect

```tsx
// Hard-coded Spanish, concatenation, manual plural, unformatted price
export const ServiceSummary = ({ service, bookingCount }: ServiceSummaryProps): ReactElement => (
  <p>
    {"Servicio: " + service.name + " - $" + service.priceInCents / 100}
    {bookingCount === 1 ? " (1 reserva)" : ` (${bookingCount} reservas)`}
  </p>
);
```

### Correct

**`src/i18n/locales/es/business.json`**

```json
{
  "services": {
    "card": {
      "editAction": "Editar servicio"
    },
    "summary": {
      "bookingCount_one": "{{count}} reserva",
      "bookingCount_other": "{{count}} reservas",
      "priceLabel": "{{serviceName}}: {{formattedPrice}}"
    }
  }
}
```

**`src/i18n/locales/en/business.json`**

```json
{
  "services": {
    "card": {
      "editAction": "Edit service"
    },
    "summary": {
      "bookingCount_one": "{{count}} booking",
      "bookingCount_other": "{{count}} bookings",
      "priceLabel": "{{serviceName}}: {{formattedPrice}}"
    }
  }
}
```

**`src/i18n/locales/es/common.json`**

```json
{
  "bookingStatus": {
    "cancelled": "Cancelada",
    "completed": "Completada",
    "confirmed": "Confirmada",
    "no_show": "No se presentó",
    "pending": "Pendiente de confirmación"
  }
}
```

**`src/i18n/locales/en/common.json`**

```json
{
  "bookingStatus": {
    "cancelled": "Cancelled",
    "completed": "Completed",
    "confirmed": "Confirmed",
    "no_show": "No-show",
    "pending": "Pending confirmation"
  }
}
```

```ts
// src/portals/business/features/services/models/ServiceSummaryProps.interface.ts
export interface ServiceSummaryProps {
  bookingCount: number;
  currencyCode: string;
  serviceName: string;
  servicePriceInCents: number;
}
```

```tsx
// src/portals/business/features/services/components/ServiceSummary.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import { I18N_NAMESPACE } from "@/shared/constants";
import { formatPrice } from "@/shared/utils/format";
import type { ServiceSummaryProps } from "../models/ServiceSummaryProps.interface";

export const ServiceSummary = ({
  bookingCount,
  currencyCode,
  serviceName,
  servicePriceInCents,
}: ServiceSummaryProps): ReactElement => {
  const { i18n, t } = useTranslation(I18N_NAMESPACE.BUSINESS);

  return (
    <p>
      {t("services.summary.priceLabel", {
        formattedPrice: formatPrice(
          servicePriceInCents,
          currencyCode,
          i18n.language,
        ),
        serviceName,
      })}
      {t("services.summary.bookingCount", { count: bookingCount })}
    </p>
  );
};
```

Keeping formatting in a ViewModel is preferred once the component has any logic (`component-architecture`); this example is presentation-only.

A status label, typed against the status union:

```tsx
// src/shared/components/booking-status-label/BookingStatusLabel.tsx
import type { ReactElement } from "react";
import { useTranslation } from "react-i18next";
import type { BookingStatus } from "@/shared/domain";

export interface BookingStatusLabelProps {
  status: BookingStatus;
}

export const BookingStatusLabel = ({
  status,
}: BookingStatusLabelProps): ReactElement => {
  const { t } = useTranslation();

  return <span>{t(`bookingStatus.${status}`)}</span>;
};
```

If a status is added to `BOOKING_STATUS` without its label in `common.json`, `tsc` fails.

## 4. Type-safe keys

Keys are checked by TypeScript. A typo in `t("…")` is a compile error.

```ts
// src/i18n/resources.ts
import adminEn from "./locales/en/admin.json";
import businessEn from "./locales/en/business.json";
import commonEn from "./locales/en/common.json";
import customerEn from "./locales/en/customer.json";
import landingEn from "./locales/en/landing.json";
import validationEn from "./locales/en/validation.json";
import adminEs from "./locales/es/admin.json";
import businessEs from "./locales/es/business.json";
import commonEs from "./locales/es/common.json";
import customerEs from "./locales/es/customer.json";
import landingEs from "./locales/es/landing.json";
import validationEs from "./locales/es/validation.json";

export const resources = {
  en: {
    admin: adminEn,
    business: businessEn,
    common: commonEn,
    customer: customerEn,
    landing: landingEn,
    validation: validationEn,
  },
  es: {
    admin: adminEs,
    business: businessEs,
    common: commonEs,
    customer: customerEs,
    landing: landingEs,
    validation: validationEs,
  },
} as const;
```

```ts
// src/i18n/i18next.d.ts
import "i18next";
import type { resources } from "./resources";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: "common";
    resources: (typeof resources)["es"];
  }
}
```

The `"common"` literal in the declaration is required by TypeScript's module augmentation and is the only place a namespace is written as a string.

### Keys used outside `t()`

Sometimes a key is stored and translated later (for example, a Zod message rendered by `FormField`). Those keys go in a typed constant, never as loose strings:

```ts
// src/shared/constants/i18n/ValidationMessageKey.constants.ts
export const VALIDATION_MESSAGE_KEY = {
  EMAIL_INVALID: "emailInvalid",
  OUT_OF_RANGE: "outOfRange",
  PASSWORD_TOO_WEAK: "passwordTooWeak",
  RECAPTCHA_REQUIRED: "recaptchaRequired",
  REQUIRED: "required",
  TOO_LONG: "tooLong",
  TOO_SHORT: "tooShort",
} as const;

export type ValidationMessageKey =
  (typeof VALIDATION_MESSAGE_KEY)[keyof typeof VALIDATION_MESSAGE_KEY];
```

```ts
// src/shared/constants/index.ts (append)
export {
  VALIDATION_MESSAGE_KEY,
  type ValidationMessageKey,
} from "./i18n/ValidationMessageKey.constants";
```

Supported languages are a constant too; `i18n.ts`, the language switcher and tests use it:

```ts
// src/shared/constants/i18n/Language.constants.ts
export const LANGUAGE = {
  EN: "en",
  ES: "es",
} as const;

export type Language = (typeof LANGUAGE)[keyof typeof LANGUAGE];

export const DEFAULT_LANGUAGE = LANGUAGE.ES;
```

```ts
// src/shared/constants/index.ts (append)
export {
  DEFAULT_LANGUAGE,
  LANGUAGE,
  type Language,
} from "./i18n/Language.constants";
```

The values match the keys of `validation.json`; `forms-validation-standards` shows how they are used.

## 5. Formatting with `Intl`

Never format by hand or with `toLocaleString()` without a locale. Use the shared helpers, which receive the active language and, for dates, the business `timeZone` (`domain-glossary`).

```ts
// src/shared/utils/format/formatPrice.ts
import { MONEY } from "@/shared/constants";

export const formatPrice = (
  priceInCents: number,
  currencyCode: string,
  language: string,
): string =>
  new Intl.NumberFormat(language, {
    currency: currencyCode,
    style: "currency",
  }).format(priceInCents / MONEY.CENTS_PER_UNIT);
```

```ts
// src/shared/utils/format/formatDateTime.ts
export const formatDateTime = (
  dateTime: Date,
  timeZone: string,
  language: string,
): string =>
  new Intl.DateTimeFormat(language, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(dateTime);
```

```ts
// src/shared/utils/format/index.ts
export { formatDateTime } from "./formatDateTime";
export { formatPrice } from "./formatPrice";
```

```ts
// src/shared/constants/numbers/Money.constants.ts
export const MONEY = {
  CENTS_PER_UNIT: 100,
} as const;
```

```ts
// src/shared/constants/index.ts (append)
export { MONEY } from "./numbers/Money.constants";
```

The option values `"medium"`, `"short"` and `"currency"` are part of the typed `Intl` API, so they stay inline.

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| No visible text literals in JSX | ESLint `i18next/no-literal-string` (`mode: "jsx-only"`) on `src/**/*.tsx` |
| Keys exist | `tsc` via `i18next.d.ts` |
| Every key exists in `es` and `en` | `src/i18n/tests/localeParity.test.ts` (compares key sets per namespace) |
| No concatenated visible text | Code review, plus the literal-string rule above |
| JSON formatting and sorted keys | Prettier; keys sorted by the `i18n:sort` script |

## 7. Checklist

- [ ] No visible text in `.tsx`, constants or Cloud Functions. It is in `locales/{es,en}` or `functions/…/locales`.
- [ ] The key is in the right namespace and follows `<feature>.<element>.<purpose>`.
- [ ] The key exists in both `es` and `en`, with the same interpolation variables.
- [ ] Interpolation instead of concatenation; `_one` / `_other` for plurals.
- [ ] Dates, prices and numbers use `formatDateTime` / `formatPrice` with the active language and the business time zone.
- [ ] `aria-label`, `alt` and `title` are translated.
- [ ] Keys stored outside `t()` come from a typed constant (`VALIDATION_MESSAGE_KEY`).
- [ ] Status labels use the status value as key (`bookingStatus.no_show`).
