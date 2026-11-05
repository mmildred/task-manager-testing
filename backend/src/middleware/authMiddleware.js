'use strict';

const jwt = require('jsonwebtoken');
const { ACCESS_TOKEN_SECRET } = require('../auth/tokens');

/**
 * Middleware para validar el JWT de acceso.
 * Devuelve 401 si no está autenticado o el token es inválido/expirado.
 */
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const token = authHeader.substring(7).trim();

  try {
    const payload = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = {
      id: payload.sub,
      email: payload.email,
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired.' });
    }
    return res.status(401).json({ error: 'Invalid token.' });
  }
}

module.exports = { requireAuth };
