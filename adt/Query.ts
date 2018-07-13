class ShortCircuit<A> extends Error {
	constructor(public readonly data: A) {
		super();
	}
}
interface IErrors {
	isError: true;
	errors: Error[];
}
function errors(errors: Error[]): IErrors {
	return { isError: true, errors };
}
interface IValues<A> {
	isError: false;
	generator: () => Iterator<A>;
}
interface Next<A> {
	done: false;
	value: A;
}
interface Done<B> {
	done: true;
	value: B;
}
interface IIter<A> {
	next<B>(value: B): Next<A> | Done<B>;
}
function values<A>(generator: () => Iterator<A>): IValues<A> {
	return { isError: false, generator };
}
type IQuery<A> = IErrors | IValues<A>;
const _privateVars = new Map<Query<any>, IQuery<any>>();
function transform<A, B>(q: Query<A>, f: (_: IQuery<A>) => B): B {
	return f(_privateVars.get(q) as IQuery<A>);
}
class QueryImpl<A> implements Iterable<A> {
	constructor(query: IQuery<A>) {
		if (!(this instanceof Query)) {
			const obj = Object.create(Query.prototype);
			Query.call(obj, query);
			return obj;
		}
		_privateVars.set(this, query);
	}

	[Symbol.iterator](): Iterator<A> {
		return transform(this, q => {
			if (q.isError)
				return {
					next() {
						return { done: true, value: q.errors as any };
					},
				} as Iterator<A>;
			return q.generator();
		});
	}
	chain<B>(f: (_: A) => Query<B>): Query<B> {
		return transform(this, q => {
			if (q.isError) return (<any>this) as Query<never>;
			const bs: B[] = [];
			try {
				this.forEach(a => {
					const fb = f(a);
					transform(fb, q2 => {
						if (q2.isError) throw new ShortCircuit(fb);
						fb.forEach(b => {
							bs.push(b);
						});
					});
				});
			} catch (e) {
				if (e instanceof ShortCircuit) return e.data;
				throw e;
			}
			return Query.liftIterable(bs);
		});
	}
	forEach(f: (_: A) => void): void {
		return this.reduce((empty, a) => (f(a), empty), undefined);
	}
	isEmpty(): boolean {
		return transform(this, q => q.isError || q.generator().next().done);
	}
	isError(): boolean {
		return transform(this, q => q.isError);
	}
	map<B>(f: (_: A) => B): Query<B> {
		return transform(
			this,
			q =>
				q.isError
					? ((<any>this) as Query<never>)
					: Query.liftIterable(
							this.reduce<B[]>((acc, a) => acc.concat([f(a)]), [])
					  )
		);
	}
	reduce<B>(f: (acc: B, a: A) => B, seed: B): B {
		let acc = seed;
		for (const a of this) {
			acc = f(acc, a);
		}
		return acc;
	}

	static liftError<A = never>(e: Error): Query<A> {
		return Query.liftErrors([e]);
	}
	static liftErrors<A = never>(es: Error[]): Query<A> {
		return new Query(errors(es));
	}
	static liftIterable<A>(as: Iterable<A>): Query<A> {
		return new Query(values(() => as[Symbol.iterator]()));
	}
	static of<A>(a: A): Query<A> {
		return Query.liftIterable([a]);
	}
}
type QueryImplConstructor = typeof QueryImpl;

interface Query<A> extends QueryImpl<A> {}
interface QueryConstructor extends QueryImplConstructor {
	<A>(_query: IQuery<A>): Query<A>;
	new <A>(_query: IQuery<A>): Query<A>;
}
const Query: QueryConstructor = <any>QueryImpl;

const q1 = Query.of(3);
const q2 = new Query({ isError: true, errors: [new Error('erro')] });
const q3 = Query({
	isError: false,
	generator: () => [1, 2, 3][Symbol.iterator](),
});

console.log(q1, q2, q3);
