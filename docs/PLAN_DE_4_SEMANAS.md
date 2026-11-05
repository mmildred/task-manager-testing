# Plan de Práctica de 4 Semanas para Pruebas de Software

Este plan organiza el aprendizaje y la ejecución progresiva de las técnicas de prueba descritas en la guía, utilizando la aplicación **Task Manager** desarrollada para la materia *Desarrollo Móvil Integral*.

---

```
  Semana 1                 Semana 2                 Semana 3                 Semana 4
+----------------------+ +----------------------+ +----------------------+ +----------------------+
| Mentalidad, Planes,  | | Pruebas Unitarias,   | | E2E, Valores Límite, | | Rendimiento,         |
| Casos de Prueba y    | | Widgets, API e       | | Seguridad OWASP y    | | Compatibilidad,      |
| Exploración          | | Integración          | | Accesibilidad        | | Regresión y CI/CD    |
|                      | |                      | |                      | |                      |
| Entregables:         | | Entregables:         | | Entregables:         | | Entregables:         |
| • 01_PLAN_DE_PRUEBAS | | • validation.test.js | | • app_test.dart      | | • health-test.js     |
| • 02_CASOS_DE_PRUEBA | | • task_test.dart     | | • 08_VALORES_LIMITE  | | • 12_COMPATIBILIDAD  |
| • 03_EXPLORATORIAS   | | • task_list_test.dart| | • 09_SEGURIDAD_OWASP | | • 13_REGRESION       |
|                      | | • tasks.api.test.js  | | • 11_ACCESIBILIDAD   | | • tests.yml (CI)     |
+----------------------+ +----------------------+ +----------------------+ +----------------------+
```

---

## Semana 1: Mentalidad, Planes, Casos de Prueba y Exploración

- **Objetivo:** Aprender a investigar el comportamiento del software de manera sistemática, pasando de la intuición a la documentación formal y estructurada.
- **Actividades:**
  1. Definir los criterios de aceptación para una característica crítica (Creación de Tareas: éxito típico, entrada inválida y frontera de permisos).
  2. Documentar casos de prueba formales y elaborar un reporte de bug profesional ante la desaparición de tareas completadas.
  3. Ejecutar una sesión de prueba exploratoria de 15 minutos con una carta (charter) enfocada en pérdida de datos y escenarios adversos.
- **Entregables asociados:**
  - `docs/01_PLAN_DE_PRUEBAS.md`
  - `docs/02_CASOS_DE_PRUEBA_Y_REPORTE_DE_BUGS.md`
  - `docs/03_NOTAS_SESION_EXPLORATORIA.md`

---

## Semana 2: Pruebas Unitarias, de Widgets, API e Integración

- **Objetivo:** Construir la base sólida de la pirámide de pruebas, aislando la lógica de negocio y verificando la colaboración entre capas.
- **Actividades:**
  1. Implementar pruebas unitarias en el backend con Jest para la función `validateTitle` (recorte de espacios, longitud límite de 120 caracteres, entradas no string).
  2. Implementar pruebas unitarias en Dart para el modelo `Task` (`fromJson`, validación de campos obligatorios e IDs faltantes).
  3. Implementar pruebas de widgets en Flutter con `flutter_test` para `TaskListPanel` (estados de carga, lista vacía, error con botón de reintento).
  4. Implementar pruebas de integración de API con Supertest verificando autenticación, validaciones y aislamiento entre usuarios (BOLA).
- **Entregables asociados:**
  - `backend/tests/unit/validation.test.js`
  - `backend/tests/integration/tasks.api.test.js`
  - `mobile/test/unit/task_test.dart`
  - `mobile/test/widget/task_list_panel_test.dart`

---

## Semana 3: End-to-End, Límites, Seguridad y Accesibilidad

- **Objetivo:** Verificar el viaje completo del usuario a través de la interfaz y blindar la aplicación contra entradas maliciosas y barreras de accesibilidad.
- **Actividades:**
  1. Automatizar el viaje completo del usuario (End-to-End) con `integration_test` en Flutter: Login $\to$ Crear tarea $\to$ Marcar completa $\to$ Cerrar sesión $\to$ Volver al login.
  2. Aplicar partición de equivalencia y análisis de valores límite al campo de contraseña ($0, 7, 8, 128, 129$ caracteres).
  3. Ejecutar pruebas negativas de seguridad basadas en el OWASP API Top 10 (intentos de manipulación de `ownerId`, inyección SQL simulada, XSS).
  4. Realizar auditoría de accesibilidad con lector de pantalla y escalado tipográfico ($150\%$).
- **Entregables asociados:**
  - `mobile/integration_test/app_test.dart`
  - `docs/08_VALORES_LIMITE_Y_PARTICION_EQUIVALENCIA.md`
  - `docs/09_SEGURIDAD_OWASP_API.md`
  - `docs/11_ACCESIBILIDAD_AUDITORIA.md`

---

## Semana 4: Rendimiento, Compatibilidad, Regresión y CI

- **Objetivo:** Medir la estabilidad bajo carga, asegurar compatibilidad entre dispositivos y automatizar la ejecución continua de pruebas en la nube.
- **Actividades:**
  1. Configurar y ejecutar una prueba de carga segura con k6 sobre el endpoint `/health`, modificando umbrales de SLA para interpretar el reporte.
  2. Construir la matriz de compatibilidad multi-dispositivo (pantallas compactas vs pantallas amplias/tablets).
  3. Definir la suite de pruebas de humo y la lista de verificación de regresión previa al release.
  4. Configurar el flujo de integración continua en GitHub Actions (`tests.yml`) y verificar la detección de fallos intencionales.
  5. Contrastar el uso de mocks frente a pruebas con base de datos real.
- **Entregables asociados:**
  - `backend/k6/health-test.js` y `docs/10_RENDIMIENTO_K6_REPORTE.md`
  - `docs/12_MATRIZ_COMPATIBILIDAD.md`
  - `docs/13_CHECKLIST_REGRESION_Y_HUMO.md`
  - `.github/workflows/tests.yml` y `docs/14_AUTOMATIZACION_CI_GITHUB_ACTIONS.md`
  - `mobile/test/unit/mock_api_client_test.dart` y `docs/15_ANALISIS_MOCKS_VS_INTEGRACION.md`
