import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { getLang } from './i18n';
import Home from './pages/Home';
import Ntnui from './pages/Ntnui';
import Volleyball from './pages/Volleyball';
import { applyTheme, getStoredTheme } from './theme';

applyTheme(getStoredTheme());

const root = document.getElementById('root');
if (root) {
  const lang = getLang();
  const pages = {
    volleyball: <Volleyball lang={lang} />,
    ntnui: <Ntnui lang={lang} />,
  };
  const page = pages[root.dataset.page as keyof typeof pages] ?? <Home lang={lang} />;
  createRoot(root).render(<StrictMode>{page}</StrictMode>);
}
