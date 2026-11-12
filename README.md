# The Balikbayan Project

An interactive literary website about Filipino migration, memory, family, and belonging. Visitors explore a balikbayan box, read paired accounts from someone who left and someone who stayed, and discover related readings and films.

The implementation follows the approved forest-green, cream, and sage design: a box logo beside the header title, textured Home headline, filled photographic sections, a three-column story collection, and a simple contribution form.

## Run the website

Use Node.js 22 or later. There are no third-party dependencies to install.

```sh
npm start
```

Open **http://127.0.0.1:4173**. Keep the terminal running; press **Ctrl+C** to stop. `npm run dev` and `node server.mjs` do the same thing. To use another port, run `PORT=4174 npm start` on macOS/Linux.

Use the same address, port, and browser profile to retain access to your saved contributions. `localhost`, `127.0.0.1`, a different port, and the eventual Vercel domain have separate browser storage. Export a backup before moving between them. Open the site through the server rather than double-clicking `index.html`.

## Pages and interactions

- **Home** — textured split hero, four object links, and a preview of both perspectives.
- **Inside the Box** (`#box`) — select a letter, photograph, journey, or taste of home; the image, description, and matching story update together. Object selections support direct links, such as `#box?object=journey`.
- **Our Stories** (`#stories`) — ten original accounts in five pairs, English/Filipino reading editions, bilingual keyword search, perspective/source filters, and five themes: Leaving, Staying, Remembering, Coming Home, and Belonging. Story cards lift and show a shadow on hover or keyboard focus. The default collection omits sample counts and badges; author names and theme tags have separate positions.
- **Story reading** (`#story/sample-ari`, for example) — paired reading on desktop, stacked accounts on phones, English/Filipino controls, media players, transcripts, and links to more reading. Own contributions can be edited or removed.
- **Explore & Watch** (`#explore`) — six credited original resources, format/theme/place filters, keyword search, external reading links, and YouTube players opened on demand.
- **Share Your Story** (`#submit`) — name or pseudonym, title, perspective, theme, narrative, optional image/audio/video, media description, and consent. An unpaired own contribution can be connected to a companion account.
- **About** (`#about`) — project context, image-led concepts, English/Filipino introduction switching, photography sources, and storage/privacy information. The old `#exhibit` link remains an alias for About.

The four additional original fictional accounts are **The first winter coat**, **It is still warm here**, **The words I kept**, and **You can answer in English**. These built-in accounts are original fiction, with the content note kept in About and the credits. They are not interviews or verified testimonies.

## What hosting does and does not change

The website is static. Contributions and uploaded media are stored as IndexedDB records and binary Blobs in the visitor's browser. They are not sent to a public database, and other visitors cannot see them. Vercel hosts the website files; it does not make browser-local submissions shared.

A shared public archive would need a backend database, file storage, and appropriate submission/moderation controls. No API keys or environment variables are needed for the current site.

Explore & Watch is an edited collection of links and summaries in `js/resources.js`, not an automatic web crawler, RSS importer, or live YouTube search. Full articles remain on their original publishers' websites. No YouTube iframe is loaded until a visitor chooses a video. Local assets make the core pages work without remote image/font services; external articles and YouTube playback require internet access.

## Build and deploy

```sh
npm run build
```

This creates **`dist/`**, containing only `index.html`, CSS, JavaScript, and assets. Tests, documentation, development servers, and browser test data are excluded.

`vercel.json` sets Framework Preset **Other**, Build Command **`npm run build`**, and Output Directory **`dist`**. Follow [the Vercel deployment guide](docs/DEPLOYMENT.md) for import steps, future updates, and the distinction between a hosted website and a shared story archive. The code is not automatically committed, pushed, or published by this update.

Before public publication, review [media credits and permission status](assets/CREDITS.md). Some photographs retained from the approved visual mockup are editorial references rather than openly licensed assets.

## Data and media

- Narrative: 30–30,000 characters. Title: 120 characters. Contributor name: 80 characters.
- One image (JPEG, PNG, WebP, GIF; up to 10 MB), one audio file (up to 25 MB), and one video (up to 50 MB) per story.
- Attachments require a transcript or description. Browser support for the actual audio/video codec still matters.
- Up to 500 own contributions; up to 150 MB per JSON backup/import, subject to browser storage availability.
- Backups include the submitted text and binary media. Import adds new story IDs and skips existing IDs; it does not overwrite an edited story. Invalid records and conflicting pairings roll back the import.
- Clearing site data, changing browser/profile, and browser storage eviction can remove the local collection. Use **Back up & restore** in the footer to export it.
- Built-in samples remain read-only and are excluded from backups.

## Project files

| File | Purpose |
| --- | --- |
| `index.html` | Seven view containers, shared navigation, contribution form, and dialogs |
| `css/style.css` | Approved visual direction, responsive layouts, hover/focus states, reduced motion |
| `js/app.js` | Routing, story collection, paired reading, contribution editing, and backup controls |
| `js/objects.js` | Interactive box objects and their matching stories |
| `js/resources.js` | Curated external readings/videos and their browsing/player controls |
| `js/samples.js` | Ten original English accounts and five pair headings |
| `js/story-translations.js` | Complete Filipino editions, pair introductions, and reading labels |
| `js/credits.js` | In-site photography and media source links |
| `js/db.js`, `js/validation.js`, `js/backup.js` | Browser persistence, validation, and atomic backup/restore |
| `assets/` | Local photographs, original box mark, paper grain, sample audio/video, and credits |
| `server.mjs` | Local static server, including range requests for media playback |
| `scripts/build.mjs` | Dependency-free static build into `dist/` |
| `vercel.json` | Vercel build configuration |
| `tests/` | Browser walkthrough using a separate, disposable Chromium profile |

## Verify

```sh
npm test
```

The test harness detects Chrome/Edge on macOS and Windows and common Chromium paths on Linux. Set `CHROME_PATH` if your browser lives elsewhere. It never uses your ordinary browser profile. Generated screenshots, reports, fixtures, downloads, and temporary browser profiles are ignored by Git. See [TESTING.md](TESTING.md) for verification results and limits.

## Reading and navigation refinements

The header includes Home, The Box, Our Stories, Explore & Watch, About, and Share Your Story. Each opens its own view with a brief fade/slide transition, correct active navigation, and heading focus. Reduced-motion preferences skip the animation. Clicking the active page returns to its entrance without resetting form input.

Choose **English** or **Filipino** in Our Stories or on a reading page. All ten built-in titles and narratives, along with the five pair introductions, have complete Filipino editions. The choice is remembered when browser preference storage is available. Links with `?lang=fil` open the Filipino edition directly. Search matches both languages. Submitted contributions remain in their original language; the website does not automatically translate user writing. The included narration remains in English and is labeled accordingly.
