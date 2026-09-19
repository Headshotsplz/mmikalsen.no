import type { ReactNode } from 'react';
import type { Dict } from '../i18n';

function Entry({ years, team, logo, children }: { years: string; team: string; logo: ReactNode; children: ReactNode }) {
  return (
    <li className="relative pb-5 pl-6 last:pb-0">
      <span className="absolute top-1.5 -left-[8px] h-3.5 w-3.5 rounded-full bg-brand ring-4 ring-white dark:bg-slate-300 dark:ring-slate-900" />
      <span className="block text-sm text-slate-500 dark:text-slate-400">{years}</span>
      <span className="flex items-center gap-2.5 text-lg font-bold">
        {logo}
        {team}
      </span>
      {children}
    </li>
  );
}

export default function Timeline({ t }: { t: Dict }) {
  const v = t.vb;
  return (
    <ul className="border-l-[3px] border-brand dark:border-slate-600">
      <Entry years={v.forde.years} team="Førde" logo={<img src="/images/logo-forde.jpg" width={160} height={160} alt="" className="h-10 w-auto" />}>
        <p className="mt-1">{v.forde.text}</p>
        <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm font-bold text-amber-900 dark:bg-amber-900/50 dark:text-amber-200">
          {v.forde.badge}
        </span>
        <img
          src="/images/forde-lag.jpg"
          width={765}
          height={765}
          alt={v.forde.photoAlt}
          loading="lazy"
          className="mt-3 block h-auto w-full max-w-md rounded-lg"
        />
        <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{v.forde.caption}</span>
      </Entry>
      <Entry years={v.osi.years} team="OSI" logo={null}>
        <p className="mt-1">{v.osi.text}</p>
      </Entry>
      <Entry years={v.ntnui.years} team="NTNUI" logo={<img src="/images/logo-ntnui.webp" width={2000} height={810} alt="" className="h-10 w-auto" />}>
        <p className="mt-1">{v.ntnui.text}</p>
      </Entry>
    </ul>
  );
}
