# HJV Scenarier

Webbaseret øvelsessystem til oprettelse, sammensætning og afvikling af scenarier med opgaver. Systemet er udviklet med henblik på øvelser, hvor deltagere kan arbejde med opgaver undervejs, herunder opgaver med GPS-aktivering og begrænset netværksforbindelse.

Repositoryet indeholder en administrationsdel, en brugerflade til deltagere og instruktører samt et fælles API.

**Status:** Udviklingsprototype. Centrale flows er implementeret, men løsningen er ikke færdigtestet eller klargjort til produktion. Se [Status og videreudvikling](#status-og-videreudvikling).

## Kom hurtigt i gang

### Forudsætninger

- Git
- Docker Desktop med Docker Compose
- Node.js 22
- pnpm (eventuelt via Corepack)

### 1. Hent projektet og installer dependencies

```bash
git clone https://github.com/foirfe/hjv-scenarier.git
cd hjv-scenarier
pnpm install
```

### 2. Opret miljøfiler

Kopiér følgende eksempel-filer:

```text
.env.example          -> .env
apps/api/.env.example -> apps/api/.env
```

I rodens `.env` angives PostgreSQL-brugernavn, adgangskode og databasenavn. I `apps/api/.env` angives API'ets databaseforbindelse, JWT-secret og adgangskode til første administrator.

Eksempel til lokal udvikling med værdierne fra rodens `.env.example`:

```dotenv
# .env (i projektets rod)
POSTGRES_USER=hjv_user
POSTGRES_PASSWORD=local_dev_password_change_me
POSTGRES_DB=hjv_database
```

```dotenv
# apps/api/.env
DATABASE_URL="postgresql://hjv_user:local_dev_password_change_me@db:5432/hjv_database?schema=public"
PORT=3000
JWT_SECRET="indsæt-en-lang-tilfældig-secret"
SEED_ADMIN_PASSWORD="indsæt-en-stærk-adgangskode"
CORS_ORIGINS="http://localhost:5173,http://localhost:5174"
```

**Bemærk:** API'et kører i Docker og skal derfor bruge `db` som database-host, ikke `localhost`. Skifter du PostgreSQL-adgangskoden i rodens `.env`, skal den samme adgangskode bruges i `DATABASE_URL`. Brug ikke eksempel-adgangskoder i et delt eller offentligt miljø. Miljøfilerne må ikke committes.

### 3. Start database og API

```bash
pnpm setup:dev
pnpm db:seed
```

`setup:dev` bygger/starter Docker-containere, anvender eksisterende Prisma-migrationer og genererer Prisma-klienten. `db:seed` opretter grunddata og den første administrator.

Seed opretter blandt andet opgavetyperne `OBSERVATION`, `QUIZ`, `PROCEDURE`, `CHECKLIST` og `EMERGENCY` samt miljøerne Maritim, Land og Kyst.

Første login er:

- **Brugernavn:** `admin`
- **Adgangskode:** værdien i `SEED_ADMIN_PASSWORD`

Seed ændrer ikke adgangskoden for en administrator, der allerede findes i databasen.

### 4. Start de to frontends

Åbn to terminaler fra projektets rod:

```bash
pnpm dev:management
```

```bash
pnpm dev:user
```

| Del | Lokal adresse |
| --- | --- |
| Management | http://localhost:5173 |
| Deltager-/instruktørvisning | http://localhost:5174 |
| API | http://localhost:3000 |
| Swagger / API-dokumentation | http://localhost:3000/docs |

Frontends bruger som udgangspunkt `http://localhost:3000`. En anden API-adresse kan angives med `VITE_API_URL` i den relevante frontend.

## Hvad kan systemet?

### Management (`apps/management-web`)

Administrationsdelen bruges af brugere med global rolle `ADMIN`.

- **Oversigt:** Nøgletal, aktive afviklinger og scenarier, der kræver opmærksomhed.
- **Opgaver:** Oprettelse og redigering af genbrugelige opgaver, quizzer, tjeklister og instruktørinstruktioner.
- **Excel-import:** Download af skabelon, forhåndsvisning/validering og import af udvalgte opgaver.
- **Scenarier:** Samling af opgaver, afhængigheder mellem opgaver og valg af aktiveringsform.
- **Afviklinger:** Oprettelse af afviklinger, tilknytning af brugere, roller, start og opfølgning på progression.
- **Deltagere:** Administration af brugere og deres status/roller.

Et scenarie har status `DRAFT`, `READY` eller `ARCHIVED`. I oprettelsesdialogen til afviklinger kan man vælge scenarier med status `READY`.

### Deltager- og instruktørvisning (`apps/users-web`)

Brugere logger ind og ser de afviklinger, de er tilknyttet.

- Deltagere og holdledere ser egne opgaver og progression.
- Instruktører kan følge deltagernes opgavestatus og aktivere manuelle opgaver.
- Opgaver kan have quiz-svar, fritekstsvar eller tjeklister.
- GPS-opgaver kan aktiveres, når brugeren er inden for den konfigurerede radius.
- Kompas/GPS-guide er implementeret, hvor browser og enhed understøtter det.
- Gennemførte opgaver vises sammenfoldet.
- En synkroniseringsindikator viser forbindelse og ændringer, der afventer serveren.

Der er to forskellige rollebegreber:

| Niveau | Roller | Formål |
| --- | --- | --- |
| Global brugerrolle | `ADMIN`, `USER` | Adgang til administration og API |
| Rolle i en afvikling | `PARTICIPANT`, `TEAM_LEADER`, `INSTRUCTOR` | Funktion i en konkret øvelse |

En person kan have forskellige roller i forskellige afviklinger. Brugerne knyttes direkte til afviklinger; der er ikke et særskilt hold-/gruppesystem i den nuværende datamodel.

## Afprøv et enkelt scenarie

Når miljøet kører, kan det samlede flow afprøves sådan:

1. Log ind på management-web som `admin`, og opret en deltager under **Deltagere**.
2. Opret en aktiv opgave under **Opgaver**.
3. Opret et scenarie under **Scenarier**, tilføj opgaven, og sæt scenariet til `READY`.
4. Opret en afvikling under **Afviklinger** og tilknyt deltageren med rollen `PARTICIPANT`.
5. Start afviklingen. Det er her, opgaver og progression oprettes som run-data.
6. Log ind som deltager på users-web, åbn afviklingen, og gennemfør opgaven.

Brug gerne en `AUTOMATIC` opgave til første test. Så er testen ikke afhængig af GPS eller manuel instruktøraktivering.

## Sådan hænger projektet sammen

```text
apps/
├── api/               NestJS API, Prisma og database-logik
├── management-web/    React/Vite til administration
└── users-web/         React/Vite til deltagere og instruktører
    └── src/offline/    IndexedDB, snapshots og syncQueue

compose.yaml           Docker-opsætning til API og PostgreSQL
pnpm-workspace.yaml    Monorepo-workspace
package.json           Fælles scripts
```

Teknologier: TypeScript, React, Vite, React Router, NestJS, PostgreSQL, Prisma, Docker Compose og pnpm. Brugerfladens offline-lager er bygget med Dexie oven på IndexedDB.

### De vigtigste datamodeller

| Model | Ansvar |
| --- | --- |
| `Task` | Genbrugelig opgave med type, indhold og eventuelle svarmuligheder/tjeklistepunkter |
| `Scenario` | Samling af opgaver med status |
| `ScenarioTask` | Placering af en opgave i et scenarie, inklusive aktivering, GPS og afhængigheder |
| `ScenarioRun` | En konkret afvikling af et scenarie |
| `ScenarioRunTask` | Kopi af en opgave til den konkrete afvikling |
| `ScenarioRunUser` | Brugerens tilknytning og rolle i afviklingen |
| `ScenarioRunTaskProgress` | Én brugers progression, svar og tjekliste for én run-opgave |

Ved **start af en afvikling** opretter backend snapshots af scenariets opgaver. Dermed er et igangværende run ikke afhængigt af, at de oprindelige opgaveskabeloner senere redigeres.

En task kan have en af tre aktiveringsformer:

| Aktivering | Virkemåde |
| --- | --- |
| `AUTOMATIC` | Bliver aktiv automatisk, når forudsætningerne er opfyldt |
| `GEO` | Bliver tilgængelig efter forudsætningerne og aktiveres inden for GPS-radius |
| `MANUAL` | Afventer instruktøraktivering, når forudsætningerne er opfyldt |

En opgaves progression følger `LOCKED`, `AVAILABLE`, `ACTIVE` og `COMPLETED`. Flere forudsætninger kan være knyttet til samme opgave; alle skal være gennemført før oplåsning.

### Hvor ændrer man hvad?

| Hvis du skal ændre ... | Start her |
| --- | --- |
| Databasefelter og relationer | `apps/api/prisma/schema.prisma` |
| Opgaver og Excel-import | `apps/api/src/tasks/` |
| Scenarier og afhængigheder | `apps/api/src/scenarios/` |
| Afvikling, progression og GPS-validering | `apps/api/src/scenario-runs/` |
| Brugerlogin og rettigheder | `apps/api/src/auth/`, `apps/api/src/users/` |
| Management-sider | `apps/management-web/src/pages/` |
| Deltager-/instruktørvisning | `apps/users-web/src/pages/`, `components/`, `hooks/` |
| Offline-data og synkronisering | `apps/users-web/src/offline/` |

NestJS er opdelt i controllere, services og DTO'er. Controlleren håndterer HTTP, DTO'en validerer input, og servicen udfører logik og databaseoperationer. API-endpoints kan undersøges i Swagger på `/docs`.

## Offline-funktionalitet

Offline-understøttelsen ligger i **users-web**, ikke i management-web.

Når en bruger åbner en igangværende afvikling online, kan den relevante run-state og et separat offline-snapshot lagres i IndexedDB. Snapshot'et indeholder opgaveindhold til senere lokal oplåsning, men ikke facit (`isCorrect`) eller instruktørinstruktioner.

IndexedDB-databasen hedder `hjv-offline` og har tre stores:

| Store | Indhold |
| --- | --- |
| `runs` | Brugerens aktuelle/cached run og opgavestatus |
| `runSnapshots` | Task-definitioner til offline brug |
| `syncQueue` | Mutationer der endnu ikke er bekræftet af API'et |

De implementerede køtyper er:

```text
COMPLETE_TASK
CHECKLIST_ITEM
SUBMIT_ANSWER
GEO_ACTIVATE
```

Ved manglende forbindelse gemmes handlinger lokalt. `syncManager.ts` forsøger at sende dem i rækkefølge, når forbindelsen er tilbage. UI'et opdateres lokalt, men **serveren er den endelige kilde til korrekt progression og validering**.

Centrale filer:

- `offline/db.ts`: Dexie-database og versionsopgraderinger.
- `offline/runCache.ts`: Lokal run-state.
- `offline/runSnapshot.ts`: Cache og sammenfletning af run med task-indhold.
- `offline/localProgress.ts`: Lokal oplåsning af afhængige opgaver.
- `offline/syncQueue.ts`: Oprettelse og læsning af ventende ændringer.
- `offline/syncManager.ts`: Gensendelse af ændringer til API.
- `components/SyncQueueProcessor.tsx`: Forsøg på synkronisering ved drift/genopkobling.

**Begrænsninger:** Appens HTML/JavaScript er endnu ikke pakket til offline opstart via en service worker/PWA. Listen over alle afviklinger (`/scenario-runs/me`) har heller ikke tilsvarende offline-cache. Test derfor offline-funktionerne ved først at åbne den konkrete øvelse online og derefter stoppe API'et, mens frontend stadig kører. Offline-adgang efter lukning af browsersessionen er ikke garanteret med den nuværende sessionStorage-baserede loginhåndtering.

Quiz-facit valideres på serveren, når svaret synkroniseres. GPS-valideringen bruger rapporterede koordinater og er ikke en sikring mod manipuleret/spoofet position.

## Daglig udvikling

Fra projektets rod:

| Kommando | Formål |
| --- | --- |
| `pnpm dev:backend` | API via Docker Compose med watch |
| `pnpm docker:up` | Byg og start API/database |
| `pnpm docker:down` | Stop containere |
| `pnpm docker:status` | Se containerstatus |
| `pnpm api:logs` | Følg API-log |
| `pnpm db:logs` | Følg PostgreSQL-log |
| `pnpm db:status` | Status på Prisma-migrationer |
| `pnpm db:apply` | Anvend eksisterende migrationer |
| `pnpm db:generate` | Generér Prisma-klient |
| `pnpm db:seed` | Seed grunddata og admin |

Ved ændringer i `schema.prisma` oprettes en ny migration under udvikling:

```bash
docker compose exec api pnpm prisma migrate dev --name beskriv_aendringen
pnpm db:generate
```

Commit migrationen sammen med schemaændringen. De genererede Prisma-filer er ignoreret af Git.

Byg og lint kan køres for hver app:

```bash
pnpm --dir apps/api build
pnpm --dir apps/api test
pnpm --dir apps/management-web build
pnpm --dir apps/management-web lint
pnpm --dir apps/users-web build
pnpm --dir apps/users-web lint
```

Der findes enkelte testfiler, men en dækkende automatiseret testpakke for de centrale flows er endnu ikke etableret. Eksisterende startertests bør ikke bruges som dokumentation for fuld funktionalitet.

## Status og videreudvikling

Projektet er sat på pause efter udviklingen af den lokale dependency-motor i oktober 2026. Der er implementeret mange af de centrale funktioner, men en samlet ende-til-ende-test og produktionsgennemgang mangler.

**Vigtigt ved overtagelse:**

1. **Gennemgå API-adgang til opgaver.** `GET /tasks/:id` kræver login, men mangler aktuelt `ADMIN`-rollebegrænsning. Den tilhørende service returnerer også quiz-options med `isCorrect`. Det bør rettes, før systemet bruges med rigtige kursister.
2. **Test offline/synkronisering systematisk.** Kontrollér især rækkefølge af køhandlinger, genforsøg, genindlæsning under ventende ændringer og konflikter, når API'et kommer tilbage. Se også `refreshRun()` i `RunPage.tsx` for dobbelte cache-skrivninger og `syncManager.ts` for udsendelse af gentagne `RUN_SYNCED_EVENT` under replay.
3. **Tilføj PWA/service worker**, hvis brugerfladen skal kunne åbnes fra en helt offline enhed. Det er endnu ikke implementeret.
4. **Udbyg testdækningen.** Prioritér rolleadgang, scenariosnapshots, dependencies med flere forudsætninger, svar/tjeklister, GPS og offline replay.
5. **Gennemgå drift og sikkerhed.** Swagger er aktuelt sat op uden miljøbegrænsning. Overvej håndtering af lokale snapshots, sessions, personoplysninger, logs og deployment, før produktion.
6. **Ret mindre UI-/dataafvigelser.** Management-oversigten viser bl.a. en tæller mærket “Aktive deltagere”, mens API'et tæller alle aktive brugere. Dette bør enten omdøbes eller beregnes anderledes.

Det statiske offline-snapshot indeholder også indholdet af endnu låste opgaver. UI'et skjuler indholdet, men en bruger med adgang til browserens udviklerværktøjer kan se det i IndexedDB. Det er en kendt afvejning ved fuldt offline scenarieforløb.

## Fejlfinding

**API kan ikke forbinde til PostgreSQL:** Kontrollér at Docker-containerne kører, at værdierne i de to `.env`-filer matcher, og at `DATABASE_URL` bruger hostnavnet `db` inde i Docker.

**CORS-fejl fra frontend:** Kontrollér `CORS_ORIGINS` i `apps/api/.env`. Den skal indeholde de faktiske adresser på begge frontends. Husk at genstarte API ved ændringer i miljøvariabler.

**Prisma-fejl efter schemaændring:** Kontrollér migrationstatus og regenerér klienten. Prisma kører i Docker, hvilket også undgår behovet for at afvikle Prisma-motoren direkte på Windows.

**Ingen administrator efter første start:** Kontrollér `SEED_ADMIN_PASSWORD` og kør `pnpm db:seed`. Eksisterende `admin` får ikke automatisk ny adgangskode ved gentaget seed.

**Opgaver åbner ikke offline:** Kontrollér under browserens DevTools → Application → IndexedDB → `hjv-offline`, at både `runs` og `runSnapshots` indeholder det konkrete run. Kig i `syncQueue` for handlinger, som afventer synkronisering.

**Login virker ikke efter længere tids pause:** JWT udløber efter én time. Ny login kræver forbindelse til API'et.

---

Denne README dokumenterer repositoryets tilstand ved overdragelsen. Nye udviklere bør først få det lokale miljø op at køre, gennemføre et lille scenario fra management til deltagervisning og derefter gennemgå punkterne under videreudvikling.

