import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json-summary'],
      include: [
        'lib/setUtils.ts',
        'lib/slugGenerator.ts',
        'lib/formatters.ts',
        'lib/stats/calculations.ts',
        'app/api/releases/route.ts',
        'app/api/admin/cards/route.ts',
      ],
      thresholds: {
        // Phase 1 modules have strict 80% threshold
        'lib/setUtils.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'lib/slugGenerator.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
        'lib/stats/calculations.ts': { statements: 80, branches: 80, functions: 80, lines: 80 },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
