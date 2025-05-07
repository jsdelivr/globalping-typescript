module.exports = {
	'exit': true,
	'timeout': 10000,
	// 'file': [
	// 	'test/setup.ts',
	// ],
	'spec': [
		'test/tests/e2e/**/*.ts',
	],
	'node-option': [
		'enable-source-maps',
		'experimental-specifier-resolution=node',
		'loader=ts-node/esm',
	],
};
