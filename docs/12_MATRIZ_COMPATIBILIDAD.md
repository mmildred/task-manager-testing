# 12. Matriz de Compatibilidad y Pruebas Multi-Dispositivo

Este documento define la matriz de compatibilidad de plataformas y dispositivos para la aplicación **Task Manager**, detallando las observaciones del **Ejercicio Práctico 12**.

---

## 1. Matriz de Compatibilidad de Dispositivos

| Plataforma | Perfil de Dispositivo | Rango de SO / API | Comprobaciones Críticas Realizadas |
| :--- | :--- | :--- | :--- |
| **Android** | Pantalla Pequeña (4.7" / 720p, ej. Moto E / Pixel 3a) | Android 8.0 a 10 (API 26-29) | Inicio de sesión, escalado tipográfico, recuperación de conectividad, área táctil. |
| **Android** | Dispositivo Estándar Actual (6.4" - 6.7" / 1080p, ej. Pixel 7 / Galaxy S23) | Android 13 a 14 (API 33-34) | CRUD completo de tareas, refresco de sesión con token JWT, cierre de sesión. |
| **iOS** | Pantalla Pequeña (ej. iPhone SE 2da/3ra gen) | iOS 15 a 16 | Distribución visual, teclado en pantalla sin solapar botones, accesibilidad. |
| **iOS** | Dispositivo Estándar Actual (ej. iPhone 14/15) | iOS 17+ | Ciclo de vida de la app (background / resume), notch / Dynamic Island. |
| **Emulador / Escritorio** | Perfil de Desarrollo (Chrome / Windows Desktop / Pixel Emulator) | Toolchain actual | Pruebas de humo rápidas, pruebas automatizadas de integración y widgets. |

---

## 2. Ejercicio Práctico 12: Comparación entre Pantalla Pequeña y Pantalla Grande

### A. Resultados en Pantalla Pequeña (Viewport compacto: $360 \times 640\text{ dp}$)
- **Comportamiento del Teclado:** Al enfocar el campo de contraseña, el teclado virtual ocupa más del $50\%$ de la pantalla.
  - *Sin optimización:* Producía un error de `RenderFlex overflow` de 32 píxeles.
  - *Con solución implementada:* Gracias a `SingleChildScrollView` en `LoginScreen`, el formulario se desplaza suavemente sin recortar el botón de login ni ocultar mensajes de error.
- **Títulos Largos en la Lista:** Títulos de 120 caracteres en `ListTile` realizan salto de línea automático en múltiples renglones sin desbordar los márgenes laterales.
- **Controles táctiles:** El checkbox y el icono de menú conservan un área de interacción holgada ($\ge 48\text{ dp}$), garantizando que no sea difícil tocarlos con una sola mano.

---

### B. Resultados en Pantalla Grande (Tablet / Escritorio: $1280 \times 800\text{ dp}$ o superior)
- **Distribución del Formulario:** Para evitar que los campos de texto de inicio de sesión se estiren de forma antiestética a lo largo de todo el ancho del monitor, se aplicó una restricción de ancho máximo:
  ```dart
  ConstrainedBox(
    constraints: const BoxConstraints(maxWidth: 400),
    child: Column(...),
  )
  ```
  Esto centra el formulario con márgenes equilibrados.
- **Listado de Tareas:** Las tarjetas y separadores ocupan el espacio de manera limpia y legible, aprovechando la amplitud sin perder legibilidad.
