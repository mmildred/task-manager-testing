import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile/task_list_panel.dart';

void main() {
  group('TaskListPanel Widget Tests', () {
    testWidgets('shows loading state with circular indicator', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TaskListPanel(loading: true, tasks: []),
          ),
        ),
      );

      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('shows empty state when list has no tasks', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TaskListPanel(loading: false, tasks: []),
          ),
        ),
      );

      expect(find.text('No tasks yet.'), findsOneWidget);
    });

    testWidgets('shows error state message', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TaskListPanel(
              loading: false,
              tasks: [],
              errorMessage: 'Could not load tasks.',
            ),
          ),
        ),
      );

      expect(find.text('Could not load tasks.'), findsOneWidget);
    });

    testWidgets('shows task data correctly', (tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: Scaffold(
            body: TaskListPanel(
              loading: false,
              tasks: ['Plan tests', 'Execute Jest tests', 'Review OWASP checks'],
            ),
          ),
        ),
      );

      expect(find.text('Plan tests'), findsOneWidget);
      expect(find.text('Execute Jest tests'), findsOneWidget);
      expect(find.text('Review OWASP checks'), findsOneWidget);
    });

    // --- EJERCICIO PRÁCTICO 5 ---
    testWidgets('shows retry button on error state and tapping it invokes callback exactly once', (tester) async {
      int retryInvocationCount = 0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TaskListPanel(
              loading: false,
              tasks: const [],
              errorMessage: 'Connection lost. Please retry.',
              onRetry: () {
                retryInvocationCount++;
              },
            ),
          ),
        ),
      );

      // Verificar que el botón de reintentar es visible
      final retryButtonFinder = find.byKey(const Key('retry-button'));
      expect(retryButtonFinder, findsOneWidget);
      expect(find.text('Reintentar'), findsOneWidget);
      expect(retryInvocationCount, 0);

      // Simular tap del usuario
      await tester.tap(retryButtonFinder);
      await tester.pump();

      // Verificar que la función de retorno fue invocada exactamente una vez
      expect(retryInvocationCount, 1);
    });
  });
}
