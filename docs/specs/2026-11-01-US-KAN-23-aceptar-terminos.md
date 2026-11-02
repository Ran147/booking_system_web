# Spec técnica — KAN-23: revisar y aceptar los términos antes de pagar

| Campo | Valor |
| --- | --- |
| Historia / Épica | KAN-23 / KAN-20 (contratación de planes) |
| Portal | landing (`src/modules/landing/features/plan-checkout/`) + `functions/src/billing/` |
| Fecha | 2026-11-01 |
| Estado | Borrador para revisión |
| SPEC de la feature | `src/modules/landing/features/plan-checkout/specs/SPEC.md` (AC-KAN-23-01 … 04, AS-10, AS-11) |
| Depende de | KAN-9 (página de términos de Joshua, ya en `develop`); se fusiona **después de #66** (misma pantalla) y de #65 (mismo `api/callFunction.ts`) |

---

## 1. Resumen

La pantalla de pago ya tiene la casilla de términos y un enlace que abre `/terms` (KAN-9) en una pestaña nueva. Faltan tres cosas del SPEC:

1. **Abrir los términos antes de aceptarlos (AS-11):** hoy se puede marcar la casilla sin haberlos abierto nunca.
2. **Pagar desactivado sin términos (AC-KAN-23-03):** hoy el botón está activo y el aviso solo sale al enviar.
3. **La versión aceptada (AC-KAN-23-02, AS-10):** el servidor guarda `termsVersion: "provisional-2026-10-17"`, no la fecha de la página de términos.

## 2. Fuera de alcance

| Tema | Dónde |
| --- | --- |
| El texto de los términos | KAN-9 (Joshua); no se toca |
| Rechazar en el servidor un pago sin términos | Ya está: `termsAccepted: true` en el esquema de `payPlanCheckout` (`functions/` y #65) |

## 3. Cambios

### 3.1 Pantalla (`src/modules/landing/features/plan-checkout/`)

| Archivo | Cambio |
| --- | --- |
| `components/PlanCheckoutTermsField.tsx` (nuevo) | La casilla y el enlace, sacados de `PlanCheckoutForm.tsx` a su propio componente. El enlace sigue abriendo `/terms` en una pestaña nueva (AC-KAN-23-01: el formulario no se pierde). La casilla está **desactivada hasta que se abre el enlace una vez**, con la pista `planCheckout.terms.openFirst` (AS-11). Mientras no esté marcada, muestra `planCheckout.checkout.termsRequired` junto a la casilla (AC-KAN-23-03) |
| `models/PlanCheckoutTermsFieldProps.interface.ts` (nuevo) | Props del componente, con JSDoc |
| `components/PlanCheckoutForm.tsx` | Usa `PlanCheckoutTermsField` en lugar del bloque de la casilla. "Pagar" desactivado mientras los términos no estén aceptados |
| `hooks/usePlanCheckoutViewModel.ts` | `hasOpenedTerms` (estado, `false` al entrar) y `handleTermsOpened`. `isTermsAccepted` sale de `form.watch("termsAccepted")` |
| `src/i18n/locales/{es,en}/landing.json` | Clave nueva `planCheckout.terms.openFirst` ("Abre los términos y condiciones para poder aceptarlos") |

Mover el bloque a su propio componente también deja pequeño el choque con #66, que cambia el mismo formulario.

### 3.2 Versión de los términos (AS-10)

| Archivo | Cambio |
| --- | --- |
| `functions/src/billing/constants/PlanCheckout.constants.ts` | `TERMS_VERSION.PROVISIONAL` → `TERMS_VERSION.CURRENT: "2026-10-12"`, con el comentario de mantenerlo igual que `landing:terms.lastUpdated` |
| `functions/src/billing/payPlanCheckout.ts` | Usa `TERMS_VERSION.CURRENT` |
| `api/callFunction.ts` | El mismo cambio en el espejo de `TERMS_VERSION` que agrega #65. **Se hace después de fusionar #65**, al integrar `develop` en esta rama, para no tocar el stub que #65 reemplaza |

## 4. Tests

| Archivo | Cubre |
| --- | --- |
| `tests/PlanCheckoutTerms.test.tsx` (nuevo) | AC-KAN-23-01 el enlace apunta a `/terms`, abre otra pestaña y el email escrito sigue ahí; AS-11 la casilla está desactivada con `openFirst` hasta abrir el enlace; AC-KAN-23-03 "Pagar" desactivado y `termsRequired` visible mientras no se acepta, y el aviso desaparece al aceptar |
| `functions/src/billing/tests/payPlanCheckout.test.ts` | AC-KAN-23-02 el `PlanCheckout` guarda `termsVersion: "2026-10-12"` |
| `tests/api/payPlanCheckout.test.ts` (de #65) | Lo mismo en `api/`, después de fusionar #65 |

Es un archivo de pruebas aparte de `PlanCheckoutPage.test.tsx` (#66) para que los dos PRs no creen el mismo archivo.

## 5. Decisiones para revisar

| Id | Decisión | Por qué |
| --- | --- | --- |
| D1 | Los términos se siguen abriendo en una pestaña nueva, no en un diálogo | AC-KAN-23-01 permite las dos. La pestaña ya existe, reutiliza la página de Joshua sin tocarla y no pierde el formulario |
| D2 | Hacer clic en el enlace cuenta como "abrir los términos una vez" (AS-11) | Es lo único que la pantalla puede saber de otra pestaña |
| D3 | De AC-KAN-23-04 solo aplica la casilla desactivada. El error "no se pudo cargar el texto" no puede pasar aquí | El texto viene con la app (i18n), no se lee de la red. Si la pestaña nueva falla, la muestra la página de error normal de la app |
| D4 | `TERMS_VERSION` es la fecha de la página de términos, `2026-10-12` | AS-10. Si Joshua cambia los términos, cambia `landing:terms.lastUpdated` y esta constante en el mismo PR |
| D5 | Se fusiona después de #66 y #65 | Toca la misma pantalla que #66 y el mismo archivo `api/callFunction.ts` que #65. Al integrar `develop` se resuelve el choque (pocas líneas) y se hace el cambio de §3.2 en `api/` |
