/// Converts a JSON object into a task value.
class Task {
  /// Creates a task.
  const Task({
    required this.id,
    required this.title,
    this.completed = false,
  });

  /// Unique server identifier.
  final String id;

  /// User-visible task title.
  final String title;

  /// Whether the task is marked as completed.
  final bool completed;

  /// Parses a task from JSON.
  ///
  /// Throws [FormatException] when required fields are missing or invalid.
  factory Task.fromJson(Map<String, dynamic> json) {
    final id = json['id'];
    final title = json['title'];

    if (id is! String || id.trim().isEmpty) {
      throw const FormatException('Invalid task data: missing or invalid ID.');
    }

    if (title is! String || title.trim().isEmpty) {
      throw const FormatException('Invalid task data: missing or invalid title.');
    }

    final trimmedTitle = title.trim();
    if (trimmedTitle.length > 120) {
      throw const FormatException('Invalid task data: title exceeds maximum length of 120 characters.');
    }

    return Task(
      id: id,
      title: trimmedTitle,
      completed: json['completed'] == true,
    );
  }

  /// Converts task to JSON map.
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'title': title,
      'completed': completed,
    };
  }
}
