# Dead Ends — Orchestrator 13

| Iteration | Approach Tried | Why It Failed | Files Touched |
|-----------|---------------|---------------|---------------|
| Iteration 1 | Direct property assignment (`input.value = ...; input.dispatchEvent(new Event('input'))`) in `scripts/audit_e2e_click_harness.mjs` for React controlled components | React 18/19 controlled components override input value setters on `HTMLInputElement.prototype`. Setting `input.value` directly does not trigger React's internal state tracker, causing `onChange` not to fire and form validation to fail with "Por favor ingresa tu nombre y apellido para continuar." | `scripts/audit_e2e_click_harness.mjs` |
| Iteration 1 | Silent optional chaining (`element?.click()`) across multi-step wizard in test harness | When Step 1 validation blocked transition, elements for Steps 2, 3, and 4 did not exist in DOM; optional chaining silently evaluated to undefined without failing the harness, leading to false completion claims | `scripts/audit_e2e_click_harness.mjs` |
