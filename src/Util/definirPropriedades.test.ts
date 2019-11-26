import { definirPropriedades } from './definirPropriedades';

test('definirPropriedades', () => {
  const a = { _y: 0, x: 27, y: 33 };
  const b = {
    get x() {
      return 42;
    }
  };
  const c = {
    _y: 3,
    get y() {
      return this._y - 1;
    },
    set y(_y) {
      this._y = _y + 1;
    }
  };
  definirPropriedades(a, b, c);

  expect(a.x).toBe(42);
  expect(() => {
    a.x = 3;
  }).toThrow();

  a.y = 42;
  expect(a.y).toBe(42);
  expect(a._y).toBe(43);
});
