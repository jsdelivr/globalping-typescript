import { assert } from 'chai';
import { Globalping } from '../../../src/index.js';
import { TypedMeasurementRequest } from '../../../src/types.js';

describe('Globalping', () => {
	const globalping = new Globalping({ throwApiErrors: false });
	let validMeasurementId: string;

	describe('createMeasurement', () => {
		it('should create a measurement', async () => {
			const measurement: TypedMeasurementRequest = {
				type: 'ping',
				target: 'example.com',
			};

			const result = await globalping.createMeasurement(measurement);

			assert.ok(result.ok);
			assert.isString(result.data.id);
			assert.equal(result.data.probesCount, 1);

			validMeasurementId = result.data.id;
		});

		it('should return a validation error', async () => {
			const measurement: TypedMeasurementRequest = {
				type: 'ping',
				target: 'example.com',
				limit: 1000,
			};

			const result = await globalping.createMeasurement(measurement);

			Globalping.assertHttpStatus(400, result);
			assert.equal(result.data.error.type, 'validation_error');
			assert.isString(result.data.error.message);
			assert.isString(result.data.error.params?.limit);
		});
	});

	describe('getMeasurement', () => {
		it('should get a measurement', async () => {
			const result = await globalping.getMeasurement(validMeasurementId);

			assert.ok(result.ok);
			assert.equal(result.data.id, validMeasurementId);
			Globalping.assertMeasurementType('ping', result.data);
			assert.equal(result.data.measurementOptions?.packets, undefined);
		});

		it('should return a not found error', async () => {
			const result = await globalping.getMeasurement(`${validMeasurementId}-nope`);
			Globalping.assertHttpStatus(404, result);
		});
	});

	describe('awaitMeasurement', () => {
		it('should wait for measurement completion', async () => {
			const measurement: TypedMeasurementRequest = {
				type: 'ping',
				target: 'example.com',
				measurementOptions: {
					packets: 16,
				},
			};

			const result1 = await globalping.createMeasurement(measurement);
			assert.ok(result1.ok);

			const result2 = await globalping.awaitMeasurement(result1.data.id);

			assert.ok(result2.ok);
			assert.equal(result2.data.status, 'finished');
		});
	});

	describe('listProbes', () => {
		it('should list probes', async () => {
			const result = await globalping.listProbes();

			assert.ok(result.ok);
			assert.isAbove(result.data.length, 1000);
		});
	});

	describe('getLimits', () => {
		it('should get limits', async () => {
			const result = await globalping.getLimits();

			assert.ok(result.ok);
			assert.equal(result.data.rateLimit.measurements.create.type, 'ip');
			assert.isUndefined(result.data.credits);
		});
	});

	describe('misc', () => {
		it('should send the configured auth token', async () => {
			it('should get limits', async () => {
				const result = await new Globalping({ auth: 'xx' }).getLimits();
				Globalping.assertHttpStatus(429, result);
			});
		});

		it('should respect the configured timeout', async () => {
			try {
				await new Globalping({ timeout: 1 }).listProbes();
				assert.fail('Expected an error to be thrown.');
			} catch (error) {
				assert.instanceOf(error, DOMException);
				assert.oneOf(error.name, [ 'AbortError', 'TimeoutError' ]);
			}
		});
	});
});
