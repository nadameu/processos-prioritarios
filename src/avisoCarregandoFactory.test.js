import avisoCarregandoFactory from './avisoCarregandoFactory';

let progresso = {};
let saida = {};
let avisoCarregando;
let infraExibirAviso;
let infraOcultarAviso;
let safeQuery;

beforeEach(() => {
	infraExibirAviso = jest.fn();
	infraOcultarAviso = jest.fn();
	safeQuery = jest.fn(selector =>
		Promise.resolve(
			selector === 'gmProgresso'
				? progresso
				: selector === 'gmSaida'
					? saida
					: Promise.reject(`Seletor não encontrado: "${selector}"!`)
		)
	);
	avisoCarregando = avisoCarregandoFactory({
		infraExibirAviso,
		infraOcultarAviso,
		safeQuery,
	});
});

afterEach(() => {});

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
		expect(infraExibirAviso).toHaveBeenCalled();
		expect(infraExibirAviso.mock.calls[0][0]).toBe(false);
		expect(infraExibirAviso.mock.calls[0][1]).toMatch(TEXTO);
		expect(safeQuery).toHaveBeenCalledWith('gmProgresso');
		expect(safeQuery).toHaveBeenCalledWith('gmSaida');
	});

	it('Oculta o aviso usando o método "infraOcultarAviso"', () => {
		avisoCarregando.ocultar();
		expect(infraOcultarAviso).toHaveBeenCalled();
	});

	it('Exibe automaticamente ao atualizar', async () => {
		const exibir = avisoCarregando.exibir;
		avisoCarregando.exibir = jest.fn(exibir);
		avisoCarregando.ocultar();
		await avisoCarregando.atualizar(1, 100);
		expect(avisoCarregando.exibir).toHaveBeenCalled();
		avisoCarregando.exibir = exibir;
	});

	it('Exibe o progresso', async () => {
		await avisoCarregando.atualizar(1, 100);
		expect(progresso).toEqual({ value: 1, max: 100 });
		expect(saida).toEqual({ textContent: '1 / 100' });
	});

	it('Emite erro se acrescentar sem exibir antes', async done => {
		avisoCarregando.ocultar();
		try {
			await avisoCarregando.acrescentar(8);
		} catch (_) {
			done();
		}
	});

	it('Calcula o progresso conforme acréscimo', () => {
		const exibir = avisoCarregando.atualizar(8, 40);
		const acrescentar = exibir.then(() => avisoCarregando.acrescentar(3));
		return acrescentar.then(() => {
			expect(progresso).toEqual({ value: 11, max: 40 });
			expect(saida).toEqual({ textContent: '11 / 40' });
		});
	});
});
