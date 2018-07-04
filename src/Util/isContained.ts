export function isContained(
	origContained: string,
	origContainer: string
): boolean {
	const contained = origContained.toLowerCase();
	const container = origContainer.toLowerCase();
	const ignored = /[./]/;
	let indexFrom = -1;
	return Array.prototype.every.call(
		contained,
		(char: string) =>
			ignored.test(char) ||
			!!(indexFrom = container.indexOf(char, indexFrom) + 1)
	);
}
