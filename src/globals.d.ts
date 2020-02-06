interface Thenable<T> {
  then(f: (_: T) => any, g?: (_: any) => any): any;
}
type Resolvable<T> = T | Thenable<T>;

interface Promise<T> {
  catch<U>(f: (_: any) => Resolvable<U>): Promise<T | U>;
  then<U>(f: (_: T) => Resolvable<U>, g?: (_: any) => Resolvable<U>): Promise<U>;
}
interface PromiseConstructor {
  resolve<T>(value: Resolvable<T>): Promise<T>;
}
