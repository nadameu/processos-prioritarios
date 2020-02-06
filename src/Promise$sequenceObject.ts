type SequencePromisesObjectResult<T> = {
  [key in keyof T]: T[key] extends Thenable<infer U> ? U : T[key];
};

export async function Promise$sequenceObject<T extends { [key: string]: unknown }>(
  obj: T
): Promise<SequencePromisesObjectResult<T>> {
  let hasErrors = false;
  const left = {} as any;
  const right = {} as any;
  await Promise.all(
    Object.entries(obj).map(([key, p]) =>
      Promise.resolve(p).then(
        value => {
          right[key] = value;
        },
        reason => {
          hasErrors = true;
          left[key] = reason;
        }
      )
    )
  );
  return hasErrors ? Promise.reject(left) : Promise.resolve(right);
}
