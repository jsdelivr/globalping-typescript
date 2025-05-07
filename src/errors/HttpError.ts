export class HttpError extends Error {
	constructor (
		public readonly request: Request,
		public readonly response: Response,
	) {
		super(`HTTP ${response.status} ${response.statusText}`);

		Object.defineProperty(this, 'request', { enumerable: false });
		Object.defineProperty(this, 'response', { enumerable: false });
	}
}
