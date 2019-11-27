import { replace } from './replace';

test('string -> string', () => {
  expect(replace('a', 'b')('aaa')).toEqual('baa');
});

test('re -> string', () => {
  expect(replace(/a/, 'b')('aaa')).toEqual('baa');
});

test('re (multi) -> string', () => {
  expect(replace(/a/g, 'b')('aaa')).toEqual('bbb');
});

test('string -> fn', () => {
  expect(
    replace('a', (match, index, fullstring) => `(${match}, ${index}, ${fullstring})`)('aaa')
  ).toEqual('(a, 0, aaa)aa');
});

test('re -> fn', () => {
  expect(
    replace(/a/, (match, index, fullstring) => `(${match}, ${index}, ${fullstring})`)('aaa')
  ).toEqual('(a, 0, aaa)aa');
});

test('re (multi) -> fn', () => {
  expect(
    replace(/a/g, (match, index, fullstring) => `(${match}, ${index}, ${fullstring})`)('aaa')
  ).toEqual('(a, 0, aaa)(a, 1, aaa)(a, 2, aaa)');
});

test('re (group) -> fn', () => {
  expect(
    replace(
      /a(a)a/,
      (match, group0, index, fullstring) => `(${match}, ${group0}, ${index}, ${fullstring})`
    )('aaa aaa aaa')
  ).toEqual('(aaa, a, 0, aaa aaa aaa) aaa aaa');
});
