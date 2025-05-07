import { HttpError } from './HttpError.js';

export class ApiError<T> extends HttpError {
	constructor (
		request: Request,
		response: Response,
		public readonly data: T,
	) {
		super(request, response);
	}
}
