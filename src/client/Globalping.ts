import { type Client, type RequestResult, createClient, createConfig } from '../openapi-ts/client/index.js';

// @transform-path ../../../package.json
import pkg from '../../package.json' with { type: 'json' };
import { HttpError } from '../errors/HttpError.js';
import { ApiError } from '../errors/ApiError.js';
import * as sdk from '../openapi-ts/sdk.gen.js';

import {
	CallResult, SuccessCallResult, ResponseTypes, KnownResponseTypes,
	TypedMeasurementRequest, TypedMeasurementResponse, TypedMeasurementResponses,
	FinishedMeasurementResponse, NoResponseTypes, Awaitable,
} from '../types.js';

import {
	CreateMeasurementResponses, CreateMeasurementErrors,
	GetLimitsResponses,
	GetMeasurementErrors,
	ListProbesResponses,
	MeasurementResponse,
	MeasurementStatus,
	MeasurementType, type ClientOptions,
} from '../openapi-ts/index.js';

import { wait } from '../utils.js';

export type GlobalpingOptions<ThrowOnKnownErrors> = {
	auth?: string;
	userAgent?: string;
	throwApiErrors?: ThrowOnKnownErrors;
	timeout?: number;
};

export class Globalping<ThrowApiErrors extends boolean = false> {
	private readonly auth: string | undefined;
	private readonly client: Client;
	private readonly userAgent: string;
	private readonly throwApiErrors: ThrowApiErrors;
	private readonly timeout: number;

	constructor ({ auth, userAgent, throwApiErrors, timeout }: GlobalpingOptions<ThrowApiErrors> = {}) {
		this.userAgent = userAgent ?? `globalping-typescript/${pkg.version} (https://github.com/jsdelivr/globalping-typescript)`;
		this.throwApiErrors = throwApiErrors ?? false as ThrowApiErrors;
		this.timeout = timeout ?? 30000;
		this.auth = auth;

		this.client = createClient(createConfig<ClientOptions>({
			baseUrl: 'https://api.globalping.io',
			fetch: (...args: Parameters<typeof fetch>) => {
				const request = new Request(...args);
				const headers = new Headers(request.headers);
				headers.set('User-Agent', this.userAgent);

				if (this.auth) {
					headers.set('Authorization', `Bearer ${this.auth}`);
				}

				return fetch(new Request(request, {
					headers,
					signal: AbortSignal.timeout(this.timeout),
				}));
			},
		}));
	}

	/**
	 * @see {@link sdk.createMeasurement} for the API docs
	 */
	createMeasurement (measurement: TypedMeasurementRequest) {
		return this.transformResult<CreateMeasurementResponses, CreateMeasurementErrors>(sdk.createMeasurement({
			body: measurement,
			client: this.client,
		}));
	}

	/**
	 * @see {@link sdk.getMeasurement} for the API docs
	 */
	async getMeasurement (id: string) {
		const result = await this.transformResult<TypedMeasurementResponses<MeasurementType>, GetMeasurementErrors>(sdk.getMeasurement({
			path: { id },
			client: this.client,
		}));

		if (!result.ok) {
			return result;
		}

		return result;
	}

	/**
	 * @see {@link sdk.getMeasurement} for the API docs
	 */
	async awaitMeasurement (id: string) {
		const getMeasurement = (eTag?: string | null) => {
			return sdk.getMeasurement({
				path: { id },
				headers: eTag ? {
					'If-None-Match': eTag,
				} : {},
				client: this.client,
			});
		};

		const start = Date.now();
		let internalResult = Globalping.requireRequestCompleted(await getMeasurement());
		const maxTime = internalResult.data?.timeout === undefined ? 35000 : (internalResult.data.timeout + 10) * 1000;

		while (internalResult.data && internalResult.data.status === MeasurementStatus.IN_PROGRESS) {
			if (Date.now() - start > maxTime) {
				throw new Error(`Timed out waiting for measurement ${id} to finish.`);
			}

			await wait(500);
			const newInternalResult = Globalping.requireRequestCompleted(await getMeasurement(internalResult.response.headers.get('ETag')));

			if (newInternalResult.response.status !== 304) {
				internalResult = newInternalResult;
			}
		}

		const result = await this.transformResult<TypedMeasurementResponses<MeasurementType>, GetMeasurementErrors>(internalResult);

		if (!result.ok) {
			return result;
		}

		const data = result.data;
		Globalping.assertMeasurementFinished(data);

		return { ...result, data };
	}

