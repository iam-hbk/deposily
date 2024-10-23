import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'), // Use './' to point to the root directory
    },
  },
  test: {
    globals: true, // Optional: Allow using global describe, it, etc.
    environment: 'node', // Optional: Ensure Vitest runs in the right environment
  },
});
