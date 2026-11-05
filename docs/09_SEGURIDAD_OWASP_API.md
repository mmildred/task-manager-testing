# 09. Pruebas de Seguridad y Lista de Verificación OWASP API

Este documento detalla la evaluación de seguridad realizada sobre la API REST y el cliente móvil de **Task Manager**, cubriendo la lista de las 10 vulnerabilidades principales de OWASP API Security y los resultados experimentales del **Ejercicio Práctico 9**.

---

## 1. Lista de Verificación OWASP API Security (Top 10)

| Riesgo OWASP API | Verificación Realizada en Task Manager | Estado | Implementación / Mitigación en el Código |
| :--- | :--- | :---: | :--- |
| **API1:2023 Broken Object Level Authorization (BOLA)** | Toda consulta de tareas filtra estrictamente por `owner_id = req.user.id`. Si el usuario B solicita una tarea del usuario A por ID, se devuelve `404` o `403`. | **Aprobado** | `tasks.api.test.js`: No se permite leer ni alterar tareas de otro propietario. |
| **API2:2023 Broken Authentication** | Tokens JWT firmados con expiración corta (15 min). Refresh tokens de un solo uso con rotación y revocación. | **Aprobado** | `tokens.js`: Middleware `requireAuth` rechaza tokens ausentes, vencidos o alterados con código 401. |
| **API3:2023 Broken Object Property Level Authorization** | Prevención de **Mass Assignment**: Los clientes no pueden definir `ownerId`, `id` o estados de privilegios en el payload JSON. | **Aprobado** | `task.controller.js`: El `ownerId` se extrae únicamente del token del servidor (`req.user.id`). Cualquier `ownerId` en el cuerpo se ignora. |
| **API4:2023 Unrestricted Resource Consumption** | Límites estrictos en el tamaño del cuerpo de la petición (`express.json({ limit: '10kb' })`) y longitud de títulos ($\le 120$ caracteres). | **Aprobado** | `app.js` y `validation.js` previenen saturación de memoria por payloads gigantes. |
| **API5:2023 Broken Function Level Authorization** | Rutas protegidas divididas claramente de rutas públicas (`/health`, `/auth/*`). | **Aprobado** | Middleware `requireAuth` se monta sobre todas las rutas `/api/v1/tasks`. |
| **API6:2023 Unrestricted Access to Sensitive Business Flows** | Detección de reutilización de refresh tokens (Token Reuse Detection). Si un token revocado se vuelve a presentar, se revocan todas las sesiones activas del usuario (posible robo de credenciales). | **Aprobado** | `tokens.js`: `rotateRefreshToken` invalida todas las sesiones si detecta reutilización. |
| **API7:2023 Server Side Request Forgery (SSRF)** | La API no acepta URLs ni endpoints arbitrarios suministrados por el cliente para hacer peticiones externas. | **Aprobado** | Arquitectura cerrada sin webhooks de usuario no validados. |
| **API8:2023 Security Misconfiguration** | Encabezados HTTP seguros mediante `helmet()`, políticas restrictivas de CORS y supresión de stack traces en errores 500. | **Aprobado** | `app.js`: Manejador centralizado de errores sin fuga de stack traces en respuestas HTTP. |
| **API9:2023 Improper Inventory Management** | Versionamiento explícito en la ruta base (`/api/v1/*`) y aislamiento de rutas obsoletas. | **Aprobado** | Rutas estandarizadas bajo `/api/v1`. |
| **API10:2023 Unsafe Consumption of APIs** | Validación estricta y tipado seguro de respuestas JSON en cliente móvil antes de su renderizado. | **Aprobado** | `Task.fromJson` valida tipos de campo antes de instanciar el modelo. |

---

## 2. Ejercicio Práctico 9: Pruebas Negativas y Asignación Masiva (Mass Assignment)

### A. Prueba de Manipulación de `ownerId`
**Objetivo:** Verificar que un atacante no pueda transferir la propiedad de una tarea o apropiarse de tareas de otros enviando un campo `ownerId` modificado en el cuerpo de la petición `PUT` o `POST`.

**Petición Enviada:**
```http
PUT /api/v1/tasks/task-owner-001 HTTP/1.1
Host: localhost:3000
Authorization: Bearer [TOKEN_DE_USUARIO_LEGITIMO]
Content-Type: application/json

{
  "title": "Título actualizado legítimo",
  "ownerId": "attacker-id-9999",
  "owner_id": "attacker-id-9999"
}
```

**Resultado Observado y Verificación:**
- Código de respuesta: `200 OK`.
- Al realizar la consulta `GET /api/v1/tasks/task-owner-001` con el token del atacante (`attacker-id-9999`), el servidor responde con `404 Not Found`.
- Al realizar la consulta `GET` con el usuario legítimo, la tarea sigue estando presente y su propietario en la base de datos permanece inmutable:
  ```json
  {
    "id": "task-owner-001",
    "title": "Título actualizado legítimo",
    "completed": false
  }
  ```
- **Conclusión:** El servidor ignora cualquier `ownerId` suministrado por el cliente y deriva la propiedad únicamente del contexto de la sesión autenticada (`req.user.id`).

---

### B. Prueba de Inyección SQL (SQL Injection - SQLi)
**Carga útil (Payload):**
```json
{
  "title": "' OR '1'='1"
}
```
**Resultado:**
- El sistema guarda la tarea con el título literal `' OR '1'='1` sin ejecutar sintaxis SQL.
- El repositorio emplea consultas parametrizadas con marcadores de posición (`$1, $2, $3, $4`), impidiendo la concatenación directa de comandos SQL en el motor relacional.

---

### C. Prueba de Cross-Site Scripting (XSS / Markup Injection)
**Carga útil (Payload):**
```json
{
  "title": "<script>alert('XSS')</script>"
}
```
**Resultado:**
- En la base de datos se almacena como texto plano.
- En Flutter, los widgets `Text('<script>...')` renderizan la cadena literalmente en el canvas de renderizado nativo/Skia sin evaluar código HTML ni scripts, mitigando la ejecución inadvertida de marcado malicioso.
