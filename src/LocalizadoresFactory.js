import GUI from './GUI';
import ProcessoFactory from './ProcessoFactory';
import { isContained, parseCookies } from './helpers';

var obterFormularioRelatorioGeral = function() {
	var promiseRelatorioGeral = new Promise(function(resolve, reject) {
		var links = document.querySelectorAll('#main-menu a[href]');
		var url = Array.from(links)
			.filter(
				link =>
					new URL(link.href).searchParams.get('acao') ===
					'relatorio_geral_listar'
			)
			.map(link => link.href)[0];
		var xml = new XMLHttpRequest();
		xml.open('GET', url);
		xml.responseType = 'document';
		xml.onerror = reject;
		xml.onload = resolve;
		xml.send(null);
	}).then(function({ target: { response: doc } }) {
		console.log('Página relatório geral obtida', doc);
		const consultar = doc.getElementById('btnConsultar');
		const form = consultar.form;
		return form;
	});
	obterFormularioRelatorioGeral = () => promiseRelatorioGeral;
	return obterFormularioRelatorioGeral();
};
function trataHTML({ target: { response: doc } }) {
	var pagina = Number(doc.getElementById('hdnInfraPaginaAtual').value);
	var quantidadeProcessosCarregados = parseInt(
		doc.getElementById('hdnInfraNroItens').value
	);
	var gui = GUI.getInstance();
	gui.avisoCarregando.acrescentar(quantidadeProcessosCarregados);
	var linhas = [
		...doc.querySelectorAll(
			'#divInfraAreaTabela > table > tbody > tr[class^="infraTr"]'
		),
	];
	linhas.forEach(function(linha) {
		this.processos.push(ProcessoFactory.fromLinha(linha));
	}, this);
	var proxima = doc.getElementById('lnkInfraProximaPaginaSuperior');
	if (proxima) {
		console.info('Buscando próxima página', this.nome || this.siglaNome);
		return this.obterPagina(pagina + 1, doc);
	}
	return this;
}
class Localizador {
	constructor() {
		this.id = null;
		this.linha = null;
		this.link = null;
		this.nome = null;
		this.processos = [];
		this.quantidadeProcessosNaoFiltrados = null;
		this.sigla = null;
		this.siglaNome = null;
	}

	obterPagina(pagina, doc) {
		var self = this;
		return new Promise(function(resolve, reject) {
			var url, data;
			if (pagina === 0) {
				url = self.link.href;
				data = new FormData();
				var camposPost = [
					'optchkcClasse',
					'optDataAutuacao',
					'optchkcUltimoEvento',
					'optNdiasSituacao',
					'optJuizo',
					'optPrioridadeAtendimento',
					'chkStatusProcesso',
				];
				camposPost.forEach(campo => data.set(campo, 'S'));
				data.set('paginacao', '100');
				data.set('hdnInfraPaginaAtual', pagina);
			} else {
				doc.getElementById('selLocalizador').value = self.id;
				var paginaAtual = doc.getElementById('hdnInfraPaginaAtual');
				paginaAtual.value = pagina;
				var form = paginaAtual.parentElement;
				while (form.tagName.toLowerCase() !== 'form') {
					form = form.parentElement;
				}
				url = form.action;
				data = new FormData(form);
			}
			var xml = new XMLHttpRequest();
			xml.open('POST', url);
			xml.responseType = 'document';
			xml.onerror = reject;
			xml.onload = resolve;
			xml.send(data);
		})
			.then(trataHTML.bind(this))
			.catch(console.error.bind(console));
	}
	obterPrazosPagina(pagina = 0) {
		const self = this;
		return obterFormularioRelatorioGeral()
			.then(function(form) {
				const url = form.action;
				const method = form.method;
				const data = new FormData();
				data.set('paginacao', '100');
				data.set('selPrazo', 'A');
				data.set('selLocalizadorPrincipal', self.id);
				data.set('selLocalizadorPrincipalSelecionados', self.id);
				data.set('optchkcClasse', 'S');
				data.set('hdnInfraPaginaAtual', pagina.toString());
				data.set('selRpvPrecatorio', 'null');
				return new Promise(function(resolve, reject) {
					var xml = new XMLHttpRequest();
					xml.open(method, url);
					xml.responseType = 'document';
					xml.onerror = reject;
					xml.onload = resolve;
					xml.send(data);
				});
			})
			.then(function({ target: { response: doc } }) {
				const tabela = doc.getElementById('tabelaLocalizadores');
				const quantidadeProcessosCarregados = parseInt(
					doc.getElementById('hdnInfraNroItens').value
				);
				if (tabela) {
					console.log(
						pagina,
						self.sigla,
						tabela.querySelector('caption').textContent
					);
					const linhasList = tabela.querySelectorAll('tr[data-classe]');
					const linhas = Array.from(linhasList);
					const processosComPrazoAberto = new Set();
					linhas.forEach(linha => {
						const link = linha.cells[1].querySelector('a[href]');
						const numproc = new URL(link.href).searchParams.get('num_processo');
						processosComPrazoAberto.add(numproc);
					});
					self.processos = self.processos.filter(
						processo => ! processosComPrazoAberto.has(processo.numproc)
					);
				} else {
					console.log(pagina, self.sigla, quantidadeProcessosCarregados);
				}
				if (doc.getElementById('lnkProximaPaginaSuperior')) {
					const paginaAtual = parseInt(
						doc.getElementById('selInfraPaginacaoSuperior').value
					);
					const paginaNova = paginaAtual < 2 ? 2 : paginaAtual + 1;
					return self.obterPrazosPagina.call(self, paginaNova);
				}
				const gui = GUI.getInstance();
				gui.avisoCarregando.acrescentar(parseInt(self.link.textContent));
				return self;
			});
	}
	excluirPrazosAbertos() {
		const link = this.link;
		if (! link.href) {
			return Promise.resolve(this);
		}
		return this.obterPrazosPagina(0).then(
			function() {
				this.link.textContent = this.processos.length;
				return this;
			}.bind(this)
		);
	}
	obterProcessos() {
		this.processos = [];
		var link = this.link;
		if (! link.href) {
			return Promise.resolve(this);
		}
		return this.obterPagina(0).then(
			function() {
				this.quantidadeProcessosNaoFiltrados = this.processos.length;
				this.link.textContent = this.processos.length;
				if (this.processos.length > 0) {
					var localizadorProcesso = this.processos[0].localizadores.filter(
						localizador => localizador.id === this.id
					)[0];
					if (! this.sigla) {
						this.sigla = localizadorProcesso.sigla;
					}
					if (this.sigla && this.nome) {
						this.siglaNome = [this.sigla, this.nome].join(' - ');
					}
					var siglaComSeparador = `${this.sigla} - `;
					this.nome = this.siglaNome.substr(siglaComSeparador.length);
					this.lembrete = localizadorProcesso.lembrete;
				}
				return this;
			}.bind(this)
		);
	}
	get quantidadeProcessos() {
		return Number(this.link.textContent);
	}
}

