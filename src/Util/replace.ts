type Replacer = (substring: string, ...args: any[]) => string;

export function replace(
	matcher: string | RegExp,
	replaceValue: string
): (text: string) => string;
export function replace(
	matcher: string | RegExp,
	replacer: Replacer
): (text: string) => string;
export function replace(
	matcher: string | RegExp,
	replacer: string | Replacer
): (text: string) => string {
	return function(text) {
		return text.replace(matcher, replacer as any);
	};
}
