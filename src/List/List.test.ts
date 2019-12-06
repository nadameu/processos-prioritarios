import { pipe } from 'adt-ts';
import { List } from './index';
import { Maybe } from '../Maybe';

test('List.fromArray / List.toArray', () => {
  const f = pipe(List.fromArray, List.toArray);
  expect(f([])).toEqual([]);
  expect(f([1, 2, 3])).toEqual([1, 2, 3]);
});

test('List.fromIterable', () => {
  const f = pipe(List.fromIterable, List.toArray);
  expect(f([])).toEqual([]);
  expect(f([1, 2, 3])).toEqual([1, 2, 3]);
});

test('List.drop', () => {
  const f = (index: number) => (array: number[]) =>
    List.toArray(List.drop(List.fromArray(array) as List<number>, index));
  const g = (index: number) => (array: number[]) => array.slice(Math.max(0, index));
  const vazio: number[] = [];
  const array = [1, 2, 3];
  for (const index of [-1, 0, 1, 2, 3, 4]) {
    const fi = f(index);
    const gi = g(index);
    expect(fi(vazio)).toEqual(gi(vazio));
    expect(fi(array)).toEqual(gi(array));
  }
});

test('List.index', () => {
  const f = (array: number[]) => (index: number) => pipe(List.fromArray, List.index(index))(array);
  const g: (array: number[]) => (index: number) => Maybe<number> = array => index =>
    Maybe.fromNullable(array[index]);

  const f1 = f([]);
  const g1 = g([]);
  for (const i of [-1, 0, 1]) {
    expect(f1(i)).toEqual(g1(i));
  }

  const f2 = f([1, 2, 3]);
  const g2 = g([1, 2, 3]);
  for (const i of [-1, 0, 1, 2, 3]) {
    expect(f2(i)).toEqual(g2(i));
  }
});

test('List.filter', () => {
  const array = [1, 2, 3, 4, 5, 6];
  const p = (x: number) => x % 2 === 0;
  const f: (_: number[]) => number[] = pipe(List.fromArray, List.filter(p), List.toArray);
  const g = (xs: number[]) => xs.filter(p);
  expect(f(array)).toEqual(g(array));
});
