import './includes/estilos.scss';
import { Localizador } from './LocalizadoresFactory';

let construindo = false;
let button: HTMLButtonElement;
let progresso: HTMLProgressElement;
let saida: HTMLOutputElement;

var invalidSymbols = /[&<>"]/g;
var replacementSymbols: { [key: string]: string } = {
	'&': 'amp',
	'<': 'lt',
	'>': 'gt',
	'"': 'quot',
};
function safeHTML(strings: string[], ...vars: string[]) {
	return vars.reduce(
		(result, variable, i) =>
			result +
			variable.replace(invalidSymbols, sym => `&${replacementSymbols[sym]};`) +
			strings[i + 1],
		strings[0]
	);
}

export class GUI {
	atualizarGrafico: () => void = () => {};
	constructor() {
		if (!construindo) {
			throw new Error(
				'Classe deve ser instanciada usando o método .getInstance().'
			);
		}
	}
	atualizarVisualizacao(localizador: Localizador, filtrado = false) {
		var linha = localizador.linha;
		const DIAS_A_FRENTE = 3;
		var avisos = [
			'Processos com prazo excedido em dobro',
			'Processos com prazo vencido',
			`Processos com prazo a vencer nos próximos ${DIAS_A_FRENTE} dias`,
			'Processos no prazo',
		];
		const MILISSEGUNDOS_EM_UM_DIA = 864e5;
		const ULTIMA_HORA = 23;
		const ULTIMO_MINUTO = 59;
		const ULTIMO_SEGUNDO = 59;
		const ULTIMO_MILISSEGUNDO = 999;
		const agora = new Date();
		const aVencer = new Date(
			agora.getFullYear(),
			agora.getMonth(),
			agora.getDate() + DIAS_A_FRENTE,
			ULTIMA_HORA,
			ULTIMO_MINUTO,
			ULTIMO_SEGUNDO,
			ULTIMO_MILISSEGUNDO
		);
		const atrasoAVencer =
			(agora.getTime() - aVencer.getTime()) / MILISSEGUNDOS_EM_UM_DIA;
		var prioridades = [
			localizador.processos.filter(processo => processo.atrasoPorcentagem >= 1),
			localizador.processos.filter(
				processo => processo.atraso >= 0 && processo.atrasoPorcentagem < 1
			),
			localizador.processos.filter(
				processo => processo.atraso < 0 && processo.atraso >= atrasoAVencer
			),
			localizador.processos.filter(processo => processo.atraso < atrasoAVencer),
		];
		var baloes = prioridades.map(function(processos, indicePrioridade) {
			return `<span id="gmLocalizador${
				localizador.id
			}Prioridade${indicePrioridade}" class="gmProcessos gmPrioridade${indicePrioridade}${processos.length > 0 ? '' : ' gmVazio'}" onmouseover="infraTooltipMostrar(&quot;${avisos[indicePrioridade]}&quot;);" onmouseout="infraTooltipOcultar();">${processos.length}</span>`;
		});
		var conteudo = [];
		if (!(localizador.sigla || localizador.nome)) {
			conteudo.push(localizador.siglaNome);
		} else if (localizador.sigla) {
			if (localizador.nome !== localizador.sigla) {
				if (isContained(localizador.sigla, localizador.nome)) {
					conteudo.push(localizador.nome);
				} else {
					conteudo.push(`${localizador.sigla} (${localizador.nome})`);
				}
			} else {
				conteudo.push(localizador.sigla);
			}
		} else {
			conteudo.push(localizador.nome);
		}
		if (localizador.lembrete) {
			conteudo.push(' ');
			conteudo.push(
				`<img class="infraImgNormal" src="../../../infra_css/imagens/balao.gif" style="width:0.9em; height:0.9em; opacity:1; border-width:0;" onmouseover="${safeHTML`return infraTooltipMostrar('${
					localizador.lembrete
				}','',400);`}" onmouseout="return infraTooltipOcultar();"/>`
			);
		}
		var processosComPeticao = localizador.processos.filter(processo => {
			let localizadoresPeticao = processo.localizadores.filter(
				localizadorProcesso =>
					localizadorProcesso.sigla === 'PETIÇÃO' ||
					localizadorProcesso.sigla === 'SUSPENSOS-RETORNO'
			);
			return localizadoresPeticao.length > 0;
		});
		const OCULTAR_BALOES_COM_MAIS_DE = 99;
		baloes.unshift(
			`<span id="gmLocalizador${localizador.id}Peticoes" class="gmPeticoes${
				processosComPeticao.length > 0 ? '' : ' gmVazio'
			}" onmouseover="infraTooltipMostrar(&quot;Processos com localizador PETIÇÃO ou SUSPENSOS-RETORNO&quot;);" onmouseout="infraTooltipOcultar();">${
				processosComPeticao.length > OCULTAR_BALOES_COM_MAIS_DE
					? '+'
					: processosComPeticao.length
			}</span>`
		);
		conteudo.push('<div class="gmBaloes">');
		conteudo.push(baloes.join(''));
		conteudo.push('</div>');
		linha.cells[0].innerHTML = conteudo.join('');
		if (localizador.quantidadeProcessosNaoFiltrados > 0) {
			var container = document.createElement('span');
			container.className = 'gmBotoesLocalizador';
			if (filtrado) {
				linha.classList.add('gmFiltrado');
			} else {
				linha.classList.remove('gmFiltrado');
				var filtrar = document.createElement('a');
				filtrar.setAttribute(
					'onmouseover',
					'infraTooltipMostrar("Excluir processos com prazos em aberto.");'
				);
				filtrar.setAttribute('onmouseout', 'infraTooltipOcultar();');
				filtrar.setAttribute('onclick', 'infraTooltipOcultar();');
				filtrar.className = 'gmFiltrar';
				filtrar.textContent = 'Filtrar';
				filtrar.addEventListener(
					'click',
					function(evt) {
						evt.preventDefault();
						evt.stopPropagation();
						Array.from(
							document.getElementsByClassName('gmDetalhesAberto')
						).forEach(function(balaoAberto) {
							let linhaAberta = balaoAberto.parentElement;
							while (linhaAberta && linhaAberta.tagName.toLowerCase() !== 'tr')
								linhaAberta = linhaAberta.parentElement;
							if (linhaAberta && linhaAberta === linha) {
								balaoAberto.classList.remove('gmDetalhesAberto');
								Array.from(
									document.getElementsByClassName('gmDetalhes')
								).forEach(function(linhaAntiga) {
									linha.parentElement.removeChild(linhaAntiga);
								});
							}
						});
						var gui = GUI.getInstance();
						gui.avisoCarregando.exibir(
							'Filtrando processos com prazo em aberto...'
						);
						gui.avisoCarregando.atualizar(0, localizador.quantidadeProcessos);
						localizador.excluirPrazosAbertos().then(function() {
							gui.avisoCarregando.ocultar();
							gui.atualizarVisualizacao(localizador, true);
							gui.atualizarGrafico();
						});
					},
					false
				);
				container.appendChild(filtrar);
			}
			var atualizar = document.createElement('a');
			atualizar.className = 'gmAtualizar';
			atualizar.textContent = 'Atualizar';
			atualizar.addEventListener(
				'click',
				function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
					Array.from(
						document.getElementsByClassName('gmDetalhesAberto')
					).forEach(function(balaoAberto) {
						let linhaAberta = balaoAberto.parentElement;
						while (linhaAberta && linhaAberta.tagName.toLowerCase() !== 'tr')
							linhaAberta = linhaAberta.parentElement;
						if (linhaAberta && linhaAberta === linha) {
							balaoAberto.classList.remove('gmDetalhesAberto');
							Array.from(document.getElementsByClassName('gmDetalhes')).forEach(
								function(linhaAntiga) {
									linha.parentElement.removeChild(linhaAntiga);
								}
							);
						}
					});
					var gui = GUI.getInstance();
					gui.avisoCarregando.exibir('Atualizando...');
					gui.avisoCarregando.atualizar(
						0,
						localizador.quantidadeProcessosNaoFiltrados
					);
					localizador.obterProcessos().then(function() {
						gui.avisoCarregando.ocultar();
						gui.atualizarVisualizacao(localizador);
						gui.atualizarGrafico();
					});
				},
				false
			);
			container.appendChild(atualizar);
			var divExistente = linha.cells[0].querySelector('div');
			divExistente.insertBefore(container, divExistente.firstChild);
		}
		function alternarDetalhes(balao, processos, indicePrioridade) {
			Array.from(document.getElementsByClassName('gmDetalhes')).forEach(
				function(linhaAntiga) {
					linha.parentElement.removeChild(linhaAntiga);
				}
			);
			if (balao.classList.contains('gmDetalhesAberto')) {
				balao.classList.remove('gmDetalhesAberto');
				return;
			}
			Array.from(document.getElementsByClassName('gmDetalhesAberto')).forEach(
				function(balaoAberto) {
					balaoAberto.classList.remove('gmDetalhesAberto');
				}
			);
			balao.classList.add('gmDetalhesAberto');
			const MENOR = -1,
				MAIOR = +1;
			processos.sort((a, b) => {
				if (a.termoPrazoCorregedoria < b.termoPrazoCorregedoria) return MENOR;
				if (a.termoPrazoCorregedoria > b.termoPrazoCorregedoria) return MAIOR;
				return 0;
			});
			processos.forEach(function(processo, indiceProcesso) {
				var linhaNova = linha.parentElement.insertRow(
					linha.rowIndex + 1 + indiceProcesso
				);
				var atraso = Math.round(processo.atraso);
				linhaNova.className = 'infraTrClara gmDetalhes';
				const DIGITOS_CLASSE = 6,
					DIGITOS_COMPETENCIA = 2;
				linhaNova.dataset.classe = (
					'0'.repeat(DIGITOS_CLASSE) + processo.numClasse
				).substr(-DIGITOS_CLASSE);
				linhaNova.dataset.competencia = (
					'0'.repeat(DIGITOS_COMPETENCIA) + processo.numCompetencia
				).substr(-DIGITOS_COMPETENCIA);
				var textoData;
				switch (processo.campoDataConsiderada) {
					case 'dataSituacao':
						switch (processo.situacao) {
							case 'MOVIMENTO-AGUARDA DESPACHO':
								textoData = 'Data da conclusão para despacho';
								break;
							case 'MOVIMENTO-AGUARDA SENTENÇA':
								textoData = 'Data da conclusão para sentença';
								break;
							default:
								textoData = 'Data de alteração da situação';
								break;
						}
						break;
					case 'dataUltimoEvento':
						textoData = 'Data do último evento';
						break;
					case 'dataInclusaoLocalizador':
						textoData = 'Data de inclusão no localizador';
						break;
					default:
						throw new Error('Campo "data considerada" desconhecido.');
				}
				const MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM = 2,
					MAXIMO_PRIORIDADE_DOIS_OU_MAIOR = 1,
					DIAS_BAIXO = 3,
					IDEAL = 0.5;
				var indicePrioridadeProcesso = indicePrioridade;
				if (typeof indicePrioridade === 'undefined') {
					prioridades.forEach((processos, indice) => {
						if (processos.includes(processo)) {
							indicePrioridadeProcesso = indice;
						}
					});
				}
				var esperado = processo.prazoCorregedoria;
				var minimo = 0;
				var maximo =
					esperado *
					(indicePrioridadeProcesso > 1
						? MAXIMO_PRIORIDADE_DOIS_OU_MAIOR
						: MAXIMO_PRIORIDADE_MENOR_OU_IGUAL_A_UM);
				var baixo = esperado - DIAS_BAIXO;
				var alto = esperado;
				var ideal = esperado * IDEAL;
				var valor = esperado + atraso;
				const PCT = 100;
				var porcentagem = `${Math.round(
					PCT + processo.atrasoPorcentagem * PCT
				)}%`;
				var localizadoresExtra = processo.localizadores
					.filter(loc => loc.id !== localizador.id)
					.map(loc => loc.sigla);
				linhaNova.innerHTML = [
					'<td>',
					safeHTML`<img class="gmLembreteProcesso${
						processo.lembretes.length === 0 ? ' gmLembreteProcessoVazio' : ''
					}" src="../../../infra_css/imagens/balao.gif" onmouseover="return infraTooltipMostrar('${processo.lembretes
						.map(lembrete => lembrete.replace(/\n/g, '<br>'))
						.join(
							'<hr style="border-width: 0 0 1px 0;">'
						)}', 'Lembretes', 400);" onmouseout="return infraTooltipOcultar();">`,
					[
						`<a href="${processo.link}">${processo.numprocFormatado}</a>`,
						`<abbr title="${textoData}">${processo[
							processo.campoDataConsiderada
						]
							.toLocaleString()
							.substr(0, 10)}</abbr> + ${esperado
							.toString()
							.replace(/\.5$/, '&half;')}${
							esperado >= 2 ? ' dias' : ' dia'
						} = ${processo.termoPrazoCorregedoria
							.toLocaleString()
							.substr(0, 10)}`,
					].join(' | '),
					`<span class="gmDetalheClasse"> | ${processo.classe.toUpperCase()}</span>`,
					localizadoresExtra.length > 0
						? localizadoresExtra
								.map(loc => `<span class="gmLocalizadorExtra">${loc}</span>`)
								.join(' ')
						: '',
					'</td>',
					'<td>',
					`<meter ${
						indicePrioridadeProcesso < 2 ? ' class="gmExcesso"' : ''
					} min="${minimo}" max="${maximo}" low="${baixo}" high="${alto}" optimum="${ideal}" value="${valor}">${atraso}</meter>`,
					`<span class="gmPorcentagem">${porcentagem}</span><span class="gmDiasParaFim"> | ${
						processo.atraso >= 0 ? 'Prazo excedido há ' : ''
					}`,
					Math.abs(atraso) < 1
						? processo.atraso >= 0
							? 'menos de um'
							: 'Menos de um'
						: Math.abs(atraso),
					Math.abs(atraso) > 1 ? ' dias ' : ' dia ',
					processo.atraso < 0 ? 'até o fim do prazo' : '',
					processo.prioridade
						? '</span> <span class="gmPrioridade">(Prioridade)</span>'
						: '',
					'</td>',
				].join('');
			});
		}
		prioridades.forEach(function(processos, indicePrioridade) {
			var balao = document.getElementById(
				`gmLocalizador${localizador.id}Prioridade${indicePrioridade}`
			);
			balao.addEventListener(
				'click',
				function(evt) {
					evt.preventDefault();
					evt.stopPropagation();
					alternarDetalhes(balao, processos, indicePrioridade);
				},
				false
			);
		});
		const balaoPeticoes = document.getElementById(
			`gmLocalizador${localizador.id}Peticoes`
		);
		balaoPeticoes.addEventListener(
			'click',
			function(evt) {
				evt.preventDefault();
				evt.stopPropagation();
				alternarDetalhes(balaoPeticoes, processosComPeticao);
			},
			false
		);
	}
	avisoCarregando = {
		acrescentar(qtd) {
			if (!progresso || !saida) {
				throw new Error('Aviso ainda não foi exibido.');
			}
			var atual = progresso.value,
				total = progresso.max;
			this.atualizar(atual + qtd, total);
		},
		atualizar(atual, total) {
			if (!progresso || !saida) {
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
	criarBotaoAcao(localizadores) {
		var frag = document.createDocumentFragment();
		var area = document.getElementById('divInfraAreaTelaD');
		button = document.createElement('button');
		button.textContent = 'Analisar conteúdo dos localizadores';
		frag.appendChild(button);
		frag.appendChild(document.createElement('br'));
		function criarCheckboxMostrar(
			id,
			padrao,
			[classeTrue, classeFalse],
			texto
		) {
			var input = document.createElement('input');
			input.type = 'checkbox';
			function onChange() {
				localStorage.setItem(id, input.checked ? 'S' : 'N');
				if (input.checked) {
					if (classeFalse !== '') document.body.classList.remove(classeFalse);
					if (classeTrue !== '') document.body.classList.add(classeTrue);
				} else {
					if (classeTrue !== '') document.body.classList.remove(classeTrue);
					if (classeFalse !== '') document.body.classList.add(classeFalse);
				}
			}
			input.checked = localStorage.hasOwnProperty(id)
				? localStorage.getItem(id) === 'S'
				: padrao;
			input.addEventListener('click', onChange);
			var gui = GUI.getInstance();
			input.addEventListener('click', () => {
				Array.from(document.querySelectorAll('.gmDetalhes')).forEach(detalhe =>
					detalhe.parentNode.removeChild(detalhe)
				);
				localizadores.forEach(localizador =>
					gui.atualizarVisualizacao(localizador)
				);
				if (typeof gui.atualizarGrafico === 'function') gui.atualizarGrafico();
			});
			onChange();
			var label = document.createElement('label');
			label.textContent = texto;
			label.insertBefore(input, label.firstChild);
			return label;
		}
		var labelClasses = criarCheckboxMostrar(
			'mostrarClasses',
			true,
			['', 'gmNaoMostrarClasses'],
			' Mostrar classe dos processos'
		);
		frag.appendChild(labelClasses);
		frag.appendChild(document.createElement('br'));
		var labelDias = criarCheckboxMostrar(
			'mostrarDiasParaFim',
			true,
			['', 'gmNaoMostrarDiasParaFim'],
			' Mostrar dias para o fim do prazo'
		);
		frag.appendChild(labelDias);
		frag.appendChild(document.createElement('br'));
		var labelConsiderarDataInclusaoLocalizador = criarCheckboxMostrar(
			'considerarDataInclusaoLocalizador',
			false,
			['gmConsiderarDataInclusaoLocalizador', ''],
			'Entre data do último evento e da inclusão no localizador, considerar a mais antiga'
		);
		frag.appendChild(labelConsiderarDataInclusaoLocalizador);
		frag.appendChild(document.createElement('br'));
		var labelPrazoMetade = criarCheckboxMostrar(
			'prazoMetade',
			true,
			['gmPrazoMetade', ''],
			'Conceder metade do prazo normal para processos prioritários'
		);
		frag.appendChild(labelPrazoMetade);
		frag.appendChild(document.createElement('br'));
		area.insertBefore(frag, area.firstChild);
		return button;
	}
	atualizarBotaoAcao() {
		if (button) {
			button.textContent = 'Atualizar';
		}
	}
	criarGrafico(localizadores) {
		function excluirCanvasAntigo() {
			const canvases = document.getElementsByTagName('canvas');
			if (canvases.length > 0) {
				console.log('Excluindo canvas antigo');
				Array.from(canvases).forEach(canvas =>
					canvas.parentNode.removeChild(canvas)
				);
			}
		}
		function extrairProcessos(localizadores) {
			const processos = new Map();
			const agora = new Date(),
				hoje = new Date(agora.getFullYear(), agora.getMonth(), agora.getDate());
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
			for (let timestamp of processos.values()) {
				let valorAtual = datas.get(timestamp) || 0;
				datas.set(timestamp, valorAtual + 1);
			}
			return datas;
		}
		const Grafico = (function() {
			class Grafico {
				get area() {
					var area = {
						corFundo: 'rgba(102, 102, 102, 0.25)',
						linha: { espessura: 1, cor: '#666' },
					};
					const margemExterna =
						this.dimensoes.margem +
						this.linha.espessura / 2 +
						this.dimensoes.espacamento +
						area.linha.espessura / 2;
					area.margens = {
						t: margemExterna + this.texto.altura / 2,
						r: margemExterna,
						b: margemExterna + this.texto.altura + this.dimensoes.espacamento,
						l:
							margemExterna +
							this.escala.largura +
							2 * this.dimensoes.espacamento,
					};
					area.dimensoes = {
						largura: this.dimensoes.largura - area.margens.l - area.margens.r,
						altura: this.dimensoes.altura - area.margens.t - area.margens.b,
					};
					return area;
				}
				constructor() {
					this.dimensoes = {
						get largura() {
							return Math.min(
								1024,
								document.querySelector('#divInfraAreaTelaD').clientWidth
							);
						},
						altura: 400,
						margem: 3,
						espacamento: 5,
					};
					this.linha = { espessura: 1, cor: 'rgba(255, 255, 255, 0.9)' };
					this.corFundo = 'rgb(51, 51, 51)';
					this.texto = {
						altura: 10,
						cor: 'hsla(180, 100%, 87%, 0.87)',
						corSecundaria: 'hsla(180, 100%, 87%, 0.5)',
					};
					this.escala = {
						maximo: 20,
						unidadePrimaria: 10,
						unidadeSecundaria: 5,
						largura: 2 * this.texto.altura,
						linhaPrimaria: { espessura: 2, cor: '#888' },
						linhaSecundaria: { espessura: 0.5, cor: '#666' },
					};
					let self = this;
					this.categorias = {
						quantidade: 1,
						get distancia() {
							return self.area.dimensoes.largura / self.categorias.quantidade;
						},
					};
					this.barras = {
						corVencido: 'hsla(15, 80%, 75%, 1)',
						corProximosDias: 'hsla(60, 100%, 75%, 1)',
						corNoPrazo: 'hsla(120, 75%, 80%, 1)',
						espacamento: 0.2,
						/* valor entre 0 e 1, proporcional à largura disponível */ get largura() {
							return self.categorias.distancia * (1 - self.barras.espacamento);
						},
					};
					const canvas = document.createElement('canvas');
					canvas.width = this.dimensoes.largura;
					canvas.height = this.dimensoes.altura;
					this.canvas = canvas;
					this.context = this.canvas.getContext('2d');
					this.dados = new Map();
				}
				inserirDados(dados) {
					this.dados = dados;
				}
				render() {
					this.calcularEscala();
					this.calcularLarguraEscala();
					this.calcularCategorias();
					this.desenharFundo();
					this.desenharArea();
					this.desenharEscala();
					this.desenharCategorias();
					this.desenharBarras();
					return this.canvas;
				}
				desenharFundo() {
					const context = this.context;
					context.fillStyle = this.corFundo;
					context.fillRect(0, 0, this.dimensoes.largura, this.dimensoes.altura);
					context.beginPath();
					let x = this.dimensoes.margem;
					let y = x;
					let w = this.dimensoes.largura - 2 * this.dimensoes.margem;
					let h = this.dimensoes.altura - 2 * this.dimensoes.margem;
					context.rect(x, y, w, h);
					context.lineWidth = this.linha.espessura;
					context.strokeStyle = this.linha.cor;
					context.stroke();
				}
				desenharArea() {
					const context = this.context;
					context.beginPath();
					context.rect(
						this.area.margens.l,
						this.area.margens.t,
						this.area.dimensoes.largura,
						this.area.dimensoes.altura
					);
					context.fillStyle = this.area.corFundo;
					context.fill();
					context.lineWidth = this.area.linha.espessura;
					context.strokeStyle = this.area.linha.cor;
					context.stroke();
				}
				desenharEscala() {
					const context = this.context;
					const xTexto =
						this.dimensoes.margem +
						this.linha.espessura / 2 +
						this.dimensoes.espacamento +
						this.escala.largura / 2;
					const xLinha =
						xTexto + this.escala.largura / 2 + this.dimensoes.espacamento;
					const wLinha =
						this.area.dimensoes.largura + this.dimensoes.espacamento;
					for (
						let i = 0;
						i <= this.escala.maximo;
						i += this.escala.unidadeSecundaria
					) {
						if (i % this.escala.unidadePrimaria === 0) {
							context.fillStyle = this.texto.cor;
							context.strokeStyle = this.escala.linhaPrimaria.cor;
							context.lineWidth = this.escala.linhaPrimaria.espessura;
						} else {
							context.fillStyle = this.texto.corSecundaria;
							context.strokeStyle = this.escala.linhaSecundaria.cor;
							context.lineWidth = this.escala.linhaSecundaria.espessura;
						}
						let proporcao = i / this.escala.maximo;
						let y =
							this.dimensoes.altura -
							this.area.margens.b -
							proporcao * this.area.dimensoes.altura;
						context.fillText(i.toString(), xTexto, y);
						context.beginPath();
						context.moveTo(xLinha, y);
						context.lineTo(xLinha + wLinha, y);
						context.stroke();
					}
				}
				desenharCategorias() {
					const context = this.context;
					const larguraPossivelTexto = context.measureText('99').width;
					const step = Math.ceil(
						(larguraPossivelTexto + this.dimensoes.espacamento) /
							this.categorias.distancia
					);
					const agora = new Date(),
						hoje = new Date(
							agora.getFullYear(),
							agora.getMonth(),
							agora.getDate()
						);
					context.fillStyle = this.texto.cor;
					const y =
						this.dimensoes.altura -
						(this.dimensoes.margem +
							this.linha.espessura / 2 +
							this.area.margens.b) /
							2;
					for (let i = 0; i < this.categorias.quantidade; i += step) {
						let dia = new Date(
							hoje.getFullYear(),
							hoje.getMonth(),
							hoje.getDate() + i
						);
						let x = this.area.margens.l + (i + 0.5) * this.categorias.distancia;
						context.fillText(dia.getDate().toString(), x, y);
					}
				}
				desenharBarras() {
					const context = this.context;
					const agora = new Date(),
						hoje = new Date(
							agora.getFullYear(),
							agora.getMonth(),
							agora.getDate()
						);
					const larguraBarra =
						this.categorias.distancia * (1 - this.barras.espacamento);
					for (let i = 0; i < this.categorias.quantidade; i++) {
						if (i === 0) {
							context.fillStyle = this.barras.corVencido;
						} else if (i <= 3) {
							context.fillStyle = this.barras.corProximosDias;
						} else {
							context.fillStyle = this.barras.corNoPrazo;
						}
						let dia = new Date(
							hoje.getFullYear(),
							hoje.getMonth(),
							hoje.getDate() + i
						);
						if (this.dados.has(dia.getTime())) {
							let x =
								this.area.margens.l +
								(i + 0.5) * this.categorias.distancia -
								larguraBarra / 2;
							let valor = this.dados.get(dia.getTime());
							let altura =
								(valor / this.escala.maximo) * this.area.dimensoes.altura;
							let y = this.dimensoes.altura - this.area.margens.b - altura;
							context.fillRect(x, y, larguraBarra, altura);
						}
					}
				}
				calcularEscala() {
					const quantidades = Array.from(this.dados.values());
					const maximo = Math.max.apply(null, quantidades);
					this.calcularDadosEscala(maximo);
					const distanciaMinima =
						2 * this.dimensoes.espacamento + 2 * this.texto.altura;
					let secundariaOk = this.assegurarDistanciaMinima(
						'unidadeSecundaria',
						distanciaMinima
					);
					if (secundariaOk) return;
					let primariaOk = this.assegurarDistanciaMinima(
						'unidadePrimaria',
						distanciaMinima
					);
					if (primariaOk) {
						this.escala.unidadeSecundaria = this.escala.unidadePrimaria;
					} else {
						throw new Error('Não sei o que fazer');
					}
				}
				calcularLarguraEscala() {
					const context = this.context;
					context.textBaseline = 'middle';
					context.textAlign = 'center';
					context.font = `${this.texto.altura}px Arial`;
					const largura = context.measureText(this.escala.maximo.toString())
						.width;
					this.escala.largura = largura;
				}
				calcularCategorias() {
					const dias = Array.from(this.dados.keys());
					const agora = new Date(),
						hoje = new Date(
							agora.getFullYear(),
							agora.getMonth(),
							agora.getDate()
						);
					const minimo = hoje.getTime();
					const maximo = Math.max.apply(null, dias);
					const UM_DIA = 864e5;
					this.categorias.quantidade = (maximo - minimo) / UM_DIA + 1;
				}
				calcularDadosEscala(maximo) {
					if (maximo <= 10) {
						this.escala.unidadePrimaria = 10;
					} else {
						const ordem = Math.floor(Math.log(maximo) / Math.log(10));
						this.escala.unidadePrimaria = Math.pow(10, ordem);
					}
					this.escala.unidadeSecundaria = this.escala.unidadePrimaria / 10;
					this.escala.maximo =
						Math.ceil(maximo / this.escala.unidadeSecundaria) *
						this.escala.unidadeSecundaria;
				}
				assegurarDistanciaMinima(unidade, distancia) {
					let tamanhoIdealEncontrado = false;
					[1, 2, 2.5, 5, 10].forEach(mult => {
						if (tamanhoIdealEncontrado) return;
						let novoIntervalo = this.escala[unidade] * mult;
						if (novoIntervalo % 1 !== 0) return;
						let novoMaximo =
							Math.ceil(this.escala.maximo / novoIntervalo) * novoIntervalo;
						if (
							(novoMaximo / novoIntervalo) * distancia <=
							this.area.dimensoes.altura
						) {
							tamanhoIdealEncontrado = true;
							if (mult !== 1) {
								this.escala[unidade] *= mult;
								this.escala.maximo = novoMaximo;
							}
						}
					});
					return tamanhoIdealEncontrado;
				}
			}
			return Grafico;
		})();
		excluirCanvasAntigo();
		const processos = extrairProcessos(localizadores);
		const tabelaDatas = extrairDatas(processos);
		var grafico = new Grafico();
		grafico.inserirDados(tabelaDatas);
		document.getElementById('divInfraAreaTelaD').appendChild(grafico.render());
	}
	visitLocalizador(pvtVars) {
		return pvtVars;
	}

	static instance: GUI;
	static getInstance() {
		if (!GUI.instance) {
			construindo = true;
			GUI.instance = new GUI();
			construindo = false;
		}
		return GUI.instance;
	}
}
