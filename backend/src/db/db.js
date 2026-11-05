'use strict';

const crypto = require('crypto');
const { Pool } = require('pg');

let pool = null;

// Entorno de memoria aislado para pruebas deterministas y rápidas
const memoryStore = {
  users: new Map(),
  refreshTokens: new Map(),
  tasks: new Map(),
};

function isPostgresConfigured() {
  return process.env.USE_POSTGRES === 'true' && Boolean(process.env.DATABASE_URL || process.env.PGHOST);
}

if (isPostgresConfigured()) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    host: process.env.PGHOST,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
    database: process.env.PGDATABASE,
    port: process.env.PGPORT ? Number(process.env.PGPORT) : 5432,
    max: 10,
    idleTimeoutMillis: 30000,
  });
}

/**
 * Ejecuta una consulta a base de datos.
 * Utiliza PostgreSQL real si está configurado, o el motor aislado en memoria para pruebas.
 */
async function query(text, params = []) {
  if (pool) {
    return pool.query(text, params);
  }

  // Simulación segura para pruebas en memoria
  const normalized = text.trim().toLowerCase();

  // USERS QUERIES
  if (normalized.startsWith('insert into users')) {
    const [id, email, passwordHash] = params;
    // Verificar unicidad de email
    for (const u of memoryStore.users.values()) {
      if (u.email === email) {
        const err = new Error('duplicate key value violates unique constraint');
        err.code = '23505';
        throw err;
      }
    }
    const user = { id, email, password_hash: passwordHash, created_at: new Date() };
    memoryStore.users.set(id, user);
    return { rows: [user], rowCount: 1 };
  }

  if (normalized.startsWith('select') && normalized.includes('from users where email =')) {
    const [email] = params;
    const found = Array.from(memoryStore.users.values()).find(u => u.email === email);
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  if (normalized.startsWith('select') && normalized.includes('from users where id =')) {
    const [id] = params;
    const found = memoryStore.users.get(id);
    return { rows: found ? [found] : [], rowCount: found ? 1 : 0 };
  }

  // REFRESH TOKENS QUERIES
  if (normalized.startsWith('insert into refresh_tokens')) {
    const [id, userId, tokenHash, expiresAt] = params;
    const tokenRecord = { id, user_id: userId, token_hash: tokenHash, revoked: false, expires_at: new Date(expiresAt), created_at: new Date() };
    memoryStore.refreshTokens.set(tokenHash, tokenRecord);
    return { rows: [tokenRecord], rowCount: 1 };
  }

  if (normalized.startsWith('select') && normalized.includes('from refresh_tokens where token_hash =')) {
    const [tokenHash] = params;
    const tokenRecord = memoryStore.refreshTokens.get(tokenHash);
    return { rows: tokenRecord ? [tokenRecord] : [], rowCount: tokenRecord ? 1 : 0 };
  }

  if (normalized.startsWith('update refresh_tokens set revoked = true where token_hash =')) {
    const [tokenHash] = params;
    const tokenRecord = memoryStore.refreshTokens.get(tokenHash);
    if (tokenRecord) {
      tokenRecord.revoked = true;
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  if (normalized.startsWith('update refresh_tokens set revoked = true where user_id =')) {
    const [userId] = params;
    let count = 0;
    for (const record of memoryStore.refreshTokens.values()) {
      if (record.user_id === userId) {
        record.revoked = true;
        count++;
      }
    }
    return { rowCount: count };
  }

  // TASKS QUERIES
  if (normalized.startsWith('insert into tasks')) {
    const [id, ownerId, title, completed] = params;
    const task = {
      id,
      owner_id: ownerId,
      title,
      completed: Boolean(completed),
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.tasks.set(id, task);
    return { rows: [task], rowCount: 1 };
  }

  if (normalized.startsWith('select') && normalized.includes('from tasks where owner_id =')) {
    const [ownerId] = params;
    const tasks = Array.from(memoryStore.tasks.values())
      .filter(t => t.owner_id === ownerId)
      .sort((a, b) => b.created_at - a.created_at);
    return { rows: tasks, rowCount: tasks.length };
  }

  if (normalized.startsWith('select') && normalized.includes('from tasks where id =') && normalized.includes('owner_id =')) {
    const [id, ownerId] = params;
    const task = memoryStore.tasks.get(id);
    if (task && task.owner_id === ownerId) {
      return { rows: [task], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (normalized.startsWith('select') && normalized.includes('from tasks where id =')) {
    const [id] = params;
    const task = memoryStore.tasks.get(id);
    return { rows: task ? [task] : [], rowCount: task ? 1 : 0 };
  }

  if (normalized.startsWith('update tasks') && normalized.includes('where id =') && normalized.includes('owner_id =')) {
    const [title, completed, id, ownerId] = params;
    const task = memoryStore.tasks.get(id);
    if (task && task.owner_id === ownerId) {
      task.title = title;
      task.completed = Boolean(completed);
      task.updated_at = new Date();
      return { rows: [task], rowCount: 1 };
    }
    return { rows: [], rowCount: 0 };
  }

  if (normalized.startsWith('delete from tasks where id =') && normalized.includes('owner_id =')) {
    const [id, ownerId] = params;
    const task = memoryStore.tasks.get(id);
    if (task && task.owner_id === ownerId) {
      memoryStore.tasks.delete(id);
      return { rowCount: 1 };
    }
    return { rowCount: 0 };
  }

  return { rows: [], rowCount: 0 };
}

/**
 * Limpia la base de datos de pruebas para aislar cada caso de prueba.
 */
async function resetDatabase() {
  if (pool) {
    await pool.query('TRUNCATE users, refresh_tokens, tasks CASCADE;');
  } else {
    memoryStore.users.clear();
    memoryStore.refreshTokens.clear();
    memoryStore.tasks.clear();
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
  }
}

module.exports = {
  query,
  resetDatabase,
  closePool,
  memoryStore,
};
