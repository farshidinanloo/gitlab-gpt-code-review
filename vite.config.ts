import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {crx, defineManifest} from '@crxjs/vite-plugin';

const manifest = defineManifest({
	manifest_version: 3,
	name: 'GitLab Code Review Assistant',
	version: '1.0.0',
	description: 'AI-powered code review assistant for GitLab merge requests',
	permissions: ['storage', 'activeTab', 'scripting', 'tabs'],
	host_permissions: ['<all_urls>'],
	action: {
		default_popup: 'index.html',
		default_icon: {
			'16': 'icon16.png',
			'48': 'icon16.png',
			'128': 'icon16.png',
		},
	},
	background: {
		service_worker: 'src/background/index.ts',
		type: 'module',
	},
	content_scripts: [
		{
			matches: ['<all_urls>'],
			js: ['src/content/content.tsx'],
			run_at: 'document_idle',
		},
	],
	icons: {
		'16': 'icon16.png',
		'48': 'icon16.png',
		'128': 'icon16.png',
	},
});

export default defineConfig({
	plugins: [react(), crx({manifest})],
	build: {
		rollupOptions: {
			input: {
				popup: 'index.html',
				background: 'src/background/index.ts',
				content: 'src/content/content.tsx',
			},
			output: {
				entryFileNames: '[name].js',
				chunkFileNames: '[name].js',
				assetFileNames: '[name].[ext]',
			},
		},
	},
});
