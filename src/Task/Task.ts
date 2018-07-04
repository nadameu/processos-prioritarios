interface TaskRunner<E, A> {
	(onRejected: (_: E) => void, onResolved: (_: A) => void): void;
}
export interface Task<E, A> {
	run: TaskRunner<E, A>;
}
export const Task = <E, A>(_run: TaskRunner<E, A>): Task<E, A> => ({
	run: runTask(_run),
});

const runTask = <E, A>(task: TaskRunner<E, A>) => {
	let status: 'PENDING' | 'RESOLVED' | 'REJECTED' = 'PENDING';
	return (onRejected: (_: E) => void, onResolved: (_: A) => void): void => {
		task(
			e => {
				if (status === 'PENDING') {
					status = 'REJECTED';
					onRejected(e);
				}
			},
			a => {
				if (status === 'PENDING') {
					status = 'RESOLVED';
				}
				onResolved(a);
			}
		);
	};
};
