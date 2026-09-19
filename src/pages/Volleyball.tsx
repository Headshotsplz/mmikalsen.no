import Layout from '../components/Layout';
import Section from '../components/Section';
import { dictionaries } from '../i18n';
import type { Lang } from '../types';
import MatchOverview from '../volleyball/MatchOverview';
import PerMatchStats from '../volleyball/PerMatchStats';
import SeasonStats from '../volleyball/SeasonStats';
import Timeline from '../volleyball/Timeline';

export default function Volleyball({ lang }: { lang: Lang }) {
  const t = dictionaries[lang];
  const v = t.vb;

  return (
    <Layout
      t={t}
      title="Volleyball"
      subtitle={v.subtitle}
      altHref={lang === 'en' ? '/volleyball/' : '/en/volleyball/'}
      nav={[
        { href: lang === 'en' ? '/en/' : '/', label: v.nav.home },
        { href: '#teams', label: v.nav.teams },
        { href: '#matches', label: v.nav.matches },
        { href: '#statistics', label: v.nav.stats },
        { href: '#per-match', label: v.nav.perMatch },
      ]}
    >
      <Section>
        <p className="text-lg">{v.intro}</p>
      </Section>

      <img
        src="/images/volleyball-serve.jpg"
        width={900}
        height={1200}
        alt={v.photoAlt}
        className="mx-auto block h-auto w-full max-w-md rounded-xl"
      />

      <Section id="teams" title={v.teams}>
        <Timeline t={t} />
      </Section>

      <Section id="matches" title={t.matches.title}>
        <p className="mb-4">{t.matches.intro}</p>
        <MatchOverview lang={lang} t={t} />
      </Section>

      <Section id="statistics" title={t.stats.title}>
        <p className="mb-4">{t.stats.intro}</p>
        <SeasonStats lang={lang} t={t} />
      </Section>

      <Section id="per-match" title={t.perMatch.title}>
        <p className="mb-4">{t.perMatch.intro}</p>
        <PerMatchStats lang={lang} t={t} />
      </Section>
    </Layout>
  );
}
