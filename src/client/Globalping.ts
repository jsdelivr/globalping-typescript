import { Client, createClient, createConfig, RequestResult, type TDataShape } from '@hey-api/client-fetch';

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

type GlobalpingOptions<ThrowOnKnownErrors> = {
	auth?: string;
	userAgent?: string;
	throwApiErrors?: ThrowOnKnownErrors;
	timeout?: number;
};

type GlobalpingRequestOptions = {
	auth?: string;
	userAgent?: string;
	signal?: AbortSignal;
	timeout?: number;
};

export class Globalping<ThrowApiErrors extends boolean> {
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
		}));
	}

	/**
	 * @see {@link sdk.createMeasurement} for the API docs
	 */
	createMeasurement (measurement: TypedMeasurementRequest) {
		return this.transformResult<CreateMeasurementResponses, CreateMeasurementErrors>(this.request(sdk.createMeasurement, { body: measurement }));
	}

	/**
	 * @see {@link sdk.getMeasurement} for the API docs
	 */
	async getMeasurement (id: string) {
		const result = await this.transformResult<TypedMeasurementResponses<MeasurementType>, GetMeasurementErrors>(this.request(sdk.getMeasurement, { path: { id } }));

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
			return this.request(sdk.getMeasurement, {
				path: { id },
				headers: eTag ? {
					'If-None-Match': eTag,
				} : {},
			});
		};

		const start = Date.now();
		let internalResult = await getMeasurement();

		while (internalResult.data && internalResult.data.status === MeasurementStatus.IN_PROGRESS) {
			if (Date.now() - start > 60000) {
				throw new Error(`Timed out waiting for measurement ${id} to finish.`);
			}

			await wait(500);
			const newInternalResult = await getMeasurement(internalResult.response.headers.get('ETag'));

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
		return this.transformResult<ListProbesResponses, NoResponseTypes>(this.request(sdk.listProbes));
	}

	/**
	 * @see {@link sdk.getLimits} for the API docs
	 */
	async getLimits () {
		return this.transformResult<GetLimitsResponses, NoResponseTypes>(this.request(sdk.getLimits));
	}

	private request<RSD, RSE> (fn: () => RequestResult<RSD, RSE, false>): RequestResult<RSD, RSE, false>;
	private request<RSD, RSE, RQ extends TDataShape, O extends sdk.Options<RQ, false>> (fn: (options: O) => RequestResult<RSD, RSE, false>, options?: O & GlobalpingRequestOptions): RequestResult<RSD, RSE, false>;
	private request <RSD, RSE, RQ extends TDataShape, O extends sdk.Options<RQ, false>> (fn: (options: O) => RequestResult<RSD, RSE, false>, options?: O & GlobalpingRequestOptions): RequestResult<RSD, RSE, false> {
		const optionsWithDefaults = {
			auth: this.auth,
			timeout: this.timeout,
			userAgent: this.userAgent,
			...(options || {}) as O,
		};

		return fn({
			client: this.client,
			fetch: (request: Request) => {
				const headers = new Headers(request.headers);
				headers.set('User-Agent', optionsWithDefaults.userAgent);

				if (optionsWithDefaults.auth) {
					headers.set('Authorization', `Bearer ${optionsWithDefaults.auth}`);
				}

				return fetch(new Request(request, {
					headers,
					signal: optionsWithDefaults.signal ?? AbortSignal.timeout(optionsWithDefaults.timeout),
				}));
			},
			...optionsWithDefaults,
		});
	}

	private async transformResult <TData extends ResponseTypes, TError extends ResponseTypes> (requestResult: Awaitable<Awaited<RequestResult<TData[keyof TData], TError extends unknown ? unknown : TError[keyof TError], false>>>) {
		const { data, error, request, response } = await requestResult;

		if (error != null) {
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
