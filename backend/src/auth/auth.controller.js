'use strict';

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const db = require('../db/db');
const {
  generateAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require('./tokens');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateCredentials(email, password) {
  if (typeof email !== 'string' || !EMAIL_REGEX.test(email.trim().toLowerCase())) {
    const error = new Error('Invalid email format.');
    error.status = 400;
    throw error;
  }

  if (typeof password !== 'string' || password.length < 8 || password.length > 128) {
    const error = new Error('Password must be between 8 and 128 characters.');
    error.status = 400;
    throw error;
  }
}

async function register(req, res, next) {
  try {
    const { email, password } = req.body || {};
    validateCredentials(email, password);

    const normalizedEmail = email.trim().toLowerCase();

    // Comprobar existencia previa
    const existing = await db.query('SELECT id FROM users WHERE email = $1', [normalizedEmail]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    await db.query(
      'INSERT INTO users (id, email, password_hash) VALUES ($1, $2, $3)',
      [userId, normalizedEmail, passwordHash]
    );

    const user = { id: userId, email: normalizedEmail };
    const accessToken = generateAccessToken(user);
    const refreshToken = await createRefreshToken(userId);

    return res.status(201).json({
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const result = await db.query('SELECT id, email, password_hash FROM users WHERE email = $1', [normalizedEmail]);

    if (result.rows.length === 0) {
      // Mensaje genérico para prevenir enumeración de usuarios
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const userRecord = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, userRecord.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = { id: userRecord.id, email: userRecord.email };
    const accessToken = generateAccessToken(user);
    const refreshToken = await createRefreshToken(user.id);

    return res.status(200).json({
      user: { id: user.id, email: user.email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
}

async function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(400).json({ error: 'Refresh token is required.' });
    }

    const tokens = await rotateRefreshToken(refreshToken);
    return res.status(200).json(tokens);
  } catch (err) {
    next(err);
  }
}

async function logout(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (refreshToken && typeof refreshToken === 'string') {
      await revokeRefreshToken(refreshToken);
    }
    return res.status(200).json({ message: 'Logged out successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  register,
  login,
  refresh,
  logout,
};