	/**
	 * @see {@link sdk.listProbes} for the API docs
	 */
	async listProbes () {
		return this.transformResult<ListProbesResponses, NoResponseTypes, unknown>(sdk.listProbes({
			client: this.client,
		}));
	}

	/**
	 * @see {@link sdk.getLimits} for the API docs
	 */
	async getLimits () {
		return this.transformResult<GetLimitsResponses, NoResponseTypes, unknown>(sdk.getLimits({
			client: this.client,
		}));
	}

	private static requireRequestCompleted <T extends { error?: unknown; request?: Request; response?: Response }> (result: T): T & { request: Request; response: Response } {
		if (!result.request || !result.response) {
			if (result.error instanceof Error) {
				throw result.error;
			}

			throw new Error('Request failed before receiving a response.');
		}

		return result as T & { request: Request; response: Response };
	}

	private async transformResult <TData extends ResponseTypes, TError extends ResponseTypes, TInternalError = TError> (requestResult: Awaitable<Awaited<RequestResult<TData, TInternalError, false>>>) {
		const internalResult = Globalping.requireRequestCompleted(await requestResult);
		const { data, error, request, response } = internalResult;

		if (error != null) {
			if (response.ok) {
				if (error instanceof Error) {
					throw error;
				}

				const responseError = new Error('Failed to process response.');
				Object.defineProperty(responseError, 'cause', { value: error });
				throw responseError;
			}

			if (typeof error !== 'object' || !('error' in error)) {
				throw new HttpError(request, response);
			}

			if (this.throwApiErrors) {
				throw new ApiError(request, response, error);
			}

			return { ok: false, data: error, request, response } as ThrowApiErrors extends true ? never : CallResult<TData, TError>;
		}

		if (data == null) {
			throw new Error('Unexpected undefined data');
		}

		return { ok: true, data, request, response } as SuccessCallResult<TData>;
	}

	static assertHttpStatus <S extends number, R1 extends KnownResponseTypes, R2 extends KnownResponseTypes> (status: S, result: CallResult<R1, R2>): asserts result is CallResult<R1, R2, S, S> {
		if (!Globalping.isHttpStatus(status, result)) {
			throw new Error(`Expected HTTP status ${status}, got ${result.response.status}`);
		}
	}

	static assertMeasurementFinished (measurement: MeasurementResponse): asserts measurement is FinishedMeasurementResponse<MeasurementType> {
		if (!Globalping.isMeasurementFinished(measurement)) {
			throw new Error(`Expected measurement status ${MeasurementStatus.FINISHED}, got ${measurement.status}`);
		}
	}

	static assertMeasurementType <T extends MeasurementType> (type: T, measurement: MeasurementResponse): asserts measurement is TypedMeasurementResponse<T> {
		if (!Globalping.isMeasurementType(type, measurement)) {
			throw new Error(`Expected measurement type ${type}, got ${measurement.type}`);
		}
	}

	static isHttpStatus <S extends number, R1 extends KnownResponseTypes, R2 extends KnownResponseTypes> (status: S, result: CallResult<R1, R2>): result is CallResult<R1, R2, S, S> {
		return result.response.status === status;
	}

	static isMeasurementFinished (measurement: MeasurementResponse): measurement is FinishedMeasurementResponse<MeasurementType> {
		return measurement.status === MeasurementStatus.FINISHED;
	}

	static isMeasurementType <T extends MeasurementType> (type: T, measurement: MeasurementResponse): measurement is TypedMeasurementResponse<T> {
		return measurement.type === type;
	}
}

export default Globalping;
