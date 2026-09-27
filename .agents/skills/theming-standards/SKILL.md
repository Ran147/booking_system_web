---
name: theming-standards
description: Use when choosing a color, background, border, shadow or status tone for any UI, when touching src/styles/tokens.css, or when working on the light/dark/system theme switch. Covers design tokens, Tailwind semantic classes and the ThemeProvider.
---

# Theming Standards

This skill is the **single source of truth** for colors, design tokens and the light / dark / system theme.

## Precedence

| Topic | Owner |
| --- | --- |
| Colors, tokens, dark mode, status tones | **this skill** — wins over `component-standards` on styling |
| Which primitive to use (`Button`, `Badge`, …) | `component-standards` |
| Where theme state lives (Context) | `state-management` (this skill defines the theme Context itself) |
| Storage key for the chosen theme | `constants-standards` (`STORAGE_KEY.THEME`) |
| Visible text on theme controls | `i18n-standards` |

---

## 1. Tokens are the only source of color

- Every color is a CSS variable in `src/styles/tokens.css`, defined once for light (`:root`) and once for dark (`.dark`).
- Tailwind v4 exposes each token as a semantic utility through `@theme inline`: `bg-background`, `text-foreground`, `bg-primary`, `text-muted-foreground`, `border-border`, `bg-destructive`, `bg-success`, `bg-warning`.
- Components use **only** semantic utilities. Dark mode then works without `dark:` variants.

```css
/* src/styles/tokens.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.21 0.02 265);
  --muted: oklch(0.96 0.01 265);
  --muted-foreground: oklch(0.55 0.02 265);
  --border: oklch(0.92 0.01 265);
  --primary: oklch(0.51 0.19 265);
  --primary-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.98 0 0);
  --success: oklch(0.6 0.15 150);
  --success-foreground: oklch(0.98 0 0);
  --warning: oklch(0.77 0.16 75);
  --warning-foreground: oklch(0.21 0.02 265);
  --chart-1: oklch(0.51 0.19 265);
  --chart-2: oklch(0.6 0.15 150);
  --chart-3: oklch(0.77 0.16 75);
  --radius: 0.5rem;
}

.dark {
  --background: oklch(0.17 0.02 265);
  --foreground: oklch(0.96 0.01 265);
  --muted: oklch(0.25 0.02 265);
  --muted-foreground: oklch(0.72 0.02 265);
  --border: oklch(0.3 0.02 265);
  --primary: oklch(0.66 0.17 265);
  --primary-foreground: oklch(0.17 0.02 265);
  --destructive: oklch(0.65 0.2 27);
  --destructive-foreground: oklch(0.98 0 0);
  --success: oklch(0.7 0.14 150);
  --success-foreground: oklch(0.17 0.02 265);
  --warning: oklch(0.8 0.15 75);
  --warning-foreground: oklch(0.17 0.02 265);
  --chart-1: oklch(0.66 0.17 265);
  --chart-2: oklch(0.7 0.14 150);
  --chart-3: oklch(0.8 0.15 75);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
  --color-warning: var(--warning);
  --color-warning-foreground: var(--warning-foreground);
  --color-chart-1: var(--chart-1);
  --color-chart-2: var(--chart-2);
  --color-chart-3: var(--chart-3);
  --radius-lg: var(--radius);
}
```

The values above are a neutral starting palette. Brand colors are changed **only** here.

- Every foreground/background pair meets WCAG AA contrast (4.5:1 for text) in **both** themes. Check it when a value changes.
- A new token is added to `:root`, `.dark` and `@theme inline` in the same change.

## 2. What components may and may not use

| Allowed | Forbidden |
| --- | --- |
| `bg-primary`, `text-muted-foreground`, `border-border` | Tailwind palette colors: `bg-blue-500`, `text-gray-700` |
| `bg-success`, `bg-warning`, `bg-destructive` for status | Hex, `rgb()`, `hsl()`, `oklch()` in `.tsx` or feature CSS |
| `rounded-lg` (from `--radius`) | Inline `style={{ color: … }}` |
| `cn()` to merge classes | `dark:` variants in components (tokens already switch) |

**Incorrect:**

```tsx
<span className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
  {t(`bookingStatus.${status}`)}
</span>
```

**Correct:** a status maps to a **tone**, and the tone maps to token classes. See §3.

## 3. Status tones

Statuses from `domain-glossary` are shown with a tone, never with a color picked in the feature.

```ts
// src/shared/constants/theme/Tone.constants.ts
export const TONE = {
  DANGER: "danger",
  NEUTRAL: "neutral",
  SUCCESS: "success",
  WARNING: "warning",
} as const;

export type Tone = (typeof TONE)[keyof typeof TONE];

export const TONE_CLASS_NAME = {
  [TONE.DANGER]: "bg-destructive text-destructive-foreground",
  [TONE.NEUTRAL]: "bg-muted text-muted-foreground",
  [TONE.SUCCESS]: "bg-success text-success-foreground",
  [TONE.WARNING]: "bg-warning text-warning-foreground",
} as const satisfies Record<Tone, string>;
```

