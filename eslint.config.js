// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier');

module.exports = defineConfig([
  expoConfig,
  // Must come last: disables every ESLint rule that conflicts with Prettier.
  prettierConfig,
  {
    ignores: ['dist/*', '.expo/*'],
  },
]);
