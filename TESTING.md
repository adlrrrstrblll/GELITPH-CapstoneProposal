# Verification notes

Tested on **10 November 2026** using installed Chrome in headless mode on Windows, with a separate test profile and the app's local static server.

**Result: 64 browser checks passed. No uncaught JavaScript exceptions or browser console errors were observed during the walkthrough.**

## Run the checks

~~~sh
node tests/browser.mjs
~~~

Requires Node.js 22+ and Chrome/Edge. Windows browser locations are detected; set `CHROME_PATH` for other executable locations.

Generated artifacts:

- `test-results/report.json`: names of all 64 passed checks.
- `test-results/desktop-*.png` and `test-results/mobile-*.png`: screen captures.
- `test-results/downloads-*/`: actual downloaded JSON backups.
- `test-results/`: malformed-file/import fixtures used by the tests.
- `.tmp/browser-*/`: isolated browser profiles.

These directories are ignored by Git. They do not contain data from the user's ordinary browser.

## Verified behavior

- Homepage, three selected SAMPLE previews, English/Filipino text switching, and active page navigation.
- Six sample accounts, each theme's expected result count, title/keyword search, empty search results, and perspective filtering.
- Two accounts displayed together on desktop; accounts stacked on phones.
- Actual sample audio and video playback, detected through advancing playback time.
- Required fields, permission checkbox, unsupported upload type, oversized image, and required media description.
- Image, audio, and video uploaded through real browser file inputs and saved as IndexedDB binary objects.
- Stories and attachments retained after a completed page reload.
- User-supplied HTML rendered as text, with no script execution.
- Uploaded image decoding and actual playback of stored audio/video.
- Companion submission, shared pairing identifiers, and transaction-level duplicate-perspective rejection.
- Editing text, replacing an image, removing a video, preserving audio, and retaining the paired relationship.
- Actual JSON backup download with embedded binary media and samples excluded.
- Cancelled deletion, completed deletion, companion preservation, and sample preservation.
- Restore of story records, pairs, and **byte-identical** attachments, compared using SHA-256.
- Re-import duplicate skipping; malformed JSON and invalid records rejected; pairing conflicts rolled back with no partial writes.
- Local-contribution filtering and a collection target that excludes samples.
- Missing-story and unknown-route recovery.
- All four screens checked for horizontal overflow at **768, 390, and 320 px**; desktop homepage also checked at **1440 px**. Desktop and phone screenshots captured.
- Mobile menu state, closing after navigation, stacked reading layout, and validation focus.
- Storage failure simulated before document initialization: visible storage notice, working sample archive, and blocked saves without a false success message.

The browser script initially needed a corrected hash-expression parenthesis and reload synchronization. The final 64-check run includes those fixes and the corrected mobile heading styles.

## Visual inspection

Desktop homepage and paired reading screenshots were inspected. Mobile homepage and submission screenshots revealed two heading issues, corrected before the final run:

- The word “Balikbayan” now scales with phone width.
- The submission heading preserves the intended line breaks between “Every story”, “belongs”, and “somewhere.”

## Quick manual presentation check

1. Run `node server.mjs` and open `http://127.0.0.1:4173`.
2. Browse all themes; open the Sunday pair and play its narration.
3. Open the recipe pair and play the silent sample film.
4. Submit a new contribution with media and a description.
5. Refresh, then add its companion account.
6. Edit one account and confirm both remain connected.
7. Export a backup. Restore it in a separate browser profile at the same app address.
8. Narrow the window or use device emulation and inspect the stacked accounts.

## Verification limits

- The automated run used one Chromium installation with emulated viewport sizes, not physical mobile devices.
- Safari, Firefox, screen-reader interaction, and additional media codecs have not been independently verified.
- The tests do not collect genuine interviews or establish the factual authenticity of local contributions.
- Browser quota exhaustion and a 150 MB backup were not stress-tested; the app includes limits and save/import error handling.
- This is local browser storage. Shared online submissions, authentication, moderation, and synchronization are outside the requested prototype.
