let progresso = null,
	saida = null;

export default {
	acrescentar(qtd) {
		if (! progresso || ! saida) {
			throw new Error('Aviso ainda não foi exibido.');
		}
		var atual = progresso.value,
			total = progresso.max;
		this.atualizar(atual + qtd, total);
	},
	atualizar(atual, total) {
		if (! progresso || ! saida) {
			this.exibir();
		}
		progresso.max = total;
		progresso.value = atual;
		saida.textContent = `${atual} / ${total}`;
	},
	exibir(texto = 'Carregando dados dos processos...') {
		window.infraExibirAviso(
			false,
			[
				'<center>',
				`${texto}<br/>`,
				'<progress id="gmProgresso" value="0" max="1"></progress><br/>',
				'<output id="gmSaida"></output>',
				'</center>',
			].join('')
		);
		progresso = document.getElementById('gmProgresso');
		saida = document.getElementById('gmSaida');
	},
	ocultar() {
		window.infraOcultarAviso();
		progresso = null;
		saida = null;
	},
};
