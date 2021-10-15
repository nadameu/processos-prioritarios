const PREAMBULO = '<processos-prioritarios>';

export function log(...params: any[]) {
	console.log(PREAMBULO, ...params);
}

export function error(...params: any[]) {
	console.group(PREAMBULO);
	console.error(...params);
	console.groupEnd();
}
