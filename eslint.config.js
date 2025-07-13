import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import eslintImport from 'eslint-plugin-import';
import prettierPlugin from 'eslint-plugin-prettier';
import jsoncParser from 'jsonc-eslint-parser';
import yamlParser from 'yaml-eslint-parser';
import markdownPlugin from 'eslint-plugin-markdown';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

export default tseslint.config([
  // Ignore generated output directories and large lock file
  globalIgnores(['dist']),
  globalIgnores(['dist', 'package-lock.json']),
  globalIgnores(['test-results', 'playwright-report']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      import: eslintImport,
      'jsx-a11y': jsxA11y,
      prettier: prettierPlugin,
    },
    rules: {
      'import/order': ['warn', { alphabetize: { order: 'asc' } }],
      'prettier/prettier': 'warn',
    },
  },
  // Enable prettier for other file types as well
  {
    files: ['**/*.{js,jsx,ts,tsx,md,json,yml,yaml}'],
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.{yml,yaml}'],
    languageOptions: {
      parser: yamlParser,
    },
    plugins: {
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'warn',
    },
  },
  {
    files: ['**/*.md'],
    plugins: {
      markdown: markdownPlugin,
    },
    processor: 'markdown/markdown',
  },
]);
