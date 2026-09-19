import type { ReactNode } from 'react';

export default function Section({ id, title, children }: { id?: string; title?: string; children: ReactNode }) {
  return (
    <section
      id={id}
      className="scroll-mt-14 rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800"
    >
      {title && <h2 className="mb-3 text-xl font-bold text-brand dark:text-slate-100">{title}</h2>}
      {children}
    </section>
  );
}

export function Muted({ children }: { children: ReactNode }) {
  return <p className="text-sm text-slate-500 dark:text-slate-400">{children}</p>;
}
