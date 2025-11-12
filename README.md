
# Fantastic Task

En moderne familie-oppgaveapp bygget som Progressive Web App (PWA) med React og Vite. Appen lar familier administrere oppgaver sammen med et poengsystem og rollehåndtering.

## Funksjoner

- 🏠 **Familiebasert oppgavestyring** - Opprett eller bli med i en familie med invitasjonskoder
- 👥 **Rollehåndtering** - Admin, medlemmer og barn med forskjellige tillatelser
- 📅 **Dagsbasert oppgavefiltrering** - Vis oppgaver for spesifikke dager
- ⭐ **Poengsystem** - Tjen poeng for fullførte oppgaver
- 📊 **Statistikk og visualisering** - Se fremgang med diagrammer
- 🎨 **Tilpassbare profiler** - Velg kallenavn og avatar-farger
- 📱 **PWA-støtte** - Installer som app på mobil/desktop
- 🔒 **Sikkerhet** - Row Level Security (RLS) med Supabase

## Teknologi

### Frontend
- **React 19** – Moderne UI-komponenter med hooks
- **Vite** – Rask utviklingsserver og byggverktøy
- **React Icons** – Ikoner
- **Recharts** – Datavisualisering og statistikk
- **React Rewards** – Belønningsanimasjoner

### Backend & Database
- **Supabase** – Backend-as-a-Service med PostgreSQL
- **PostgreSQL** – Database med Row Level Security
- **Supabase Auth** – Autentisering og brukerhåndtering

### Testing & Kvalitet
- **Vitest** – Enhetstesting med moderne API
- **Playwright** – End-to-end testing
- **ESLint** – Kodekvalitetskontroll
- **Husky** – Git hooks for automatisering

## Komme i gang

### Forutsetninger
- Node.js (16+)
- npm eller yarn
- Supabase-konto

### 1. Installer avhengigheter
```bash
npm install
```

### 2. Sett opp Supabase
1. Opprett et nytt prosjekt på [supabase.com](https://supabase.com)
2. Kopier `.env.example` til `.env.local` og fyll inn dine Supabase-detaljer:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
3. Kjør SQL-skriptene i `database/` mappen for å sette opp databaseskjemaet:
   - `database/schema.sql` - Hovedskjema
   - `database/rls-policies.sql` - Sikkerhetspolicies

### 3. Sett opp GitHub Secrets (for keep-alive)
For å holde Supabase-databasen aktiv og forhindre at den blir suspendert, må du legge til følgende secrets i GitHub repository settings:

1. Gå til repository settings → Secrets and variables → Actions
2. Legg til følgende secrets:
   - `VITE_SUPABASE_URL` - Din Supabase URL
   - `VITE_SUPABASE_ANON_KEY` - Din Supabase anon key

GitHub Actions vil automatisk kjøre et keep-alive script daglig kl. 03:00 UTC.

### 4. Start utviklingsserver
```bash
npm run dev
```

Appen vil være tilgjengelig på `http://localhost:5173`

## Tilgjengelige kommandoer

### Utvikling
```bash
npm run dev          # Start utviklingsserver
npm run build        # Bygg produksjonsversjon
npm run preview      # Forhåndsvis produksjonsbygg
npm run lint         # Kjør ESLint kodekvalitetskontroll
```

### Testing
```bash
npm run test         # Kjør enhetstester (watch mode)
npm run test:run     # Kjør enhetstester (enkeltkjøring)
npm run test:ui      # Kjør enhetstester med UI
npm run test:coverage # Kjør enhetstester med dekningsrapport
npm run test:e2e     # Kjør E2E-tester
npm run test:e2e:ui  # Kjør E2E-tester med UI
```

### Versjonshåndtering
```bash
npm run version:patch  # Bump patch version (1.0.0 → 1.0.1)
npm run version:minor  # Bump minor version (1.0.0 → 1.1.0)
npm run version:major  # Bump major version (1.0.0 → 2.0.0)
npm run version:show   # Vis gjeldende version
```

> **Merk:** Prosjektet bruker automatisk semantisk versjonering. Versjonen bumpes automatisk ved push til main branch basert på commit-meldinger (conventional commits).

## Mappestruktur

```
fantastic-task/
├── src/                    # Kildekode
│   ├── components/         # React-komponenter
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utilities og konfigurasjoner
│   └── test/              # Testfiler
├── public/                # Statisk innhold og PWA-manifest
├── database/              # SQL-skjema og migreringer
├── scripts/               # Utility scripts (keep-alive, etc.)
├── tests/                 # E2E-tester (Playwright)
├── .github/workflows/     # GitHub Actions workflows
├── coverage/              # Testdekning (auto-generert)
├── playwright-report/     # Playwright rapporter (auto-generert)
└── test-results/          # Testresultater (auto-generert)
```

## Arkitektur

### Hovedkomponenter
- **App.jsx** - Hovedapp med state management og routing
- **AuthModal.jsx** - Autentisering og familieopprettelse
- **TaskList.jsx** - Oppgaveliste med datofiltrering
- **ProfileSelector.jsx** - Familiemedlemvelger og profilhåndtering
- **FamilyMemberCard.jsx** - Detaljert medlemsredigering
- **StatsBarChart.jsx** - Statistikkvisualisering

### Hooks
- **useAuth.js** - Autentiseringshåndtering
- **useFamily.js** - Familiehåndtering og tillatelser
- **useTasks.js** - Oppgavehåndtering

### Database
Bruker PostgreSQL med Supabase og Row Level Security for:
- **families** - Familiegrupper
- **family_members** - Brukere i familier
- **tasks** - Oppgaver med gjentagelsesmønstre
- **task_assignments** - Daglige oppgavetildelinger
- **task_completions** - Fullførte oppgaver
- **points_transactions** - Poenghistorikk

## Lisens

Dette prosjektet er privat og ikke lisensiert for offentlig bruk.