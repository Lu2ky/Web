import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores([
    'dist',
    'node_modules',
    'test-results',
    'playwright-report',
    // Los .d.ts los valida `tsc`, no ESLint (aún sin parser de TypeScript).
    '**/*.d.ts',
  ]),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      // Deuda heredada, cuantificada en docs/frontend/baseline.md.
      // F1 la elimina (servicios sin hooks, variables muertas) y estas reglas
      // vuelven a "error". Mientras tanto no bloquean CI.
      'no-unused-vars': ['warn', {
        varsIgnorePattern: '^[A-Z_]',
        argsIgnorePattern: '^_',
        caughtErrors: 'none',
        ignoreRestSiblings: true,
      }],
      'react-refresh/only-export-components': 'warn',
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/static-components': 'warn',
    },
  },
  {
    // Frontera de la capa API + persistencia centralizada.
    // `fetch` solo puede usarse dentro del Singleton. `localStorage` solo en
    // los módulos de storage/sesión; el resto es deuda conocida para F3/F4.
    files: ['src/**/*.{js,jsx}'],
    ignores: [
      'src/shared/api/apiClient.js',
      'src/shared/session/authSession.js',
      'src/shared/storage/notificationsSilence.js',
      'src/shared/storage/todoStorage.js',
      'src/shared/storage/themeCache.js',
      'src/shared/storage/appearance.js',
      'src/**/*.test.{js,jsx}',
      'src/**/*.spec.{js,jsx}',
      'src/test/**',
    ],
    rules: {
      'no-restricted-globals': ['error',
        {
          name: 'fetch',
          message: 'Usa apiClient (src/shared/api/apiClient.js). fetch solo se permite en la capa API.',
        },
        {
          name: 'localStorage',
          message: 'La persistencia debe pasar por un módulo de storage compartido.',
        },
      ],
    },
  },
  {
    // Bloquea `import.meta.env.VITE_*` fuera de apiClient. `import.meta.env.DEV`
    // sigue permitido para logs de desarrollo.
    files: ['src/**/*.{js,jsx}'],
    ignores: ['src/shared/api/apiClient.js'],
    rules: {
      'no-restricted-syntax': ['error', {
        selector: "MemberExpression[object.type='MemberExpression'][object.object.name='import'][object.property.name='meta'][property.name='env'][property.name=/^VITE_/]",
        message: 'Los endpoints viven en src/shared/api/apiClient.js; no agregues envs VITE_* fuera de la capa API.',
      }],
    },
  },
  {
    // Tests: entorno jsdom + API de Vitest.
    files: ['**/*.{test,spec}.{js,jsx}', 'src/test/**/*.{js,jsx}'],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node, ...globals.vitest },
    },
  },
  {
    // E2E, scripts y configuración: entorno Node.
    files: ['tests/**/*.{js,jsx}', 'scripts/**/*.{js,mjs}', '*.config.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
])
