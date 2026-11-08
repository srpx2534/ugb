// vitest.config.mjs
// dist/ derleme kopyalarini dislar: aksi halde ayni testler her kopya icin
// tekrar kosar, bayat kopya yesil gorunup regresyonu gizler.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/core/test/**/*.test.mjs'],
    exclude: ['**/node_modules/**', '**/dist/**'],
    environment: 'node',
  },
});