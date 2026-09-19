import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { getLang } from './i18n';
import Home from './pages/Home';
import Volleyball from './pages/Volleyball';
import { applyTheme, getStoredTheme } from './theme';

applyTheme(getStoredTheme());

const root = document.getElementById('root');
if (root) {
  const lang = getLang();
  const page = root.dataset.page === 'volleyball' ? <Volleyball lang={lang} /> : <Home lang={lang} />;
  createRoot(root).render(<StrictMode>{page}</StrictMode>);
}
