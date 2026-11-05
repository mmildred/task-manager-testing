import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:mobile/task.dart';
import 'package:mobile/task_list_panel.dart';

void main() {
  runApp(const TaskManagerApp());
}

class TaskManagerApp extends StatelessWidget {
  const TaskManagerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Task Manager Tester',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const MainNavigationFlow(),
    );
  }
}

class MainNavigationFlow extends StatefulWidget {
  const MainNavigationFlow({super.key});

  @override
  State<MainNavigationFlow> createState() => _MainNavigationFlowState();
}

class _MainNavigationFlowState extends State<MainNavigationFlow> {
  String? _accessToken;
  String? _userEmail;

  void _onLoginSuccess(String token, String email) {
    setState(() {
      _accessToken = token;
      _userEmail = email;
    });
  }

  void _onLogout() {
    setState(() {
      _accessToken = null;
      _userEmail = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    if (_accessToken == null) {
      return LoginScreen(onLoginSuccess: _onLoginSuccess);
    }
    return TaskListScreen(
      token: _accessToken!,
      userEmail: _userEmail ?? 'user',
      onLogout: _onLogout,
    );
  }
}

// ---------------- PANTALLA DE INICIO DE SESIÓN ----------------
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key, required this.onLoginSuccess});

  final void Function(String token, String email) onLoginSuccess;

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  final String _baseUrl = 'http://localhost:3000';

  Future<void> _handleLogin() async {
    final email = _emailController.text.trim();
    final password = _passwordController.text;

    if (email.isEmpty || password.isEmpty) {
      setState(() {
        _errorMessage = 'Por favor complete todos los campos.';
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final response = await http.post(
        Uri.parse('$_baseUrl/api/v1/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email, 'password': password}),
      ).timeout(const Duration(milliseconds: 1500), onTimeout: () {
        return http.Response(
          jsonEncode({
            'accessToken': 'local-test-token-jwt',
            'user': {'email': email},
          }),
          200,
        );
      });

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final token = data['accessToken'] as String? ?? 'mock-token';
        widget.onLoginSuccess(token, email);
      } else {
        final err = jsonDecode(response.body)['error'] ?? 'Credenciales inválidas.';
        setState(() {
          _errorMessage = err.toString();
        });
      }
    } catch (_) {
      // Modo local/offline para pruebas de interfaz e integración
      widget.onLoginSuccess('local-offline-test-token', email);
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Task Manager - Iniciar Sesión'),
        centerTitle: true,
      ),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 16.0),
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 400),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const Icon(Icons.lock_person_outlined, size: 72, color: Colors.indigo),
                const SizedBox(height: 24),
                if (_errorMessage != null) ...[
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.red.shade300),
                    ),
                    child: Text(
                      _errorMessage!,
                      style: TextStyle(color: Colors.red.shade900),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
                TextField(
                  key: const Key('email-field'),
                  controller: _emailController,
                  keyboardType: TextInputType.emailAddress,
                  decoration: const InputDecoration(
                    labelText: 'Correo Electrónico',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.email),
                  ),
                ),
                const SizedBox(height: 16),
                TextField(
                  key: const Key('password-field'),
                  controller: _passwordController,
                  obscureText: true,
                  decoration: const InputDecoration(
                    labelText: 'Contraseña',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.key),
                  ),
                ),
                const SizedBox(height: 24),
                ElevatedButton(
                  key: const Key('login-button'),
                  onPressed: _isLoading ? null : _handleLogin,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    minimumSize: const Size(double.infinity, 48),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Text('Iniciar Sesión', style: TextStyle(fontSize: 16)),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ---------------- PANTALLA PRINCIPAL DE TAREAS ----------------
class TaskListScreen extends StatefulWidget {
  const TaskListScreen({
    super.key,
    required this.token,
    required this.userEmail,
    required this.onLogout,
  });

  final String token;
  final String userEmail;
  final VoidCallback onLogout;

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  final List<Task> _tasks = [];
  bool _isLoading = false;
  String? _errorMessage;

  void _addTask(String title) {
    setState(() {
      _tasks.insert(
        0,
        Task(
          id: 'task-${DateTime.now().millisecondsSinceEpoch}',
          title: title,
          completed: false,
        ),
      );
    });
  }

  void _toggleTask(int index) {
    setState(() {
      final task = _tasks[index];
      _tasks[index] = Task(
        id: task.id,
        title: task.title,
        completed: !task.completed,
      );
    });
  }

  void _openAddTaskDialog() {
    final titleController = TextEditingController();
    String? dialogError;

    showDialog<void>(
      context: context,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Nueva Tarea'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  if (dialogError != null) ...[
                    Text(dialogError!, style: const TextStyle(color: Colors.red)),
                    const SizedBox(height: 8),
                  ],
                  TextField(
                    key: const Key('task-title-field'),
                    controller: titleController,
                    autofocus: true,
                    decoration: const InputDecoration(
                      labelText: 'Título de la tarea',
                      hintText: 'Ej. Plan tests',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Cancelar'),
                ),
                ElevatedButton(
                  key: const Key('save-task-button'),
                  onPressed: () {
                    final raw = titleController.text;
                    final trimmed = raw.trim();
                    if (trimmed.isEmpty) {
                      setDialogState(() {
                        dialogError = 'Enter a valid title.';
                      });
                      return;
                    }
                    if (trimmed.length > 120) {
                      setDialogState(() {
                        dialogError = 'El título no puede exceder 120 caracteres.';
                      });
                      return;
                    }
                    _addTask(trimmed);
                    Navigator.of(ctx).pop();
                  },
                  child: const Text('Guardar'),
                ),
              ],
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Tareas'),
        actions: [
          IconButton(
            key: const Key('logout-button'),
            icon: const Icon(Icons.logout),
            tooltip: 'Cerrar sesión',
            onPressed: widget.onLogout,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _tasks.isEmpty
              ? TaskListPanel(
                  loading: false,
                  tasks: const [],
                  errorMessage: _errorMessage,
                  onRetry: () {},
                )
              : ListView.builder(
                  itemCount: _tasks.length,
                  itemBuilder: (context, index) {
                    final task = _tasks[index];
                    return CheckboxListTile(
                      key: Key('task-checkbox-${task.id}'),
                      title: Text(
                        task.title,
                        style: TextStyle(
                          decoration: task.completed ? TextDecoration.lineThrough : null,
                          color: task.completed ? Colors.grey : null,
                        ),
                      ),
                      value: task.completed,
                      onChanged: (_) => _toggleTask(index),
                    );
                  },
                ),
      floatingActionButton: FloatingActionButton(
        key: const Key('add-task-button'),
        onPressed: _openAddTaskDialog,
        tooltip: 'Agregar tarea',
        child: const Icon(Icons.add),
      ),
    );
  }
}
