export default {
  testEnvironment: 'node',
  collectCoverageFrom: [
    'js/config/constants.js',
    'js/config/layouts.js',
    'js/config/upgrades.js',
    'js/config/index.js',
    'js/state.js',
    'js/upgrades.js',
    'js/env.js',
  ],
  coverageThreshold: {
    global: {
      lines: 90,
      functions: 90,
      branches: 85,
      statements: 90,
    },
  },
};
