import type { ReactNode } from 'react';
import Layout from '../components/Layout';
import Section from '../components/Section';
import Tabs from '../components/Tabs';
import { dictionaries } from '../i18n';
import type { Lang } from '../types';
import CurrentSeason from '../volleyball/CurrentSeason';
import MatchOverview from '../volleyball/MatchOverview';
import PerMatchStats from '../volleyball/PerMatchStats';
import SeasonStats from '../volleyball/SeasonStats';
import Timeline from '../volleyball/Timeline';

function TabIntro({ children }: { children: ReactNode }) {
  return <p className="mb-4 text-sm text-slate-600 dark:text-slate-300">{children}</p>;
}

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
        { href: '#statistics', label: v.nav.stats },
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

      <Section id="statistics" title={v.stats}>
        <Tabs
          tabs={[
            {
              id: 'career',
              label: v.tabs.career,
              content: (
                <>
                  <TabIntro>{t.matches.intro}</TabIntro>
                  <MatchOverview lang={lang} t={t} />
                </>
              ),
            },
            {
              id: 'seasons',
              label: v.tabs.seasons,
              content: (
                <>
                  <TabIntro>{t.stats.intro}</TabIntro>
                  <SeasonStats lang={lang} t={t} />
                </>
              ),
            },
            {
              id: 'per-match',
              label: v.tabs.perMatch,
              content: (
                <>
                  <TabIntro>{t.perMatch.intro}</TabIntro>
                  <PerMatchStats lang={lang} t={t} />
                </>
              ),
            },
            {
              id: 'current',
              label: v.tabs.current,
              content: (
                <>
                  <TabIntro>{t.current.intro}</TabIntro>
                  <CurrentSeason lang={lang} t={t} />
                </>
              ),
            },
          ]}
        />
      </Section>
    </Layout>
  );
}
