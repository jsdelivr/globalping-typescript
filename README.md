# Globalping Typescript API Client

The official TypeScript client for the [Globalping API](https://globalping.io/docs/api.globalping.io).
Works both in the browser and in node.js.

If you are not familiar with Globalping yet, check out the main [Globalping repository](https://github.com/jsdelivr/globalping) first.

## Installation

```sh
npm i globalping
```

In client-side applications, you can also import the library directly via [jsDelivr CDN](https://www.jsdelivr.com/package/npm/globalping).

## Usage

The library provides methods for all API operations, as well as types for all parameters.
It also exports values for all `enum` parameters as JS objects, which can be used for client-side validation.

### Quick start

Using the package in ESM/CJS applications:

```ts
import { Globalping } from 'globalping';

const globalping = new Globalping({
    auth: 'your-globalping-api-token', // Optional.
    // See the Advanced configuration section below for more options.
});
```

Using the UMD build:

```ts
const { Globalping } = window.globalping;
const globalping = new Globalping(/* options */);
```

### Create a measurement

Creates a new measurement with the set parameters. The measurement runs asynchronously, and you can retrieve its current state using `getMeasurement()` or wait for its final state using `awaitMeasurement()`.

```ts
const result = await globalping.createMeasurement({
    type: 'ping',
    target: 'example.com',
});

if (!result.ok) {
    // See the Error handling section below.
}

console.log(result); // => { data: { id: string, probesCount: number }, ... }
```

### Get a measurement

Returns the current state of the measurement.

```ts
const result = await globalping.getMeasurement(id);
console.log(result); // => { data: { id: string, status: string, ... }, ... }
```

### Await a measurement

Similar to `getMeasurement()`, but keeps pooling the API until the measurement is finished, and returns its final state.

```ts
const result = await globalping.awaitMeasurement(id);
console.log(result); // => { data: { id: string, status: 'finished', ... }, ... }
```

### List probes

Returns a list of all probes currently online and their metadata, such as location and assigned tags.

```ts
const result = await globalping.listProbes();
console.log(result); // => { data: [ { version: string, ... }, ... ], ... }
```

### Get rate limits

Returns rate limits for the current user (if authenticated) or IP address (if not authenticated).

```ts
const result = await globalping.getLimits();
console.log(result); // => { data: { rateLimit: { ... }, ... }, ... }
```

### TypeScript convenience methods

There are a few convenience methods for determining more specific response types.

#### `assertHttpStatus()` / `isHttpStatus()`

```ts
const result = await globalping.createMeasurement(id);

if (Globalping.isHttpStatus(400, result)) {
    // You can now access parameter validation error details.
}
```

#### `assertMeasurementType()` / `isMeasurementType()`

```ts
const result = await globalping.awaitMeasurement(id);
Globalping.assertMeasurementType('ping', result); // You can now access ping-specific properties on result.data
```

### Error handling

The library offers two ways of handling errors.

#### `throwApiErrors: false` (default)

Known API errors, such as parameter validation errors, rate limit errors, etc., are not thrown as exceptions. This allows the library to return precise error types for each method, which means you can access all error details in a type-safe way. You need to check each `result` before accessing its data.

```ts
const result = await globalping.createMeasurement();

// This is sufficient if you only care about success/failure.
if (result.ok) {
    // result.data is the success response, e.g., { id: string, probesCount: number }
} else {
    // result.data can be any of the possible error responses

    if (Globalping.isHttpStatus(400, result)) {
        // You can also access result.data.error.params here which is specific to this status code.
    }
}
```

Any unexpected errors, such as timeouts, networking errors, etc., are still thrown as exceptions.

#### `throwApiErrors: true`

All errors, including known API errors, are thrown as exceptions. You don't have to check `result.ok` before accessing the data, but the thrown errors only have generic types.

```ts
import { ApiError, HttpError } from 'globalping';

try {
    const result = await globalping.createMeasurement();
    console.log(result.data) // => { id: string, probesCount: number }
} catch (e) {
    if (e instanceof ApiError) {
        // Any error with a valid JSON response body.
    } else if (e instanceof HttpError) {
        // Any HTTP error with an invalid response body.
    } else {
        // Any other error.
    }
}
```

### Advanced configuration

There are a few config options available, but all of them are optional:

`auth: string`

A user authentication token obtained from https://dash.globalping.io or via OAuth (currently available only to official Globalping apps).

`userAgent: string`

Refers to this library by default. If you build another open-source project based on this library, you should override this value to point to your project instead.

`throwApiErrors: boolean`

If `false` (default), known API errors are not thrown as exceptions. See the Error handling section.

`timeout: number`

A timeout in ms for every HTTP request made by the library. The default value is 30 seconds, and you shouldn't need to change this.

## Development
Please refer to [CONTRIBUTING.md](CONTRIBUTING.md) for more information.
