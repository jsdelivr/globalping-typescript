export const wait = async (ms: number, signal?: AbortSignal) => {
	await new Promise<void>((resolve, reject) => {
		signal?.throwIfAborted();

		const abortHandler = () => {
			clearTimeout(timeout);
			// eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors -- AbortSignal reasons can be any value.
			reject(signal?.reason);
		};

		const timeout = setTimeout(() => {
			signal?.removeEventListener('abort', abortHandler);
			resolve();
		}, ms);

		signal?.addEventListener('abort', abortHandler, { once: true });
	});
};
