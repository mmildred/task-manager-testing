'use strict';

const crypto = require('crypto');
const db = require('../db/db');
const { validateTitle } = require('./validation');

/**
 * Valida un ID de tarea básico (formato UUID o no vacío).
 */
function isValidTaskId(id) {
  if (typeof id !== 'string') return false;
  const trimmed = id.trim();
  // Acepta UUID estándar o identificador alfanumérico seguro
  return /^[a-zA-Z0-9_-]{1,64}$/.test(trimmed);
}

/**
 * POST /api/v1/tasks
 * Crea una nueva tarea asociada estrictamente al usuario autenticado (req.user.id).
 * Ignora cualquier ownerId enviado en el body (OWASP BOLA y Mass Assignment prevention).
 */
async function createTask(req, res, next) {
  try {
    const { title, completed } = req.body || {};

    let validatedTitle;
    try {
      validatedTitle = validateTitle(title);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    const taskId = crypto.randomUUID();
    const ownerId = req.user.id; // Se deriva del token seguro, NO del body

    const result = await db.query(
      'INSERT INTO tasks (id, owner_id, title, completed) VALUES ($1, $2, $3, $4)',
      [taskId, ownerId, validatedTitle, Boolean(completed)]
    );

    const created = result.rows[0];
    return res.status(201).json({
      id: created.id,
      title: created.title,
      completed: created.completed,
      createdAt: created.created_at,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks
 * Lista únicamente las tareas del usuario autenticado.
 */
async function listTasks(req, res, next) {
  try {
    const ownerId = req.user.id;
    const result = await db.query(
      'SELECT id, title, completed, created_at, updated_at FROM tasks WHERE owner_id = $1',
      [ownerId]
    );

    return res.status(200).json(result.rows);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/tasks/:id
 * Obtiene una tarea por ID verificando que pertenezca al usuario autenticado.
 * Retorna 404 si no existe o si pertenece a otro usuario (no divulga existencia ajena).
 */
async function getTask(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidTaskId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }

    const result = await db.query(
      'SELECT id, owner_id, title, completed, created_at, updated_at FROM tasks WHERE id = $1 AND owner_id = $2',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      // Política consistente: 404 (o 403) para no filtrar metadatos de otros usuarios
      return res.status(404).json({ error: 'Task not found.' });
    }

    const task = result.rows[0];
    return res.status(200).json({
      id: task.id,
      title: task.title,
      completed: task.completed,
      createdAt: task.created_at,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/tasks/:id
 * Actualiza una tarea asegurando que el ownerId del servidor permanezca intacto.
 * Cualquier parámetro `ownerId` o `owner_id` en el body es ignorado o rechazado.
 */
async function updateTask(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidTaskId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }

    const { title, completed } = req.body || {};

    let validatedTitle;
    try {
      validatedTitle = validateTitle(title);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }

    // Buscamos primero la tarea para verificar propiedad
    const existing = await db.query('SELECT id, owner_id FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    // Verificación de propiedad (Authorization boundary)
    if (existing.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this task.' });
    }

    // Actualización manteniendo estrictamente req.user.id como propietario
    const result = await db.query(
      'UPDATE tasks SET title = $1, completed = $2 WHERE id = $3 AND owner_id = $4',
      [validatedTitle, Boolean(completed), id, req.user.id]
    );

    const updated = result.rows[0];
    return res.status(200).json({
      id: updated.id,
      title: updated.title,
      completed: updated.completed,
      updatedAt: updated.updated_at,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/v1/tasks/:id
 * Elimina una tarea si pertenece al usuario autenticado.
 */
async function deleteTask(req, res, next) {
  try {
    const { id } = req.params;

    if (!isValidTaskId(id)) {
      return res.status(400).json({ error: 'Invalid task ID format.' });
    }

    const existing = await db.query('SELECT id, owner_id FROM tasks WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    if (existing.rows[0].owner_id !== req.user.id) {
      return res.status(403).json({ error: 'Access forbidden: You do not own this task.' });
    }

    await db.query('DELETE FROM tasks WHERE id = $1 AND owner_id = $2', [id, req.user.id]);
    return res.status(200).json({ message: 'Task deleted successfully.' });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
};
