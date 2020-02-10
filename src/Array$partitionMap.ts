import { Either } from './Either';

export function Array$partitionMap<a, b, c>(
  xs: a[],
  f: (_: a) => Either<b, c>
): { left: b[]; right: c[] } {
  const left: b[] = [];
  const right: c[] = [];
  for (const x of xs) {
    const either = f(x);
    if (either.isLeft) left.push(either.leftValue);
    else right.push(either.rightValue);
  }
  return { left, right };
}
