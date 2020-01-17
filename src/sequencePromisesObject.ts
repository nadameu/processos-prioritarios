type SequencePromisesObjectResult<T> = {
  [key in keyof T]: T[key] extends Promise<infer U> ? U : T[key];
};

export function sequencePromisesObject<T extends { [key: string]: unknown }>(
  obj: T
): Promise<SequencePromisesObjectResult<T>> {
  return Promise.all(
    Object.entries(obj).map(([key, valueOrPromise]) =>
      Promise.resolve(valueOrPromise).then(value => [key, value] as [string, unknown])
    )
  ).then(entries => Object.fromEntries(entries) as SequencePromisesObjectResult<T>);
}