class LocalizadorFactory {
	static fromLinha(linha) {
		var localizador = new Localizador();
		localizador.linha = linha;
		const separador = ' - ';
		var siglaNome = linha.cells[0].textContent.split(separador);
		siglaNome.forEach((_, i) => {
			const qtdPartesSigla = i + 1;
			const sigla = siglaNome.slice(0, qtdPartesSigla).join(separador);
			const nome = siglaNome.slice(qtdPartesSigla).join(separador);
			if (isContained(sigla, nome)) {
				localizador.sigla = sigla;
				localizador.nome = nome;
			}
		});
		localizador.siglaNome = siglaNome.join(separador);
		var link = (localizador.link = linha.querySelector('a'));
		localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
		if (link.href) {
			var camposGet = new URL(link.href).searchParams;
			localizador.id = camposGet.get('selLocalizador');
		}
		return localizador;
	}

	static fromLinhaPainel(linha) {
		var localizador = new Localizador();
		localizador.linha = linha;
		localizador.nome = linha.cells[0].textContent.match(
			/^Processos com Localizador\s+"(.*)"$/
		)[1];
		var link = (localizador.link = linha.querySelector('a,u'));
		localizador.quantidadeProcessosNaoFiltrados = parseInt(link.textContent);
		if (link && link.href) {
			var camposGet = new URL(link.href).searchParams;
			localizador.id = camposGet.get('selLocalizador');
		}
		return localizador;
	}
}

function paraCadaLocalizador(fn) {
	var cookiesAntigos = parseCookies(document.cookie);
	var promises = this.map(fn);
	return Promise.all(promises).then(function() {
		var cookiesNovos = parseCookies(document.cookie);
		var expira = [new Date()]
			.map(d => {
				d.setFullYear(d.getFullYear() + 1);
				return d;
			})
			.map(d => d.toUTCString())
			.reduce((_, x) => x);
		for (let key in cookiesNovos) {
			const valorAntigo = cookiesAntigos[key];
			const valorNovo = cookiesNovos[key];
			if (typeof valorAntigo !== 'undefined' && valorNovo !== valorAntigo) {
				document.cookie = `${escape(key)}=${escape(
					valorAntigo
				)}; expires=${expira}`;
			}
		}
	});
}

class Localizadores extends Array {
	constructor() {
		super();
		this.tabela = null;
	}

	obterProcessos() {
		return paraCadaLocalizador.call(this, localizador =>
			localizador.obterProcessos()
		);
	}
	get quantidadeProcessos() {
		return this.reduce(
			(soma, localizador) => soma + localizador.quantidadeProcessos,
			0
		);
	}
	get quantidadeProcessosNaoFiltrados() {
		return this.reduce(
			(soma, localizador) => soma + localizador.quantidadeProcessosNaoFiltrados,
			0
		);
	}
}

export default class LocalizadoresFactory {
	static fromTabela(tabela) {
		var localizadores = new Localizadores();
		localizadores.tabela = tabela;
		var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
		linhas.forEach(function(linha) {
			localizadores.push(LocalizadorFactory.fromLinha(linha));
		});
		return localizadores;
	}
	static fromTabelaPainel(tabela) {
		var localizadores = new Localizadores();
		localizadores.tabela = tabela;
		var linhas = [...tabela.querySelectorAll('tr[class^="infraTr"]')];
		linhas.forEach(function(linha) {
			localizadores.push(LocalizadorFactory.fromLinhaPainel(linha));
		});
		return localizadores;
	}
}
