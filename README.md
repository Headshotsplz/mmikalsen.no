# mmikalsen.no

Personlig nettside for Markus Mikalsen, laget med React, TypeScript, Tailwind CSS og Vite.
Publiseres automatisk til Vercel ved push til `main`.

## Kom i gang

```bash
npm install
npm run dev      # utviklingsserver
npm run build    # typesjekk + bygg til dist/
```

## Struktur

| Sti | Innhold |
|---|---|
| `index.html`, `en/`, `volleyball/`, `en/volleyball/` | Sidene (norsk og engelsk) |
| `src/pages/` | Forside og volleyballside |
| `src/volleyball/` | Tidslinje, kampoversikt, sesongstatistikk og statistikk per kamp |
| `src/components/` | Felles komponenter (layout, graf, sorterbar tabell, tema-knapp) |
| `public/data/kamper.json` | Egen oversikt over alle kamper |
| `public/data/ntnui-matches.json` | Statistikk per kamp for NTNUI 2 (fra NVBF) |
| `api/stats.js` | Vercel-funksjon som henter sesongstatistikk fra NVBF |
| `scripts/update-ntnui-matches.mjs` | Henter nye NTNUI-kamper fra NVBF (`npm run update:matches`) |
| `.github/workflows/` | Kjører skriptet over hver natt |

## Sikkerhet

`vercel.json` setter strenge sikkerhetsheadere (CSP, HSTS m.m.). Siden har ingen
inline-skript eller -stiler, og all data hentes fra eget domene.