```ts
// src/shared/domain/booking/BookingStatusTone.constants.ts
import { TONE, type Tone } from "@/shared/constants";
import { BOOKING_STATUS, type BookingStatus } from "./BookingStatus.constants";

export const BOOKING_STATUS_TONE = {
  [BOOKING_STATUS.CANCELLED]: TONE.DANGER,
  [BOOKING_STATUS.COMPLETED]: TONE.NEUTRAL,
  [BOOKING_STATUS.CONFIRMED]: TONE.SUCCESS,
  [BOOKING_STATUS.NO_SHOW]: TONE.DANGER,
  [BOOKING_STATUS.PENDING]: TONE.WARNING,
} as const satisfies Record<BookingStatus, Tone>;
```

```tsx
// src/shared/components/status-badge/StatusBadge.tsx
import type { ReactElement, ReactNode } from "react";
import { TONE_CLASS_NAME, type Tone } from "@/shared/constants";
import { cn } from "@/shared/utils/cn";

export interface StatusBadgeProps {
  children: ReactNode;
  tone: Tone;
}

export const StatusBadge = ({
  children,
  tone,
}: StatusBadgeProps): ReactElement => (
  <span
    className={cn(
      "inline-flex items-center rounded-lg px-2 py-0.5 text-xs font-medium",
      TONE_CLASS_NAME[tone],
    )}
  >
    {children}
  </span>
);
```

```ts
// src/shared/constants/index.ts (append)
export { TONE, TONE_CLASS_NAME, type Tone } from "./theme/Tone.constants";
export {
  THEME_CLASS,
  THEME_MEDIA_QUERY,
  THEME_MODE,
  type ThemeMode,
} from "./theme/ThemeMode.constants";
export { PROVIDER_ERROR } from "./errors/ProviderError.constants";
export { BROWSER_EVENT } from "./events/BrowserEvent.constants";
```

```ts
// src/shared/constants/events/BrowserEvent.constants.ts
export const BROWSER_EVENT = {
  CHANGE: "change",
  KEY_DOWN: "keydown",
  POINTER_DOWN: "pointerdown",
  SCROLL: "scroll",
  VISIBILITY_CHANGE: "visibilitychange",
} as const;
```

Status maps use `as const satisfies Record<Status, Tone>`, so `tsc` fails when a status has no tone.

## 4. Theme modes and the ThemeProvider

- Modes: `light`, `dark` and `system` (follows the OS). Default: `system`.
- The choice is stored under `STORAGE_KEY.THEME`. For signed-in users it is also saved to `User.theme`.
- The provider adds or removes the `dark` class on `<html>`. Nothing else toggles it.
- `index.html` runs a tiny inline script that applies the stored theme before React loads, so the page does not flash.

```ts
// src/shared/constants/theme/ThemeMode.constants.ts
export const THEME_MODE = {
  DARK: "dark",
  LIGHT: "light",
  SYSTEM: "system",
} as const;

export type ThemeMode = (typeof THEME_MODE)[keyof typeof THEME_MODE];

export const THEME_CLASS = {
  DARK: "dark",
} as const;

export const THEME_MEDIA_QUERY = {
  PREFERS_DARK: "(prefers-color-scheme: dark)",
} as const;
```

```ts
// src/shared/constants/errors/ProviderError.constants.ts
// Developer-facing messages; never shown to end users.
export const PROVIDER_ERROR = {
  MISSING_AUTH_PROVIDER: "useSession must be used inside AuthProvider",
  MISSING_CURRENT_BUSINESS:
    "useCurrentBusiness requires a signed-in subscriber",
  MISSING_THEME_PROVIDER: "useTheme must be used inside ThemeProvider",
} as const;
```

```ts
// src/app/providers/theme/ThemeContextValue.interface.ts
import type { ThemeMode } from "@/shared/constants";

export interface ThemeContextValue {
  isDarkApplied: boolean;
  setThemeMode: (nextThemeMode: ThemeMode) => void;
  themeMode: ThemeMode;
}
```

```ts
// src/app/providers/theme/ThemeContext.ts
import { createContext } from "react";
import type { Nullable } from "@/shared/types";
import type { ThemeContextValue } from "./ThemeContextValue.interface";

export const ThemeContext = createContext<Nullable<ThemeContextValue>>(null);
```

