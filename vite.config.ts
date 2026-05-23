import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({ 
	server: {
		allowedHosts: ['wg91mj0o3w6i.shares.zrok.io']
	},
	plugins: [tailwindcss(), sveltekit()] });
