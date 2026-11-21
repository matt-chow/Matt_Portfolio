import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

// Relative base + hash routing: works on GitHub Pages at any repo path.
export default defineConfig({
  base: './',
  plugins: [react()],
  test: { environment: 'jsdom' },
});
