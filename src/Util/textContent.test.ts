import { Just, Nothing } from 'adt-ts';
import { textContent } from './textContent';

test('Texto válido', () => {
  document.body.textContent = 'Texto.';
  expect(textContent(document.body)).toEqual(Just('Texto.'));
});

test('Texto com espaços', () => {
  document.body.textContent = ' \t  Texto.   \t';
  expect(textContent(document.body)).toEqual(Just('Texto.'));
});

test('Vazio', () => {
  document.body.textContent = '';
  expect(textContent(document.body)).toEqual(Nothing);
});

test('Somente espaços', () => {
  document.body.textContent = ' \n \t ';
  expect(textContent(document.body)).toEqual(Nothing);
});
