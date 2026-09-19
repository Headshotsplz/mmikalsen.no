import Layout from '../components/Layout';
import Section from '../components/Section';
import { dictionaries } from '../i18n';
import type { Lang } from '../types';

export default function Home({ lang }: { lang: Lang }) {
  const t = dictionaries[lang];
  const h = t.home;
  const prefix = lang === 'en' ? '/en' : '';
  const link = 'text-brand underline decoration-brand/40 underline-offset-2 hover:decoration-brand dark:text-sky-300 dark:decoration-sky-300/40';

  return (
    <Layout
      t={t}
      title={h.title}
      subtitle={h.subtitle}
      altHref={lang === 'en' ? '/' : '/en/'}
      nav={[
        { href: '#about', label: h.nav.about },
        { href: '#studies', label: h.nav.studies },
        { href: '#hobbies', label: h.nav.hobbies },
        { href: `${prefix}/volleyball/`, label: h.nav.volleyball },
        { href: `${prefix}/ntnui/`, label: t.nav.ntnui },
        { href: '#contact', label: h.nav.contact },
      ]}
    >
      <Section id="about" title={h.nav.about}>
        <div className="space-y-3">
          {h.about.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </Section>

      <Section id="studies" title={h.nav.studies}>
        <div className="flex flex-col gap-1 rounded-lg bg-slate-100 p-4 dark:bg-slate-800">
          <span className="text-lg font-bold text-brand dark:text-white">{h.studies.program}</span>
          <span>{h.studies.school}</span>
          <span className="text-sm text-slate-500 dark:text-slate-400">{h.studies.year}</span>
        </div>

        <h3 className="mt-5 mb-2 font-semibold text-brand dark:text-slate-100">{h.studies.siteTitle}</h3>
        <p className="mb-2">{h.studies.siteIntro}</p>
        <ul className="list-disc space-y-1 pl-5">
          {h.studies.siteItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Section>

      <Section id="hobbies" title={h.nav.hobbies}>
        <ul className="list-disc pl-5">
          <li>
            <a href={`${prefix}/volleyball/`} className={link}>
              Volleyball
            </a>
          </li>
        </ul>
      </Section>

      <Section id="contact" title={h.nav.contact}>
        <p className="mb-4">
          <a
            href="/cv/Markus-Mikalsen-CV.pdf"
            type="application/pdf"
            className="inline-block rounded-md bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-light dark:bg-sky-700 dark:hover:bg-sky-600"
          >
            {h.cv}
          </a>
        </p>
        <p>
          LinkedIn:{' '}
          <a href="https://www.linkedin.com/in/markus-mikalsen/" rel="noopener" className={link}>
            linkedin.com/in/markus-mikalsen
          </a>
        </p>
        <p className="mt-1">
          GitHub:{' '}
          <a href="https://github.com/Headshotsplz" rel="noopener" className={link}>
            github.com/Headshotsplz
          </a>
        </p>
      </Section>
    </Layout>
  );
}
