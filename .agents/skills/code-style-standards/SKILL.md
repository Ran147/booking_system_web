---
name: code-style-standards
description: Enforces arrow function syntax for components/hooks, full descriptive variable naming (strictly no abbreviations), explicit return types, and clean exports.
---

# Code Style Standards

This skill defines the coding style conventions for components, custom hooks, and utility functions in this project. It ensures production-grade consistency, readability, and zero cognitive overhead during code reviews.

---

## 1. Arrow Function Syntax (`const`)

All React components, custom hooks, and utility callbacks MUST use `const` arrow function syntax. Standard `function` declarations and inline default function exports are strictly prohibited.

### Incorrect

```jsx
// ❌ Standard function declaration
function PlanCard({ plan }) {
  return <div>{plan.name}</div>;
}

// ❌ Inline default function export
export default function usePlanCatalog() {
  const [plans, setPlans] = useState([]);
  return { plans };
}
```

### Correct

```jsx
// ✅ Const arrow function definition
export const PlanCard = ({ plan }) => {
  return <div>{plan.name}</div>;
};

// ✅ Custom hook definition
export const usePlanCatalog = () => {
  const [plans, setPlans] = useState([]);
  return { plans };
};
```

---

## 2. Descriptive Variable Naming (STRICTLY NO Abbreviations)

All variables, function parameters, state bindings, and catch parameters MUST use full, descriptive names. Single-letter names and abbreviations are strictly forbidden.

### Forbidden Abbreviations & Mandatory Replacements

| Prohibited | Mandatory Replacement           | Context / Example                                |
| ---------- | -------------------------------- | ------------------------------------------------ |
| `err`      | `error`                          | `catch (error) { ... }`                          |
| `res`      | `response`                       | `const response = await fetchActivePlans();`     |
| `req`      | `request`                        | `const request = prepareBookingRequest();`       |
| `cb`       | `callback` / `onSuccessCallback` | `(callback) => void`                            |
| `e` / `evt`| `event` / `clickEvent`           | `const handleClick = (event) => { ... }`         |
| `val`      | `value`                          | `const value = event.target.value;`              |
| `idx` / `i`| `index`                          | `plans.map((plan, index) => ...)`                |
| `btn`      | `button`                         | `submitButton`, `actionButton`                   |
| `img`      | `image`                          | `serviceImage`, `logoImage`                      |
| `msg`      | `message`                        | `errorMessage`, `successMessage`                 |
| `prod`     | `product` / `service`            | In our SaaS: `service`, `plan`                   |
| `doc`      | `document`                       | `documentSnapshot`, `documentData`               |
| `auth`     | `authentication` / `session`     | Use full context when naming state               |

### Incorrect

```jsx
// ❌ Ambiguous, cryptic abbreviations
try {
  await createBooking(payload);
} catch (err) {
  console.error(err);
}

const handleChange = (e) => {
  setVal(e.target.value);
};

const renderItems = (items) => items.map((item, idx) => (
  <div key={idx}>{item.name}</div>
));
```

### Correct

```jsx
// ✅ Explicit, self-documenting naming
try {
  await createBooking(bookingPayload);
} catch (error) {
  console.error(error);
}

const handleInputChange = (event) => {
  setInputValue(event.target.value);
};

const renderPlans = (plans) => plans.map((plan, index) => (
  <PlanCard key={plan.id} plan={plan} index={index} />
));
```

---

## 3. Boolean & Event Handler Naming Conventions

- **Booleans:** Must be prefixed with auxiliary verbs: `isLoading`, `hasError`, `isSuccess`, `isEmpty`, `canSubmit`, `hasAccess`.
- **Event Handlers in ViewModels:** Named in imperative form describing the action: `handleSubmit`, `handleCancel`, `handleSelectPlan`, `handleSearchTermChange`.
- **Event Handler Props:** Named with `on` prefix: `onSelectPlan`, `onSubmit`, `onCancel`.

```jsx
// Inside ViewModel:
return {
  isLoading,
  hasError,
  handleSelectPlan,
};

// In Component Props:
<PlanCard onSelectPlan={handleSelectPlan} />
```

---

## 4. Explicit Return Types & JSDoc Annotations

Every function, hook, and component must declare its contract clearly. In TypeScript, declare explicit return types (`ReactElement`, `void`, `<Hook>Return`); in JavaScript, annotate with JSDoc `@param` and `@returns`.

```jsx
/**
 * @param {PlanCardProps} props
 * @returns {ReactElement}
 */
export const PlanCard = ({ plan, onSelectPlan }) => { ... };
```

---

## 5. Checklist Before Submitting Code

- [ ] Every component and hook is declared as a `const` arrow function.
- [ ] No forbidden abbreviations (`error` instead of `err`, `event` instead of `e`, `index` instead of `idx`, `button` instead of `btn`).
- [ ] Booleans have auxiliary prefixes (`isLoading`, `hasError`).
- [ ] Handlers and props follow `handle*` and `on*` conventions.
- [ ] Exports are explicit and unambiguous.
