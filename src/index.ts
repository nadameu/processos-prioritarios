import { main } from './main';

main().then(
  x => console.log('Resultado:', x),
  e => console.error(e)
);
