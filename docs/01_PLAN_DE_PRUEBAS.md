# 01. Plan de Pruebas y Mentalidad del Tester

Este documento define la estrategia general y el plan de pruebas para la aplicación **Task Manager** (Flutter + Node.js/Express + PostgreSQL + JWT con Refresh Tokens), siguiendo las mejores prácticas de la pirámide de pruebas y asegurando el aislamiento en entornos locales de pruebas.

---

## 1. La Pirámide de Pruebas

```
           / \
          /   \
         / E2E \       <- Pocas, completas, más lentas (Integration Test)
        /-------\
       / API &   \     <- Moderadas, rápidas, verifican límites e integración (Supertest)
      / Integración\
     /---------------\
    /  Pruebas        \  <- Muchas, aisladas, instantáneas (Jest, flutter_test)
   /   Unitarias       \
  /---------------------\
```

- **Pruebas Unitarias (Base):** Validan funciones puras y modelos de datos de forma aislada sin dependencias de red ni base de datos (`validateTitle`, `Task.fromJson`).
- **Pruebas de Integración y API (Capa Media):** Verifican que rutas, middlewares de autenticación, controladores y persistencia colaboren correctamente y respeten los límites de autorización entre usuarios.
- **Pruebas End-to-End (Cúspide):** Validan flujos críticos completos del usuario desde la interfaz móvil hasta la API y persistencia.

---

## 2. Plan de Pruebas (Test Plan) - Task Manager v1.0

| Campo | Definición / Detalle |
| :--- | :--- |
| **Característica / Versión** | Task Manager v1.0.0 (Autenticación JWT con rotación de refresh tokens y gestión segura de tareas por usuario). |
| **Alcance (Scope)** | **Incluido:** Registro de usuario, inicio de sesión, rotación y revocación de tokens, CRUD de tareas (`/api/v1/tasks`), aislamiento estricto de tareas por usuario (BOLA), validación de títulos (1 a 120 caracteres).<br>**Excluido:** Pasarelas de pago, recuperación de contraseñas por correo electrónico en producción, pruebas de carga sobre infraestructuras externas. |
| **Riesgos Identificados** | 1. **Acceso cruzado (BOLA / IDOR):** Un usuario modifica o visualiza tareas de otro modificando el ID en la petición.<br>2. **Pérdida de sesión o secuestro de token:** Reutilización de refresh tokens revocados.<br>3. **Inyección SQL / XSS:** Títulos con caracteres maliciosos interpretados por la base de datos o el cliente.<br>4. **Degradación de rendimiento:** Bloqueo del Event Loop por hashing excesivo de contraseñas o consultas sin índices. |
| **Entorno de Pruebas** | - **Backend:** Node.js v20.x, Express 4.x en `http://localhost:3000`.<br>- **Base de Datos de Pruebas:** PostgreSQL dedicada / motor aislado en memoria que se reinicia entre pruebas con `resetDatabase()`.<br>- **Cliente Móvil:** Flutter 3.16.x sobre Emulador Android y Chrome/Desktop.<br>- **Herramientas:** Jest, Supertest, flutter_test, integration_test, k6. |
| **Datos de Prueba** | Cuentas sintéticas desechables (`testuser1@example.test`, `tester@example.test`). Credenciales rotativas. Queda **estrictamente prohibido** el uso de credenciales o datos reales de producción. |
| **Tipos de Pruebas** | Unitarias, Componentes/Widgets, Integración de API, End-to-End (viaje de usuario), Valores Límite, Seguridad OWASP, Rendimiento k6, Accesibilidad y Regresión. |
| **Criterios de Entrada** | - API y base de datos de prueba desplegadas localmente.<br>- Repositorio y dependencias instaladas limpiamente (`npm ci`, `flutter pub get`).<br>- Datos de prueba sintéticos preparados. |
| **Criterios de Salida** | - 100% de pruebas unitarias y de integración pasando en verde.<br>- 0 vulnerabilidades BOLA (acceso cruzado) detectadas.<br>- Pruebas de límites de título (1-120 caracteres) validadas.<br>- Checklist de regresión completado sin defectos bloqueantes ni de alta severidad abiertos. |
| **Responsables** | Мариам (Tester / Desarrollador QA) y equipo docente de Desarrollo Móvil Integral. |
| **Gestión de Evidencias** | Informes redactados, logs sin tokens reales expuestos (los tokens JWT y contraseñas se ofuscan en capturas y reportes con `[REDACTED]`). |

---

## 3. Ejercicio Práctico 1: Criterios de Aceptación para la Creación de Tareas

**Requisito:** *"Un usuario con sesión iniciada puede crear una tarea."*

1. **Éxito típico (Happy Path):**
   > *Dado* que un usuario autenticado envía un título válido (ej. `"Preparar examen de pruebas"`),  
   > *Cuando* se procesa la solicitud de creación,  
   > *Entonces* la tarea se guarda con estado no completado, vinculada al ID del usuario autenticado, y se devuelve el código HTTP `201 Created` con el ID generado y el título guardado.

2. **Entrada inválida (Invalid Input):**
   > *Dado* que un usuario autenticado intenta crear una tarea con un título vacío o compuesto únicamente por espacios en blanco (`"   "`), o superior a 120 caracteres,  
   > *Cuando* se procesa la solicitud,  
   > *Entonces* el sistema rechaza la creación con código HTTP `400 Bad Request` y un mensaje claro (`"Enter a valid title."`), sin almacenar registros huérfanos.

3. **Límite de permisos / Frontera de autorización (Permission Boundary):**
   > *Dado* que el Usuario A ha creado una tarea con ID `task-A1`,  
   > *Cuando* el Usuario B (o un cliente no autenticado) intenta leer, modificar o eliminar la tarea `task-A1` cambiando el identificador en la URL o enviando un campo `ownerId` manipulado,  
   > *Entonces* el sistema rechaza la petición con código HTTP `403 Forbidden` o `404 Not Found`, impidiendo que el Usuario B conozca o modifique información de la tarea ajena.
