import Grafico from './Grafico';
import { apenasData } from './helpers';

function excluirCanvasAntigo() {
	const canvases = Array.from(document.getElementsByTagName('canvas'));
	canvases.forEach(canvas => canvas.parentNode.removeChild(canvas));
}

function extrairProcessos(localizadores) {
	const processos = new Map();
	const hoje = apenasData(Date.now());
	localizadores.forEach(localizador => {
		localizador.processos.forEach(
			({ numproc, termoPrazoCorregedoria: termo }) => {
				const dataTermo = apenasData(termo);
				const timestamp = Math.min(
					Math.max(hoje.getTime(), dataTermo.getTime()),
					processos.get(numproc) || Infinity
				);
				processos.set(numproc, timestamp);
			}
		);
	});
	return processos;
}

function extrairDatas(processos) {
	const datas = new Map();
	for (const data of processos.values()) {
		const valorAtual = datas.get(data) || 0;
		datas.set(data, valorAtual + 1);
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
