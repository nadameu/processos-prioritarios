module.exports = {
	transform: {
		'^.+\\.tsx?$': 'ts-jest',
		'^.+\\.jsx?$': 'babel-jest',
	},
	testRegex: '\\.test\\.[jt]sx?$',
	moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
	testPathIgnorePatterns: ['<rootDir>/node_modules/', '<rootDir>/build/', '<rootDir>/dist/'],
};
