# Reporte de Seguridad - Cambio de Contrasena

Fecha: 2026-03-19

## Herramientas utilizadas
- Playwright (pruebas dinamicas E2E de seguridad)
- Revision estatica de codigo en frontend
- Pruebas HTTP directas con PowerShell (Invoke-WebRequest)

## Herramientas solicitadas no disponibles
- OWASP ZAP: no instalado en este entorno
- Burp Suite: no instalado en este entorno

## Casos ejecutados (dinamicos)
Evidencia de ejecucion:
- tests/evidencia/mi-perfil-cambio-contrasena-seguridad-e2e.txt

Casos:
1. Riesgo IDOR: userId manipulable desde ruta
2. Politica debil: acepta contrasena simple de 6 caracteres
3. Sin control anti-automatizacion en cliente

## Hallazgos

### 1) Riesgo de control de acceso (IDOR)
- Severidad: Alta
- OWASP: A01 Broken Access Control
- Evidencia: el request de cambio usa el userId de la URL (/App/:userId) sin amarre visible a sesion/token.
- Archivo relacionado: src/components/Account/UserProfile.jsx
- Archivo relacionado: src/services/userService.jsx
- Impacto: un atacante podria intentar operar sobre IDs de otros usuarios si backend no valida ownership.
- Recomendacion:
  - En backend, ignorar userId enviado por cliente y tomar identidad desde sesion/JWT.
  - En frontend, evitar depender de userId manipulable en URL para operaciones sensibles.

### 2) Politica de contrasena insuficiente
- Severidad: Media
- OWASP: A07 Identification and Authentication Failures
- Evidencia: el formulario permite nueva contrasena de 6 caracteres sin complejidad adicional.
- Archivo relacionado: src/components/Account/UserProfile.jsx
- Impacto: aumenta riesgo de credenciales debiles.
- Recomendacion:
  - Exigir longitud minima mayor (>= 10 o 12) y complejidad (mayuscula, minuscula, numero, simbolo).
  - Validar tambien en backend (control obligatorio).

### 3) Falta de controles anti-fuerza-bruta en cliente
- Severidad: Media
- OWASP: A07 / A04
- Evidencia: multiples intentos consecutivos se envian sin cooldown/captcha/lockout en UI.
- Archivo relacionado: src/components/Account/UserProfile.jsx
- Impacto: facilita automatizacion de intentos.
- Recomendacion:
  - Implementar rate-limit y lockout en backend.
  - Complementar en UI con backoff progresivo y captcha adaptativo.

### 4) Riesgo de transporte inseguro
- Severidad: Alta
- OWASP: A02 Cryptographic Failures
- Evidencia: endpoints en .env usan HTTP (no HTTPS).
- Archivo relacionado: .env
- Impacto: credenciales podrian exponerse en transito.
- Recomendacion:
  - Migrar todas las rutas sensibles a HTTPS.
  - Forzar HSTS y redireccion de HTTP a HTTPS.

## Estado de validacion real backend
- En pruebas de persistencia real previas se observo 404 en ruta de cambio de contrasena configurada.
- Evidencia: tests/evidencia/mi-perfil-cambio-contrasena-real-persistencia-e2e.txt
- Evidencia: tests/evidencia/mi-perfil-cambio-contrasena-real-check-api.txt

## Conclusion
Se detectaron vulnerabilidades relevantes en el flujo de cambio de contrasena, especialmente en control de acceso, robustez de credenciales y transporte. Se recomienda priorizar correcciones de backend (autorizacion por identidad de sesion, rate-limit y HTTPS) antes de promover el flujo a produccion.
