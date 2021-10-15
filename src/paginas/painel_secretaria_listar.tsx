import * as console from '../Console';

import { h, Fragment } from '../dom';
import { assert } from '../assert';

export function paginaPainelSecretariaListar(doc: Document) {
	let barra, texto;
	try {
		barra = doc.querySelector('#divInfraBarraLocalizacao');
		assert(barra !== null);
		const tituloBarra = barra.querySelector('h4');
		assert(tituloBarra !== null);
		texto = tituloBarra.textContent;
		assert(texto !== null);
	} catch (e) {
		throw new Error('Não foi possível verificar o perfil do usuário.');
	}
	switch (texto) {
		case 'Painel do Diretor de Secretaria':
		case 'Painel do Diretor de Secretaria Substituto':
			criarBotao(barra);
			break;
	}
}

function Botao() {
	return (
		<>
			<button onclick={onClick}>Processos prioritários</button>
			<br />
		</>
	);
}

function criarBotao(barra: Element) {
	barra.parentNode!.insertBefore(<Botao />, barra.nextSibling);
}

function onClick(evt: MouseEvent) {
	console.log('Botão clicado', evt);
	try {
		const menu = document.querySelector('#main-menu');
		assert(menu !== null);
		const itens = analisarMenu(menu);
		const localizadorOrgaoListar = itens.get('localizador_orgao_listar');
	} catch (e) {
		console.error(e);
	}
}

function analisarMenu(menu: Element): Map<string, string> {
	return new Map(
		Array.from(menu.querySelectorAll<HTMLAnchorElement>('a[href]'), link => {
			const { href, searchParams } = new URL(link.href);
			return [searchParams.get('acao'), href] as [string | null, string];
		}).filter((x): x is [string, string] => x[0] !== null)
	);
}
