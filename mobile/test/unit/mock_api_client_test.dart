import 'dart:convert';
import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:mobile/task.dart';

/// Cliente API desacoplado para pruebas con soporte a clientes HTTP inyectados.
class TaskApiClient {
  TaskApiClient({required this.client, required this.baseUrl});

  final http.Client client;
  final String baseUrl;

  Future<List<Task>> fetchTasks(String token) async {
    final response = await client.get(
      Uri.parse('$baseUrl/api/v1/tasks'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((item) => Task.fromJson(item as Map<String, dynamic>)).toList();
    } else if (response.statusCode == 401) {
      throw Exception('Unauthorized');
    } else {
      throw Exception('Server error: ${response.statusCode}');
    }
  }

  Future<Task> createTask(String token, String title) async {
    final response = await client.post(
      Uri.parse('$baseUrl/api/v1/tasks'),
      headers: {
        'Authorization': 'Bearer $token',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'title': title}),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body) as Map<String, dynamic>;
      return Task.fromJson(data);
    } else if (response.statusCode == 400) {
      throw const FormatException('Enter a valid title.');
    } else {
      throw Exception('Failed to create task');
    }
  }
}

// --- EJERCICIO PRÁCTICO 15: Pruebas con Cliente Mockeado ---
void main() {
  group('Mocked TaskApiClient Tests (Ejercicio 15)', () {
    test('fetches tasks successfully using mocked HTTP client', () async {
      final mockClient = MockClient((request) async {
        expect(request.url.path, '/api/v1/tasks');
        expect(request.headers['Authorization'], 'Bearer mock-test-token');

        return http.Response(
          jsonEncode([
            {'id': 'task-101', 'title': 'Prueba mockeada rápida', 'completed': false},
            {'id': 'task-102', 'title': 'Verificar serialización', 'completed': true},
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = TaskApiClient(client: mockClient, baseUrl: 'http://localhost:3000');
      final tasks = await apiClient.fetchTasks('mock-test-token');

      expect(tasks.length, 2);
      expect(tasks[0].id, 'task-101');
      expect(tasks[0].title, 'Prueba mockeada rápida');
      expect(tasks[1].completed, true);
    });

    test('handles 401 Unauthorized cleanly with mock client', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'error': 'Token expired.'}),
          401,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = TaskApiClient(client: mockClient, baseUrl: 'http://localhost:3000');

      expect(
        () => apiClient.fetchTasks('expired-token'),
        throwsA(isA<Exception>().having((e) => e.toString(), 'message', contains('Unauthorized'))),
      );
    });

    test('handles 400 Bad Request on invalid creation with mock client', () async {
      final mockClient = MockClient((request) async {
        return http.Response(
          jsonEncode({'error': 'Enter a valid title.'}),
          400,
          headers: {'content-type': 'application/json'},
        );
      });

      final apiClient = TaskApiClient(client: mockClient, baseUrl: 'http://localhost:3000');

      expect(
        () => apiClient.createTask('valid-token', '   '),
        throwsFormatException,
      );
    });
  });
}
