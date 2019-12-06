/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable prefer-arrow-callback */
export interface Cons<a> {
  head: a;
  tail: List<a>;
}
export type Nil = null;
export type Result<a> = Cons<a> | Nil;
export interface List<a> {
  (): Result<a>;
}
