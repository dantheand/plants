module.exports = {
  testEnvironment: "jsdom",
  preset: "ts-jest",
  transformIgnorePatterns: ["node_modules/(?!(crypto-random-string)/)"],
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
