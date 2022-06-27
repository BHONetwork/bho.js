/* eslint-disable */
export default {
  displayName: "sdk-swap",
  preset: "../../jest.preset.js",
  resolver: "jest-node-exports-resolver",
  globals: {
    "ts-jest": {
      tsconfig: "<rootDir>/tsconfig.spec.json",
    },
  },
  transform: {
    "^.+\\.[tj]sx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js", "jsx"],
  coverageDirectory: "../../coverage/packages/sdk-swap",
};
