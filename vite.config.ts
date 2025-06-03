// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtém __dirname em ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Permite importar "@/" para apontar para "src/"
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    lib: {
      // Ponto de entrada da biblioteca
      entry: path.resolve(__dirname, 'src/index.ts'),
      // Nome da variável global para UMD
      name: 'IsoBoardLib',
      // Formatos que queremos gerar: ES e UMD
      formats: ['es', 'umd'],
      // Gera o nome dos arquivos com base no formato. '_' ignora o segundo parâmetro.
      fileName: (format, _entryName) => `iso-board-lib.${format}.js`,
    },
    rollupOptions: {
      // Essas dependências não devem ser empacotadas dentro do bundle
      external: ['react', 'react-dom', 'phaser'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          phaser: 'Phaser',
        },
      },
    },
    // Diretório de saída
    outDir: 'dist',
    // Gera sourcemaps para facilitar debugging
    sourcemap: true,
  },
});
