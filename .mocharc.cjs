module.exports = {
	'exit': true,
	'timeout': 10000,
	// 'file': [
	// 	'test/setup.ts',
	// ],
	'spec': [
		'test/tests/integration/**/*.ts',
	],
	'node-option': [
		'enable-source-maps',
		'experimental-specifier-resolution=node',
		'loader=ts-node/esm',
	],
};
