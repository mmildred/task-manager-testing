import 'package:flutter/material.dart';

/// Shows tasks or the current loading, empty, or error state.
/// Incorporates accessibility (Semantics) and a retry button for error recovery.
class TaskListPanel extends StatelessWidget {
  /// Creates a task list panel.
  const TaskListPanel({
    super.key,
    required this.loading,
    required this.tasks,
    this.errorMessage,
    this.onRetry,
  });

  /// Whether tasks are being loaded.
  final bool loading;

  /// Task titles to display.
  final List<String> tasks;

  /// Optional safe error message.
  final String? errorMessage;

  /// Callback executed when the user taps the retry button (Ejercicio práctico 5).
  final VoidCallback? onRetry;

  @override
  Widget build(BuildContext context) {
    if (loading) {
      return const Center(
        child: CircularProgressIndicator(
          semanticsLabel: 'Cargando lista de tareas',
        ),
      );
    }

    if (errorMessage != null) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 12),
              Text(
                errorMessage!,
                textAlign: TextAlign.center,
                style: const TextStyle(fontSize: 16),
              ),
              if (onRetry != null) ...[
                const SizedBox(height: 16),
                ElevatedButton.icon(
                  key: const Key('retry-button'),
                  onPressed: onRetry,
                  icon: const Icon(Icons.refresh),
                  label: const Text('Reintentar'),
                  style: ElevatedButton.styleFrom(
                    minimumSize: const Size(120, 48), // Objetivo táctil accesible >= 48px
                  ),
                ),
              ],
            ],
          ),
        ),
      );
    }

    if (tasks.isEmpty) {
      return const Center(
        child: Text(
          'No tasks yet.',
          style: TextStyle(fontSize: 16, color: Colors.grey),
        ),
      );
    }

    return ListView.separated(
      itemCount: tasks.length,
      separatorBuilder: (_, __) => const Divider(height: 1),
      itemBuilder: (context, index) {
        final task = tasks[index];
        return ListTile(
          leading: const Icon(Icons.check_circle_outline),
          title: Text(
            task,
            style: const TextStyle(fontSize: 16),
          ),
        );
      },
    );
  }
}
