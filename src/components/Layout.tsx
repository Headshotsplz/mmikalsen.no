import type { ReactNode } from 'react';
import ThemeToggle from './ThemeToggle';
import type { Dict } from '../i18n';

export interface NavItem {
  href: string;
  label: string;
}

interface Props {
  t: Dict;
  title: string;
  subtitle: string;
  nav: NavItem[];
  altHref: string;
  children: ReactNode;
}

export default function Layout({ t, title, subtitle, nav, altHref, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="bg-brand px-4 py-10 text-center text-white">
        <h1 className="text-3xl font-bold sm:text-4xl">{title}</h1>
        <p className="mt-2 text-white/85">{subtitle}</p>
      </header>

      <nav className="sticky top-0 z-10 bg-brand-light/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-center gap-x-5 gap-y-2 px-4 py-2 text-sm text-white">
          {nav.map((item) => (
            <a key={item.href} href={item.href} className="hover:underline">
              {item.label}
            </a>
          ))}
          <span className="flex items-center gap-2">
            <a
              href={altHref}
              lang={t.langSwitch.lang}
              hrefLang={t.langSwitch.lang}
              className="rounded-md px-2 py-1 ring-1 ring-white/50 hover:bg-white/10"
            >
              {t.langSwitch.label}
            </a>
            <ThemeToggle t={t.theme} />
          </span>
        </div>
      </nav>

      <main className="mx-auto w-full max-w-4xl flex-1 space-y-5 px-4 py-8">{children}</main>

      <footer className="py-6 text-center text-sm text-slate-500 dark:text-slate-400">{t.footer}</footer>
    </div>
  );
}
