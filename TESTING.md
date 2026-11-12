# Verification notes

The UI implementation was verified on **12 November 2026** with installed Google Chrome in headless mode on macOS, using an isolated browser profile and temporary local server.

**125 browser checks passed, with no uncaught browser exceptions or console errors.** The static build also completed successfully.

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
- Existing box logo, green header, white navigation with a Home link, and ten stories in five pairs without repeated sample counts or badges.
- All five story themes, bilingual keyword search, perspective/source filtering, useful empty states, and card hover shadows.
- Plain author names and separate theme tags; the repeated fictional-story notice is absent from reading pages.
- Every header link opens its own view with correct active navigation and heading focus. Rapid navigation, browser Back, reduced motion, and returning to an active page are checked.
- Clicking the active Share Your Story link preserves unsaved form text.
- Complete Filipino titles and narratives in all five pairs, language switching, direct Filipino links, preference persistence across navigation/reload, and English restoration.
- Object deep links and selection updating the image, selected state, and story link together.
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

Desktop Home, archive, Box, reading, About, Explore, and submission screenshots, together with representative mobile screenshots, were reviewed. The About and submission hero photos have explicit desktop heights so their intrinsic portrait dimensions do not create empty space beside the copy.

The walkthrough scrolls video players into view before checking playback. Both English and Filipino reading layouts are checked at the supported viewport sizes.

YouTube iframe construction is tested without depending on live third-party playback. Actual YouTube availability, embedding restrictions, and external publisher availability remain controlled by those services. The resource library is curated rather than a live feed.

The verification uses Chromium with emulated viewport sizes, not physical phones. Safari, Firefox, screen-reader interaction, browser quota exhaustion, and maximum-size backups have not been independently verified. Local browser submissions do not become a shared archive when the static files are hosted.

The reading-language preference uses browser preference storage when available. Existing user contributions are kept in their original language and are not automatically translated. The included narration remains English.
