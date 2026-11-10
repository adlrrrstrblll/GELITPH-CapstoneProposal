# The Balikbayan Project

**Balikbayan Box** is a local, multimedia exhibit of Filipino migration, memory, family, and belonging. Its central feature connects an account from **The Person Who Left** to an account from **The Family Who Stayed**.

## Run locally

Use Node.js 22 or later. No dependency installation or build step is needed.

From this repository:

~~~sh
node server.mjs
~~~

Open **http://127.0.0.1:4173** in a browser. Keep the terminal running while using the exhibit; press Ctrl+C to stop it. You can also use `npm start`.

Use the same address, browser profile, and port for your presentation. `localhost`, `127.0.0.1`, another port, and another browser each have separate browser storage. Opening the HTML directly with `file://` is not supported.

The Node server only serves static files. There are no API endpoints, backend database, or server-side submissions. Contributions and uploaded media stay in IndexedDB in the visitor's browser. All images, sample audio, sample video, and fonts are local or system-provided; the exhibit makes no external requests during normal use. Credit links open external websites only when clicked.

## What is included

- Four screens: home/exhibit introduction, searchable story archive, story detail, and submission/edit form.
- Forest-green and cream editorial design with responsive layouts and English/Filipino introduction switching.
- Theme filters: Leaving, Staying, Remembering, and Coming Home; perspective and sample/local filters.
- Connected migrant and family accounts shown side by side on desktop and stacked on phones.
- Accessible submission form with consent, field validation, file type/size limits, and media descriptions.
- IndexedDB storage of story records and image, audio, and video Blobs.
- Editing, replacing/removing attachments, and deleting local contributions.
- A pairing selector that links to an unpaired account from the other perspective. The shared `pairId` is managed automatically.
- JSON backups that include uploaded media, with validated, atomic restore and duplicate-ID skipping.
- Six clearly marked fictional SAMPLE stories in three pairs, including playable sample audio and a silent sample film.
- Useful empty, missing-story, validation, storage-error, and playback-error states.

There is no authentication. Edit/remove controls manage contributions in the current browser. Samples are read-only source content, are not stored as local contributions, and are not included in exported backups.

## Presentation walkthrough

1. Open the homepage; switch the introduction between English and Filipino.
2. Choose **Explore the Exhibit**, then try each theme filter.
3. Open **The space between Sunday calls**. Read the mother's and child's fictional accounts side by side. Play the computer-voiced sample and open its transcript.
4. Open **A recipe without measurements** to play the silent SAMPLE photographic study.
5. Choose **Share your story**. Fill in the required fields, optionally attach media, describe the media, and give permission.
6. Submit, open the new story, and refresh the browser to confirm it remains available.
7. Choose **Contribute the other perspective** on an unpaired local story. Submit a companion account to see the two stories together.
8. Edit or remove a local account using its story-page controls.
9. In the archive, search for the contributor/title, try a theme, and select **Local contributions**.
10. Choose **Back up & restore**, download the JSON backup, and keep it somewhere safe. Import it in a separate browser profile to restore the local collection and all media.

Sample stories and pseudonyms are fictional. They do not count toward the proposal's target of at least 10 genuine personal accounts. The prototype does not verify whether submitted accounts are genuine.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Shared navigation, four screen containers, form, and dialogs |
| `css/style.css` | Editorial styling, typography, responsive layouts, reduced-motion rules |
| `js/app.js` | Hash navigation, views, search/filtering, form, pairing controls, collection actions |
| `js/db.js` | IndexedDB transactions and atomic pairing/import checks |
| `js/validation.js` | Shared story, consent, attachment, and pairing validation |
| `js/backup.js` | Embedded-media JSON export, validation, and restore |
| `js/samples.js` | Separate, read-only fictional SAMPLE accounts |
| `assets/` | Local photos, favicon, sample narration/film, and credits |
| `server.mjs` | Dependency-free static local server with media range requests |
| `tests/` | Dependency-free Chrome/Edge browser walkthrough and sample-film helper |
| `TESTING.md` | Verification scope, results, and manual checks |

The app uses native ES modules. Hash-based routes share one HTML shell; there is no router dependency.

## Backups and limits

- Image: JPEG, PNG, WebP, or GIF, up to **10 MB**.
- Audio: MP3, WAV, M4A, OGG, or WebM, up to **25 MB**.
- Video: MP4, WebM, or OGV, up to **50 MB**.
- One attachment of each type per story.
- Narrative: 30–30,000 characters; title: 120; contributor name: 80.
- At most **500** local stories and **150 MB** per JSON backup/import.
- Actual storage availability depends on browser/device quotas. A large collection can exceed the single-backup limit; use smaller attachments for this academic prototype.
- Files must have a supported extension and MIME type. A container's actual codec also needs to be supported by the visitor's browser.
- Restoring adds new IDs and skips existing IDs. It does not overwrite edited local stories. A pairing conflict or invalid record rejects the import without partial writes.
- Exported backups include text and binary media as base64. They contain the contributor's submitted content; keep backups with appropriate care.
- Clearing site data, using another origin/profile, private-browsing cleanup, or browser eviction can remove or hide the local collection. Export a backup before changing browsers or clearing data.

A real shared public archive, remote submissions, moderation, authentication, and cross-device synchronization would require a future backend. Those are outside this local prototype.

## Browser verification

~~~sh
node tests/browser.mjs
~~~

The tests use an isolated Chromium profile and a temporary local server. On Windows they discover Chrome or Edge automatically. Elsewhere, set `CHROME_PATH` to a Chromium executable. No browser-testing dependency is installed.

Screenshots, a machine-readable report, downloads, and fixtures go to ignored `test-results/`; browser profiles go to ignored `.tmp/`. The tests never use your normal browser's data.

To regenerate the silent sample film from the credited local jeepney photograph:

~~~sh
node tests/create-media.mjs
~~~

The audio and video are already included; regeneration is not required to run the exhibit. See `assets/CREDITS.md` for media sources and labels.
