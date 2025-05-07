## Setting up the environment

```sh
npm i
```

## Modifying/Adding code

The contents of `src/openapi-ts` is generated from the [OpenAPI specification](https://api.globalping.io/v1/spec.yaml). Run `npm run openapi:generate` to update it.

The rest of the code is handwritten and can be modified as needed.

## Running tests

`npm run test:integration`

Runs integration tests with mocked data. These tests are part of the CI process.

`npm run test:e2e`

Runs live tests that hit the API. These tests are NOT run as a part of the CI.

`npm run test:dist`

Verifies the final builds and `package.json` configuration are correct and the package loads without errors.

## Linting and formatting

This repository uses [eslint](https://www.npmjs.com/package/eslint) to format the code.

`npm run lint`

`npm run lint:fix`

## Publishing and releases

TODO
