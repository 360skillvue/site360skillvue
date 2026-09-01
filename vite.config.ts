import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv, type Plugin} from 'vite';

// Mirrors the /simulateur-cout-tms-rps -> .html rewrite from vercel.json for local dev.
const simulateurRewrite: Plugin = {
  name: 'simulateur-cout-tms-rps-rewrite',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/simulateur-cout-tms-rps') {
        req.url = '/simulateur-cout-tms-rps.html';
      }
      next();
    });
  },
};

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), simulateurRewrite],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    build: {
      outDir: 'www',
      rollupOptions: {
        output: {
          // Nom fixe pour le point d'entree et la feuille de style : les 84
          // pages pre-rendues les citent, un nom hache obligerait a toutes
          // les redeposer a chaque build. Les morceaux charges a la demande
          // gardent leur empreinte, ils ne sont cites que par le bundle.
          entryFileNames: 'assets/app.js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: (info) =>
            info.name && info.name.endsWith('.css')
              ? 'assets/app[extname]'
              : 'assets/[name]-[hash][extname]',
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
