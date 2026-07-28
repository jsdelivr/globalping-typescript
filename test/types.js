import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import module from 'node:module';
import { spawnSync } from 'node:child_process';
import { after, before, describe, it } from 'node:test';

const require = module.createRequire(import.meta.url);
const tscPath = require.resolve('typescript/bin/tsc');

const compileFixture = (fixture) => {
	const result = spawnSync(process.execPath, [
		tscPath,
		'--ignoreConfig',
		'--noEmit',
		'--strict',
		'--target',
		'ES2022',
		'--module',
		'NodeNext',
		'--moduleResolution',
		'NodeNext',
		'--moduleDetection',
		'legacy',
		'--types',
		'globalping',
		path.resolve(import.meta.dirname, `fixtures/${fixture}`),
	], {
		encoding: 'utf8',
	});

	return {
		status: result.status,
		output: `${result.stdout}${result.stderr}`,
	};
};

describe('types', () => {
	before(() => {
		fs.cpSync(path.resolve(import.meta.dirname, '../package.json'), path.resolve(import.meta.dirname, '../node_modules/globalping/package.json'), { recursive: true });
		fs.cpSync(path.resolve(import.meta.dirname, '../index.d.ts'), path.resolve(import.meta.dirname, '../node_modules/globalping/index.d.ts'));
		fs.cpSync(path.resolve(import.meta.dirname, '../dist'), path.resolve(import.meta.dirname, '../node_modules/globalping/dist'), { recursive: true });
	});

	after(() => {
		fs.rmSync('node_modules/globalping', { recursive: true, force: true });
	});

	it('exposes the UMD namespace to scripts', () => {
		const result = compileFixture('umd-global.ts');

		assert.equal(result.status, 0, result.output);
	});

	it('does not expose the UMD namespace as an ESM module global', () => {
		const result = compileFixture('umd-global.mts');

		assert.notEqual(result.status, 0, result.output);
		assert.match(result.output, /error TS2686:/);
		assert.doesNotMatch(result.output, /error TS2304:/);
	});

	it('does not expose the UMD namespace as a CommonJS module global', () => {
		const result = compileFixture('umd-global.cts');

		assert.notEqual(result.status, 0, result.output);
		assert.match(result.output, /error TS2686:/);
		assert.doesNotMatch(result.output, /error TS2304:/);
	});
});
