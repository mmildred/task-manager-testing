import http from 'k6/http';
import { check, sleep } from 'k6';

// Configuración de la prueba de carga segura (Sección 10)
// VUs: 5 usuarios virtuales concurrentes durante 30 segundos
// Umbrales (SLO): Menos del 1% de errores y p95 < 500ms
export const options = {
  vus: 5,
  duration: '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
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
