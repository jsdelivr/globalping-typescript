export * from './client/Globalping.js';
export { default } from './client/Globalping.js';
export * from './errors/ApiError.js';
export * from './errors/HttpError.js';

// Export JS enums.
export {
	IpVersion,
	PingProtocol,
	TracerouteProtocol,
	DnsQueryType,
	DnsProtocol,
	MtrProtocol,
	HttpRequestMethod,
	HttpProtocol,
	MeasurementType,
	ContinentCode,
	RegionName,
	TlsKeyType,
	MeasurementStatus,
	RateLimitType,
	FailureSource,
} from './openapi-ts/types.gen.js';

// Export the relevant custom types.
export type {
	PingMeasurementRequest,
	TracerouteMeasurementRequest,
	MtrMeasurementRequest,
	DnsMeasurementRequest,
	HttpMeasurementRequest,
	TypedMeasurementRequest,
	TypedMeasurementResponse,
	TypedMeasurementResponses,
	TypedMeasurementResultItem,
	FinishedMeasurementResponse,
} from './types.js';

// Export the relevant OpenAPI types.
export type {
	MeasurementPingOptions,
	MeasurementTracerouteOptions,
	MeasurementDnsOptions,
	MeasurementMtrOptions,
	MeasurementHttpOptions,
	MeasurementLocationOption,
	MeasurementLocations,
	MeasurementOptions,
	CreateMeasurementResponse,
	FinishedPingTestResult,
	FinishedTracerouteTestResult,
	FinishedSimpleDnsTestResult,
	FinishedTraceDnsTestResult,
	FinishedDnsTestResult,
	FinishedMtrTestResult,
	FinishedHttpTestResult,
	InProgressTestResult,
	FailedTestResult,
	OfflineTestResult,
	ProbeLocation,
	TestResult,
	MeasurementResultItem,
	MeasurementResponse,
	Probe,
	Probes,
	Limits,
} from './openapi-ts/types.gen.js';
