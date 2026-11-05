'use strict';

const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const db = require('../db/db');

const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET || 'test-access-token-secret-for-local-development-only-replace-in-prod';
const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
    },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRY }
  );
}

async function createRefreshToken(userId) {
  const rawToken = crypto.randomBytes(40).toString('hex');
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_EXPIRY_MS);
  const tokenId = crypto.randomUUID();

  await db.query(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES ($1, $2, $3, $4)',
    [tokenId, userId, tokenHash, expiresAt.toISOString()]
  );

  return rawToken;
}

/**
 * Rota el refresh token y detecta intentos de reutilización de tokens revocados (OWASP).
 */
async function rotateRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  const { rows } = await db.query(
    'SELECT id, user_id, token_hash, revoked, expires_at FROM refresh_tokens WHERE token_hash = $1',
    [tokenHash]
  );

  if (rows.length === 0) {
    const error = new Error('Invalid refresh token.');
    error.status = 401;
    throw error;
  }

  const record = rows[0];

  // Detección de reutilización (Token Reuse Detection)
  if (record.revoked) {
    // Si alguien intenta usar un token ya revocado, podría haber sido robado.
    // Invalidamos todas las sesiones activas del usuario por seguridad (OWASP)
    await db.query('UPDATE refresh_tokens SET revoked = true WHERE user_id = $1', [record.user_id]);
    const error = new Error('Token reuse detected. All sessions revoked.');
    error.status = 401;
    throw error;
  }

  // Verificar caducidad
  if (new Date() > new Date(record.expires_at)) {
    const error = new Error('Refresh token expired.');
    error.status = 401;
    throw error;
  }

  // Revocar el token actual
  await db.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);

  // Obtener usuario
  const userResult = await db.query('SELECT id, email FROM users WHERE id = $1', [record.user_id]);
  if (userResult.rows.length === 0) {
    const error = new Error('User not found.');
    error.status = 401;
    throw error;
  }
  const user = userResult.rows[0];

  // Emitir nuevo par de tokens
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = await createRefreshToken(user.id);

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

async function revokeRefreshToken(rawToken) {
  const tokenHash = hashToken(rawToken);
  await db.query('UPDATE refresh_tokens SET revoked = true WHERE token_hash = $1', [tokenHash]);
}

module.exports = {
  ACCESS_TOKEN_SECRET,
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
  hashToken,
};
