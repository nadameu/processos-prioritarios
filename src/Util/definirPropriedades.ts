export function definirPropriedades(target: object, ...sources: object[]) {
	sources.forEach(source => {
		Object.defineProperties(
			target,
			Object.getOwnPropertyNames(source).reduce<PropertyDescriptorMap>(
				(descriptors, key) => {
					descriptors[key] = Object.getOwnPropertyDescriptor(
						source,
						key
					) as PropertyDescriptor;
					return descriptors;
				},
				{}
			)
		);
	});
	return target;
}
