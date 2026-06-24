import { dirname } from "path";
import { fileURLToPath } from "url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = defineConfig([
  {
    basePath: __dirname
  },
  ...nextVitals,
  ...nextTs,
  globalIgnores([
      'node_modules/**',
      '.next/**',
      'out/**',
      'build/**',
      'coverage/**',
      'next-env.d.ts',
  ]),
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': ['warn'],
      'react-hooks/set-state-in-effect': ['warn', { caughtErrors: 'none' }],
      'react-hooks/purity': ['warn', { caughtErrors: 'none' }],
    }
  }
]);

export default eslintConfig;
