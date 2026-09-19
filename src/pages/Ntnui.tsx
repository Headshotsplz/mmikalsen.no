import Layout from '../components/Layout';
import Section from '../components/Section';
import { dictionaries } from '../i18n';
import type { Lang } from '../types';
import CurrentSeason from '../volleyball/CurrentSeason';

// Egen side for NTNUI 2 i 1. divisjon 2026/27.
export default function Ntnui({ lang }: { lang: Lang }) {
  const t = dictionaries[lang];
  const prefix = lang === 'en' ? '/en' : '';

  return (
    <Layout
      t={t}
      title="NTNUI 2"
      subtitle={t.current.subtitle}
      altHref={lang === 'en' ? '/ntnui/' : '/en/ntnui/'}
      nav={[
        { href: `${prefix}/`, label: t.nav.home },
        { href: `${prefix}/volleyball/`, label: t.nav.volleyball },
        { href: `${prefix}/ntnui/`, label: t.nav.ntnui },
      ]}
    >
      <Section>
        <p>{t.current.intro}</p>
      </Section>
      <Section>
        <CurrentSeason lang={lang} t={t} />
      </Section>
    </Layout>
  );
}
