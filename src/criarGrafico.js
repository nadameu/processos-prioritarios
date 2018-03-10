import Grafico from './Grafico';

function excluirCanvasAntigo() {
	const canvases = Array.from(document.getElementsByTagName('canvas'));
	if (canvases.length > 0) {
		console.log('Excluindo canvas antigo');
		canvases.forEach(canvas => canvas.parentNode.removeChild(canvas));
	}
}

function extrairProcessos(localizadores) {
	const processos = new Map();
	const agora = new Date();
	const hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
	localizadores.forEach(localizador => {
		localizador.processos.forEach(processo => {
			const numproc = processo.numproc;
			const termo = processo.termoPrazoCorregedoria,
				dataTermo = new Date(
					termo.getFullYear(),
					termo.getMonth(),
					termo.getDate()
				);
			const timestamp = Math.max(hoje.getTime(), dataTermo.getTime());
			if (processos.has(numproc)) {
				const timestampAntigo = processos.get(numproc),
					timestampNovo = Math.min(timestampAntigo, timestamp);
				processos.set(numproc, timestampNovo);
			} else {
				processos.set(numproc, timestamp);
			}
		});
	});
	return processos;
}

function extrairDatas(processos) {
	const datas = new Map();
	for (const timestamp of processos.values()) {
		const valorAtual = datas.get(timestamp) || 0;
		datas.set(timestamp, valorAtual + 1);
	}
	return datas;
}

export default function criarGrafico(localizadores) {
	excluirCanvasAntigo();
	const processos = extrairProcessos(localizadores);
	const tabelaDatas = extrairDatas(processos);
	var grafico = new Grafico();
	grafico.inserirDados(tabelaDatas);
	document.getElementById('divInfraAreaTelaD').appendChild(grafico.render());
}
