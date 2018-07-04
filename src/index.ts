import main from './main';

main(document)(
	e => {
		console.error(e);
	},
	x => {
		x && console.log('Resultado:', x);
	}
);
