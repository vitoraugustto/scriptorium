export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'js/config.js',
    'js/state.js',
    'js/upgrades.js',
    'js/env.js',
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 90,
      statements: 90,
    },
  },
};
