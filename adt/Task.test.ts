import { Task } from './Task';

let expected: number;
const onReject = jest.fn();
const onResolve = jest.fn();

beforeEach(() => {
	onReject.mockClear();
	onResolve.mockClear();
	expected = genRandomInt();
});

describe('Task', () => {
	it('is a function', () => {
		expect(Task).toBeInstanceOf(Function);
	});
	it('can be called with "new" keyword', () => {
		const make = () => new Task(null as any);
		expect(make).not.toThrow();
		expect(make()).toBeInstanceOf(Task);
	});
	it('can be called without "new" keyword', () => {
		const make = () => Task(null as any);
		expect(make).not.toThrow();
		expect(make()).toBeInstanceOf(Task);
	});
	it('resolves once', () => {
		const task = Task<string, number>((rej, res) => {
			res(expected);
			res(-36);
			rej('ERROR');
		});
		expect(fork(task)).toEqual({ rej: 0, res: [expected] });
	});
	it('rejects once', () => {
		const task = Task<number, string>((rej, res) => {
			rej(expected);
			rej(-36);
			res('not expected');
		});
		expect(fork(task)).toEqual({ rej: [expected], res: 0 });
	});
	it('can be cancelled', () => {
		jest.useFakeTimers();
		const sideEffect = jest.fn();
		const task = fakeTimeout(sideEffect);
		const cancel = task.fork(onReject, onResolve);
		cancel();
		jest.runAllTimers();
		expect(getResult().res).toBe(0);
		expect(sideEffect).not.toHaveBeenCalled();
		jest.clearAllTimers();
	});
});
describe('Static methods', () => {
	test('of', () => {
		const task = Task.of(expected);
		expect(fork(task).res).toEqual([expected]);
	});
	test('rejected', () => {
		const task = Task.rejected(expected);
		expect(fork(task).rej).toEqual([expected]);
	});
});
describe('Instance methods', () => {
	test('chain', () => {
		const task = Task.of<number, number>(expected).chain(x =>
			Task.rejected(x * 2 - 1)
		);
		expect(fork(task).rej).toEqual([expected * 2 - 1]);
	});
	test('chain cancelling', () => {
		jest.useFakeTimers();
		const sideEffect = jest.fn();
		const task = fakeTimeout(sideEffect, 'Failure', 100).chain(() =>
			fakeTimeout(sideEffect, 'Another failure', 200)
		);
		const cancel = task.fork(onReject, onResolve);
		cancel();
		jest.runAllTimers();
		expect(getResult()).toEqual({ rej: 0, res: 0 });
		expect(sideEffect).not.toHaveBeenCalled();
		jest.clearAllTimers();
	});
	test('orElse', () => {
		const task = Task.rejected<number, number>(expected).orElse(x =>
			Task.of(x * 2 - 1)
		);
		expect(fork(task).res).toEqual([expected * 2 - 1]);
	});
	test('orElse cancelling', () => {
		jest.useFakeTimers();
		const sideEffect = jest.fn();
		const task = fakeRejectTimeout(sideEffect, 'Failure', 100).orElse(() =>
			fakeRejectTimeout(sideEffect, 'Another failure', 200)
		);
		const cancel = task.fork(onReject, onResolve);
		cancel();
		jest.runAllTimers();
		expect(getResult()).toEqual({ rej: 0, res: 0 });
		expect(sideEffect).not.toHaveBeenCalled();
		jest.clearAllTimers();
	});
	test('map', () => {
		const task = Task.of(expected).map(x => x * 3 + 4);
		expect(fork(task).res).toEqual([expected * 3 + 4]);
	});
	test('mapRejected', () => {
		const task = Task.rejected(expected).mapRejected(x => x * 3 + 4);
		expect(fork(task).rej).toEqual([expected * 3 + 4]);
	});
});

interface Result<E, A> {
	rej: 0 | E[];
	res: 0 | A[];
}

function fakeTimeout(
	sideEffect: jest.Mock,
	msg: string = 'FAILED',
	timeout = 0
): Task<never, string> {
	return Task((_, res) => {
		const timer = setTimeout(() => {
			res(msg);
			sideEffect('BOOM');
		}, timeout);
		return () => clearTimeout(timer);
	});
}

function fakeRejectTimeout(
	sideEffect: jest.Mock,
	msg: string = 'FAILED',
	timeout = 0
): Task<string, never> {
	return Task(rej => {
		const timer = setTimeout(() => {
			rej(msg);
			sideEffect('BOOM');
		}, timeout);
		return () => clearTimeout(timer);
	});
}

function fork<E, A>(task: Task<E, A>): Result<E, A> {
	task.fork(onReject, onResolve);
	return getResult();
}

function genRandomInt(): number {
	return (Math.random() * 1e5) | 0;
}

function getResult<E, A>(): Result<E, A> {
	return {
		rej:
			onReject.mock.calls.length === 0
				? 0
				: onReject.mock.calls.map(([x]) => x),
		res:
			onResolve.mock.calls.length === 0
				? 0
				: onResolve.mock.calls.map(([x]) => x),
	};
}
