---
name: component-standards
description: Standards for UI components — reuse existing components in src/components/common, forbid raw HTML controls (buttons, inputs, spinners, modals), and enforce atomic accessibility consistency.
---

# UI Component Standards and Reuse Catalog

This skill defines the rules for building and reusing UI components in **Booking System Web**. All UI code must adhere strictly to these conventions.

---

## 1. Reuse Existing Components First (Mandatory)

**Never invent a parallel base component** when one already exists under `src/components/common/`. Before creating any new UI markup or raw HTML control:

1. Search `src/components/common/` for an existing primitive or atom that covers the requirement.
2. Prefer **composition and configuration** (props, `variant`, `size`, `className`, `children`) over cloning or writing HTML from scratch.
3. If you are about to write `<button>`, `<input>`, `<select>`, `<textarea>`, `<img>`, a custom spinner (`animate-spin`), a custom modal overlay (`fixed inset-0 ...`), or a one-off table — **STOP** and use the catalog below.
4. Create a **new** common component only when no existing base fits after an honest search — and place it in `src/components/common/` so all modules can reuse it.

---

## 2. Decision Checklist & Reusable Catalog (`src/components/common/`)

| Requirement | Use this Component | DO NOT do this |
| :--- | :--- | :--- |
| **Click action / CTA** | `<Button variant="default \| outline \| ghost \| destructive" size="sm \| md \| lg">` | Native `<button>` or a custom styled button |
| **Form text input** | `<InputField label="..." error="..." {...register(...)} />` | Raw `<input type="text">` or custom input wrapper |
| **Selection dropdown** | `<SelectField label="..." options={[...]} />` | Raw `<select>` element |
| **Text area / Notes** | `<TextareaField label="..." rows={...} />` | Raw `<textarea>` |
| **Loading indicator** | `<Spinner size="sm \| md \| lg" />` | CSS `animate-spin` div markup |
| **Dialog / Modal window** | `<Modal isOpen={...} onClose={...} title="...">` | Custom `fixed inset-0 bg-black/50` overlay div |
| **Confirmation prompt** | `<ConfirmModal onConfirm={...} onCancel={...} title="..." description="..." />` | `window.confirm()` or ad-hoc prompt dialog |
| **Card container** | `<Card>`, `<CardHeader>`, `<CardTitle>`, `<CardContent>`, `<CardFooter>` | Custom `border rounded-xl p-6` wrapper |
| **General Badge / Chip** | `<Badge variant="default \| secondary \| outline \| destructive">` | Ad-hoc `<span>` tag with hardcoded background colors |
| **Domain Status Badge** | `<StatusBadge status={status} />` | Custom colored badge mapping statuses manually |
| **Empty state feedback** | `<EmptyState message="..." action={<Button ...>} />` | Arbitrary empty text message |
| **Error state feedback** | `<ErrorState messageKey="..." onRetry={...} />` | Ad-hoc red error div |
| **Data table** | `<Table columns={[...]} data={[...]} />` | One-off `<table>` markup |

---

## 3. Incorrect vs Correct Examples

### Click Action / Button

```jsx
// ❌ INCORRECT: Raw HTML button with arbitrary styling and palette colors
<button
  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold"
  onClick={handleCreateService}
>
  Crear Servicio
</button>

// ✅ CORRECT: Reusing shared Button atom with semantic tokens
import { Button } from "@/components/common";

<Button variant="default" size="md" onClick={handleCreateService}>
  Crear Servicio
</Button>
```

### Loading Spinner

```jsx
// ❌ INCORRECT: Ad-hoc CSS spinner
{isLoading && (
  <div className="flex justify-center p-4">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)}

// ✅ CORRECT: Reusing shared Spinner
import { Spinner } from "@/components/common";

{isLoading && <Spinner size="md" />}
```

### Modal Overlay & Dialogs

```jsx
// ❌ INCORRECT: Ad-hoc modal overlay in a feature page (breaks accessibility and focus trap)
{isModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
    <div className="bg-card p-6 rounded-xl border border-border">
      <h2>Cancelar Reservación</h2>
      <p>¿Estás seguro de cancelar la cita?</p>
      <button onClick={handleConfirm}>Sí</button>
    </div>
  </div>
)}

// ✅ CORRECT: Reusing accessible Modal primitive (with ARIA, focus trap & ESC handling)
import { Button, Modal } from "@/components/common";

<Modal isOpen={isModalOpen} onClose={handleCloseModal} title={t("booking.cancel.title")}>
  <p className="text-muted-foreground mb-4">{t("booking.cancel.confirmationMessage")}</p>
  <div className="flex justify-end gap-2">
    <Button variant="outline" onClick={handleCloseModal}>
      {t("common.cancel")}
    </Button>
    <Button variant="destructive" onClick={handleConfirmCancel}>
      {t("booking.cancel.action")}
    </Button>
  </div>
</Modal>
```

---

## 4. Separation with Architecture and Dynamic Theming

1. **Common components are presentation-only:** Atoms in `src/components/common/` receive state and handlers strictly via props and contain NO business logic, Firestore queries, or router navigation.
2. **Dynamic Theming Integration:** All common components MUST consume semantic tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`) per `dynamic-theming-standards` to guarantee flawless Dark Mode support (RNF-05).
3. **Module Feature Pages:** Module pages in `src/modules/` compose these common primitives and connect them to their corresponding `use*ViewModel` hook.

---

## 5. Checklist Before Finishing UI Code

- [ ] Se buscó en `src/components/common/` antes de crear cualquier elemento de interfaz.
- [ ] Cero elementos HTML nativos crudos (`<button>`, `<input>`, `<select>`, `<textarea>`) en módulos de negocio.
- [ ] Cero spinners manuales con `animate-spin` o divs con `fixed inset-0` creados ad-hoc.
- [ ] Los estilos consumen exclusivamente tokens semánticos de `tokens.css`.
- [ ] Los componentes exportan funciones flecha `const` con tipado explícito o contratos JSDoc.
- [ ] Todo componente nuevo en `src/components/common/` se exporta en el barrel `src/components/common/index.ts`.
