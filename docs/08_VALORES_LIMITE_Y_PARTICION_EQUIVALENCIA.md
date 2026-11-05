# 08. Valores Límite y Partición de Equivalencia

Este documento detalla la aplicación de las técnicas de diseño de pruebas de caja negra **Partición de Equivalencia** (Equivalence Partitioning) y **Análisis de Valores Límite** (Boundary Value Analysis - BVA), cumpliendo con el **Ejercicio Práctico 8**.

---

## 1. Campo de Título de la Tarea (1 a 120 caracteres)

| Partición o Límite | Entrada de Muestra | Resultado Esperado | Justificación Técnica |
| :--- | :--- | :---: | :--- |
| **Vacío (Empty)** | `""` | Rechazar (400) | Viola longitud mínima (longitud = 0). |
| **Solo espacios en blanco** | `"   "` | Rechazar (400) | Al recortar con `.trim()`, la longitud resultante es 0. |
| **Límite inferior exacto** | `"a"` (1 carácter) | Aceptar (201) | Longitud mínima permitida. |
| **Valor típico válido** | `"Plan tests"` (10 car.) | Aceptar (201) | Caso de uso común dentro del rango válido. |
| **Límite superior exacto** | `"a".repeat(120)` (120 car.)| Aceptar (201) | Longitud máxima permitida en esquema SQL y validación. |
| **Justo sobre el límite superior** | `"a".repeat(121)` (121 car.)| Rechazar (400) | Excede el límite de 120 caracteres por 1 unidad. |
| **Tipo de dato incorrecto en JSON** | `title: 42` o `title: null` | Rechazar (400) | Previene errores de tipo y fallos no controlados (`TypeError`). |

---

## 2. Ejercicio Práctico 8: Análisis Aplicado al Campo de Contraseña (Password)

### Reglas de Negocio para Contraseñas en Task Manager:
- Longitud mínima: **8 caracteres** (Previene contraseñas triviales o fuerza bruta rápida).
- Longitud máxima: **128 caracteres** (Previene ataques de denegación de servicio por cálculo hash intensivo en bcrypt - DoS via long passwords).
- **Regla de seguridad fundamental:** *Evitar terminantemente probar con contraseñas personales o de producción. Todas las pruebas emplean contraseñas sintéticas desechables.*

### Matriz de Particiones de Equivalencia y Valores Límite

| Clase de Equivalencia / Límite | Valor de Entrada de Prueba (Sintético) | Longitud | Resultado Esperado | Código HTTP | Justificación |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **P1: Cadena Vacía** | `""` | 0 | Rechazar | `400 Bad Request` | Campo obligatorio ausente. |
| **P2: Por debajo del mínimo** | `"Ab1!"` | 4 | Rechazar | `400 Bad Request` | Menor a 8 caracteres (insegura). |
| **B1: Justo bajo límite inferior** | `"Passw1!"` | 7 | Rechazar | `400 Bad Request` | Valor inmediatamente anterior a la frontera permitida ($N - 1$). |
| **B2: Límite inferior exacto** | `"Secret1!"` | 8 | Aceptar | `200 / 201` | Frontera mínima permitida ($N$). |
| **P3: Longitud típica válida** | `"P@ssw0rdTest2026!"` | 17 | Aceptar | `200 / 201` | Valor representativo en la partición válida. |
| **B3: Justo bajo límite superior**| `"A1b!" + "x".repeat(123)` | 127 | Aceptar | `200 / 201` | Valor inmediatamente inferior a la frontera máxima ($M - 1$). |
| **B4: Límite superior exacto** | `"A1b!" + "x".repeat(124)` | 128 | Aceptar | `200 / 201` | Frontera máxima permitida ($M$). |
| **B5: Justo sobre límite superior**| `"A1b!" + "x".repeat(125)`| 129 | Rechazar | `400 Bad Request` | Valor inmediatamente superior a la frontera máxima ($M + 1$). Mitiga DoS por CPU en bcrypt. |
| **P4: Longitud masiva / DoS** | `"a".repeat(10000)` | 10,000 | Rechazar | `400 / 413` | Carga excesiva rechazada por el middleware de validación o body size limit (10kb). |
| **P5: Tipo no string** | `password: 12345678` | N/A | Rechazar | `400 Bad Request` | Control estricto de tipos antes de procesar el hash. |

---

## 3. Implementación de Verificación en Código

Este análisis está directamente implementado y cubierto en el backend dentro de `src/auth/auth.controller.js`:
```javascript
if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
  const error = new Error('Password must be between 8 and 128 characters.');
  error.status = 400;
  throw error;
}
```
Y verificado en las suites automáticas de `tests/integration/auth.api.test.js`.
