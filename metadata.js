export default {
	name: 'Processos prioritários',
	namespace: 'http://nadameu.com.br/processos-prioritarios',
	include: [
		/^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao\=usuario_tipo_monitoramento_localizador_listar\&/,
		/^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao\=localizador_processos_lista\&/,
		/^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao\=localizador_orgao_listar\&/,
		/^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao\=relatorio_geral_listar\&/,
		/^https:\/\/eproc\.(jf(pr|rs|sc)|trf4)\.jus\.br\/eproc(V2|2trf4)\/controlador\.php\?acao\=[^&]+\&acao_origem=principal\&/,
	],
	grant: 'none',
};
