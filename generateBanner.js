import { stringify } from 'userscript-meta';
import data from './metadata';
import pkg from './package.json';

export function generateBanner() {
  const { version, description, author } = pkg;
  return stringify({
    name: description,
    version,
    author,
    ...data,
  });
}
