import type { ReactNode } from 'react';

// Innhold som er skjult til man klikker (brukes for detaljtabeller).
export default function Collapsible({ summary, children }: { summary: string; children: ReactNode }) {
  return (
    <details className="group mt-2">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-md px-2 py-1 text-sm font-semibold text-brand hover:bg-slate-100 dark:text-sky-300 dark:hover:bg-slate-800 [&::-webkit-details-marker]:hidden">
        <span aria-hidden="true" className="transition-transform group-open:rotate-90">
          ▸
        </span>
        {summary}
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}
