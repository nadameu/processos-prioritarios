//@ts-check

import { apenasData } from './helpers';

/**
 * @typedef Area
 * @prop {string} corFundo
 * @prop {Linha}  linha
 * @prop {Margens} margens
 * @prop {DimensoesArea} dimensoes
 */

/**
 * @typedef Barras
 * @prop {number} espacamento
 * @prop {string} corVencido
 * @prop {string} corProximosDias
 * @prop {string} corNoPrazo
 * @prop {{(): number}} largura
 */

/**
 * @typedef Categorias
 * @prop {{(): number}} distancia
 * @prop {number} quantidade
 */

/**
 * @typedef DimensoesArea
 * @prop {number} altura
 * @prop {number} largura
 */

/**
 * @typedef DimensoesGrafico
 * @prop {{(): number}} largura
 * @prop {number} altura
 * @prop {number} margem
 * @prop {number} espacamento
 */

/**
 * @typedef Escala
 * @prop {number} largura
 * @prop {number} maximo
 * @prop {number} unidadePrimaria
 * @prop {number} unidadeSecundaria
 * @prop {Linha} linhaPrimaria
 * @prop {Linha} linhaSecundaria
 */

/**
 * @typedef Linha
 * @prop {number} espessura
 * @prop {string} cor
 */

/**
 * @typedef Margens
 * @prop {number} t
 * @prop {number} r
 * @prop {number} b
 * @prop {number} l
 */

/**
 * @typedef Texto
 * @prop {number} altura
 * @prop {string} cor
 * @prop {string} corSecundaria
 */

export default class Grafico {
	/** @return {Area} */
	area() {
		const espessuraLinha = 1;
		const margemExterna =
			this.dimensoes.margem +
			this.linha.espessura / 2 +
			this.dimensoes.espacamento +
			espessuraLinha / 2;
		const margens = {
			t: margemExterna + this.texto.altura / 2,
			r: margemExterna,
			b: margemExterna + this.texto.altura + this.dimensoes.espacamento,
			l: margemExterna + this.escala.largura + 2 * this.dimensoes.espacamento,
		};
		const dimensoes = {
			largura: this.dimensoes.largura() - margens.l - margens.r,
			altura: this.dimensoes.altura - margens.t - margens.b,
		};
		return {
			corFundo: 'rgba(102, 102, 102, 0.25)',
			linha: { espessura: espessuraLinha, cor: '#666' },
			margens,
			dimensoes,
		};
	}
	/** @type {DimensoesGrafico} */
	dimensoes = {
		largura() {
			return Math.min(
				1024,
				document.querySelector('#divInfraAreaTelaD').clientWidth
			);
		},
		altura: 400,
		margem: 3,
		espacamento: 5,
	};
	/** @type {Linha} */
	linha = { espessura: 1, cor: 'rgba(255, 255, 255, 0.9)' };
	/** @type {string} */
	corFundo = 'rgb(51, 51, 51)';
	/** @type {Texto} */
	texto = {
		altura: 10,
		cor: 'hsla(180, 100%, 87%, 0.87)',
		corSecundaria: 'hsla(180, 100%, 87%, 0.5)',
	};
	/** @type {Escala} */
	escala = {
		maximo: 20,
		unidadePrimaria: 10,
		unidadeSecundaria: 5,
		largura: 2 * this.texto.altura,
		linhaPrimaria: { espessura: 2, cor: '#888' },
		linhaSecundaria: { espessura: 0.5, cor: '#666' },
	};
	/** @type {Categorias} */
	categorias = {
		quantidade: 1,
		distancia() {
			return this.area().dimensoes.largura / this.categorias.quantidade;
		},
	};
	/** @type {Barras} */
	barras = {
		corVencido: 'hsla(15, 80%, 75%, 1)',
		corProximosDias: 'hsla(60, 100%, 75%, 1)',
		corNoPrazo: 'hsla(120, 75%, 80%, 1)',
		espacamento: 0.2,

		/* valor entre 0 e 1, proporcional à largura disponível */
		largura() {
			return this.categorias.distancia * (1 - this.barras.espacamento);
		},
	};
	/** @type {HTMLCanvasElement} */
	canvas;
	/** @type {CanvasRenderingContext2D} */
	context;
	/** @type {Map<number, number>} */
	dados;
	constructor() {
		const canvas = document.createElement('canvas');
		canvas.width = this.dimensoes.largura();
		canvas.height = this.dimensoes.altura;
		this.canvas = canvas;
		this.context = this.canvas.getContext('2d');
		this.dados = new Map();
	}
	/**
	 * @param {Map<number, number>} dados
	 */
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
		context.fillRect(0, 0, this.dimensoes.largura(), this.dimensoes.altura);
		context.beginPath();
		let x = this.dimensoes.margem;
		let y = this.dimensoes.margem;
		let w = this.dimensoes.largura() - 2 * this.dimensoes.margem;
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
			this.area().margens.l,
			this.area().margens.t,
			this.area().dimensoes.largura,
			this.area().dimensoes.altura
		);
		context.fillStyle = this.area().corFundo;
		context.fill();
		context.lineWidth = this.area().linha.espessura;
		context.strokeStyle = this.area().linha.cor;
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
		const wLinha = this.area().dimensoes.largura + this.dimensoes.espacamento;
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
				this.area().margens.b -
				proporcao * this.area().dimensoes.altura;
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
				this.categorias.distancia()
		);
		const hoje = apenasData(Date.now());
		context.fillStyle = this.texto.cor;
		const y =
			this.dimensoes.altura -
			(this.dimensoes.margem +
				this.linha.espessura / 2 +
				this.area().margens.b) /
				2;
		for (let i = 0; i < this.categorias.quantidade; i += step) {
			const dia = new Date(
				hoje.getFullYear(),
				hoje.getMonth(),
				hoje.getDate() + i
			);
			const x = this.area().margens.l + (i + 0.5) * this.categorias.distancia();
			context.fillText(dia.getDate().toString(), x, y);
		}
	}
	desenharBarras() {
		const context = this.context;
		const hoje = apenasData(Date.now());
		const larguraBarra =
			this.categorias.distancia() * (1 - this.barras.espacamento);
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
					this.area().margens.l +
					(i + 0.5) * this.categorias.distancia() -
					larguraBarra / 2;
				let valor = this.dados.get(dia.getTime());
				let altura = valor / this.escala.maximo * this.area().dimensoes.altura;
				let y = this.dimensoes.altura - this.area().margens.b - altura;
				context.fillRect(x, y, larguraBarra, altura);
			}
		}
	}
	calcularEscala() {
		const maximo = Math.max(...this.dados.values());
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
		const largura = context.measureText(this.escala.maximo.toString()).width;
		this.escala.largura = largura;
	}
	calcularCategorias() {
		const minimo = apenasData(Date.now()).getTime();
		const dias = [minimo].concat(Array.from(this.dados.keys()));
		const maximo = Math.max(...dias);
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
				novoMaximo / novoIntervalo * distancia <=
				this.area().dimensoes.altura
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
