import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/templates/**',
      '**/web/**',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: [
      'apps/cli/src/**/*.ts',
      'libs/engine-core/src/**/*.{ts,tsx}',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.node,
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
);
