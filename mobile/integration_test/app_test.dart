import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:mobile/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('complete user journey: login -> create task -> mark complete -> logout (Ejercicio 7)', (tester) async {
    app.main();
    await tester.pumpAndSettle();

    // Paso 1: Ingresar credenciales sintéticas de prueba
    await tester.enterText(find.byKey(const Key('email-field')), 'tester@example.test');
    await tester.enterText(find.byKey(const Key('password-field')), 'local-test-password');
    await tester.tap(find.byKey(const Key('login-button')));
    await tester.pumpAndSettle();

    // Verificar que estamos en la pantalla de tareas
    expect(find.text('Mis Tareas'), findsOneWidget);

    // Paso 2: Abrir modal y crear una nueva tarea
    await tester.tap(find.byKey(const Key('add-task-button')));
    await tester.pumpAndSettle();

    await tester.enterText(find.byKey(const Key('task-title-field')), 'Check release flow');
    await tester.tap(find.byKey(const Key('save-task-button')));
    await tester.pumpAndSettle();

    // Confirmar que la tarea aparece en la lista
    expect(find.text('Check release flow'), findsOneWidget);

    // Paso 3 (Ejercicio 7): Marcar la tarea como completada
    final checkboxFinder = find.byType(CheckboxListTile);
    expect(checkboxFinder, findsOneWidget);
    await tester.tap(checkboxFinder);
    await tester.pumpAndSettle();

    // Paso 4 (Ejercicio 7): Cerrar sesión
    final logoutFinder = find.byKey(const Key('logout-button'));
    expect(logoutFinder, findsOneWidget);
    await tester.tap(logoutFinder);
    await tester.pumpAndSettle();

    // Paso 5 (Ejercicio 7): Verificar que la pantalla de inicio de sesión vuelve a aparecer
    expect(find.byKey(const Key('login-button')), findsOneWidget);
    expect(find.byKey(const Key('email-field')), findsOneWidget);
  });
}
