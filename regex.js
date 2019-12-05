import escapeStringRegexp from 'escape-string-regexp';

/**
 * @typedef Expr
 * @type {string | RegExp}
 */

/**
 * @param  {...Expr} exprs Expressions
 * @return {RegExp}
 */
export function concat(...exprs) {
  return RegExp(exprs.map(toSource).join(''));
}

/**
 * @param {Expr} expr
 * @return {RegExp}
 */
export function fromExpr(expr) {
  return typeof expr === 'string' ? literal(expr) : expr;
}

/**
 * @param {Expr} expr
 * @return {string}
 */
export function toSource(expr) {
  return fromExpr(expr).source;
}

/**
 * @param {string} text
 * @return {RegExp}
 */
export function literal(text) {
  return RegExp(escapeStringRegexp(text));
}

/**
 * @param  {...Expr} exprs
 * @return {RegExp}
 */
export function oneOf(...exprs) {
  return RegExp(`(${exprs.map(toSource).join('|')})`);
}
