module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: "<rootDir>/tsconfig.jest.json",
      },
    ],
  },
  moduleNameMapper: {
    "\\.(png|jpg|jpeg|svg|gif)$": "<rootDir>/src/webparts/prioCertifs/app/__mocks__/fileMock.js",
    "\\.(scss|css)$": "<rootDir>/src/webparts/prioCertifs/app/__mocks__/styleMock.js",
    "^@microsoft/sp-http$": "<rootDir>/src/webparts/prioCertifs/app/__mocks__/spHttpMock.js",
  },
};
