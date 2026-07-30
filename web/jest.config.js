module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/*.test.ts"],
  moduleNameMapper: {
    "^aws-amplify$": "<rootDir>/tests/mocks/aws-amplify.ts",
    "^aws-amplify/auth$": "<rootDir>/tests/mocks/aws-amplify-auth.ts",
  },
};
