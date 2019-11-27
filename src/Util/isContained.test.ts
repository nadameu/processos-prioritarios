import { isContained } from './isContained';

test('Igual', () => {
  expect(isContained('abc', 'abc')).toBe(true);
});

test('Com caracteres extras', () => {
  expect(isContained('abc', 'antes abc depois')).toBe(true);
});

test('Abreviações', () => {
  expect(isContained('a.b/c', 'a b c')).toBe(true);
});

test('Uma letra faltando', () => {
  expect(isContained('abc', 'aaaaaabbbbbdddd')).toBe(false);
});
