'use strict';

const request = require('supertest');
const { app } = require('../../src/app');
const db = require('../../src/db/db');

describe('Auth API and Token Rotation', () => {
  beforeEach(async () => {
    await db.resetDatabase();
  });

  afterAll(async () => {
    await db.closePool();
  });

  test('registers a new user and returns token pair', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'tester@example.test', password: 'securePassword123' });

    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user.email).toBe('tester@example.test');
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  test('rejects registration with existing email', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.test', password: 'securePassword123' });

    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'duplicate@example.test', password: 'otherPassword123' });

    expect(res.status).toBe(409);
  });

  test('logs in an existing user with valid credentials', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'login@example.test', password: 'myValidPassword123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'login@example.test', password: 'myValidPassword123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
  });

  test('rejects login with wrong password', async () => {
    await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'wrongpw@example.test', password: 'myValidPassword123' });

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'wrongpw@example.test', password: 'incorrectPassword' });

    expect(res.status).toBe(401);
  });

  test('rotates refresh token and returns new token pair', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'rotate@example.test', password: 'securePassword123' });

    const originalRefreshToken = regRes.body.refreshToken;

    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body).toHaveProperty('accessToken');
    expect(refreshRes.body).toHaveProperty('refreshToken');
    expect(refreshRes.body.refreshToken).not.toBe(originalRefreshToken);
  });

  test('detects refresh token reuse and revokes sessions (OWASP)', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'reuse@example.test', password: 'securePassword123' });

    const originalRefreshToken = regRes.body.refreshToken;

    // Primer uso legítimo: rota el token
    await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });

    // Segundo intento con el token viejo (reutilización sospechosa)
    const secondTry = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: originalRefreshToken });

    expect(secondTry.status).toBe(401);
    expect(secondTry.body.error).toMatch(/reuse/i);
  });

  test('logs out and revokes refresh token', async () => {
    const regRes = await request(app)
      .post('/api/v1/auth/register')
      .send({ email: 'logout@example.test', password: 'securePassword123' });

    const token = regRes.body.refreshToken;

    const logoutRes = await request(app)
      .post('/api/v1/auth/logout')
      .send({ refreshToken: token });

    expect(logoutRes.status).toBe(200);

    // Intentar refrescar con el token revocado debe fallar
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: token });

    expect(refreshRes.status).toBe(401);
  });

  test('health check returns 200 ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });
});
