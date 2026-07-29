const releaseNoteTypes = [
	{ type: 'feat', section: 'Features' },
	{ type: 'feature', section: 'Features' },
	{ type: 'fix', section: 'Bug Fixes' },
	{ type: 'perf', section: 'Performance Improvements' },
	{ type: 'revert', section: 'Reverts' },
	{ type: 'docs', section: 'Documentation', hidden: true },
	{ type: 'style', section: 'Styles', hidden: true },
	{ type: 'chore', section: 'Miscellaneous Chores', hidden: true },
	{ type: 'refactor', section: 'Code Refactoring', hidden: true },
	{ type: 'test', section: 'Tests', hidden: true },
	{ type: 'build', section: 'Build System', hidden: true },
	{ type: 'ci', section: 'Continuous Integration', hidden: true },
	{ type: 'misc', section: 'Miscellaneous', hidden: true },
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
