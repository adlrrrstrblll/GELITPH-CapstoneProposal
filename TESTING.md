# Verification notes

The UI implementation was verified on **16 November 2026** with installed Google Chrome in headless mode on macOS, using an isolated browser profile and temporary local server.

**153 browser checks passed, with no uncaught browser exceptions or console errors.** The static build also completed successfully.

## Reproduce

```sh
npm test
npm run build
```

Requires Node.js 22+ and Chrome/Edge. The harness detects macOS, Windows, and common Linux executable locations. Override with `CHROME_PATH` if needed. It does not use your normal browser profile or existing submissions.

Generated artifacts are ignored by Git:

- `test-results/report.json` — passed checks and observed console errors.
- `test-results/desktop-*.png`, `test-results/mobile-*.png` — screenshots.
- `test-results/downloads-*/` — actual JSON backup downloads.
- `test-results/` — invalid upload/backup fixtures used by tests.
- `.tmp/browser-*/` — isolated browser profiles.

## Covered behavior

- Home pair previews; English/Filipino About introduction; navigation and missing-route recovery.
- One complete keepsake explorer on Home, with the separate Box tab and view removed. Open the box opens Our Stories, with the duplicate Browse our stories link removed; legacy Box links redirect to the selected object on Home.
- Seeded prototype like totals on all collection cards; keyboard liking without navigation or focus loss; like/unlike synchronization between cards and reading pages; persistence through reload; independent counts for paired accounts.
- The Liked stories collection filter shows only the visitor's favorites and combines with search, theme, and perspective. The filter survives reload and returning from a story; unliking removes the account from the filtered list, with keyboard focus preserved. Empty favorites have a browsing action, and Clear filters restores the full collection.
- The person described in each editorial summary is identified at the end of the account; new contributions retain their author or pseudonym credit. New contributions begin at zero likes and can be liked without replacing media attachments.
- Collection skeletons while local storage is loading, followed by the saved stories. Empty contributions offer writing and browsing actions. When preference storage is blocked, likes work for the visit and explain their temporary state.
- Existing box logo, green header, white navigation with a Home link, and ten stories in five pairs without repeated sample counts or badges.
- All five story themes, bilingual keyword search, perspective/source filtering, useful empty states, and card hover shadows.
- Names and theme tags appear without an editorial-summary label; thematic pairs explain that their subjects belong to separate accounts.
- Every header link opens its own view with correct active navigation and heading focus. Rapid navigation, browser Back, reduced motion, and returning to an active page are checked.
- Clicking the active Share Your Story link preserves unsaved form text.
- Complete Filipino titles and narratives in all five pairs, language switching, direct Filipino links, preference persistence across navigation/reload, and English restoration.
- Home object deep links and selection updating the image, quote, description, selected state, and story link together.
- All four new accounts opening beside their companion.
- Six credited external resources; Read/Watch and country filters; keyword search/reset; privacy-enhanced YouTube iframe construction and disposal.
- No YouTube iframe before an explicit play action.
- Paired reading on desktop and stacked accounts on phones.
- Actual playback time advancing for the computer-voiced sample and silent sample film.
- Form headings without numeric prefixes or character counters; required fields/consent; errors and focus feedback; unsupported types, oversized files, and required attachment descriptions.
- Image/audio/video uploads stored as binary IndexedDB attachments and retained across a completed reload.
- User-supplied HTML rendered as text rather than executed.
- Uploaded image decoding and actual playback of stored recordings.
- Companion creation; opposite-perspective preselection; transaction-level duplicate-pair rejection.
- Editing text, replacing an image, removing a video, preserving audio, and retaining the companion relationship.
- Actual JSON export excluding samples; deletion cancellation/removal; companion and sample preservation.
- Restore of text, pairs, and **byte-identical** binary media, checked with SHA-256.
- Duplicate imports skipped; malformed JSON, invalid records, and pair conflicts rejected without partial imports.
- Every main page checked for horizontal overflow at **1024, 768, 390, and 320 px**; desktop Home checked at **1440 px**.
- Mobile navigation expanded/closed state, stacked reading, and form validation focus.
- Simulated storage failure leaves samples readable and prevents a false save success.

## Visual review and limits

Desktop Home, keepsakes, archive likes, author credits, collection loading, reading, About, Explore, and submission screenshots, together with representative mobile screenshots, were reviewed. The About hero photo has an explicit desktop height. The selected keepsake photo follows the content height, and the submission photo fills the right half of its header to the page edge. Both crop the photograph without distortion; the submission header stacks its text and photo on phones.

The revised features use sage-tinted neutrals, balanced headings and paragraph wrapping, and short ease-out transitions. Reduced-motion preferences disable animations. Media object URLs remain valid while any visible or hidden page element references them, including lazy archive images after contributions are edited or restored.

The walkthrough scrolls video players into view before checking playback. Both English and Filipino reading layouts are checked at the supported viewport sizes.

YouTube iframe construction is tested without depending on live third-party playback. Actual YouTube availability, embedding restrictions, and external publisher availability remain controlled by those services. The resource library is curated rather than a live feed.

The verification uses Chromium with emulated viewport sizes, not physical phones. Safari, Firefox, screen-reader interaction, browser quota exhaustion, and maximum-size backups have not been independently verified. Local browser submissions do not become a shared archive when the static files are hosted.

The reading-language preference uses browser preference storage when available. Existing user contributions are kept in their original language and are not automatically translated. The included computer narration reads the first three English paragraphs of the researched Susan summary; it is not her voice.

Like totals are prototype numbers, not a live shared tally. A visitor's added likes stay in browser preference storage and are separate from contribution backups. Built-in entries describe real people from published accounts, summarized for this project. Their names do not represent registered users or direct contributors; no sign-in is required.

## Research content update

The 153 browser checks were rerun successfully after replacing all ten fictional entries and their Filipino editions with source-based editorial summaries. Dataset-specific search and name assertions now use the researched entries. The narration was regenerated and its playback verified. Source URLs, publication details, pairing context, and keepsake mappings are recorded in [CONTENT-SOURCES.md](docs/CONTENT-SOURCES.md).
