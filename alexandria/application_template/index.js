import React from 'react';
import ReactDOM from 'react-dom';
import { router } from './routes';

const url = '/docs/guidelines';
const route = router.matchRoute('GET', url);
console.log(route);
route.handler().then(module => {
	const Component = module.default;
	ReactDOM.render(
		<Component/>,
		document.getElementById('app'),
	);
});
