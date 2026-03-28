import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-static generates a static site.
		// fallback: 'index.html' enables SPA mode.
		adapter: adapter({
			fallback: 'index.html',
			strict: false
		})
	}
};

export default config;
