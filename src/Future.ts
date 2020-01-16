/* eslint-disable @typescript-eslint/camelcase */

import { Applicative_1 } from 'adt-ts/dist/esm/typeclasses';
import { Generic1 } from 'adt-ts/dist/esm/Generic';

export class Future<a> {
  constructor(private _run: (handler: (value: a) => void) => void) {}

  ap<b>(ff: Future<(_: a) => b>): Future<b> {
    return lift2(ff, this, (f, x) => f(x));
  }
  chain<b>(f: (_: a) => Future<b>): Future<b> {
    return new Future<b>(k => this.then(x => f(x).then(k)));
  }
  map<b>(f: (_: a) => b): Future<b> {
    return new Future<b>(k => this.then(x => k(f(x))));
  }

  then(handler: (value: a) => void): void {
    let done = false;
    this._run(value => {
      if (done) return;
      done = true;
      handler(value);
    });
  }

  static of<a>(value: a): Future<a> {
    return new Future(k => q(() => k(value)));
  }
}

const resolved = Promise.resolve();
function q(f: () => void): void {
  resolved.then(f).catch(err =>
    setTimeout(() => {
      throw err;
    })
  );
}

export function lift2<a, b, c>(fx: Future<a>, fy: Future<b>, f: (x: a, y: b) => c): Future<c> {
  return new Future<c>(k => {
    let x: { value: a } | null = null;
    let y: { value: b } | null = null;
    fx.then(value => {
      x = { value };
      check();
    });
    fy.then(value => {
      y = { value };
      check();
    });
    function check() {
      if (x && y) k(f(x.value, y.value));
    }
  });
}

interface TFuture extends Generic1 {
  type: Future<this['a']>;
}

export const applicativeFuture = {
  apply: ff => fx => lift2(ff, fx, (f, x) => f(x)),
  map: f => fx => fx.map(f),
  pure: x => Future.of(x),
} as Applicative_1<TFuture>;
