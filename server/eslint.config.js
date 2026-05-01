export default [
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: await import("@typescript-eslint/parser"),
    },
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default,
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "no-console": "warn",
    },
  },
];
