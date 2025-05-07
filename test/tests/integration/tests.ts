import { JSDOM } from 'jsdom';
import { assert } from 'chai';
import fetchMock from 'fetch-mock';
import { Globalping, ApiError } from '../../../src/index.js';
import { TypedMeasurementRequest } from '../../../src/types.js';
import { CreateMeasurementError, MeasurementStatus } from '../../../src/openapi-ts/index.js';

describe('Globalping', () => {
	before(() => {
		fetchMock.mockGlobal();
		const dom = new JSDOM('', { url: 'https://api.globalping.io' });
		global.location = dom.window.location;
	});

	afterEach(() => {
		fetchMock.removeRoutes();
		fetchMock.clearHistory();
	});

	after(() => {
		fetchMock.unmockGlobal();
	});

	describe('throwApiErrors: false', () => {
		const globalping = new Globalping({ throwApiErrors: false });

		describe('createMeasurement', () => {
			it('should create a measurement', async () => {
				const mockResponse = {
					status: 202,
					body: {
						id: '123',
						probesCount: 1,
					},
				};

				fetchMock.post('/v1/measurements', mockResponse);

				const measurement: TypedMeasurementRequest = {
					type: 'ping',
					target: 'example.com',
				};

				const result = await globalping.createMeasurement(measurement);

				if (result.ok) {
					assert.equal(result.data.id, mockResponse.body.id);
					assert.equal(result.data.probesCount, mockResponse.body.probesCount);
				}

				Globalping.assertHttpStatus(202, result);
				assert.equal(result.data.id, mockResponse.body.id);
				assert.equal(result.data.probesCount, mockResponse.body.probesCount);

				assert.ok(result.ok);
			});

			it('should return a validation error', async () => {
				const mockResponse = {
					status: 400,
					body: {
						error: {
							type: 'validation_error',
							message: 'Parameter validation failed.',
							params: {
								limit: '"limit" must be less than or equal to 500',
							},
						},
						links: {
							documentation: 'https://globalping.io/docs/api.globalping.io#post-/v1/measurements',
						},
					},
				} as const;

				fetchMock.post('/v1/measurements', mockResponse);

				const measurement: TypedMeasurementRequest = {
					type: 'ping',
					target: 'example.com',
					limit: 1000,
				};

				const result = await globalping.createMeasurement(measurement);
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (!result.ok) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.equal(result.data.error.message, mockResponse.body.error.message);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.equal(result.data.error.message, mockResponse.body.error.message);
					assert.equal(result.data.error.params?.limit, mockResponse.body.error.params.limit);
				}

				assert.ok(!result.ok);
				assert.ok(resultHasExpectedStatus);
			});

			it('should return a no probes found error', async () => {
				const mockResponse = {
					status: 422,
					body: {
						error: {
							type: 'no_probes_found',
							message: 'No matching IPv4 probes available.',
						},
						links: {
							documentation: 'https://globalping.io/docs/api.globalping.io#post-/v1/measurements',
						},
					},
				} as const;

				fetchMock.post('/v1/measurements', mockResponse);

				const measurement: TypedMeasurementRequest = {
					type: 'ping',
					target: 'example.com',
					locations: 'some-non-existent-measurement-id',
				};

				const result = await globalping.createMeasurement(measurement);
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (!result.ok) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.equal(result.data.error.message, mockResponse.body.error.message);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.equal(result.data.error.message, mockResponse.body.error.message);
				}

				assert.ok(!result.ok);
				assert.ok(resultHasExpectedStatus);
			});

			it('should return a too many probes error', async () => {
				const mockResponse = {
					status: 429,
					body: {
						error: {
							type: 'too_many_probes',
							message: 'Too Many Probes Requested',
						},
						links: {
							documentation: 'https://globalping.io/docs/api.globalping.io#post-/v1/measurements',
						},
					},
				} as const;

				fetchMock.post('/v1/measurements', mockResponse);

				const measurement: TypedMeasurementRequest = {
					type: 'ping',
					target: 'example.com',
				};

				const result = await globalping.createMeasurement(measurement);
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (!result.ok) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.equal(result.data.error.message, mockResponse.body.error.message);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.equal(result.data.error.message, mockResponse.body.error.message);
				}

				assert.ok(!result.ok);
				assert.ok(resultHasExpectedStatus);
			});
		});

		describe('getMeasurement', () => {
			it('should get a measurement', async () => {
				const mockResponse = {
					status: 200,
					body: {
						id: '123',
						type: 'ping',
						target: 'example.com',
						status: MeasurementStatus.IN_PROGRESS,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						probesCount: 1,
						results: [],
					},
				} as const;

				fetchMock.get('/v1/measurements/123', mockResponse);

				const result = await globalping.getMeasurement('123');
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (result.ok) {
					assert.equal(result.data.id, mockResponse.body.id);
					assert.deepOwnInclude(result.data, mockResponse.body);
					Globalping.assertMeasurementType('ping', result.data);
					assert.equal(result.data.measurementOptions?.packets, undefined);
				}

				if (resultHasExpectedStatus) {
					Globalping.assertMeasurementType('ping', result.data);
					assert.equal(result.data.id, mockResponse.body.id);
					assert.deepOwnInclude(result.data, mockResponse.body);
					assert.equal(result.data.measurementOptions?.packets, undefined);
				}

				assert.ok(result.ok);
				assert.ok(resultHasExpectedStatus);
			});

			it('should return a not found error', async () => {
				const mockResponse = {
					status: 404,
					body: {
						error: {
							type: 'not_found',
							message: 'Couldn\'t find the requested item.',
						},
					},
				} as const;

				fetchMock.get('/v1/measurements/123', mockResponse);

				const result = await globalping.getMeasurement('123');
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (!result.ok) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.deepOwnInclude(result.data, mockResponse.body);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.deepOwnInclude(result.data, mockResponse.body);
				}

				assert.ok(!result.ok);
				assert.ok(resultHasExpectedStatus);
			});

			it('should return a too many requests error', async () => {
				const mockResponse = {
					status: 429,
					body: {
						error: {
							type: 'too_many_requests',
							message: 'Too many requests. Please retry in 4 seconds.',
						},
					},
				} as const;

				fetchMock.get('/v1/measurements/123', mockResponse);

				const result = await globalping.getMeasurement('123');
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (!result.ok) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.deepOwnInclude(result.data, mockResponse.body);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.error.type, mockResponse.body.error.type);
					assert.deepOwnInclude(result.data, mockResponse.body);
				}

				assert.ok(!result.ok);
				assert.ok(resultHasExpectedStatus);
			});
		});

		describe('awaitMeasurement', () => {
			it('should wait for measurement completion', async () => {
				const inProgressResponse = {
					status: 200,
					headers: {
						etag: '123',
					},
					body: {
						id: '123',
						type: 'ping',
						target: 'example.com',
						status: MeasurementStatus.IN_PROGRESS,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						probesCount: 1,
						results: [],
					},
				};

				const finishedResponse = {
					status: 200,
					body: {
						...inProgressResponse.body,
						status: MeasurementStatus.FINISHED,
					},
				} as const;

				fetchMock
					.get('/v1/measurements/123', inProgressResponse, { repeat: 2 })
					.get('/v1/measurements/123', 304, { repeat: 2 })
					.getOnce('/v1/measurements/123', finishedResponse);

				const result = await globalping.awaitMeasurement('123');
				const resultHasExpectedStatus = Globalping.isHttpStatus(finishedResponse.status, result);

				if (result.ok) {
					assert.equal(result.data.id, finishedResponse.body.id);
					assert.deepOwnInclude(result.data, finishedResponse.body);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.id, finishedResponse.body.id);
					assert.deepOwnInclude(result.data, finishedResponse.body);
				}

				assert.ok(result.ok);
				assert.ok(resultHasExpectedStatus);
			});
		});

		describe('listProbes', () => {
			it('should list probes', async () => {
				const mockResponse = {
					status: 200,
					body: [{
						version: '1.0.0',
					}],
				} as const;

				fetchMock.get('/v1/probes', mockResponse);

				const result = await globalping.listProbes();
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (result.ok) {
					assert.equal(result.data.length, 1);
					assert.deepOwnInclude(result.data.at(0), mockResponse.body.at(0));
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.length, 1);
					assert.deepOwnInclude(result.data.at(0), mockResponse.body.at(0));
				}

				assert.ok(result.ok);
				assert.ok(resultHasExpectedStatus);
			});
		});

		describe('getLimits', () => {
			it('should get limits', async () => {
				const mockResponse = {
					status: 200,
					body: {
						rateLimit: {
							measurements: {
								create: {
									type: 'ip',
									limit: 100,
									remaining: 95,
									reset: 3599,
								},
							},
						},
					},
				} as const;

				fetchMock.get('/v1/limits', mockResponse);

				const result = await globalping.getLimits();
				const resultHasExpectedStatus = Globalping.isHttpStatus(mockResponse.status, result);

				if (result.ok) {
					assert.equal(result.data.rateLimit.measurements.create.type, 'ip');
					assert.deepOwnInclude(result.data, mockResponse.body);
				}

				if (resultHasExpectedStatus) {
					assert.equal(result.data.rateLimit.measurements.create.type, 'ip');
					assert.deepOwnInclude(result.data, mockResponse.body);
				}

				assert.ok(result.ok);
				assert.ok(resultHasExpectedStatus);
			});
		});

		describe('misc', () => {
			it('should send the configured user agent', async () => {
				const mockResponse1 = {
					status: 200,
					body: [{
						version: '1.0.0',
					}],
				} as const;

				const mockResponse2 = {
					status: 200,
					body: [{
						version: '2.0.0',
					}],
				} as const;

				const mockResponse3 = {
					status: 200,
					body: [{
						version: '3.0.0',
					}],
				} as const;

				fetchMock.get(({ request }) => !!request?.headers?.get('User-Agent')?.includes('globalping-typescript'), mockResponse1);
				fetchMock.get(({ request }) => request?.headers?.get('User-Agent') === 'xx', mockResponse2);
				fetchMock.get(() => true, mockResponse3);

				const result1 = await globalping.listProbes();
				const result2 = await new Globalping({ userAgent: 'xx' }).listProbes();
				const result3 = await new Globalping({ userAgent: 'yy' }).listProbes();

				assert.equal(result1.data.at(0)?.version, '1.0.0');
				assert.equal(result2.data.at(0)?.version, '2.0.0');
				assert.equal(result3.data.at(0)?.version, '3.0.0');
			});

			it('should send the configured auth token', async () => {
				const mockResponse = {
					status: 200,
					body: [{
						version: '1.0.0',
					}],
				} as const;

				fetchMock.get(({ request }) => request?.headers?.get('Authorization') === 'Bearer xx', mockResponse);

				const result = await new Globalping({ auth: 'xx' }).listProbes();

				assert.equal(result.data.at(0)?.version, '1.0.0');
			});

			it('should respect the configured timeout', async () => {
				const mockResponse = {
					status: 200,
					body: [{
						version: '1.0.0',
					}],
				} as const;

				fetchMock.get(() => true, mockResponse, {
					delay: 100,
				});

				try {
					await new Globalping({ timeout: 50 }).listProbes();
					assert.fail('Expected an error to be thrown.');
				} catch (error) {
					assert.instanceOf(error, DOMException);
					assert.oneOf(error.name, [ 'AbortError', 'TimeoutError' ]);
				}
			});
		});
	});

	describe('throwApiErrors: true', () => {
		const globalping = new Globalping({ throwApiErrors: true });

		describe('createMeasurement', () => {
			it('should create a measurement', async () => {
				const mockResponse = {
					status: 202,
					body: {
						id: '123',
						probesCount: 1,
					},
				};

				fetchMock.post('/v1/measurements', mockResponse);

				const measurement: TypedMeasurementRequest = {
					type: 'ping',
					target: 'example.com',
				};

				const result = await globalping.createMeasurement(measurement);

				assert.equal(result.data.id, mockResponse.body.id);
				assert.equal(result.data.probesCount, mockResponse.body.probesCount);

				assert.ok(result.ok);
			});

			it('should return a validation error', async () => {
				const mockResponse = {
					status: 400,
					body: {
						error: {
							type: 'validation_error',
							message: 'Parameter validation failed.',
							params: {
								limit: '"limit" must be less than or equal to 500',
							},
						},
						links: {
							documentation: 'https://globalping.io/docs/api.globalping.io#post-/v1/measurements',
						},
					},
				} as const;

				fetchMock.post('/v1/measurements', mockResponse);

				const measurement: TypedMeasurementRequest = {
					type: 'ping',
					target: 'example.com',
					limit: 1000,
				};

				try {
					await globalping.createMeasurement(measurement);
					assert.fail('Expected an error to be thrown.');
				} catch (error) {
					assert.instanceOf(error, ApiError<CreateMeasurementError>);
					assert.equal(error.data.error.type, mockResponse.body.error.type);
					assert.equal(error.data.error.message, mockResponse.body.error.message);
				}
			});
		});

		describe('getMeasurement', () => {
			it('should get a measurement', async () => {
				const mockResponse = {
					status: 200,
					body: {
						id: '123',
						type: 'ping',
						target: 'example.com',
						status: MeasurementStatus.IN_PROGRESS,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						probesCount: 1,
						results: [],
					},
				} as const;

				fetchMock.get('/v1/measurements/123', mockResponse);

				const result = await globalping.getMeasurement('123');

				assert.equal(result.data.id, mockResponse.body.id);
				assert.deepOwnInclude(result.data, mockResponse.body);

				assert.ok(result.ok);
			});

			it('should get a ping measurement with the exact type', async () => {
				const mockResponse = {
					status: 200,
					body: {
						id: '123',
						type: 'ping',
						target: 'example.com',
						status: MeasurementStatus.IN_PROGRESS,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						probesCount: 1,
						results: [],
					},
				} as const;

				fetchMock.get('/v1/measurements/123', mockResponse);

				const result = await globalping.getMeasurement('123');
				Globalping.assertMeasurementType('ping', result.data);

				assert.equal(result.data.id, mockResponse.body.id);
				assert.equal(result.data.measurementOptions?.packets, undefined);
				assert.deepOwnInclude(result.data, mockResponse.body);

				assert.ok(result.ok);
			});

			it('should return a not found error', async () => {
				const mockResponse = {
					status: 404,
					body: {
						error: {
							type: 'not_found',
							message: 'Couldn\'t find the requested item.',
						},
					},
				} as const;

				fetchMock.get('/v1/measurements/123', mockResponse);

				try {
					await globalping.getMeasurement('123');
					assert.fail('Expected an error to be thrown.');
				} catch (error) {
					assert.instanceOf(error, ApiError<CreateMeasurementError>);
					assert.equal(error.data.error.type, mockResponse.body.error.type);
					assert.equal(error.data.error.message, mockResponse.body.error.message);
				}
			});
		});

		describe('awaitMeasurement', () => {
			it('should wait for measurement completion', async () => {
				const inProgressResponse = {
					status: 200,
					body: {
						id: '123',
						type: 'ping',
						target: 'example.com',
						status: MeasurementStatus.IN_PROGRESS,
						createdAt: new Date().toISOString(),
						updatedAt: new Date().toISOString(),
						probesCount: 1,
						results: [],
					},
				};

				const finishedResponse = {
					status: 200,
					body: {
						...inProgressResponse.body,
						status: MeasurementStatus.FINISHED,
					},
				} as const;

				fetchMock
					.get('/v1/measurements/123', inProgressResponse, { repeat: 2 })
					.get('/v1/measurements/123', finishedResponse);

				const result = await globalping.awaitMeasurement('123');

				assert.equal(result.data.id, finishedResponse.body.id);
				assert.deepOwnInclude(result.data, finishedResponse.body);

				assert.ok(result.ok);
			});
		});

		describe('listProbes', () => {
			it('should list probes', async () => {
				const mockResponse = {
					status: 200,
					body: [{
						version: '1.0.0',
					}],
				} as const;

				fetchMock.get('/v1/probes', mockResponse);

				const result = await globalping.listProbes();

				assert.equal(result.data.length, 1);
				assert.deepOwnInclude(result.data.at(0), mockResponse.body.at(0));

				assert.ok(result.ok);
			});
		});

		describe('getLimits', () => {
			it('should get limits', async () => {
				const mockResponse = {
					status: 200,
					body: {
						rateLimit: {
							measurements: {
								create: {
									type: 'ip',
									limit: 100,
									remaining: 95,
									reset: 3599,
								},
							},
						},
					},
				} as const;

				fetchMock.get('/v1/limits', mockResponse);

				const result = await globalping.getLimits();

				assert.equal(result.data.rateLimit.measurements.create.type, 'ip');
				assert.deepOwnInclude(result.data, mockResponse.body);

				assert.ok(result.ok);
			});
		});
	});
});
