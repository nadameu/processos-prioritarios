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
				const expected = fork(v);
				const actual = fork(v.ap(Task.of((x: number) => x)));
				expect(actual).toEqual(expected);
			});
			test('A.of(x).ap(A.of(f)) == A.of(f(x))', () => {
				const expected = fork(Task.of(f(x)));
				const actual = fork(Task.of(x).ap(Task.of(f)));
				expect(actual).toEqual(expected);
			});
			test('A.of(y).ap(u) == u.ap(A.of(f => f(y)))', () => {
				const expected = fork(
					u.ap(Task.of<never, (_: (_: number) => number) => number>(f => f(y)))
				);
				const actual = fork(Task.of<never, number>(y).ap(u));
				expect(actual).toEqual(expected);
			});
		});
		test('rejected', () => {
			const expected = fork(Task.of(600)).res;
			const actual = fork(Task.rejected(600)).rej;
			expect(actual).toEqual(expected);
		});
		describe('zero', () => {
			it('should never resolve', () => {
				expect(fork(Task.zero())).toEqual({ rej: 0, res: 0 });
			});
			const x = Task.of<never, number>(60);
			const f = (x: number) => x / 4;
			const zero = Task.zero<never, number>();
			test('x.alt(A.zero()) == x', () => {
				const expected = fork(x);
				const actual = fork(x.alt(zero));
				expect(actual).toEqual(expected);
			});
			test('A.zero().alt(x) == x', () => {
				const expected = fork(x);
				const actual = fork(zero.alt(x));
				expect(actual).toEqual(expected);
			});
			test('A.zero().map(f) == A.zero()', () => {
				const expected = fork(zero);
				const actual = fork(zero.map(f));
				expect(actual).toEqual(expected);
			});
		});
	});

	describe('Instance methods', () => {
		describe('fork', () => {
			test('resolves once', () => {
				const task = Task<string, number>((rej, res) => {
					res(60);
					res(99);
					rej('ERROR');
				});
				expect(fork(task)).toEqual({ rej: 0, res: [60] });
			});
			test('rejects once', () => {
				const task = Task<number, string>((rej, res) => {
					rej(60);
					rej(99);
					res('ERROR');
				});
				expect(fork(task)).toEqual({ rej: [60], res: 0 });
			});
			test('can be cancelled', () => {
				const sideEffect = jest.fn();
				const cancelRes = Task((_, res) => {
					const timer = setTimeout(() => {
						sideEffect();
						res(600);
					});
					return () => clearTimeout(timer);
				}).fork(sideEffect, sideEffect);
				const cancelRej = Task(rej => {
					const timer = setTimeout(() => {
						sideEffect();
						rej('FAIL');
					});
					return () => clearTimeout(timer);
				}).fork(sideEffect, sideEffect);
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
				const expected = fork(m.chain(x => f(x).chain(g)));
				const actual = fork(m.chain(f).chain(g));
				expect(actual).toEqual(expected);
			});
			const x = 60;
			const f = (x: number) => x * 40;
			const after = <T>(ms: number, value: T): Task<never, T> =>
				Task((_, res) => {
					const timer = setTimeout(res, ms, value);
					return () => clearTimeout(timer);
				});
			test('synchronous', () => {
				const expected = fork(Task.of(f(x)));
				const actual = fork(Task.of(x).chain(x => Task.of(f(x))));
				expect(actual).toEqual(expected);
			});
			test('asynchronous', () => {
				jest.useFakeTimers();
				const task = after(200, x).chain(x => after(200, f(x)));
				const onResolve = jest.fn();
				const onReject = jest.fn();
				task.fork(onReject, onResolve);
				jest.advanceTimersByTime(350);
				expect(onReject).not.toHaveBeenCalled();
				expect(onResolve).not.toHaveBeenCalled();
				jest.advanceTimersByTime(50);
				expect(onReject).not.toHaveBeenCalled();
				expect(onResolve.mock.calls).toEqual([[f(x)]]);
			});
			test('cancelling', () => {
				const sideEffect = jest.fn();
				const createTask = () =>
					Task<never, number>((_, res) => {
						const timer = setTimeout(() => {
							sideEffect();
							res(600);
						});
						return () => clearTimeout(timer);
					});
				const result = fork(createTask().chain(createTask), true);
				expect(result).toEqual({ rej: 0, res: 0 });
				expect(sideEffect).not.toHaveBeenCalled();
			});
		});
		describe('orElse', () => {
			test('m.orElse(f).orElse(g) == m.orElse(x => f(x).orElse(g))', () => {
				const f = (x: string) => Task.rejected(`BEFORE${x}`);
				const g = (x: string) => Task.rejected(`${x}AFTER`);
				const m = Task.rejected('FAIL');
				const expected = fork(m.orElse(x => f(x).orElse(g)));
				const actual = fork(m.orElse(f).orElse(g));
				expect(actual).toEqual(expected);
			});
			const x = 'fail';
			const f = (x: string) => `BEFORE${x}`;
			const after = <T>(ms: number, value: T): Task<T, never> =>
				Task(rej => {
					const timer = setTimeout(rej, ms, value);
					return () => clearTimeout(timer);
				});
			test('synchronous', () => {
				const expected = fork(Task.rejected(f(x)));
				const actual = fork(Task.rejected(x).orElse(x => Task.rejected(f(x))));
				expect(actual).toEqual(expected);
			});
			test('asynchronous', () => {
				jest.useFakeTimers();
				const task = after(200, x).orElse(x => after(200, f(x)));
				const onResolve = jest.fn();
				const onReject = jest.fn();
				task.fork(onReject, onResolve);
				jest.advanceTimersByTime(350);
				expect(onReject).not.toHaveBeenCalled();
				expect(onResolve).not.toHaveBeenCalled();
				jest.advanceTimersByTime(50);
				expect(onReject.mock.calls).toEqual([[f(x)]]);
				expect(onResolve).not.toHaveBeenCalled();
			});
			test('cancelling', () => {
				const sideEffect = jest.fn();
				const createTask = () =>
					Task<string, never>(rej => {
						const timer = setTimeout(() => {
							sideEffect();
							rej('FAIL');
						});
						return () => clearTimeout(timer);
					});
				const result = fork(createTask().orElse(createTask), true);
				expect(result).toEqual({ rej: 0, res: 0 });
				expect(sideEffect).not.toHaveBeenCalled();
			});
		});
		describe('map', () => {
			const u = Task.of(60);
			const f = (x: number) => x / 3;
			const g = (x: number) => x + 10;
			test('u.map(a => a) == u', () => {
				const expected = fork(u);
				const actual = fork(u.map(a => a));
				expect(actual).toEqual(expected);
			});
			test('u.map(x => f(g(x)) == u.map(g).map(f)', () => {
				const expected = fork(u.map(g).map(f));
				const actual = fork(u.map(x => f(g(x))));
				expect(actual).toEqual(expected);
			});
		});
		describe('mapRejected', () => {
			const u = Task.rejected('fail');
			const f = (x: string) => `BEFORE${x}`;
			const g = (x: string) => `${x}AFTER`;
			test('u.mapRejected(a => a) == u', () => {
				const expected = fork(u);
				const actual = fork(u.mapRejected(a => a));
				expect(actual).toEqual(expected);
			});
			test('u.mapRejected(x => f(g(x)) == u.mapRejected(g).mapRejected(f)', () => {
				const expected = fork(u.mapRejected(g).mapRejected(f));
				const actual = fork(u.mapRejected(x => f(g(x))));
				expect(actual).toEqual(expected);
			});
		});
		describe('ap', () => {
			const x = 60;
			const f = (x: number) => x * 40;
			const after = <T>(ms: number, value: T): Task<never, T> =>
				Task((_, res) => {
					const timer = setTimeout(res, ms, value);
					return () => clearTimeout(timer);
				});
			test('v.ap(u.ap(a.map(f => g => x => f(g(x))))) == v.ap(u).ap(a)', () => {
				type Fn<A, B> = (_: A) => B;
				const t = <A, B, C>(f: Fn<B, C>) => (g: Fn<A, B>) => (x: A): C =>
					f(g(x));
				const a = Task.of((x: number) => x / 4);
				const u = Task.of((x: number) => x - 15);
				const v = Task.of(60);
				const expected = fork(v.ap(u).ap(a));
				jest.resetAllMocks();
				const actual = fork(v.ap(u.ap(a.map(f => t(f)))));
				expect(actual).toEqual(expected);
			});
			test('should run in parallel', () => {
				jest.useFakeTimers();
				const task = after(200, x).ap(after(200, f));
				const onResolve = jest.fn();
				const onReject = jest.fn();
				task.fork(onReject, onResolve);
				jest.advanceTimersByTime(250);
				expect(onReject).not.toHaveBeenCalled();
				expect(onResolve.mock.calls).toEqual([[f(x)]]);
			});
			describe('cancel on failures', () => {
				test('failed that', () => {
					const sideEffect = jest.fn();
					const task = Task<string, number>((_, res) => {
						const timer = setTimeout(() => {
							sideEffect();
							res(x);
						});
						return () => clearTimeout(timer);
					}).ap<never>(Task.rejected('no go'));
					expect(fork(task)).toEqual({ rej: ['no go'], res: 0 });
					expect(sideEffect).not.toHaveBeenCalled();
				});
				test('failed this', () => {
					const sideEffect = jest.fn();
					const task = Task.rejected<string, number>('no go').ap(
						Task<string, (_: number) => number>((_, res) => {
							const timer = setTimeout(() => {
								sideEffect();
								res(f);
							});
							return () => clearTimeout(timer);
						})
					);
					expect(fork(task)).toEqual({ rej: ['no go'], res: 0 });
					expect(sideEffect).not.toHaveBeenCalled();
				});
			});
		});
		describe('bimap', () => {
			const resolvedP = Task.of<string, number>(60);
			const rejectedP = Task.rejected<string, number>('fail');
			describe('p.bimap(a => a, b => b) == p', () => {
				test('resolved', () => {
					const expected = fork(resolvedP);
					jest.resetAllMocks();
					const actual = fork(resolvedP.bimap(a => a, b => b));
					expect(actual).toEqual(expected);
				});
				test('rejected', () => {
					const expected = fork(rejectedP);
					jest.resetAllMocks();
					const actual = fork(rejectedP.bimap(a => a, b => b));
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
					const expected = fork(p.bimap(g, i).bimap(f, h));
					jest.resetAllMocks();
					const actual = fork(p.bimap(a => f(g(a)), b => h(i(b))));
					expect(actual).toEqual(expected);
				});
				test('rejected', () => {
					const p = rejectedP;
					const expected = fork(p.bimap(g, i).bimap(f, h));
					jest.resetAllMocks();
					const actual = fork(p.bimap(a => f(g(a)), b => h(i(b))));
					expect(actual).toEqual(expected);
				});
			});
		});
		describe('alt', () => {
			const after = <T>(ms: number, value: T): Task<any, T> =>
				Task((_, res) => {
					const timer = setTimeout(res, ms, value);
					return () => clearTimeout(timer);
				});
			const rejectAfter = <T>(ms: number, reason: T): Task<T, any> =>
				Task(rej => {
					const timer = setTimeout(rej, ms, reason);
					return () => clearTimeout(timer);
				});
			const ok = Task.of<any, number>(60);
			const fail = Task.rejected<string, any>('fail');
			const zero = Task.zero<string, number>();
			const f = (x: number) => x / 5;
			describe('a.alt(b).alt(c) == a.alt(b.alt(c))', () => {
				type T = Task<string, number>;
				const generateTest = (a: T, b: T, c: T) => () => {
					const expected = fork(a.alt(b.alt(c)));
					const actual = fork(a.alt(b).alt(c));
					expect(actual).toEqual(expected);
				};
				test('ok, fail, zero', generateTest(ok, fail, zero));
				test('ok, zero, fail', generateTest(ok, zero, fail));
				test('fail, ok, zero', generateTest(fail, ok, zero));
				test('fail, zero, ok', generateTest(fail, zero, ok));
				test('zero, ok, fail', generateTest(zero, ok, fail));
				test('zero, fail, ok', generateTest(zero, fail, ok));
			});
			describe('a.alt(b).map(f) == a.map(f).alt(b.map(f))', () => {
				type T = Task<string, number>;
				const generateTest = (a: T, b: T) => () => {
					const expected = fork(a.map(f).alt(b.map(f)));
					const actual = fork(a.alt(b).map(f));
					expect(actual).toEqual(expected);
				};
				test(
					'first is faster',
					generateTest(after(100, 60), rejectAfter(200, 'fail'))
				);
				test(
					'second is faster',
					generateTest(after(200, 60), rejectAfter(100, 'fail'))
				);
			});
		});
	});
});

type SingleResult<T> = 0 | T[];

interface Result<E, A> {
	rej: SingleResult<E>;
	res: SingleResult<A>;
}

function fork<E, A>(task: Task<E, A>, cancel = false): Result<E, A> {
	jest.useFakeTimers();
	const onReject = jest.fn();
	const onResolve = jest.fn();
	const doCancel = task.fork(onReject, onResolve);
	if (cancel) doCancel();
	jest.runAllTimers();
	const rejCalls = onReject.mock.calls;
	const resCalls = onResolve.mock.calls;
	const first = <T>(arr: T[]): T => arr[0];
	const computeResult = <T>(arr: T[][]): SingleResult<T> =>
		arr.length === 0 ? 0 : arr.map(first);
	return {
		rej: computeResult(rejCalls),
		res: computeResult(resCalls),
	};
}