```ts
// src/app/providers/theme/useThemeController.ts
import { useEffect, useMemo, useState } from "react";
import {
  BROWSER_EVENT,
  STORAGE_KEY,
  THEME_CLASS,
  THEME_MEDIA_QUERY,
  THEME_MODE,
  type ThemeMode,
} from "@/shared/constants";
import type { ThemeContextValue } from "./ThemeContextValue.interface";

const isThemeMode = (storedValue: unknown): storedValue is ThemeMode =>
  Object.values(THEME_MODE).some((themeMode) => themeMode === storedValue);

const readStoredThemeMode = (): ThemeMode => {
  const storedValue = localStorage.getItem(STORAGE_KEY.THEME);
  return isThemeMode(storedValue) ? storedValue : THEME_MODE.SYSTEM;
};

export const useThemeController = (): ThemeContextValue => {
  const [themeMode, setThemeModeState] =
    useState<ThemeMode>(readStoredThemeMode);
  const [prefersDark, setPrefersDark] = useState<boolean>(
    () => window.matchMedia(THEME_MEDIA_QUERY.PREFERS_DARK).matches,
  );

  useEffect(() => {
    const mediaQueryList = window.matchMedia(THEME_MEDIA_QUERY.PREFERS_DARK);
    const handleSchemeChange = (event: MediaQueryListEvent): void => {
      setPrefersDark(event.matches);
    };
    mediaQueryList.addEventListener(BROWSER_EVENT.CHANGE, handleSchemeChange);
    return (): void => {
      mediaQueryList.removeEventListener(
        BROWSER_EVENT.CHANGE,
        handleSchemeChange,
      );
    };
  }, []);

  const isDarkApplied =
    themeMode === THEME_MODE.DARK ||
    (themeMode === THEME_MODE.SYSTEM && prefersDark);

  useEffect(() => {
    document.documentElement.classList.toggle(THEME_CLASS.DARK, isDarkApplied);
  }, [isDarkApplied]);

  return useMemo(
    () => ({
      isDarkApplied,
      setThemeMode: (nextThemeMode: ThemeMode): void => {
        localStorage.setItem(STORAGE_KEY.THEME, nextThemeMode);
        setThemeModeState(nextThemeMode);
      },
      themeMode,
    }),
    [isDarkApplied, themeMode],
  );
};
```

```tsx
// src/app/providers/theme/ThemeProvider.tsx
import type { ReactElement, ReactNode } from "react";
import { ThemeContext } from "./ThemeContext";
import { useThemeController } from "./useThemeController";

export interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider = ({
  children,
}: ThemeProviderProps): ReactElement => {
  const themeContextValue = useThemeController();

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
};
```

```ts
// src/app/providers/theme/useTheme.ts
import { useContext } from "react";
import { PROVIDER_ERROR } from "@/shared/constants";
import { ThemeContext } from "./ThemeContext";
import type { ThemeContextValue } from "./ThemeContextValue.interface";

export const useTheme = (): ThemeContextValue => {
  const themeContextValue = useContext(ThemeContext);

  if (!themeContextValue) {
    throw new Error(PROVIDER_ERROR.MISSING_THEME_PROVIDER);
  }

  return themeContextValue;
};
```

The theme toggle (`ThemeToggle` in `component-standards`) calls `useTheme().setThemeMode`, and its labels come from `common:theme.*`.

## 5. Charts and images

- Charts (reports, dashboard) use `--chart-*` tokens through `var(--color-chart-1)` and friends, never library default colors.
- Logos uploaded by businesses must stay legible on both backgrounds. Show them on a `bg-background` surface with `border-border`.

---

## 6. Enforced by

| Rule | Tool |
| --- | --- |
| No Tailwind palette colors in class strings | ESLint `no-restricted-syntax` on string literals matching `(bg\|text\|border\|ring\|fill\|stroke)-(slate\|gray\|zinc\|neutral\|stone\|red\|orange\|amber\|yellow\|lime\|green\|emerald\|teal\|cyan\|sky\|blue\|indigo\|violet\|purple\|fuchsia\|pink\|rose)-\d` |
| No hex colors in TS/TSX | ESLint `no-restricted-syntax` on string literals matching `#[0-9a-fA-F]{3,8}\b` |
| No `dark:` variants in components | ESLint `no-restricted-syntax` on string literals containing `dark:` (off in `src/shared/components/ui/`) |
| No inline `style` colors | ESLint `react/forbid-dom-props` (`style`) in `src/portals/**` and `src/features/**` |
| Every status has a tone | `tsc` via `satisfies Record<Status, Tone>` |
| Contrast in both themes | Manual check, plus the accessibility checks in `unit-testing-standards` |

## 7. Checklist

- [ ] Only semantic utilities (`bg-primary`, `text-muted-foreground`, …). No palette colors, hex values or inline color styles.
- [ ] No `dark:` variants. The tokens handle dark mode.
- [ ] New tokens are added to `:root`, `.dark` and `@theme inline` together, and meet AA contrast in both themes.
- [ ] Statuses use `TONE` through a `…_STATUS_TONE` map and `StatusBadge`.
- [ ] Theme changes go through `useTheme().setThemeMode`. Nothing else touches the `dark` class.
- [ ] The screen was checked in light **and** dark mode.
