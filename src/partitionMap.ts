import { Either } from './Either';

type PartitionMapResult<a, b> = {
  left: a[];
  right: b[];
};

export function partitionMap<a, b, c>(
  xs: a[],
  f: (value: a, index: number, array: a[]) => Either<b, c>
): PartitionMapResult<b, c> {
  const left: b[] = [];
  const right: c[] = [];
  xs.forEach((value, index, array) => {
    const either = f(value, index, array);
    if (either.isLeft) left.push(either.leftValue);
    else right.push(either.rightValue);
  });
  return { left, right };
}
