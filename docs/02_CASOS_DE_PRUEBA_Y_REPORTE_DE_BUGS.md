# 02. Casos de Prueba y Reporte de Bugs

Este documento contiene los casos de prueba formales para la suite de pruebas del **Task Manager** y el reporte de bug detallado correspondiente al **Ejercicio Práctico 2**.

---

## 1. Casos de Prueba (Test Cases)

### TC-01: Creación de Tarea con Título Válido
| Campo | Detalle |
| :--- | :--- |
| **ID y Título** | `TC-01`: Creación exitosa de tarea con título válido. |
| **Precondiciones** | Usuario autenticado con token JWT válido en el encabezado `Authorization: Bearer <token>`. |
| **Pasos** | 1. Enviar petición `POST` a `/api/v1/tasks` con el cuerpo `{"title": "Planificar pruebas de integración"}`.<br>2. Comprobar la respuesta del servidor.<br>3. Enviar petición `GET` a `/api/v1/tasks`. |
| **Datos de Prueba** | `{"title": "Planificar pruebas de integración"}` |
| **Resultado Esperado** | Código HTTP `201 Created`. El cuerpo contiene el ID generado, el título recortado y `completed: false`. La tarea aparece en el listado del usuario. |
| **Resultado Actual** | Conforme / Exitoso (Validado por Supertest en `tasks.api.test.js`). |
| **Entorno** | Node.js v20.x, Express 4.x, PostgreSQL / DB de pruebas local. |

---

### TC-02: Rechazo de Título con Solo Espacios en Blanco
| Campo | Detalle |
| :--- | :--- |
| **ID y Título** | `TC-02`: Rechazo de creación con título en blanco o espacios. |
| **Precondiciones** | Usuario autenticado con token JWT válido. |
| **Pasos** | 1. Enviar petición `POST` a `/api/v1/tasks` con el cuerpo `{"title": "     "}`.<br>2. Comprobar el código de estado y el mensaje de error. |
| **Datos de Prueba** | `{"title": "     "}` |
| **Resultado Esperado** | Código HTTP `400 Bad Request`. Respuesta JSON con `{"error": "Enter a valid title."}`. No se inserta ningún registro en la base de datos. |
| **Resultado Actual** | Conforme / Exitoso (Validado en pruebas unitarias y de API). |
| **Entorno** | Node.js v20.x, Express 4.x. |

---

### TC-03: Límite de Autorización entre Usuarios (Prevención BOLA)
| Campo | Detalle |
| :--- | :--- |
| **ID y Título** | `TC-03`: Intento de lectura de tarea ajena por ID. |
| **Precondiciones** | 1. Usuario A crea una tarea privada (`task-A`).<br>2. Usuario B obtiene un token JWT válido para su propia cuenta. |
| **Pasos** | 1. Usuario B envía petición `GET` a `/api/v1/tasks/task-A` con su propio token en `Authorization`.<br>2. Comprobar la respuesta devuelta por el endpoint. |
| **Datos de Prueba** | Token de Usuario B, ID de tarea perteneciente al Usuario A. |
| **Resultado Esperado** | Código HTTP `404 Not Found` (o `403 Forbidden`). El sistema no divulga la existencia ni los datos de la tarea del Usuario A. |
| **Resultado Actual** | Conforme / Exitoso (Validado en `tasks.api.test.js`). |
| **Entorno** | Node.js v20.x, Express 4.x. |

---

## 2. Ejercicio Práctico 2: Reporte de Defecto (Bug Report)

### Contexto del Problema
Un usuario reporta que al pulsar sobre el checkbox para marcar una tarea como completada, la tarea desaparece por completo de la pantalla en lugar de permanecer tachada.

```
+---------------------------------------------------------------------------------------+
|                                    REPORTE DE DEFECTO                                 |
|                                     ID: BUG-TASK-0042                                 |
+---------------------------------------------------------------------------------------+
| Resumen (Summary):                                                                    |
| La tarea desaparece inesperadamente de la vista al ser marcada como completada.       |
+---------------------------------------------------------------------------------------+
| Entorno (Environment):                                                                |
| - Dispositivo: Emulador Pixel 7 / Android 14 (API 34)                                 |
| - Versión de la Aplicación Móvil: v1.0.0+1 (Debug build)                              |
| - Versión del Backend API: v1.0.0 (commit local)                                      |
| - Motor de Base de Datos: PostgreSQL 16 (Local Test DB)                               |
+---------------------------------------------------------------------------------------+
| Precondiciones (Preconditions):                                                       |
| 1. Cuenta de prueba sintética activa: tester_qa@example.test (sin datos personales).   |
| 2. Existe al menos una tarea pendiente creada: "Revisar criterios de aceptación".    |
| 3. Sesión activa en el cliente móvil Flutter.                                         |
+---------------------------------------------------------------------------------------+
| Pasos para Reproducir (Steps to reproduce):                                          |
| 1. Iniciar sesión con la cuenta de prueba sintética.                                  |
| 2. En la pantalla principal "Mis Tareas", localizar la tarea pendiente.               |
| 3. Tocar el checkbox ubicado a la izquierda de la tarea para marcarla como completada.|
| 4. Observar el comportamiento de la lista en la interfaz.                             |
+---------------------------------------------------------------------------------------+
| Resultado Esperado (Expected Result):                                                 |
| La tarea debe permanecer en la lista, el checkbox debe mostrarse marcado (✓), y el    |
| texto del título debe mostrarse con estilo tachado (TextDecoration.lineThrough)       |
| con color atenuado, permitiendo al usuario desmarcarla si lo desea.                   |
+---------------------------------------------------------------------------------------+
| Resultado Actual (Actual Result):                                                     |
| La tarea es eliminada inmediatamente del árbol de widgets (`tasks.removeAt(index)` en |
| lugar de actualizar `task.completed = true`). La lista reduce su conteo en 1 y, si era|
| la única tarea, se muestra el estado vacío ("No tasks yet."). Al refrescar, la base  |
| de datos aún conserva la tarea, lo que causa inconsistencia visual inmediata.         |
+---------------------------------------------------------------------------------------+
| Evidencia (Evidence):                                                                 |
| - Log redactado de la llamada HTTP:                                                   |
|   PUT /api/v1/tasks/task-123 HTTP/1.1                                                 |
|   Authorization: Bearer [REDACTED_ACCESS_TOKEN]                                       |
|   {"title": "Revisar criterios de aceptación", "completed": true}                     |
|   HTTP/1.1 200 OK -> {"id": "task-123", "completed": true}                           |
| - Fragmento de código defectuoso en el cliente:                                      |
|   setState(() { _tasks.removeWhere((t) => t.id == id); }); // ¡ERROR: Remueve el ítem!|
+---------------------------------------------------------------------------------------+
| Evaluación de Severidad y Prioridad:                                                  |
|                                                                                       |
| Severidad: MEDIA-ALTA (Major / High Severity)                                         |
| Justificación: Provoca una pérdida aparente de datos para el usuario final y causa    |
| confusión grave sobre el estado real de sus tareas, aunque no destruye la base de     |
| datos física.                                                                         |
|                                                                                       |
| Prioridad: ALTA (High Priority)                                                       |
| Justificación: Afecta el flujo esencial de uso (completar tareas). Debe corregirse    |
| antes del siguiente release a usuarios o entrega al profesor.                         |
+---------------------------------------------------------------------------------------+
```
