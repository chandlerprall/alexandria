import { Router } from 'napoleon';

const routes = {{routes}};

export const router = new Router();

for (let i = 0; i < routes.length; i++) {
	const route = routes[i];
	router.mount({
		name: route.id,
		url: route.slug,
		handler: () => {
			console.log('loading', route.articleFile)
			return import(`./articles/${route.articleFile}`)
		}
	});
}
