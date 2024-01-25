module.exports = {
  verbose: true,
  testEnvironment: "jsdom",
  preset: "ts-jest",
  transformIgnorePatterns: [
    // Ignore ES modules in node_modules
    "node_modules/(?!(crypto-random-string|use-local-storage-state)/)",
  ],
  transform: {
    "^.+\\.(ts|tsx)?$": "ts-jest",
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    // Mock CSS files
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    // Mock image files
    "\\.(jpg|jpeg|png|gif|webp|svg)$": "<rootDir>/__mocks__/fileMock.js",
  },
};
