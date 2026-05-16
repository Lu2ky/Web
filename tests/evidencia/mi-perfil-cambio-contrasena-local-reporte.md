# Reporte local - Cambio de contrasena

Fecha: 2026-03-24
Entorno: local (playwright.config.js + vitest)

## Resultado final
- Estado funcional local: CONFIRMADO
- Unitarias del flujo de cambio: OK
- E2E local (funcional + seguridad cliente): OK

## Evidencias principales
- tests/evidencia/mi-perfil-cambio-contrasena-local-unit.txt
- tests/evidencia/mi-perfil-cambio-contrasena-local-e2e.txt

## Comandos ejecutados
- npx vitest run src/components/Account/UserProfile.changePassword.test.jsx
- npx playwright test -c playwright.config.js tests/e2e/user-profile-change-password.e2e.spec.js tests/e2e/user-profile-change-password.security.e2e.spec.js --reporter=list --workers=1

## Nota
- Este reporte valida el flujo en local. No evalua persistencia real de backend live.
