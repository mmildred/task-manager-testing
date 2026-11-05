# 11. Auditoría de Accesibilidad (a11y) y Usabilidad

Este documento detalla la auditoría de accesibilidad y usabilidad aplicada a la aplicación móvil Flutter de **Task Manager**, en cumplimiento del **Ejercicio Práctico 11**.

---

## 1. Lista de Verificación de Accesibilidad (WCAG 2.1 AA)

| Criterio | Requisito de la Guía | Evaluación en la Aplicación Móvil | Estado |
| :--- | :--- | :--- | :---: |
| **Contraste de Color** | Relación de contraste mínimo de 4.5:1 para texto normal contra el fondo. | Fondo blanco con texto `#1A1A1A` (contraste 16:1) y botones `Colors.indigo` con texto blanco (contraste 7.8:1). | **Cumple** |
| **Objetivos Táctiles (Touch Targets)** | Tamaño mínimo de área táctil interactiva de $48 \times 48\text{ dp}$. | Botones de Login y Diálogos configurados con `minimumSize: Size(..., 48)` y `FloatingActionButton` estándar ($56 \times 56\text{ dp}$). | **Cumple** |
| **Etiquetado para Lectores de Pantalla** | Todos los campos interactivos e iconos cuentan con nombres accesibles (`semanticsLabel`, `tooltip`). | - Botón flotante: `tooltip: 'Agregar tarea'`.<br>- Botón de salida: `tooltip: 'Cerrar sesión'`.<br>- Indicador de carga: `semanticsLabel: 'Cargando lista de tareas'`. | **Cumple** |
| **Escala de Texto Dinámica (Text Scaling)** | La interfaz no se desborda cuando el usuario activa fuentes grandes ($1.5\times$ o $2.0\times$). | Pantalla de inicio de sesión envuelta en `SingleChildScrollView` y campos con layout responsivo que previenen desbordamientos (`RenderFlex overflow`). | **Cumple** |
| **Independencia del Color** | El color no debe ser el único canal para comunicar el estado de una tarea. | Las tareas completadas muestran checkbox marcado (✓), título tachado (`lineThrough`) y color secundario. No dependen solo de un cambio de color. | **Cumple** |
| **Recuperación ante Errores** | Los mensajes de error explican la causa y ofrecen una acción correctiva directa. | El componente `TaskListPanel` incluye el botón **"Reintentar"** (`retry-button`) con icono y etiqueta textual clara. | **Cumple** |

---

## 2. Ejercicio Práctico 11: Simulación con Lector de Pantalla y Texto Ampliado

### A. Prueba con Escala de Texto Grande (Font Scale 1.5x - 2.0x)
1. **Procedimiento:** Se configuró el factor de escala tipográfica del sistema en $150\%$ en la configuración de accesibilidad.
2. **Observaciones durante el flujo de creación de tarea y error:**
   - En la versión inicial previa a la optimización, el diálogo de creación de tarea provocaba un error de desbordamiento de 14 píxeles en pantallas compactas (`A RenderFlex overflowed by 14 pixels on the bottom`).
   - **Corrección aplicada:** Se encapsuló el cuerpo del diálogo y la pantalla de inicio de sesión dentro de vistas con scroll adaptativo (`SingleChildScrollView` y `ConstrainedBox`), permitiendo que el texto grande y los mensajes de validación ("Enter a valid title.") queden completamente visibles sin truncamientos.

---

### B. Prueba con Lector de Pantalla (TalkBack / VoiceOver)
1. **Procedimiento:** Se navegó con lector de pantalla por el flujo: Inicio de sesión $\to$ Creación de tarea $\to$ Activación de error de validación por título vacío.
2. **Registro de controles y anuncios audibles:**

| Control / Elemento | Lo que el lector anunciaba originalmente | Corrección / Estado Final |
| :--- | :--- | :--- |
| **Icono de Carga** | *"Imagen sin etiquetar"* | Se añadió `semanticsLabel: 'Cargando lista de tareas'`, anunciado correctamente como *"Cargando lista de tareas, barra de progreso"*. |
| **Campo de Correo** | *"Edición, Correo Electrónico"* | Anuncio claro y focalizable. |
| **Error en Diálogo** | El foco se quedaba en el campo de texto y no saltaba al error. | El mensaje de error `"Enter a valid title."` se anuncia inmediatamente en el siguiente swipe de accesibilidad. |
| **Checkbox de Tarea** | *"Casilla de verificación, desmarcada, [Título de la tarea]"* | Anuncio perfecto mediante `CheckboxListTile`. |
