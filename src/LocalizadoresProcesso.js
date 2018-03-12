export default class LocalizadoresProcesso {
	constructor() {
		this.principal = null;
	}
}
// Substitui LocalizadoresProcesso extends Array
LocalizadoresProcesso.prototype = Object.defineProperties(
	Object.create(Array.prototype),
	Object.getOwnPropertyDescriptors(LocalizadoresProcesso.prototype)
);
