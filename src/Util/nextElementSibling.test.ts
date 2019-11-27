import { nextElementSibling } from './nextElementSibling';
import { Nothing, Just } from 'adt-ts';

test('Inexistente', () => {
  document.body.innerHTML = '';

  const div = document.createElement('div');
  document.body.appendChild(div);

  const texto = document.createTextNode('texto');
  document.body.appendChild(texto);

  expect(nextElementSibling(div)).toEqual(Nothing);

  expect(nextElementSibling(texto)).toEqual(Nothing);
});

test('Existente', () => {
  document.body.innerHTML = '';

  const div = document.createElement('div');
  document.body.appendChild(div);

  const texto = document.createTextNode('texto');
  document.body.appendChild(texto);

  const span = document.createElement('span');
  document.body.appendChild(span);

  expect(nextElementSibling(div)).toEqual(Just(span));

  expect(nextElementSibling(texto)).toEqual(Just(span));
});
