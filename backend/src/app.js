'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const { requireAuth } = require('./middleware/authMiddleware');
const authController = require('./auth/auth.controller');
const taskController = require('./tasks/task.controller');

const app = express();

// Seguridad de encabezados HTTP (OWASP)
app.use(helmet());
app.use(cors());

// Limitar tamaño de payload a 10kb para mitigar DoS
app.use(express.json({ limit: '10kb' }));

// Health check endpoint (usado para k6 y comprobaciones rápidas)
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Rutas de autenticación
app.post('/api/v1/auth/register', authController.register);
app.post('/api/v1/auth/login', authController.login);
app.post('/api/v1/auth/refresh', authController.refresh);
app.post('/api/v1/auth/logout', authController.logout);

// Rutas protegidas de tareas
app.post('/api/v1/tasks', requireAuth, taskController.createTask);
app.get('/api/v1/tasks', requireAuth, taskController.listTasks);
app.get('/api/v1/tasks/:id', requireAuth, taskController.getTask);
app.put('/api/v1/tasks/:id', requireAuth, taskController.updateTask);
app.delete('/api/v1/tasks/:id', requireAuth, taskController.deleteTask);

// Manejador centralizado de errores seguro (no divulga stack traces al cliente)
app.use((err, req, res, next) => {
  const status = err.status || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message;
  res.status(status).json({ error: message });
});

module.exports = { app };
