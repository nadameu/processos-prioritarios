import { Just, Nothing } from 'adt-ts';
import { index } from './index';

test('index', () => {
  const array = [1, 2, 3];

  expect(index(0)(array)).toEqual(Just(1));
  expect(index(9)(array)).toEqual(Nothing);
});
