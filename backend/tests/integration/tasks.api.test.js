'use strict';

const request = require('supertest');
const { app } = require('../../src/app');
const db = require('../../src/db/db');

// Funciones de ayuda para pruebas
let userCounter = 0;
async function createTestUserAndGetToken() {
  userCounter++;
  const email = `testuser${userCounter}_${Date.now()}@example.test`;
  const password = 'local-test-password-123';

  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ email, password });

  return res.body.accessToken;
}

async function createTask(token, title) {
  const res = await request(app)
    .post('/api/v1/tasks')
    .set('Authorization', `Bearer ${token}`)
    .send({ title });

  return res.body.id;
}

describe('Task API Security and Integration', () => {
  beforeEach(async () => {
    await db.resetDatabase();
  });

  afterAll(async () => {
    await db.closePool();
  });

  // Sección 6: Pruebas base de API
  test('rejects task creation without authentication', async () => {
    const response = await request(app)
      .post('/api/v1/tasks')
      .send({ title: 'Plan tests' });

    expect(response.status).toBe(401);
  });

  test('rejects an empty title', async () => {
    const token = await createTestUserAndGetToken();
    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: '   ' });

    expect(response.status).toBe(400);
  });

  test('does not let one user read another user task', async () => {
    const owner = await createTestUserAndGetToken();
    const stranger = await createTestUserAndGetToken();

    const taskId = await createTask(owner, 'Private task');

    const response = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${stranger}`);

    expect([403, 404]).toContain(response.status);
  });

  // --- EJERCICIO PRÁCTICO 6 ---
  test('rejects an invalid task ID format', async () => {
    const token = await createTestUserAndGetToken();

    const response = await request(app)
      .get('/api/v1/tasks/invalid!@#$$%^^&*()')
      .set('Authorization', `Bearer ${token}`);

    expect([400, 404]).toContain(response.status);
  });

  test('rejects task creation when title is missing in payload', async () => {
    const token = await createTestUserAndGetToken();

    const response = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(response.status).toBe(400);
  });

  test('does not let one user update another user task', async () => {
    const owner = await createTestUserAndGetToken();
    const attacker = await createTestUserAndGetToken();

    const taskId = await createTask(owner, 'Legitimate task');

    const response = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${attacker}`)
      .send({ title: 'Hacked task title' });

    expect([403, 404]).toContain(response.status);

    // Confirmar que el título original sigue intacto
    const verifyResponse = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner}`);

    expect(verifyResponse.status).toBe(200);
    expect(verifyResponse.body.title).toBe('Legitimate task');
  });

  // --- EJERCICIO PRÁCTICO 9 (Seguridad y OWASP API) ---
  test('ignores or rejects ownerId in update payload and retains server-derived ownership', async () => {
    const owner = await createTestUserAndGetToken();
    const foreignUser = await createTestUserAndGetToken();

    const taskId = await createTask(owner, 'Protected Ownership Task');

    // Intentar cambiar el ownerId enviando un ownerId falso o ajeno en el body
    const updateResponse = await request(app)
      .put(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner}`)
      .send({
        title: 'Updated title without changing ownership',
        ownerId: 'hacked-owner-999',
        owner_id: 'hacked-owner-999',
      });

    expect(updateResponse.status).toBe(200);

    // El usuario original aún puede acceder (la propiedad sigue intacta)
    const checkOwner = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${owner}`);
    expect(checkOwner.status).toBe(200);

    // El usuario ajeno sigue sin poder acceder
    const checkForeign = await request(app)
      .get(`/api/v1/tasks/${taskId}`)
      .set('Authorization', `Bearer ${foreignUser}`);
    expect([403, 404]).toContain(checkForeign.status);
  });

  test('safely handles SQL injection strings as plain text data', async () => {
    const token = await createTestUserAndGetToken();
    const injectionTitle = "' OR '1'='1";

    const createResponse = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: injectionTitle });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe(injectionTitle);

    const getResponse = await request(app)
      .get(`/api/v1/tasks/${createResponse.body.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getResponse.status).toBe(200);
    expect(getResponse.body.title).toBe(injectionTitle);
  });

  test('safely handles script tags as plain text without interpretation', async () => {
    const token = await createTestUserAndGetToken();
    const xssPayload = '<script>alert(1)</script>';

    const createResponse = await request(app)
      .post('/api/v1/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: xssPayload });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.title).toBe(xssPayload);
  });
});
