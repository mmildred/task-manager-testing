# 13. Pruebas de Humo (Smoke) y Lista de Regresión (Regression Checklist)

Este documento contiene la suite de pruebas de humo y la lista de verificación de regresión exhaustiva para **Task Manager**, en cumplimiento del **Ejercicio Práctico 13**.

---

## 1. Suite de Pruebas de Humo (Smoke Suite - 3 minutos)

La prueba de humo se ejecuta inmediatamente tras cada despliegue o compilación nueva para verificar que las funciones vitales operen:

1. [ ] **Apertura de la App:** La app móvil abre sin crashear en la pantalla de inicio de sesión.
2. [ ] **Health Check de la API:** Petición `GET /health` responde `200 OK` con `{"status": "ok"}`.
3. [ ] **Inicio de Sesión:** Usuario sintético de prueba puede iniciar sesión y recibe token JWT.
4. [ ] **Carga de Lista:** La pantalla principal "Mis Tareas" carga el listado o el estado vacío sin congelarse.
5. [ ] **Creación Rápida:** Una tarea simple se crea y se refleja en la vista.
6. [ ] **Cierre de Sesión:** El botón de logout redirige limpiamente a la pantalla de login.

---

## 2. Ejercicio Práctico 13: Lista de Verificación de Regresión Completa

Esta lista se ejecuta antes de cualquier entrega final o release para garantizar que los cambios recientes no rompieron funcionalidades existentes.

### Módulo A: Creación de Tareas (Creation)
- [ ] **REG-CR-01:** Crear tarea con título típico (10-30 caracteres) $\to$ Retorna 201 y aparece al inicio de la lista.
- [ ] **REG-CR-02:** Crear tarea con título de 1 carácter (límite inferior) $\to$ Aceptada exitosamente.
- [ ] **REG-CR-03:** Crear tarea con título de 120 caracteres (límite superior) $\to$ Aceptada exitosamente.
- [ ] **REG-CR-04:** Crear tarea con título de 121 caracteres $\to$ Rechazada con 400 Bad Request.
- [ ] **REG-CR-05:** Crear tarea con espacios en blanco únicamente (`"   "`) $\to$ Rechazada con 400 Bad Request.
- [ ] **REG-CR-06:** Crear tarea sin autenticación (sin Bearer token) $\to$ Rechazada con 401 Unauthorized.

### Módulo B: Edición y Actualización de Tareas (Editing)
- [ ] **REG-ED-01:** Modificar el título de una tarea existente por un nuevo texto válido $\to$ Se actualiza el campo y la fecha `updated_at`.
- [ ] **REG-ED-02:** Intentar actualizar una tarea asignándole un título en blanco $\to$ Error 400 y se conserva el título anterior.
- [ ] **REG-ED-03:** Enviar un cuerpo con `ownerId` manipulado durante la edición $\to$ El servidor ignora el campo ajeno y mantiene la propiedad del usuario autenticado.

### Módulo C: Finalización de Tareas (Completion)
- [ ] **REG-CP-01:** Marcar tarea como completada tocando el checkbox $\to$ `completed` cambia a `true`, la tarea se tacha visualmente y permanece en la lista.
- [ ] **REG-CP-02:** Desmarcar tarea completada $\to$ `completed` vuelve a `false`, se quita el tachado.
- [ ] **REG-CP-03:** Persistencia del estado tras recargar $\to$ Al salir y volver a entrar a la pantalla, las tareas conservan su estado completado correcto.

### Módulo D: Eliminación de Tareas (Deletion)
- [ ] **REG-DL-01:** Eliminar tarea propia existente $\to$ Devuelve 200 OK y desaparece inmediatamente del listado.
- [ ] **REG-DL-02:** Intentar eliminar una tarea con un ID inexistente $\to$ Devuelve 404 Not Found.
- [ ] **REG-DL-03:** Comprobar que eliminar una tarea no elimina tareas de otros usuarios.

### Módulo E: Aislamiento y Control de Acceso Cruzado (Cross-User Access)
- [ ] **REG-SEC-01:** Usuario B intenta leer la tarea del Usuario A (`GET /api/v1/tasks/:id`) $\to$ Devuelve 404 Not Found (no expone la existencia de la tarea ajena).
- [ ] **REG-SEC-02:** Usuario B intenta editar la tarea del Usuario A (`PUT /api/v1/tasks/:id`) $\to$ Devuelve 403 Forbidden o 404 Not Found.
- [ ] **REG-SEC-03:** Usuario B intenta eliminar la tarea del Usuario A (`DELETE /api/v1/tasks/:id`) $\to$ Devuelve 403 Forbidden o 404 Not Found.
- [ ] **REG-SEC-04:** Listado general (`GET /api/v1/tasks`) $\to$ Solo devuelve las tareas pertenecientes al token de la sesión actual; 0 tareas de otros usuarios se filtran en la respuesta.
