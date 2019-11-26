import { Either, Left, Right } from './Either';
import { Task } from './Task';

describe('Task', () => {
  describe('constructor', () => {
    test('is a function', () => {
      expect(typeof Task).toBe('function');
    });
    test('can be called with "new" keyword', () => {
      const make = () => new Task(null as any);
      expect(make).not.toThrow();
      expect(make()).toBeInstanceOf(Task);
    });
    test('can be called without "new" keyword', () => {
      const make = () => Task(null as any);
      expect(make).not.toThrow();
      expect(make()).toBeInstanceOf(Task);
    });
  });

  describe('Static methods', () => {
    describe('of', () => {
      const x = 600;
      const y = x;
      const f = (x: number) => x / 4;
      const v = Task.of<never, number>(x);
      const u = Task.of<never, (_: number) => number>(f);
      test('v.ap(A.of(x => x)) == v', () => {
        const expected = run(v);
        const actual = run(v.ap(Task.of((x: number) => x)));
        expect(actual).toEqual(expected);
      });
      test('A.of(x).ap(A.of(f)) == A.of(f(x))', () => {
        const expected = run(Task.of(f(x)));
        const actual = run(Task.of(x).ap(Task.of(f)));
        expect(actual).toEqual(expected);
      });
      test('A.of(y).ap(u) == u.ap(A.of(f => f(y)))', () => {
        const expected = run(
          u.ap(
            Task.of<never, (_: (_: number) => number) => number>(f => f(y))
          )
        );
        const actual = run(Task.of<never, number>(y).ap(u));
        expect(actual).toEqual(expected);
      });
    });
    test('rejected', () => {
      const expected = run(Task.of(600)).res;
      const actual = run(Task.rejected(600)).rej;
      expect(actual).toEqual(expected);
    });
    describe('zero', () => {
      it('should never resolve', () => {
        expect(run(Task.zero())).toEqual({ rej: 0, res: 0 });
      });
      const x = Task.of<never, number>(60);
      const f = (x: number) => x / 4;
      const zero = Task.zero<never, number>();
      test('x.alt(A.zero()) == x', () => {
        const expected = run(x);
        const actual = run(x.alt(zero));
        expect(actual).toEqual(expected);
      });
      test('A.zero().alt(x) == x', () => {
        const expected = run(x);
        const actual = run(zero.alt(x));
        expect(actual).toEqual(expected);
      });
      test('A.zero().map(f) == A.zero()', () => {
        const expected = run(zero);
        const actual = run(zero.map(f));
        expect(actual).toEqual(expected);
      });
    });
  });

  describe('Instance methods', () => {
    describe('fork', () => {
      test('resolves once', () => {
        const task = Task<string, number>(handler => {
          handler(Right(60));
          handler(Right(99));
          handler(Left('ERROR'));
        });
        expect(run(task)).toEqual({ rej: 0, res: [60] });
      });
      test('rejects once', () => {
        const task = Task<number, string>(handler => {
          handler(Left(60));
          handler(Left(99));
          handler(Right('ERROR'));
        });
        expect(run(task)).toEqual({ rej: [60], res: 0 });
      });
      test('can be cancelled', () => {
        const sideEffect = jest.fn();
        const cancelRes = Task(handler => {
          const timer = setTimeout(() => {
            sideEffect();
            handler(Right(600));
          });
          return () => clearTimeout(timer);
        }).run(sideEffect);
        const cancelRej = Task(handler => {
          const timer = setTimeout(() => {
            sideEffect();
            handler(Left('FAIL'));
          });
          return () => clearTimeout(timer);
        }).run(sideEffect);
        cancelRes();
        cancelRej();
        jest.runAllTimers();
        expect(sideEffect).not.toHaveBeenCalled();
        jest.clearAllTimers();
      });
    });
    describe('chain', () => {
      test('m.chain(f).chain(g) == m.chain(x => f(x).chain(g))', () => {
        const f = (x: number) => Task.of(x / 3);
        const g = (x: number) => Task.of(x + 8);
        const m = Task.of(60);
        const expected = run(m.chain(x => f(x).chain(g)));
        const actual = run(m.chain(f).chain(g));
        expect(actual).toEqual(expected);
      });
      const x = 60;
      const f = (x: number) => x * 40;
      const after = <T>(ms: number, value: T): Task<never, T> =>
        Task(handler => {
          const timer = setTimeout(handler, ms, Right(value));
          return () => clearTimeout(timer);
        });
      test('synchronous', () => {
        const expected = run(Task.of(f(x)));
        const actual = run(Task.of(x).chain(x => Task.of(f(x))));
        expect(actual).toEqual(expected);
      });
      test('asynchronous', () => {
        jest.useFakeTimers();
        const task = after(200, x).chain(x => after(200, f(x)));
        const handler = jest.fn();
        task.run(handler);
        jest.advanceTimersByTime(350);
        expect(handler).not.toHaveBeenCalled();
        jest.advanceTimersByTime(50);
        expect(handler.mock.calls).toEqual([[Right(f(x))]]);
      });
      test('cancelling', () => {
        const sideEffect = jest.fn();
        const createTask = () =>
          Task<never, number>(handler => {
            const timer = setTimeout(() => {
              sideEffect();
              handler(Right(600));
            });
            return () => clearTimeout(timer);
          });
        const result = run(createTask().chain(createTask), true);
        expect(result).toEqual({ rej: 0, res: 0 });
        expect(sideEffect).not.toHaveBeenCalled();
      });
    });
    describe('orElse', () => {
      test('m.orElse(f).orElse(g) == m.orElse(x => f(x).orElse(g))', () => {
        const f = (x: string) => Task.rejected(`BEFORE${x}`);
        const g = (x: string) => Task.rejected(`${x}AFTER`);
        const m = Task.rejected('FAIL');
        const expected = run(m.orElse(x => f(x).orElse(g)));
        const actual = run(m.orElse(f).orElse(g));
        expect(actual).toEqual(expected);
      });
      const x = 'fail';
      const f = (x: string) => `BEFORE${x}`;
      const after = <T>(ms: number, value: T): Task<T, never> =>
        Task(handler => {
          const timer = setTimeout(handler, ms, Left(value));
          return () => clearTimeout(timer);
        });
      test('synchronous', () => {
        const expected = run(Task.rejected(f(x)));
        const actual = run(Task.rejected(x).orElse(x => Task.rejected(f(x))));
        expect(actual).toEqual(expected);
      });
      test('asynchronous', () => {
        jest.useFakeTimers();
        const task = after(200, x).orElse(x => after(200, f(x)));
        const handler = jest.fn();
        task.run(handler);
        jest.advanceTimersByTime(350);
        expect(handler).not.toHaveBeenCalled();
        jest.advanceTimersByTime(50);
        expect(handler.mock.calls).toEqual([[Left(f(x))]]);
      });
      test('cancelling', () => {
        const sideEffect = jest.fn();
        const createTask = () =>
          Task<string, never>(handler => {
            const timer = setTimeout(() => {
              sideEffect();
              handler(Left('FAIL'));
            });
            return () => clearTimeout(timer);
          });
        const result = run(createTask().orElse(createTask), true);
        expect(result).toEqual({ rej: 0, res: 0 });
        expect(sideEffect).not.toHaveBeenCalled();
      });
    });
    describe('map', () => {
      const u = Task.of(60);
      const f = (x: number) => x / 3;
      const g = (x: number) => x + 10;
      test('u.map(a => a) == u', () => {
        const expected = run(u);
        const actual = run(u.map(a => a));
        expect(actual).toEqual(expected);
      });
      test('u.map(x => f(g(x)) == u.map(g).map(f)', () => {
        const expected = run(u.map(g).map(f));
        const actual = run(u.map(x => f(g(x))));
        expect(actual).toEqual(expected);
      });
    });
    describe('mapRejected', () => {
      const u = Task.rejected('fail');
      const f = (x: string) => `BEFORE${x}`;
      const g = (x: string) => `${x}AFTER`;
      test('u.mapRejected(a => a) == u', () => {
        const expected = run(u);
        const actual = run(u.mapRejected(a => a));
        expect(actual).toEqual(expected);
      });
      test('u.mapRejected(x => f(g(x)) == u.mapRejected(g).mapRejected(f)', () => {
        const expected = run(u.mapRejected(g).mapRejected(f));
        const actual = run(u.mapRejected(x => f(g(x))));
        expect(actual).toEqual(expected);
      });
    });
    describe('ap', () => {
      const x = 60;
      const f = (x: number) => x * 40;
      const after = <T>(ms: number, value: T): Task<never, T> =>
        Task(handler => {
          const timer = setTimeout(handler, ms, Right(value));
          return () => clearTimeout(timer);
        });
      test('v.ap(u.ap(a.map(f => g => x => f(g(x))))) == v.ap(u).ap(a)', () => {
        type Fn<A, B> = (_: A) => B;
        const t = <A, B, C>(f: Fn<B, C>) => (g: Fn<A, B>) => (x: A): C => f(g(x));
        const a = Task.of((x: number) => x / 4);
        const u = Task.of((x: number) => x - 15);
        const v = Task.of(60);
        const expected = run(v.ap(u).ap(a));
        jest.resetAllMocks();
        const actual = run(v.ap(u.ap(a.map(f => t(f)))));
        expect(actual).toEqual(expected);
      });
      test('should run in parallel', () => {
        jest.useFakeTimers();
        const task = after(200, x).ap(after(200, f));
        const handler = jest.fn();
        task.run(handler);
        jest.advanceTimersByTime(250);
        expect(handler.mock.calls).toEqual([[Right(f(x))]]);
      });
      describe('cancel on failures', () => {
        test('failed that', () => {
          const sideEffect = jest.fn();
          const task = Task<string, number>(handler => {
            const timer = setTimeout(() => {
              sideEffect();
              handler(Right(x));
            });
            return () => clearTimeout(timer);
          }).ap<never>(Task.rejected('no go'));
          expect(run(task)).toEqual({ rej: ['no go'], res: 0 });
          expect(sideEffect).not.toHaveBeenCalled();
        });
        test('failed this', () => {
          const sideEffect = jest.fn();
          const task = Task.rejected<string, number>('no go').ap(
            Task<string, (_: number) => number>(handler => {
              const timer = setTimeout(() => {
                sideEffect();
                handler(Right(f));
              });
              return () => clearTimeout(timer);
            })
          );
          expect(run(task)).toEqual({ rej: ['no go'], res: 0 });
          expect(sideEffect).not.toHaveBeenCalled();
        });
      });
    });
    describe('bimap', () => {
      const resolvedP = Task.of<string, number>(60);
      const rejectedP = Task.rejected<string, number>('fail');
      describe('p.bimap(a => a, b => b) == p', () => {
        test('resolved', () => {
          const expected = run(resolvedP);
          jest.resetAllMocks();
          const actual = run(
            resolvedP.bimap(
              a => a,
              b => b
            )
          );
          expect(actual).toEqual(expected);
        });
        test('rejected', () => {
          const expected = run(rejectedP);
          jest.resetAllMocks();
          const actual = run(
            rejectedP.bimap(
              a => a,
              b => b
            )
          );
          expect(actual).toEqual(expected);
        });
      });
      describe('p.bimap(a => f(g(a)), b => h(i(b))) == p.bimap(g, i).bimap(f, h)', () => {
        const f = (x: string) => `BEFORE${x}`;
        const g = (x: string) => `${x}AFTER`;
        const h = (x: number) => x / 4;
        const i = (x: number) => x + 19;
        test('resolved', () => {
          const p = resolvedP;
          const expected = run(p.bimap(g, i).bimap(f, h));
          jest.resetAllMocks();
          const actual = run(
            p.bimap(
              a => f(g(a)),
              b => h(i(b))
            )
          );
          expect(actual).toEqual(expected);
        });
        test('rejected', () => {
          const p = rejectedP;
          const expected = run(p.bimap(g, i).bimap(f, h));
          jest.resetAllMocks();
          const actual = run(
            p.bimap(
              a => f(g(a)),
              b => h(i(b))
            )
          );
          expect(actual).toEqual(expected);
        });
      });
    });
    describe('alt', () => {
      const after = <T>(ms: number, value: T): Task<any, T> =>
        Task(handler => {
          const timer = setTimeout(handler, ms, Right(value));
          return () => clearTimeout(timer);
        });
      const rejectAfter = <T>(ms: number, reason: T): Task<T, any> =>
        Task(handler => {
          const timer = setTimeout(handler, ms, Left(reason));
          return () => clearTimeout(timer);
        });
      const ok = Task.of<string, number>(60);
      const fail = Task.rejected<string, number>('fail');
      const zero = Task.zero<string, number>();
      const f = (x: number) => x / 5;
      test('a.alt(b).alt(c) == a.alt(b.alt(c))', () => {
        [
          [ok, fail, zero],
          [ok, zero, fail],
          [fail, ok, zero],
          [fail, zero, ok],
          [zero, ok, fail],
          [zero, fail, ok]
        ].forEach(([a, b, c]) => {
          const expected = run(a.alt(b.alt(c)));
          const actual = run(a.alt(b).alt(c));
          expect(actual).toEqual(expected);
        });
      });
      describe('a.alt(b).map(f) == a.map(f).alt(b.map(f))', () => {
        type T = Task<string, number>;
        const generateTest = (a: T, b: T) => () => {
          const expected = run(a.map(f).alt(b.map(f)));
          const actual = run(a.alt(b).map(f));
          expect(actual).toEqual(expected);
        };
        test('first is faster', generateTest(after(100, 60), rejectAfter(200, 'fail')));
        test('second is faster', generateTest(after(200, 60), rejectAfter(100, 'fail')));
      });
    });
  });
});

type SingleResult<T> = 0 | T[];

interface Result<E, A> {
  rej: SingleResult<E>;
  res: SingleResult<A>;
}

function run<E, A>(task: Task<E, A>, cancel = false): Result<E, A> {
  jest.useFakeTimers();
  const handler = jest.fn();
  const doCancel = task.run(handler);
  if (cancel) doCancel();
  jest.runAllTimers();
  const calls: Either<E, A>[] = handler.mock.calls.map(args => args[0]);
  const rej = calls.filter((e): e is Left<E> => e.isLeft).map(e => e.leftValue);
  const res = calls.filter((e): e is Right<A> => !e.isLeft).map(e => e.rightValue);
  return {
    rej: rej.length === 0 ? 0 : rej,
    res: res.length === 0 ? 0 : res
  };
}
