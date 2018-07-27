import main from './main';
import { either } from '../adt/SEither';

either(e => console.error(e), x => (x ? console.log('Resultado:', x) : undefined), main(document));
