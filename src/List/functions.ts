/* eslint-disable prefer-arrow-callback*/

import { Maybe, Nothing, Just } from '../Maybe';
import { purry } from '../purry';
import { List, Result } from './definitions';

export function fromArray<a>(array: a[]): List<a> {
  return go;
  function go(i = 0, len = array.length): Result<a> {
    return i < len ? { head: array[i], tail: () => go(i + 1, len) } : null;
  }
}

export function toArray<a>(list: List<a>): a[] {
  const result: a[] = [];
  let current = list();
  while (current !== null) {
    result.push(current.head);
    current = current.tail();
  }
  return result;
}

export function fromIterable<a>(iterable: Iterable<a>): List<a> {
  return go;
  function go(iter = iterable[Symbol.iterator](), current = iter.next()) {
    return current.done ? null : { head: current.value, tail: () => go(iter, iter.next()) };
  }
}

export const drop = purry(function drop<a>(list: List<a>, n: number): List<a> {
  return go;
  function go(left = n, result = list()) {
    while (left > 0 && result !== null) {
      result = result.tail();
      left -= 1;
    }
    return result;
  }
}) as {
  <a>(n: number): (list: List<a>) => List<a>;
  <a>(list: List<a>, n: number): List<a>;
};

export const index = purry(function index<a>(list: List<a>, i: number): Maybe<a> {
  if (i < 0) return Nothing;
  const result = drop(list, i)();
  return result === null ? Nothing : Just(result.head);
}) as {
  <a>(i: number): (list: List<a>) => Maybe<a>;
  <a>(list: List<a>, i: number): Maybe<a>;
};

export const filter = purry(function filter<a>(list: List<a>, p: (_: a) => boolean): List<a> {
  return go;
  function go(result: Result<a> = list()): Result<a> {
    while (result !== null) {
      const { head, tail } = result;
      if (p(head)) return { head, tail: () => go(tail()) };
      result = tail();
    }
    return null;
  }
}) as {
  <a>(b: (_: a) => boolean): (a: List<a>) => List<a>;
  <a, b extends a>(b: (x: a) => x is b): (a: List<a>) => List<b>;
  <a>(list: List<a>, p: (_: a) => boolean): List<a>;
  <a, b extends a>(list: List<a>, p: (x: a) => x is b): List<b>;
};

export const map = purry(function map<a, b>(list: List<a>, f: (_: a) => b): List<b> {
  return go;
  function go(result = list()): Result<b> {
    return result === null ? null : { head: f(result.head), tail: () => go(result.tail()) };
  }
}) as {
  <a, b>(f: (_: a) => b): (list: List<a>) => List<b>;
  <a, b>(list: List<a>, f: (_: a) => b): List<b>;
};
