/**
 * [docs](@ken0x0a/eslint-config/docs/example.md)
 */
module.exports = {
  // https://eslint.org/docs/user-guide/configuring#configuration-cascading-and-hierarchy
  root: true,

  parserOptions: {
    project: "tsconfig.js.json",
  },

  /**
   * NOTE: The **order is important**, to properly override rules by later one
   */
  extends: [
    "@ken0x0a/eslint-config/base",
    "@ken0x0a/eslint-config/tslint-rules",
    "@ken0x0a/eslint-config/import",
    "@ken0x0a/eslint-config/jest",
    /**
     * if you need to use `react` related configs like following,
     * you need to install optional dependency "@ken0x0a/eslint-config-react-deps" by
     * `yarn add -D "@ken0x0a/eslint-config-react-deps"`
     */
    // '@ken0x0a/eslint-config/react',
    // '@ken0x0a/eslint-config/react-native',
    // '@ken0x0a/eslint-config/expo', // extends "./react-native"

    /**
     * '@ken0x0a/eslint-config/typescript' must be always last, to override rules
     */
    "@ken0x0a/eslint-config/typescript",
  ],
  rules: {
    /**
     * specific
     */
    "@typescript-eslint/camelcase": [2, { properties: "never", ignoreDestructuring: false }],
  },
  overrides: [
    {
      // for JS files
      files: ["**/*.js"],
      parserOptions: {
        project: "tsconfig.js.json",
      },
    },
  ],
  globals: {},
}
