import assert from 'node:assert/strict';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { createEnvironment, waitFor, delay, root } from './cdp.mjs';

const output = path.join(root, 'test-results');
const downloads = path.join(output, 'downloads-' + Date.now());
await mkdir(downloads, { recursive: true });
const environment = await createEnvironment();
const { page, browser, url } = environment;
const passed = [];
const check = (name, value) => { assert.ok(value, name); passed.push(name); console.log('PASS ' + name); };
const evaluate = expression => page.evaluate(expression);
const click = selector => evaluate('document.querySelector(' + JSON.stringify(selector) + ').click()');
async function go(hash) {
  await evaluate('location.hash = ' + JSON.stringify(hash));
  await delay(130);
}
async function fill(values) {
  await evaluate('(() => { const values = ' + JSON.stringify(values) + '; for (const [key,value] of Object.entries(values)) { const input=document.getElementById(key); input.value=value; input.dispatchEvent(new Event("input",{bubbles:true})); input.dispatchEvent(new Event("change",{bubbles:true})); } })()');
}
async function attach(selector, file) {
  const document = await page.call('DOM.getDocument');
  const { nodeId } = await page.call('DOM.querySelector', { nodeId: document.root.nodeId, selector });
  await page.call('DOM.setFileInputFiles', { nodeId, files: [file] });
}
async function screenshot(name) {
  await waitFor(page, 'document.getElementById(' + JSON.stringify('toast') + ').hidden');
  await delay(120);
  const result = await page.call('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await writeFile(path.join(output, name + '.png'), Buffer.from(result.data, 'base64'));
}
async function reload() {
  const previous = page.events.filter(event => event.method === 'Page.loadEventFired').length;
  await page.call('Page.reload');
  for (let attempt = 0; attempt < 150; attempt++) {
    if (page.events.filter(event => event.method === 'Page.loadEventFired').length > previous) {
      await waitFor(page, "document.documentElement.dataset.ready === 'true'");
      return;
    }
    await delay(80);
  }
  throw new Error('Reload did not finish.');
}

async function noOverflow(name) {
  const dimensions = await evaluate('({ width: innerWidth, scroll: document.documentElement.scrollWidth })');
  check(name, dimensions.scroll <= dimensions.width + 1);
}
async function records() {
  return evaluate('(async () => {const {getStories}=await import("./js/db.js"); const stories=await getStories(); return await Promise.all(stories.map(async story => ({id:story.id,title:story.title,pairId:story.pairId,perspective:story.perspective,media:await Promise.all(story.media.map(async medium=>({kind:medium.kind,name:medium.name,size:medium.blob.size,hash:Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256",await medium.blob.arrayBuffer()))).map(byte=>byte.toString(16).padStart(2,"0")).join("")}))) }))); })()');
}
async function submit(values) {
  await fill(values);
  await evaluate('document.getElementById("consent").checked=true');
  await click('#save-story');
  await waitFor(page, '!document.getElementById("submission-success").hidden');
  return evaluate('document.querySelector("#submission-success a").hash');
}
try {
  await browser.call('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads, eventsEnabled: true });
  await page.call('Page.navigate', { url: url + '/#home' });
  await waitFor(page, "document.documentElement.dataset.ready === 'true'");
  check('Homepage loads and presents three clearly labeled samples', await evaluate('document.querySelectorAll(".selected-story").length === 3 && document.querySelectorAll(".selected-story .sample-badge").length === 3'));
  await click('[data-language="fil"]');
  check('Filipino introduction switches on', await evaluate('!document.querySelector("#intro-fil").hidden && document.querySelector("#intro-en").hidden'));
  await click('[data-language="en"]');
  check('English introduction switches back', await evaluate('!document.querySelector("#intro-en").hidden'));
  await noOverflow('Desktop homepage fits the viewport');
  await screenshot('desktop-home');
  await go('#stories');
  check('Archive lists six SAMPLE stories', await evaluate('document.querySelectorAll(".archive-row").length === 6 && document.querySelector("#result-count").textContent.includes("6 SAMPLE")'));
  for (const [theme, count] of [['Leaving', 1], ['Staying', 1], ['Remembering', 2], ['Coming Home', 2]]) {
    await click('[data-theme="' + theme + '"]');
    check(theme + ' filter returns its stories', await evaluate('document.querySelectorAll(".archive-row").length') === count);
  }
  await click('#clear-filters');
  await fill({ search: 'The space between Sunday calls' });
  await click('#archive-search button');
  check('Title/keyword search finds the intended account', await evaluate('document.querySelectorAll(".archive-row").length === 1 && document.querySelector(".archive-row").textContent.includes("Sunday calls")'));
  await fill({ search: 'no-such-memory-xyz' });
  await click('#archive-search button');
  check('Empty search displays an actionable empty state', await evaluate('Boolean(document.querySelector(".empty-state [data-reset-filters]"))'));
  await click('[data-reset-filters]');
  await fill({ 'perspective-filter': 'stayed' });
  check('Perspective filter finds three family accounts', await evaluate('document.querySelectorAll(".archive-row").length === 3'));
  await click('#clear-filters');
  await screenshot('desktop-archive');
  await go('#story/sample-lina');
  check('Paired sample presents both accounts beside each other', await evaluate('document.querySelectorAll(".paired-stories .story-account").length === 2 && getComputedStyle(document.querySelector(".paired-stories")).gridTemplateColumns.split(" ").length === 2'));
  await waitFor(page, 'document.querySelector("audio").readyState >= 1');
  await evaluate('document.querySelector("audio").play()');
  await waitFor(page, 'document.querySelector("audio").currentTime > .1');
  check('Sample narration actually plays', true);
  await evaluate('document.querySelector("audio").pause()');
  await click('.transcript summary');
  check('Transcript opens', await evaluate('document.querySelector(".transcript").open'));
  await screenshot('desktop-paired-story');
  await go('#story/sample-ben');
  await waitFor(page, 'document.querySelector("video").readyState >= 1');
  await evaluate('document.querySelector("video").play()');
  await waitFor(page, 'document.querySelector("video").currentTime > .1');
  check('Sample silent film actually plays', true);
  await evaluate('document.querySelector("video").pause()');
  await go('#submit');
  await click('#save-story');
  check('Required fields and consent prevent an empty submission', await evaluate('!document.querySelector("#form-errors").hidden && document.querySelectorAll("[aria-invalid=true]").length >= 6 && document.activeElement.id === "form-errors"'));
  await fill({ title: 'QA: the first letter', author: 'QA <writer>', perspective: 'left', theme: 'Leaving', narrative: 'A test memory about keeping in touch with home.\n\n<script>window.unsafeStory=true</script> The ordinary moments matter.', transcript: '' });
  await evaluate('document.getElementById("consent").checked=true');
  const invalidFile = path.join(output, 'unsupported.txt');
  await writeFile(invalidFile, 'A file that is not an image.');
  await attach('#image', invalidFile);
  await click('#save-story');
  check('Unsupported upload type is rejected by the form', await evaluate('document.getElementById("image-error").textContent.includes("not supported")'));
  await evaluate('(() => { const transfer=new DataTransfer();transfer.items.add(new File([new Uint8Array(10*1024*1024+1)],"too-large.jpg",{type:"image/jpeg"}));const field=document.getElementById("image");field.files=transfer.files;field.dispatchEvent(new Event("change",{bubbles:true}));})()');
  await click('#save-story');
  check('Oversized image is rejected by the form', await evaluate('document.getElementById("image-error").textContent.includes("10 MB")'));
  await attach('#image', path.join(root, 'assets/boxes.jpg'));
  await attach('#audio', path.join(root, 'assets/sunday-narration.wav'));
  await attach('#video', path.join(root, 'assets/remembering.webm'));
  await click('#save-story');
  check('Attachments require an accessible description or transcript', await evaluate('document.getElementById("transcript-error").textContent.length > 0'));
  const firstHash = await submit({ transcript: 'QA photograph of cardboard boxes; computer-voiced fictional narration; a silent, illustrative jeepney film.' });
  const firstId = firstHash.slice(7);
  let saved = await records();
  check('All three media types are stored as persistent binary attachments', saved.length === 1 && saved[0].media.length === 3 && saved[0].media.every(medium => medium.size > 0));
  await go(firstHash);
  await reload();
  await waitFor(page, "document.documentElement.dataset.ready === 'true' && document.querySelector('.story-account[data-story-id]')");
  check('Story and media survive a page refresh', (await records())[0].media.length === 3 && await evaluate('document.querySelectorAll(".story-media").length === 3'));
  check('User text is escaped and never executed as HTML', await evaluate('!window.unsafeStory && document.querySelector(".account-meta").textContent.includes("QA <writer>") && document.querySelector(".story-narrative").textContent.includes("<script>")'));
  await waitFor(page, 'document.querySelector(".story-media img").naturalWidth > 0 && document.querySelector("audio").readyState >= 1 && document.querySelector("video").readyState >= 1');
  await evaluate('document.querySelector("audio").play()');
  await waitFor(page, 'document.querySelector("audio").currentTime > .1');
  await evaluate('document.querySelector("audio").pause();document.querySelector("video").play()');
  await waitFor(page, 'document.querySelector("video").currentTime > .1');
  await evaluate('document.querySelector("video").pause()');
  check('Uploaded image renders and both stored recordings play', true);
  check('Unpaired local story invites a companion account', await evaluate('document.querySelector(".missing-companion a").hash.startsWith("#submit?pair=")'));
  await click('.missing-companion a');
  await waitFor(page, '!document.getElementById("submit-view").hidden');
  check('Companion submission preselects the opposite perspective and pairing', await evaluate('document.getElementById("perspective").value === "stayed" && document.getElementById("related-story").value === ' + JSON.stringify(firstId)));
  const secondHash = await submit({ title: 'QA: the letter at home', author: 'QA family', narrative: 'The family remembers the same letter from home. This is test data created in an isolated browser profile.' });
  await go(secondHash);
  saved = await records();
  check('Local accounts share a pairing identifier and display together', saved.length === 2 && saved[0].pairId === saved[1].pairId && await evaluate('document.querySelectorAll(".paired-stories .story-account").length === 2'));
  const duplicateRejected = await evaluate('(async()=>{const {getStories,saveStory}=await import("./js/db.js");const story=(await getStories())[0];try{await saveStory({...story,id:"story-"+crypto.randomUUID()});return false;}catch{return (await getStories()).length===2;}})()');
  check('Atomic pairing rules reject a duplicate perspective', duplicateRejected);
  await go('#submit?edit=' + firstId);
  check('Edit form retains the existing attachments', await evaluate('document.querySelectorAll(".current-media input").length === 3'));
  await fill({ title: 'QA: the first letter, revised' });
  await attach('#image', path.join(root, 'assets/home.jpg'));
  await evaluate('document.getElementById("remove-video").checked=true');
  await click('#save-story');
  await waitFor(page, '!document.getElementById("submission-success").hidden');
  const revised = (await records()).find(story => story.id === firstId);
  check('Editing updates text, replaces an image, removes a video, and preserves audio', revised.title.endsWith('revised') && revised.media.length === 2 && revised.media.some(medium => medium.name === 'home.jpg') && revised.media.some(medium => medium.kind === 'audio'));
  check('Editing preserves the companion pairing', (await records()).every(story => story.pairId === revised.pairId));
  const beforeBackup = (await records()).sort((a,b) => a.id.localeCompare(b.id));
  await click('[data-open-backup]');
  await click('#export-button');
  await waitFor(page, 'document.getElementById("backup-status").textContent.startsWith("Backup downloaded: 2")');
  let downloaded;
  for (let attempt = 0; attempt < 100; attempt++) {
    downloaded = (await readdir(downloads)).find(name => name.endsWith('.json'));
    if (downloaded) break;
    await delay(50);
  }
  assert.ok(downloaded, 'Browser produced a downloadable JSON backup');
  const backupPath = path.join(downloads, downloaded);
  const backup = JSON.parse(await readFile(backupPath, 'utf8'));
  check('Export downloads local stories with embedded media and excludes fictional samples', backup.stories.length === 2 && backup.sampleStoriesIncluded === false && backup.stories.some(story => story.media.some(medium => medium.data.startsWith('data:audio/'))));
  await screenshot('desktop-backup');
  await click('#backup-dialog [data-close-dialog]');
  await go('#story/' + firstId);
  await click('[data-delete="' + firstId + '"]');
  await click('#delete-dialog .button-outline');
  check('Deletion can be cancelled', (await records()).length === 2);
  await click('[data-delete="' + firstId + '"]');
  await click('#confirm-delete');
  await waitFor(page, 'location.hash === "#stories"');
  check('Deletion removes only the chosen story', (await records()).length === 1);
  await go(secondHash);
  check('Deleting one account leaves its companion readable and unpaired', await evaluate('document.querySelectorAll(".story-account").length === 1 && Boolean(document.querySelector(".missing-companion"))'));
  await click('[data-delete]');
  await click('#confirm-delete');
  await waitFor(page, 'location.hash === "#stories"');
  check('Removing local contributions leaves all built-in samples intact', (await records()).length === 0 && await evaluate('document.querySelectorAll(".archive-row").length === 6'));
  await click('[data-open-backup]');
  await attach('#import-file', backupPath);
  await click('#import-button');
  await waitFor(page, 'document.getElementById("backup-status").textContent.startsWith("Restored 2")');
  const afterRestore = (await records()).sort((a,b) => a.id.localeCompare(b.id));
  check('Import restores text, pairs, and byte-identical media', JSON.stringify(beforeBackup) === JSON.stringify(afterRestore));
  await attach('#import-file', backupPath);
  await click('#import-button');
  await waitFor(page, 'document.getElementById("backup-status").textContent.includes("Skipped 2 existing")');
  check('Re-importing the same backup skips duplicates', (await records()).length === 2);
  const badBackup = { ...backup, stories: [{ ...backup.stories[0], id: 'story-' + randomUUID(), pairId: 'pair-' + randomUUID() }, { ...backup.stories[1], consent: false }] };
  const badPath = path.join(output, 'invalid-backup.json');
  await writeFile(badPath, JSON.stringify(badBackup));
  await attach('#import-file', badPath);
  await click('#import-button');
  await waitFor(page, 'document.getElementById("backup-status").classList.contains("error")');
  check('An invalid backup is rejected without partially importing valid records', (await records()).length === 2);
  const conflictPath = path.join(output, 'conflicting-backup.json');
  await writeFile(conflictPath, JSON.stringify({ ...backup, stories: [{ ...backup.stories[0], id: 'story-' + randomUUID() }] }));
  await attach('#import-file', conflictPath);
  await click('#import-button');
  await waitFor(page, 'document.getElementById("backup-status").classList.contains("error")');
  check('Pair conflicts roll back an entire import transaction', (await records()).length === 2);
  await attach('#import-file', invalidFile);
  await click('#import-button');
  await waitFor(page, 'document.getElementById("backup-status").textContent.includes("not valid JSON")');
  check('Malformed backup shows a useful error', true);
  await click('#backup-dialog [data-close-dialog]');
  await go('#stories?source=local');
  check('Local filter and target count exclude sample stories', await evaluate('document.querySelectorAll(".archive-row").length === 2 && document.getElementById("collection-count").textContent.startsWith("2 local contributions")'));
  await go('#story/does-not-exist');
  check('A missing story presents a recovery link', await evaluate('Boolean(document.querySelector(".route-error a"))'));
  await go('#unknown-page');
  check('Unknown routes recover to the homepage', await evaluate('location.hash === "#home" && !document.getElementById("home-view").hidden'));

  for (const width of [768, 390, 320]) {
    await page.call('Emulation.setDeviceMetricsOverride', { width, height: width === 768 ? 1024 : 844, deviceScaleFactor: 1, mobile: width < 600 });
    await go('#home');
    await noOverflow(width + 'px homepage fits the viewport');
    if (width === 390) {
      await screenshot('mobile-home');
      await click('.menu-toggle');
      check('Mobile navigation opens with an accessible expanded state', await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded") === "true" && document.getElementById("main-nav").classList.contains("is-open")'));
      await click('.main-nav [data-nav="stories"]');
      await waitFor(page, '!document.getElementById("stories-view").hidden');
      check('Mobile navigation closes after selecting a page', await evaluate('document.querySelector(".menu-toggle").getAttribute("aria-expanded") === "false"'));
    } else await go('#stories');
    await noOverflow(width + 'px archive fits the viewport');
    if (width === 390) await screenshot('mobile-archive');
    await go('#story/sample-lina');
    await noOverflow(width + 'px paired story fits the viewport');
    if (width === 390) {
      check('Paired accounts stack vertically on phones', await evaluate('getComputedStyle(document.querySelector(".paired-stories")).gridTemplateColumns.split(" ").length === 1 && document.querySelectorAll(".story-account")[1].getBoundingClientRect().top > document.querySelectorAll(".story-account")[0].getBoundingClientRect().bottom'));
      await screenshot('mobile-paired-story');
    }
    await go('#submit');
    await noOverflow(width + 'px submission form fits the viewport');
    if (width === 390) {
      await screenshot('mobile-submit');
      await click('#save-story');
      check('Validation and focus feedback work on mobile', await evaluate('document.activeElement.id === "form-errors"'));
    }
  }
  await page.call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1000, deviceScaleFactor: 1, mobile: false });
  await go('#submit');
  await screenshot('desktop-submit');
  const injection = await page.call('Page.addScriptToEvaluateOnNewDocument', { source: 'Object.defineProperty(window,"indexedDB",{get(){throw new DOMException("Blocked for QA","SecurityError")}})' });
  await reload();
  await waitFor(page, "document.documentElement.dataset.ready === 'true'");
  check('Unavailable browser storage shows a clear notice', await evaluate('!document.getElementById("storage-notice").hidden'));
  await go('#stories');
  check('Sample archive remains usable when storage is blocked', await evaluate('document.querySelectorAll(".archive-row").length === 6'));
  await go('#submit');
  await click('#save-story');
  check('A blocked-storage submission never reports success', await evaluate('!document.getElementById("form-errors").hidden && document.getElementById("submission-success").hidden'));
  await page.call('Page.removeScriptToEvaluateOnNewDocument', { identifier: injection.identifier });
  const errors = page.events.filter(event => event.method === 'Runtime.exceptionThrown' || (event.method === 'Log.entryAdded' && event.params.entry.level === 'error'));
  check('Browser walkthrough completes without uncaught exceptions or console errors', errors.length === 0);
  await writeFile(path.join(output, 'report.json'), JSON.stringify({ testedAt: new Date().toISOString(), browser: 'Headless Chromium', passed, consoleErrors: errors }, null, 2));
  console.log('\n' + passed.length + ' checks passed. Screenshots and report: test-results/');
} catch (error) {
  await screenshot('failure').catch(() => {});
  console.error(error.stack);
  console.error('Recent browser errors:', JSON.stringify(page.events.filter(event => event.method === 'Runtime.exceptionThrown' || event.method === 'Log.entryAdded').slice(-8)));
  process.exitCode = 1;
} finally {
  await environment.stop();
}
