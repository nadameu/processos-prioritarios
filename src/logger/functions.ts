const preambulo = '<Processos prioritários (novo)>';

export function debug(...args: any[]) {
  console.debug(preambulo, ...args);
}

export function error(...args: any[]) {
  console.error(preambulo, ...args);
}

export function log(...args: any[]) {
  console.log(preambulo, ...args);
}

export function table(...args: any[]) {
  console.log(preambulo);
  console.table(...args);
}
