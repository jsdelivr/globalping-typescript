import { defaultPlugins, defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
	input: 'https://api.globalping.io/v1/spec.yaml',
	output: {
		path: 'src/openapi-ts',
	},
	plugins: [
		...defaultPlugins,
		{
			name: '@hey-api/client-fetch',
		},
		{
			name: '@hey-api/typescript',
			enums: 'javascript',
			exportInlineEnums: true,
		},
	],
});
