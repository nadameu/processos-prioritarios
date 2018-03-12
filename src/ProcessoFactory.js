import { parseDataHora } from './helpers';
import LocalizadoresProcessoFactory from './LocalizadoresProcessoFactory';
import Processo from './Processo';

export default class ProcessoFactory {
	static fromLinha(linha) {
		var processo = new Processo();
		processo.linha = linha;
		processo.numClasse = Number(linha.dataset.classe);
		processo.numCompetencia = Number(linha.dataset.competencia);
		var link = (processo.link = linha.cells[1].querySelector('a'));
		var numprocFormatado = (processo.numprocFormatado = link.textContent);
		processo.numproc = numprocFormatado.replace(/[-.]/g, '');
		var links = linha.cells[1].getElementsByTagName('a');
		if (links.length === 2) {
			var onmouseover = [...links[1].attributes].filter(
				attr => attr.name === 'onmouseover'
			)[0].value;
			var [, codigoLembrete] = onmouseover.match(
				/^return infraTooltipMostrar\('([^']+)','Lembretes',400\);$/
			);
			var div = document.createElement('div');
			div.innerHTML = codigoLembrete;
			var tabela = div.childNodes[0];
			var linhas = Array.from(tabela.rows).reverse();
			processo.lembretes = linhas.map(linha => {
				let celula = linha.cells[2];
				celula.innerHTML = celula.innerHTML.replace(/<br.*?>/g, '\0\n');
				return celula.textContent;
			});
		}
		var textoSigilo = linha.cells[1].getElementsByTagName('br')[0].nextSibling
			.textContent;
		processo.sigilo = Number(textoSigilo.match(/Nível ([0-5])/)[1]);
		processo.situacao = linha.cells[2].textContent;
		processo.juizo = linha.cells[3].textContent;
		processo.dataAutuacao = parseDataHora(linha.cells[4].textContent);
		var diasNaSituacao = Number(linha.cells[5].textContent);
		var dataSituacao = new Date();
		dataSituacao.setDate(dataSituacao.getDate() - diasNaSituacao);
		processo.dataSituacao = dataSituacao;
		var labelsDadosComplementares = [
			...linha.cells[6].getElementsByTagName('label'),
		];
		if (labelsDadosComplementares.length === 0) {
			processo.classe = linha.cells[6].textContent;
		} else {
			processo.classe = linha.cells[6].firstChild.textContent;
			labelsDadosComplementares.forEach(label =>
				processo.dadosComplementares.add(label.textContent)
			);
		}
		processo.localizadores = LocalizadoresProcessoFactory.fromCelula(
			linha.cells[7]
		);
		var breakUltimoEvento = linha.cells[8].querySelector('br');
		processo.dataUltimoEvento = parseDataHora(
			breakUltimoEvento.previousSibling.textContent
		);
		processo.ultimoEvento = breakUltimoEvento.nextSibling.textContent;
		processo.dataInclusaoLocalizador = parseDataHora(
			linha.cells[9].textContent
		);
		var textoPrioridade = linha.cells[10].textContent;
		if (textoPrioridade === 'Sim') {
			processo.dadosComplementares.add('Prioridade Atendimento');
		}
		return processo;
	}
}
