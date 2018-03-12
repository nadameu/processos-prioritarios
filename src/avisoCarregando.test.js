import avisoCarregando from './avisoCarregando';

let progresso = {};
let saida = {};

beforeEach(() => {
	window.infraExibirAviso = jest.fn();
	window.infraOcultarAviso = jest.fn();
	document.getElementById = jest.fn(
		selector =>
			selector === 'gmProgresso'
				? progresso
				: selector === 'gmSaida' ? saida : null
	);
});

afterEach(() => {
	window.infraExibirAviso = null;
	window.infraOcultarAviso = null;
	document.getElementById = null;
});

describe('avisoCarregando', () => {
	test('Possui quatro funções', () => {
		expect(typeof avisoCarregando.exibir).toBe('function');
		expect(typeof avisoCarregando.ocultar).toBe('function');
		expect(typeof avisoCarregando.atualizar).toBe('function');
		expect(typeof avisoCarregando.acrescentar).toBe('function');
	});

	it('Exibe aviso usando o método "infraExibirAviso"', () => {
		const TEXTO = 'Meu Texto personalizado';
		avisoCarregando.exibir(TEXTO);
		expect(window.infraExibirAviso).toHaveBeenCalled();
		expect(window.infraExibirAviso.mock.calls[0][0]).toBe(false);
		expect(window.infraExibirAviso.mock.calls[0][1]).toMatch(TEXTO);
		expect(document.getElementById).toHaveBeenCalledWith('gmProgresso');
		expect(document.getElementById).toHaveBeenCalledWith('gmSaida');
	});

	it('Oculta o aviso usando o método "infraOcultarAviso"', () => {
		avisoCarregando.ocultar();
		expect(window.infraOcultarAviso).toHaveBeenCalled();
	});

	it('Exibe automaticamente ao atualizar', () => {
		const exibir = avisoCarregando.exibir;
		avisoCarregando.exibir = jest.fn(exibir);
		avisoCarregando.ocultar();
		avisoCarregando.atualizar(1, 100);
		expect(avisoCarregando.exibir).toHaveBeenCalled();
		avisoCarregando.exibir = exibir;
	});

	it('Exibe o progresso', () => {
		avisoCarregando.atualizar(1, 100);
		expect(progresso).toEqual({ value: 1, max: 100 });
		expect(saida).toEqual({ textContent: '1 / 100' });
	});

	it('Emite erro se acrescentar sem exibir antes', () => {
		avisoCarregando.ocultar();
		expect(avisoCarregando.acrescentar.bind(null, 8)).toThrow();
	});

	it('Calcula o progresso conforme acréscimo', () => {
		avisoCarregando.atualizar(8, 40);
		avisoCarregando.acrescentar(3);
		expect(progresso).toEqual({ value: 11, max: 40 });
		expect(saida).toEqual({ textContent: '11 / 40' });
	});
});
