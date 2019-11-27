import { Just, Nothing } from 'adt-ts';
import { getAttribute } from './getAttribute';

test('getAttribute', () => {
  document.body.innerHTML = /*html*/ `<div id="div" custom="yes"></div>`;

  const div = document.getElementById('div') as HTMLDivElement;

  const getCustomAttribute = getAttribute('custom');
  expect(getCustomAttribute(div)).toEqual(Just('yes'));

  const getEmptyAttribute = getAttribute('empty');
  expect(getEmptyAttribute(div)).toEqual(Nothing);
});
