const releaseNoteTypes = [
	{ type: 'feat', section: 'Features' },
	{ type: 'feature', section: 'Features' },
	{ type: 'fix', section: 'Bug Fixes' },
	{ type: 'perf', section: 'Performance Improvements' },
	{ type: 'revert', section: 'Reverts' },
	{ type: 'docs', section: 'Documentation', effect: 'hidden' },
	{ type: 'style', section: 'Styles', effect: 'hidden' },
	{ type: 'chore', section: 'Miscellaneous Chores', effect: 'hidden' },
	{ type: 'refactor', section: 'Code Refactoring', effect: 'hidden' },
	{ type: 'test', section: 'Tests', effect: 'hidden' },
	{ type: 'build', section: 'Build System', effect: 'hidden' },
	{ type: 'ci', section: 'Continuous Integration', effect: 'hidden' },
	{ type: 'misc', section: 'Miscellaneous', effect: 'hidden' },
];

export default {
	branches: [ 'master' ],
	repositoryUrl: 'git@github.com:jsdelivr/globalping-typescript.git',
	plugins: [
		[ '@semantic-release/commit-analyzer', {
			releaseRules: [
				{ type: 'misc', release: 'patch' },
			],
		}],
		[ '@semantic-release/release-notes-generator', {
			preset: 'conventionalcommits',
			presetConfig: {
				types: releaseNoteTypes,
			},
		}],
		'@semantic-release/npm',
		[ '@semantic-release/exec', {
			prepareCmd: 'npm run build',
		}],
		'@semantic-release/github',
		[ '@semantic-release/git', {
			assets: [ 'package.json', 'package-lock.json' ],
			message: 'chore: [skip ci] bump version to ${nextRelease.version}',
		}],
	],
};
