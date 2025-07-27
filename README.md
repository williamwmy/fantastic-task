
# Fantastic Task

En moderne oppgave- og familieliste-app bygget med React og Vite.

## Teknologi

- **React** – UI-komponenter
- **Vite** – Rask utviklingsserver og byggverktøy
- **Playwright** – E2E-testing
- **Vitest** – Enhetstesting
- **ESLint** – Kvalitetskontroll av kode

## Komme i gang

1. Installer avhengigheter:
   ```bash
   npm install
   ```
2. Start utviklingsserver:
   ```bash
   npm run dev
   ```
3. Kjør enhetstester:
   ```bash
   npm run test
   ```
4. Kjør E2E-tester:
   ```bash
   npm run test:e2e
   ```

## Mapper

- `src/` – Kildekode for appen
- `public/` – Statisk innhold
- `database/` – SQL-skjema og migreringer
- `tests/` – E2E-tester
- `coverage/` – Testdekning (genereres automatisk, ikke sjekkes inn)
- `playwright-report/` – Playwright testrapporter (genereres automatisk, ikke sjekkes inn)
- `test-results/` – Testresultater (genereres automatisk, ikke sjekkes inn)

## Kvalitetssikring

- Kjør `npm run lint` for å sjekke kodekvalitet.
- Testdekning og rapporter genereres automatisk ved testkjøring.