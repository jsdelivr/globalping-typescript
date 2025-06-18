import {
	InProgressTestResult, FailedTestResult, OfflineTestResult,
	FinishedDnsTestResult, FinishedHttpTestResult, FinishedMtrTestResult, FinishedPingTestResult, FinishedTracerouteTestResult,
	MeasurementDnsOptions, MeasurementHttpOptions, MeasurementMtrOptions, MeasurementPingOptions, MeasurementTracerouteOptions,
	MeasurementRequest, MeasurementResponse, MeasurementResultItem, MeasurementType,
} from './openapi-ts/index.js';

type CommonMeasurementOptions = Omit<MeasurementRequest, 'type' | 'measurementOptions'>;

type FinishedTestResultTypes = {
	ping: FinishedPingTestResult;
	traceroute: FinishedTracerouteTestResult;
	dns: FinishedDnsTestResult;
	mtr: FinishedMtrTestResult;
	http: FinishedHttpTestResult;
};

export type PingMeasurementRequest = {
	type: 'ping';
	measurementOptions?: MeasurementPingOptions;
} & CommonMeasurementOptions;

export type TracerouteMeasurementRequest = {
	type: 'traceroute';
	measurementOptions?: MeasurementTracerouteOptions;
} & CommonMeasurementOptions;

export type MtrMeasurementRequest = {
	type: 'mtr';
	measurementOptions?: MeasurementMtrOptions;
} & CommonMeasurementOptions;

export type DnsMeasurementRequest = {
	type: 'dns';
	measurementOptions?: MeasurementDnsOptions;
} & CommonMeasurementOptions;

export type HttpMeasurementRequest = {
	type: 'http';
	measurementOptions?: MeasurementHttpOptions;
} & CommonMeasurementOptions;

export type TypedMeasurementRequest = PingMeasurementRequest
	| TracerouteMeasurementRequest
	| MtrMeasurementRequest
	| DnsMeasurementRequest
	| HttpMeasurementRequest;

export type TypedMeasurementResultItem<T extends MeasurementType> = {
	result: InProgressTestResult | FailedTestResult | OfflineTestResult | FinishedTestResultTypes[T];
} & Omit<MeasurementResultItem, 'result'>;

export type TypedMeasurementResponse<T extends MeasurementType> = {
	type: T;
	measurementOptions?: Coalesce<Extract<TypedMeasurementRequest, { type: T }>['measurementOptions'], never>;
	results: Array<TypedMeasurementResultItem<T>>;
} & Omit<MeasurementResponse, 'type' | 'measurementOptions' | 'results'>;

export type TypedMeasurementResponses<T extends MeasurementType> = {
	200: TypedMeasurementResponse<T>;
};

export type FinishedMeasurementResponse<T extends MeasurementType> = {
	status: 'finished';
} & Omit<TypedMeasurementResponse<T>, 'status'>;

export type SuccessCallResult<DataType, ST extends keyof DataType = keyof DataType> = {
	ok: true;
	data: NonNullable<DataType>[ST];
	request: Request;
	response: Response;
};

export type ErrorCallResult<ErrorType, ST extends keyof ErrorType = keyof ErrorType> = {
	ok: false;
	data: ErrorType[ST];
	request: Request;
	response: Response;
};

export type CallResult<DataType, ErrorType, ST1 extends keyof DataType = keyof DataType, ST2 extends keyof ErrorType = keyof ErrorType> = SuccessCallResult<DataType, ST1> | ErrorCallResult<ErrorType, ST2>;

export type NoResponseTypes = { [k: number]: never };
export type KnownResponseTypes = { [k: number]: object };
export type ResponseTypes = KnownResponseTypes | unknown;

export type Awaitable<T> = T | PromiseLike<T>;
export type Coalesce<T, D> = T extends undefined ? D : T;
