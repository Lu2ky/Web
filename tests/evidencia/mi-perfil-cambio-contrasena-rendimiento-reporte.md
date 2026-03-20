# Reporte de Rendimiento - Cambio de Contrasena

Fecha: 2026-03-19

## Herramienta utilizada
- Artillery (carga HTTP)

## Caso de prueba
Objetivo: medir la capacidad de respuesta del endpoint de cambio de contrasena bajo carga progresiva.

Tipo de prueba: no destructiva (se uso una contrasena actual invalida para evitar cambios reales en la cuenta).

Escenario ejecutado:
- Warm-up: 20s, 3 req/s
- Ramp-up: 30s, de 5 a 15 req/s
- Carga sostenida: 30s, 15 req/s

Archivo de escenario:
- tests/performance/change-password.artillery.yml

## Resultado consolidado
Fuente:
- tests/evidencia/mi-perfil-cambio-contrasena-rendimiento.txt
- tests/evidencia/mi-perfil-cambio-contrasena-rendimiento.json

Metricas globales:
- Solicitudes enviadas: 810
- Solicitudes respondidas: 370
- Solicitudes fallidas por timeout: 440
- HTTP 404: 370
- Request rate promedio: 13 req/s
- Latencia min: 354 ms
- Latencia mediana: 361.5 ms
- Latencia p95: 376.2 ms
- Latencia p99: 383.8 ms
- Latencia maxima: 2520 ms

## Hallazgos
1. El endpoint configurado para cambio de contrasena devuelve 404 de forma sostenida bajo carga.
2. Bajo 15 req/s aparecen timeouts elevados (440), lo cual indica inestabilidad para ese flujo.
3. No se puede concluir rendimiento funcional del cambio de contrasena porque la ruta probada no esta operativa.

## Pasos de ejecucion
1. Instalar dependencias:
   npm install
2. Ejecutar prueba de carga:
   npm run test:perf:password -- -o tests/evidencia/mi-perfil-cambio-contrasena-rendimiento.json
3. Guardar salida en txt (opcional para evidencia):
   npm run test:perf:password -- -o tests/evidencia/mi-perfil-cambio-contrasena-rendimiento.json *>&1 | Out-File -FilePath .\tests\evidencia\mi-perfil-cambio-contrasena-rendimiento.txt -Encoding utf8

## Evidencia
- tests/evidencia/mi-perfil-cambio-contrasena-rendimiento.txt
- tests/evidencia/mi-perfil-cambio-contrasena-rendimiento.json
- tests/evidencia/mi-perfil-cambio-contrasena-rendimiento-reporte.md
