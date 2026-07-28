import fs from 'node:fs';
import path from 'node:path';

const esmDirectory = path.resolve('dist/esm');
const cjsDirectory = path.resolve('dist/cjs');

for (const inputPath of fs.globSync('**/*.d.ts', { cwd: esmDirectory })) {
	const relativeOutputPath = inputPath === 'index.d.ts'
		? 'bundle.d.cts'
		: inputPath.replace(/\.d\.ts$/, '.d.cts');
	const outputPath = path.join(cjsDirectory, relativeOutputPath);
	const declaration = fs.readFileSync(path.join(esmDirectory, inputPath), 'utf8')
		.replace(/(['"])(\.\.?\/[^'"]+)\.js\1/g, '$1$2.cjs$1');

	fs.mkdirSync(path.dirname(outputPath), { recursive: true });
	fs.writeFileSync(outputPath, declaration);
}
