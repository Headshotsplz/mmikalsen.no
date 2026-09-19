import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Flere HTML-sider (samme adresser som før): norsk og engelsk forside og volleyballside.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    // Ingen data:-URI-er, så Content-Security-Policy (img-src 'self') ikke stopper noe.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: {
        home: 'index.html',
        homeEn: 'en/index.html',
        volleyball: 'volleyball/index.html',
        volleyballEn: 'en/volleyball/index.html',
      },
    },
  },
});
