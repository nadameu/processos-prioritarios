import { Object$sequenceArray } from './Object$sequenceArray';

export function Promise$allErrors<a, b, c, d, e, f, g, h, i, j>(
  values: readonly [
    Resolvable<a>,
    Resolvable<b>,
    Resolvable<c>,
    Resolvable<d>,
    Resolvable<e>,
    Resolvable<f>,
    Resolvable<g>,
    Resolvable<h>,
    Resolvable<i>,
    Resolvable<j>
  ]
): Promise<[a, b, c, d, e, f, g, h, i, j]>;
export function Promise$allErrors<a, b, c, d, e, f, g, h, i>(
  values: readonly [
    Resolvable<a>,
    Resolvable<b>,
    Resolvable<c>,
    Resolvable<d>,
    Resolvable<e>,
    Resolvable<f>,
    Resolvable<g>,
    Resolvable<h>,
    Resolvable<i>
  ]
): Promise<[a, b, c, d, e, f, g, h, i]>;
export function Promise$allErrors<a, b, c, d, e, f, g, h>(
  values: readonly [
    Resolvable<a>,
    Resolvable<b>,
    Resolvable<c>,
    Resolvable<d>,
    Resolvable<e>,
    Resolvable<f>,
    Resolvable<g>,
    Resolvable<h>
  ]
): Promise<[a, b, c, d, e, f, g, h]>;
export function Promise$allErrors<a, b, c, d, e, f, g>(
  values: readonly [
    Resolvable<a>,
    Resolvable<b>,
    Resolvable<c>,
    Resolvable<d>,
    Resolvable<e>,
    Resolvable<f>,
    Resolvable<g>
  ]
): Promise<[a, b, c, d, e, f, g]>;
export function Promise$allErrors<a, b, c, d, e, f>(
  values: readonly [
    Resolvable<a>,
    Resolvable<b>,
    Resolvable<c>,
    Resolvable<d>,
    Resolvable<e>,
    Resolvable<f>
  ]
): Promise<[a, b, c, d, e, f]>;
export function Promise$allErrors<a, b, c, d, e>(
  values: readonly [Resolvable<a>, Resolvable<b>, Resolvable<c>, Resolvable<d>, Resolvable<e>]
): Promise<[a, b, c, d, e]>;
export function Promise$allErrors<a, b, c, d>(
  values: readonly [Resolvable<a>, Resolvable<b>, Resolvable<c>, Resolvable<d>]
): Promise<[a, b, c, d]>;
export function Promise$allErrors<a, b, c>(
  values: readonly [Resolvable<a>, Resolvable<b>, Resolvable<c>]
): Promise<[a, b, c]>;
export function Promise$allErrors<a, b>(
  values: readonly [Resolvable<a>, Resolvable<b>]
): Promise<[a, b]>;
export function Promise$allErrors<a>(values: readonly Resolvable<a>[]): Promise<a[]>;
export async function Promise$allErrors<a>(values: readonly Resolvable<a>[]): Promise<a[]> {
  let hasErrors = false;
  const left = Array(values.length) as any[];
  const right = Array(values.length) as a[];
  await Promise.all(
    values.map((p, i) =>
      Promise.resolve(p).then(
        value => {
          right[i] = value;
        },
        reason => {
          hasErrors = true;
          left[i] = reason;
        }
      )
    )
  );
  return hasErrors
    ? Promise.reject(/* Mantém apenas índices não vazios */ left.filter(_ => true))
    : Promise.resolve(right);
}
