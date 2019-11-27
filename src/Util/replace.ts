import { method } from 'adt-ts';

type Replacer = (...args: Array<string | number>) => string;

export function replace(matcher: string | RegExp, replaceValue: string): (text: string) => string;
export function replace(matcher: string | RegExp, replacer: Replacer): (text: string) => string;
export function replace(
  matcher: string | RegExp,
  replacer: string | Replacer
): (text: string) => string {
  return method<string, 'replace', [any, any]>('replace', matcher, replacer);
}
