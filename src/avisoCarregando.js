import avisoCarregandoFactory from './avisoCarregandoFactory';
import { safeQuery } from './helpers';

export default avisoCarregandoFactory({
	infraExibirAviso: window.infraExibirAviso,
	infraOcultarAviso: window.infraOcultarAviso,
	safeQuery,
});
