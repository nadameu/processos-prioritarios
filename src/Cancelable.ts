export class Cancelable<a> {
  constructor(private _promise: Promise<a>, private _token: { cancel(): void }) {}

  cancel() {
    this._token.cancel();
  }

  catch<b = a>(f: (_: any) => b | PromiseLike<b>): Cancelable<a | b> {
    return new Cancelable(this._promise.catch(f), this._token);
  }

  then<b>(f: (_: a) => b | PromiseLike<b>, g?: (_: any) => b | PromiseLike<b>): Cancelable<b> {
    return new Cancelable(this._promise.then(f, g), this._token);
  }

  static all<a, b, c>(xs: [Cancelable<a>, Cancelable<b>, Cancelable<c>]): Cancelable<[a, b, c]>;
  static all<a, b>(xs: [Cancelable<a>, Cancelable<b>]): Cancelable<[a, b]>;
  static all<a>(xs: Cancelable<a>[]): Cancelable<a[]>;
  static all<a>(xs: Cancelable<a>[]): Cancelable<a[]> {
    const { cancel, settled } = aux(xs);
    return new Cancelable(
      Promise.all(
        xs.map(({ _promise }, i) =>
          _promise.then(
            value => {
              settled(i);
              return Promise.resolve(value);
            },
            reason => {
              settled(i);
              cancel();
              return Promise.reject(reason);
            }
          )
        )
      ),
      { cancel }
    );
  }
}

function aux<a>(xs: Cancelable<a>[]) {
  let pending = Array.from(xs.keys());

  return { cancel, settled };

  function cancel() {
    for (const index of pending) xs[index].cancel();
  }

  function settled(index: number) {
    pending = pending.filter(i => i !== index);
  }
}
