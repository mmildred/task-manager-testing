# 15. Comparativa: Pruebas con Mocks vs Pruebas de Integración Reales

Este documento presenta el análisis comparativo entre una prueba unitaria de cliente con dependencias simuladas (Mocks) y una prueba de integración con base de datos real aislada, dando cumplimiento al **Ejercicio Práctico 15**.

---

## 1. Implementaciones Analizadas en el Proyecto

1. **Prueba con Mock (`mobile/test/unit/mock_api_client_test.dart`):**  
   Utiliza `MockClient` de `package:http/testing` para simular respuestas HTTP (`200 OK`, `401 Unauthorized`, `400 Bad Request`) directamente en memoria de Dart sin levantar un servidor ni conectar a una base de datos.
2. **Prueba de Integración (`backend/tests/integration/tasks.api.test.js`):**  
   Utiliza `Supertest` interactuando con la aplicación Express completa y ejecutando transacciones sobre la base de datos de pruebas (con reinicio mediante `resetDatabase()` antes de cada prueba).

---

## 2. Matriz Comparativa: Qué Detecta y Qué No Detecta Cada Enfoque

| Aspecto | Prueba con Cliente Mockeado (`MockClient`) | Prueba de Integración (`Supertest` + DB) |
| :--- | :--- | :--- |
| **Archivo de Prueba** | `mobile/test/unit/mock_api_client_test.dart` | `backend/tests/integration/tasks.api.test.js` |
| **Velocidad de Ejecución** | **Ultrarrápida** (~10 a 20 milisegundos). | **Media** (~200 a 500 milisegundos por suite). |
| **Dependencias Externas** | Ninguna (Corre 100% en el runtime de Dart). | Requiere Express, middlewares y motor SQL / memoria. |
| **Qué DETECTA con precisión** | - Errores en la serialización y deserialización JSON (`FormatException`).<br>- Manejo correcto de códigos de estado HTTP por parte de la UI (`200`, `400`, `401`).<br>- Construcción correcta de la URL y los encabezados (`Authorization: Bearer ...`).<br>- Comportamiento del cliente ante desconexión o timeouts. | - Errores de sintaxis SQL o violaciones de integridad referencial (`FOREIGN KEY`, `UNIQUE`).<br>- Cumplimiento real de la autorización entre usuarios (BOLA / IDOR).<br>- Filtrado de campos maliciosos (`ownerId`) en el servidor.<br>- Expiración real y rotación de tokens JWT.<br>- Conflictos de concurrencia en la base de datos. |
| **Qué NO PUEDE DETECTAR** | - Si la API real cambió el nombre de un campo en su esquema (ej. si el servidor cambia `title` por `taskName`, el mock seguirá respondiendo el formato viejo y la prueba pasará en falso verde).<br>- Bloqueos o lentitud en consultas SQL de la base de datos.<br>- Reglas de autenticación del servidor. | - Si la interfaz móvil se congela mientras espera la respuesta.<br>- Problemas de desbordamiento visual (`RenderFlex`) en la pantalla móvil.<br>- Errores de renderizado en widgets o tipografía en dispositivos físicos. |

---

## 3. Regla de Oro sobre Mocks y Pruebas Inestables (Flaky Tests)

> **Principio Clave:** *“Nunca simules (mock) el comportamiento específico que estás intentando verificar.”*

- Si estás verificando el **límite de autorización entre usuarios**, no puedes simular la función que comprueba los permisos; debes ejecutar la lógica real de base de datos para comprobar que la consulta SQL contenga efectivamente el filtro `WHERE owner_id = $2`.
- **Cómo evitar pruebas inestables (Flaky Tests):**
  1. **Aislamiento absoluto de datos:** Cada prueba ejecuta `db.resetDatabase()` antes de iniciar. Ninguna prueba depende de que otra prueba haya creado un registro previo.
  2. **Fechas y Tiempos Deterministas:** En lugar de `Thread.sleep` o retardos arbitrarios, se inyectan tiempos explícitos o se usan aserciones reactivas (`await tester.pumpAndSettle()`).
  3. **Identificadores Únicos Sintéticos:** Generar identificadores mediante `crypto.randomUUID()` para evitar colisiones por concurrencia.
