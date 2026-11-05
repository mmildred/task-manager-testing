# 14. Automatización de Pruebas en CI/CD y Cobertura de Código

Este documento describe la canalización de integración continua (CI) configurada con **GitHub Actions** para **Task Manager** y el experimento de fallo intencional del **Ejercicio Práctico 14**.

---

## 1. Configuración del Flujo de Trabajo (`.github/workflows/tests.yml`)

El flujo automatizado se dispara ante cualquier `push` o `pull_request` a la rama principal (`main`), ejecutando dos trabajos aislados en paralelo:

```yaml
name: Tests

on:
  pull_request:
  push:
    branches: [main]

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: backend
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm
          cache-dependency-path: backend/package-lock.json
      - run: npm ci
      - run: npm test

  flutter:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: mobile
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          channel: stable
      - run: flutter pub get
      - run: flutter test
```

---

## 2. Entendiendo la Cobertura de Código (Code Coverage)

> *“La cobertura indica qué líneas de código se ejecutaron durante las pruebas; no demuestra que las pruebas hayan verificado el comportamiento correcto ni las reglas de seguridad.”*

Una suite con $95\%$ de cobertura puede seguir siendo vulnerable a un fallo de autorización (BOLA) si ninguna prueba intentó usar el token del Usuario B contra el recurso del Usuario A. Por ello, nuestras pruebas no solo miden cobertura numérica, sino que verifican aserciones de fronteras de permisos y entradas maliciosas.

---

## 3. Ejercicio Práctico 14: Demostración de Fallo Intencional y Restauración

Para comprobar que la canalización de CI realmente detecta regresiones y no da "falsos positivos":

### Paso 1: Introducir un fallo intencional en `src/tasks/validation.js`
Comentamos intencionalmente la validación de longitud mínima para permitir títulos vacíos:
```javascript
// MODIFICACIÓN EXPERIMENTAL INTENCIONAL:
function validateTitle(value) {
  if (typeof value !== 'string') throw new TypeError('Enter a valid title.');
  const title = value.trim();
  // if (title.length < 1 || title.length > 120) throw new TypeError('Enter a valid title.');
  return title; // Acepta erróneamente cadenas vacías ""
}
```

### Paso 2: Ejecución del trabajo en CI / local (`npm test`)
El comando falla de inmediato con código de salida 1:
```text
FAIL tests/unit/validation.test.js
  validateTitle
    ✕ rejects a blank title (5 ms)

  ● validateTitle › rejects a blank title
    expect(received).toThrow(expected)
    Expected message: "Enter a valid title."
    Received function did not throw

FAIL tests/integration/tasks.api.test.js
  Task API Security and Integration
    ✕ rejects an empty title (240 ms)
    Expected status 400, received 201 Created

Test Suites: 2 failed, 1 passed, 3 total
Tests:       2 failed, 22 passed, 24 total
```
**Resultado en GitHub Actions:** La canalización se detiene con una cruz roja (`✕ Backend Job Failed`), bloqueando la fusión del Pull Request antes de que el código defectuoso llegue a producción.

### Paso 3: Restauración del código
Se revierte el cambio en `validation.js` restaurando la validación estricta (`title.length < 1 || title.length > 120`).  
Al volver a ejecutar `npm test`:
```text
Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        10.5 s
```
La canalización vuelve a verde (`✓ All checks passed`).
