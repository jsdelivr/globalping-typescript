import json from '@rollup/plugin-json';
import nodeResolve from '@rollup/plugin-node-resolve';

export default {
	input: 'dist/esm/index.js',
	output: [
		{
			file: 'dist/cjs/bundle.cjs',
			format: 'cjs',
			exports: 'named',
			sourcemap: true,
		},
		{
			name: 'globalping',
			file: 'dist/umd/bundle.js',
			format: 'umd',
			exports: 'named',
			sourcemap: true,
		},
	],
	plugins: [
		json(),
		nodeResolve(),
	],
};
