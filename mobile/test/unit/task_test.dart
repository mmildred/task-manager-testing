import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/task.dart';

void main() {
  group('Task Model Unit Tests', () {
    test('parses a valid task', () {
      final task = Task.fromJson(const {'id': 'task-1', 'title': 'Plan tests'});
      expect(task.id, 'task-1');
      expect(task.title, 'Plan tests');
      expect(task.completed, false);
    });

    test('rejects an empty title', () {
      expect(
        () => Task.fromJson(const {'id': 'task-1', 'title': '   '}),
        throwsFormatException,
      );
    });

    // --- EJERCICIO PRÁCTICO 4 ---
    test('rejects a task when ID is missing or null', () {
      // Falta la clave 'id'
      expect(
        () => Task.fromJson(const {'title': 'Plan tests'}),
        throwsFormatException,
      );

      // 'id' es nulo
      expect(
        () => Task.fromJson(const {'id': null, 'title': 'Plan tests'}),
        throwsFormatException,
      );

      // 'id' es una cadena vacía
      expect(
        () => Task.fromJson(const {'id': '   ', 'title': 'Plan tests'}),
        throwsFormatException,
      );
    });

    test('accepts a valid title at maximum allowed length (120 characters)', () {
      final maxTitle = 'a' * 120;
      final task = Task.fromJson({'id': 'task-max', 'title': maxTitle});

      expect(task.title, maxTitle);
      expect(task.title.length, 120);
    });

    test('rejects a title longer than the limit (> 120 characters)', () {
      final overLimitTitle = 'a' * 121;
      expect(
        () => Task.fromJson({'id': 'task-over', 'title': overLimitTitle}),
        throwsFormatException,
      );
    });

    test('accepts a title at minimum allowed length (1 character)', () {
      final task = Task.fromJson(const {'id': 'task-min', 'title': 'z'});
      expect(task.title, 'z');
    });

    test('correctly serializes task to JSON', () {
      const task = Task(id: 't-123', title: 'Complete testing', completed: true);
      final json = task.toJson();

      expect(json['id'], 't-123');
      expect(json['title'], 'Complete testing');
      expect(json['completed'], true);
    });
  });
}
