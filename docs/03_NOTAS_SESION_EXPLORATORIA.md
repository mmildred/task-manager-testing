# 03. Notas de la Sesión de Pruebas Exploratorias

Este documento documenta la sesión estructurada de pruebas exploratorias basada en una carta (charter), correspondiente al **Ejercicio Práctico 3**.

---

## 1. Carta de la Sesión (Charter)

- **Misión / Carta:** Explorar los flujos de creación y edición de tareas para identificar defectos de pérdida de datos, comportamientos inesperados ante concurrencia rápida en la interfaz y degradación de red.
- **Duración (Timebox):** 15 minutos de exploración cronometrada.
- **Probador:** Мариам (Tester QA).
- **Entorno:** Dispositivo emulador Android con red simulada (WiFi y Modo Avión activable rápidamente) conectado al backend Node.js en localhost.

---

## 2. Registro de Notas de la Sesión (Session Notes)

| Tiempo | Acción / Condición Probada | Observación del Sistema | Hallazgos y Acciones de Seguimiento |
| :---: | :--- | :--- | :--- |
| **00:00** | Inicio de sesión con usuario de prueba `tester_exp@example.test`. | Redirección instantánea a pantalla principal "Mis Tareas". Estado inicial muestra mensaje vacío: *"No tasks yet."* | Conforme. El panel de estado vacío funciona correctamente. |
| **03:15** | **Título de longitud extrema (>120 caracteres):** Se pegó un texto de 250 caracteres en el campo de título. | El diálogo muestra el mensaje de error: *"El título no puede exceder 120 caracteres."* El botón "Guardar" no envía la petición. | **Positivo:** Validación preventiva en cliente. Se verifica que la API también rechaza con 400 si se omite la validación del cliente. |
| **06:40** | **Título con solo espacios en blanco (`"     "`):** Se ingresaron 5 espacios y se pulsó "Guardar". | El diálogo resalta el error *"Enter a valid title."* y bloquea el guardado. | Conforme. Se probó también ingresar caracteres especiales y emojis (`🚀 Plan de pruebas 🧪`), guardándose sin corrupción de caracteres (UTF-8). |
| **09:30** | **Pulsaciones rápidas repetidas (Rapid repeated taps):** Se presionó rápidamente 5 veces consecutivas el botón "Guardar" al crear una tarea con título `"Prueba de clics rápidos"`. | **¡Sorpresa / Defecto encontrado!** En clientes sin debounce o sin deshabilitar el botón durante el estado de carga (`_isLoading`), se enviaron peticiones concurrentes, creando 3 tareas idénticas duplicadas en la base de datos. | **Acción correctiva implementada:** Deshabilitar el botón (`onPressed: _isLoading ? null : _save`) y aplicar bandera booleana para evitar envíos múltiples (Idempotencia). |
| **12:50** | **Conectividad interrumpida brevemente:** Se inició el guardado de una tarea mientras se conmutó la red a modo fuera de línea (Offline / timeout). | La aplicación móvil capturó la excepción de red y mostró el componente `TaskListPanel` con icono de error, mensaje de fallo de conexión y el botón **"Reintentar"** (Retry). | Conforme. Al restablecer la red y presionar "Reintentar", la sincronización se completó sin pérdida del borrador. |
| **15:00** | Cierre de sesión y verificación de almacenamiento de tokens. | El token en memoria fue limpiado. Al presionar el botón "Atrás" de Android no se regresó a la pantalla privada de tareas. | Conforme. No se filtran datos confidenciales en el historial de navegación de la app. |

---

## 3. Lo que nos sorprendió (Surprises and Key Takeaways)

1. **La vulnerabilidad de "Doble Envío" (Double-submit):**
   Fue sorprendente ver lo fácil que un usuario con una conexión lenta o impaciente puede duplicar tareas en la base de datos simplemente tocando dos o tres veces seguidas el botón "Guardar". Esto demostró la necesidad de deshabilitar los controles de formulario mientras la promesa HTTP está pendiente y contar con claves de idempotencia o validación de duplicados.

2. **Resiliencia ante pérdida de conexión:**
   Comprobar que el widget `TaskListPanel` maneja limpiamente el estado de error y provee un botón de reintento (`onRetry`) que se ejecuta exactamente una vez, evita la frustración del usuario de tener que volver a escribir todo desde cero.
