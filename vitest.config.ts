import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
  },
  resolve: {
    alias: {
      '@/components/ui': path.resolve(__dirname, 'tests/__mocks__/ui'),
      '@/hooks': path.resolve(__dirname, 'tests/__mocks__/hooks'),
      'lucide-react': path.resolve(__dirname, 'tests/__mocks__/lucide-react.ts'),
    },
  },
});
