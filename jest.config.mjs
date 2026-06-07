import nextJest from 'next/jest.js';

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'jsdom',
  transformIgnorePatterns: ['/node_modules/(?!@exodus|isomorphic-dompurify|dompurify|html-encoding-sniffer|whatwg-encoding)/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@exodus/bytes/(.*)$': '<rootDir>/node_modules/@exodus/bytes/$1'
  },
  setupFiles: ['<rootDir>/jest.setup.mjs'],
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config);
