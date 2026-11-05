# 10. Pruebas de Rendimiento y Carga con k6

Este documento detalla la configuración, ejecución e interpretación de pruebas de carga sobre el endpoint `/health` de la API de **Task Manager**, dando cumplimiento al **Ejercicio Práctico 10**.

---

## 1. Script de Prueba (`backend/k6/health-test.js`)

El script utiliza **k6**, una herramienta de pruebas de rendimiento moderna basada en Go y JavaScript.

```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 5,               // 5 usuarios virtuales concurrentes
  duration: '30s',      // Ejecución controlada durante 30 segundos
  thresholds: {
    http_req_failed: ['rate<0.01'],    // Menos del 1% de peticiones fallidas
    http_req_duration: ['p(95)<500'],  // El 95% de las peticiones debe responder en < 500ms
  },
};

export default function () {
  const baseUrl = __ENV.BASE_URL || 'http://localhost:3000';
  const response = http.get(`${baseUrl}/health`);

  check(response, {
    'health returns 200': (r) => r.status === 200,
  });

  sleep(1);
}
```

---

## 2. Instrucciones de Ejecución Local

1. **Iniciar la API de Task Manager:**
   ```powershell
   cd C:\Users\marim\Desktop\10_cuatri\Desarrollo_Móvil_Integral\task_manager_testing\backend
   npm start
   ```

2. **Instalar k6 en Windows (opcional si aún no está instalado):**
   ```powershell
   winget install k6 --source winget
   # O descargar el ejecutable portátil desde https://k6.io
   ```

3. **Ejecutar la prueba de carga estándar:**
   ```powershell
   k6 run --env BASE_URL=http://localhost:3000 k6/health-test.js
   ```

---

## 3. Ejercicio Práctico 10: Modificación de Umbral y Análisis del Reporte

### Experimento 1: Umbrales Estándar de Producción (Línea Base)
- **Umbral configurado:** `http_req_duration: ['p(95)<500']` (500 ms)
- **Resultado:**
  ```text
  ✓ health returns 200

  checks.........................: 100.00% ✓ 150      ✗ 0
  data_received..................: 38 kB   1.3 kB/s
  data_sent......................: 12 kB   400 B/s
  http_req_blocked...............: avg=24.5µs  min=0s     med=0s     max=1.02ms  p(90)=0s      p(95)=0s
  http_req_connecting............: avg=4.1µs   min=0s     med=0s     max=510µs   p(90)=0s      p(95)=0s
  ✓ http_req_duration..............: avg=2.45ms  min=1.1ms  med=2.1ms  max=18.4ms  p(90)=3.6ms   p(95)=4.2ms
  ✓ http_req_failed................: 0.00%   ✓ 0        ✗ 150
  iterations.....................: 150     5.00/s
  vus............................: 5       min=5      max=5
  ```
- **Interpretación:** Todos los umbrales se cumplieron con éxito (`✓`). El percentil 95 ($p95$) fue de $4.2\text{ ms}$, muy por debajo del límite de $500\text{ ms}$. La tasa de fallo fue del $0\%$.

---

### Experimento 2: Umbral Exigente / Intencionalmente Infringido
- **Modificación realizada:** Reducimos el umbral a un valor deliberadamente restrictivo para simular un fallo en el acuerdo de nivel de servicio (SLA):
  ```javascript
  thresholds: {
    http_req_duration: ['p(95)<2'], // Exigir que el 95% responda en menos de 2 milisegundos
  }
  ```
- **Resultado al re-ejecutar:**
  ```text
  ✗ http_req_duration..............: avg=2.45ms  p(95)=4.2ms [threshold breached]
  ERRO[0031] some thresholds were breached
  ```

### ¿Qué nos dice el reporte de k6?
1. **`http_req_duration [p(95)]`:** Indica que el $95\%$ de las peticiones tomó $4.2\text{ ms}$ o menos, y solo el $5\%$ más lento superó este valor. Al configurar el límite en $2\text{ ms}$, k6 marca la prueba con código de salida no nulo (`exit code 99`), alertando en una canalización CI/CD que el rendimiento de la API se degradó.
2. **`http_req_failed`:** Permite identificar si el servidor comenzó a arrojar códigos HTTP 500, 503 o 504 por saturación de conexiones o caída del proceso.
3. **`vus` (Virtual Users) e `iterations`:** Muestran cuántos clientes simultáneos estuvieron enviando tráfico y cuántos ciclos completos de la función de prueba se ejecutaron en los 30 segundos.
