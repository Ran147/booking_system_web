---
name: dynamic-theming-standards
description: Enforces semantic CSS custom properties and dynamic design tokens for Tailwind CSS v4 to support dark/light mode consistency (RNF-05) and live theme personalization.
---

# Dynamic Theming Standards (Tailwind CSS v4)

This skill defines rules for handling design tokens, theme switching (Light/Dark/System), and dynamic theming in **Booking System Web** according to requirement **RNF-05**.

---

## 1. Core Principles

- **Semantic Tokens Only:** Never use hardcoded palette classes (e.g. `bg-blue-600`, `text-gray-900`, `border-zinc-200`) in UI components. Always use semantic token classes (`bg-primary`, `text-foreground`, `border-border`, `bg-card`).
- **CSS Custom Properties in `src/styles/tokens.css`:** All colors are defined as HSL or OKLCH CSS variables in `:root` and `.dark`.
- **Zero Static Color Exceptions:** All text, backgrounds, borders, rings, and badges must adapt automatically to the active theme.

---

## 2. Token Mapping Reference

| Semantic Role | Tailwind v4 Utility | CSS Custom Property |
| --- | --- | --- |
| Main Page Background | `bg-background` | `--background` |
| Primary Text | `text-foreground` | `--foreground` |
| Card & Container Surface | `bg-card` | `--card` |
| Card Text | `text-card-foreground` | `--card-foreground` |
| Popover / Dropdown Surface | `bg-popover` | `--popover` |
| Popover Text | `text-popover-foreground` | `--popover-foreground` |
| Primary Brand Action | `bg-primary text-primary-foreground` | `--primary`, `--primary-foreground` |
| Secondary Action / Surface | `bg-secondary text-secondary-foreground` | `--secondary`, `--secondary-foreground` |
| Muted Background / Hover | `bg-muted text-muted-foreground` | `--muted`, `--muted-foreground` |
| Subtle Accent | `bg-accent text-accent-foreground` | `--accent`, `--accent-foreground` |
| Destructive Action / Error | `bg-destructive text-destructive-foreground` | `--destructive`, `--destructive-foreground` |
| Borders & Dividers | `border-border` | `--border` |
| Form Input Borders | `border-input` | `--input` |
| Focus Rings | `ring-ring` | `--ring` |

---

## 3. Dark Mode Protocol

1. Dark mode is controlled via the `dark` class on the root `<html>` element.
2. The user theme preference (`light`, `dark`, `system`) is persisted in `localStorage` under `THEME_MODE`.
3. In `system` mode, listen to `window.matchMedia('(prefers-color-scheme: dark)')` to react dynamically.

---

## 4. Code Examples

### ❌ Incorrect (Static Palette Colors)
```tsx
export const ServiceCard = ({ name, price }: ServiceCardProps) => (
  <div className="bg-white border border-gray-200 rounded-lg p-4 text-gray-900 shadow-sm">
    <h3 className="text-blue-600 font-bold">{name}</h3>
    <p className="text-gray-500">{price}</p>
    <button className="bg-blue-600 text-white hover:bg-blue-700">Reservar</button>
  </div>
);
```

### ✅ Correct (Semantic Tokens)
```tsx
export const ServiceCard = ({ name, price }: ServiceCardProps) => (
  <Card className="p-4">
    <h3 className="text-foreground font-bold">{name}</h3>
    <p className="text-muted-foreground">{price}</p>
    <Button variant="primary">Reservar</Button>
  </Card>
);
```

---

## 5. Checklist

- [ ] Zero static Tailwind color classes (`text-black`, `bg-white`, `bg-gray-*`, `text-blue-*`).
- [ ] Uses semantic token classes (`bg-background`, `text-foreground`, `bg-card`, `border-border`).
- [ ] Component renders correctly in both Light and Dark mode.
- [ ] No inline style color overrides (`style={{ color: '#fff' }}`).
