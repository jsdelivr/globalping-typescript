import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import module from 'node:module';
import childProcess from 'node:child_process';
import { after, before, describe, it } from 'node:test';

const require = module.createRequire(import.meta.url);

describe('dist', () => {
	before(() => {
		fs.cpSync(path.resolve(import.meta.dirname, '../package.json'), path.resolve(import.meta.dirname, '../node_modules/globalping/package.json'), { recursive: true });
		fs.cpSync(path.resolve(import.meta.dirname, '../dist'), path.resolve(import.meta.dirname, '../node_modules/globalping/dist'), { recursive: true });
	});

	after(() => {
		fs.rmSync('node_modules/globalping', { recursive: true, force: true });
	});

	describe('esm', () => {
		it('loads and works', async () => {
			const { default: GP, Globalping, ApiError } = await import('globalping');
			const globalping = new Globalping();

			assert.ok(GP);
			assert.ok(ApiError);
			assert.ok(globalping.createMeasurement);
		});
	});

	describe('cjs', () => {
		it('loads and works', async () => {
			const { default: GP, Globalping, ApiError } = require('globalping');
			const globalping = new Globalping();

			assert.ok(GP);
			assert.ok(ApiError);
			assert.ok(globalping.createMeasurement);
		});

		it('provides CommonJS TypeScript declarations', () => {
			const result = childProcess.spawnSync(process.execPath, [
				path.resolve(import.meta.dirname, '../node_modules/typescript/bin/tsc'),
				'--project',
				path.resolve(import.meta.dirname, 'fixtures/cjs-consumer'),
				'--listFiles',
			], {
				encoding: 'utf8',
			});

			assert.strictEqual(result.status, 0, result.stdout || result.stderr);
			const listedFiles = result.stdout.replaceAll('\\', '/');
			const cjsDeclaration = path.resolve(import.meta.dirname, '../node_modules/globalping/dist/cjs/bundle.d.cts').replaceAll('\\', '/');
			assert.ok(
				listedFiles.includes(cjsDeclaration),
				'The CommonJS consumer did not resolve the CommonJS declaration entry point.',
			);
		});
	});
});
