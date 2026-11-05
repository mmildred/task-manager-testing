'use strict';

const { validateTitle } = require('../../src/tasks/validation');

describe('validateTitle', () => {
  test('trims a valid title', () => {
    expect(validateTitle('  Plan tests  ')).toBe('Plan tests');
  });

  test('rejects a blank title', () => {
    expect(() => validateTitle('   ')).toThrow('Enter a valid title.');
  });

  test('rejects a title longer than the limit', () => {
    expect(() => validateTitle('a'.repeat(121))).toThrow('Enter a valid title.');
  });

  // Ejercicio práctico 4: Título válido con la longitud máxima permitida (120 caracteres)
  test('accepts a valid title at maximum allowed length (120 characters)', () => {
    const maxTitle = 'a'.repeat(120);
    expect(validateTitle(maxTitle)).toBe(maxTitle);
    expect(validateTitle(maxTitle).length).toBe(120);
  });

  // Pruebas de límites y valores de equivalencia (Sección 8)
  test('accepts a valid title at minimum allowed length (1 character)', () => {
    expect(validateTitle('x')).toBe('x');
  });

  test('rejects non-string inputs (number, null, undefined, object, boolean)', () => {
    expect(() => validateTitle(42)).toThrow(TypeError);
    expect(() => validateTitle(null)).toThrow(TypeError);
    expect(() => validateTitle(undefined)).toThrow(TypeError);
    expect(() => validateTitle({})).toThrow(TypeError);
    expect(() => validateTitle(true)).toThrow(TypeError);
  });

  test('rejects empty string', () => {
    expect(() => validateTitle('')).toThrow(TypeError);
  });
});
