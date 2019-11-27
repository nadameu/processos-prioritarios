import { parseDataHora } from './parseDataHora';
import { Just, Nothing } from 'adt-ts';

test('Data correta', () => {
  expect(parseDataHora('04/03/2017 08:30:22')).toEqual(Just(new Date(2017, 2, 4, 8, 30, 22)));
});

test('Formato desconhecido', () => {
  expect(parseDataHora('04-03-2017 08:30:22')).toEqual(Nothing);
  expect(parseDataHora('04/03/17 08:30:22')).toEqual(Nothing);
});

test('Somente data', () => {
  expect(parseDataHora('04/03/2017')).toEqual(Nothing);
});

test('Data incorreta', () => {
  expect(parseDataHora('Não é uma data válida')).toEqual(Nothing);
});

test('Datas inválidas', () => {
  expect(parseDataHora('32/12/1999 23:59:59')).toEqual(Nothing);
  expect(parseDataHora('31/13/1999 23:59:59')).toEqual(Nothing);
  expect(parseDataHora('31/12/1999 24:59:59')).toEqual(Nothing);
  expect(parseDataHora('31/12/1999 23:60:59')).toEqual(Nothing);
  expect(parseDataHora('31/12/1999 23:59:60')).toEqual(Nothing);
});
