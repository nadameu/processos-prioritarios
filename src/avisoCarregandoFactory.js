let progresso = null;
let saida = null;

const obterProgressoSaida = () =>
	Promise.all([
		progresso || Promise.reject('Sem progresso'),
		saida || Promise.reject('Sem saída'),
	]).then(([progresso, saida]) => ({ progresso, saida }));

export default ({ infraExibirAviso, infraOcultarAviso, safeQuery }) => ({
	async acrescentar(qtd) {
		const { progresso } = await obterProgressoSaida();
		var atual = parseInt(progresso.value);
		var total = parseInt(progresso.max);
		return this.atualizar(atual + qtd, total);
	},
	async atualizar(atual, total) {
		try {
			await this.atualizarValores(atual, total);
		} catch (_) {
			this.exibir();
			await this.atualizarValores(atual, total);
		}
	},
	async atualizarValores(atual, total) {
		const { progresso, saida } = await obterProgressoSaida();
		progresso.max = total;
		progresso.value = atual;
		saida.textContent = `${atual} / ${total}`;
	},
	exibir(texto = 'Carregando dados dos processos...') {
		infraExibirAviso(
			false,
			[
				'<center>',
				`${texto}<br/>`,
				'<progress id="gmProgresso" value="0" max="1"></progress><br/>',
				'<output id="gmSaida"></output>',
				'</center>',
			].join('')
		);
		progresso = safeQuery('gmProgresso');
		saida = safeQuery('gmSaida');
	},
	ocultar() {
		infraOcultarAviso();
		progresso = null;
		saida = null;
	},
});
