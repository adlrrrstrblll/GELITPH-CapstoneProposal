import { FILIPINO_STORIES, FILIPINO_PAIR_HEADINGS, STORY_UI } from './story-translations.js';
import { bindObjects, showBox } from './objects.js';
import { bindResources, showResources, closeResourceVideo } from './resources.js';
import { MEDIA_CREDITS } from './credits.js';
import { SAMPLE_STORIES, PAIR_HEADINGS } from './samples.js';
import { getStories, saveStory, deleteStory } from './db.js';
import { THEMES, PERSPECTIVES, validateDraft, fileError } from './validation.js';
import { createBackup, restoreBackup, downloadBackup } from './backup.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const excerpt = story => { const text = readingEdition(story).narrative.split('\n')[0]; return text.slice(0,155) + (text.length > 155 ? '…' : ''); };
const storyLink = story => '#story/' + encodeURIComponent(story.id) + (story.isSample && readingLanguage === 'fil' ? '?lang=fil' : '');
const arrow = '<span aria-hidden="true">↗</span>';
let localStories = [];
let stories = [...SAMPLE_STORIES];
let storageAvailable = true;
let editingStory = null;
let deleteId = null;
let lastArchiveHash = '#stories';
let routeVersion = 0;
let toastTimer;
let pageAnimation;
let readingLanguage = savedReadingLanguage();
const objectURLs = new Map();

function mediaURL(medium) {
  if (medium.url) return medium.url; // URLs exist only on the built-in sample dataset.
  if (!objectURLs.has(medium.blob)) objectURLs.set(medium.blob, URL.createObjectURL(medium.blob));
  return objectURLs.get(medium.blob);
}
function releaseURLs() {
  for (const url of objectURLs.values()) URL.revokeObjectURL(url);
  objectURLs.clear();
}
window.addEventListener('beforeunload', releaseURLs);

function showToast(message) {
  clearTimeout(toastTimer);
  $('#toast').textContent = message;
  $('#toast').hidden = false;
  toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 5000);
}
function friendlyError(error) {
  if (error?.name === 'QuotaExceededError') return 'Your browser storage is full. Export a backup, then try smaller media files.';
  return error?.message || 'The operation could not be completed. Please try again.';
}
async function refreshStories() {
  const stored = await getStories();
  releaseURLs();
  localStories = stored.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  stories = [...localStories, ...SAMPLE_STORIES];
}
function savedReadingLanguage() {
  try { return localStorage.getItem('balikbayan-reading-language') === 'fil' ? 'fil' : 'en'; }
  catch { return 'en'; }
}
function readingEdition(story, language = readingLanguage) {
  const translated = language === 'fil' ? FILIPINO_STORIES[story.id] : null;
  return translated ? { ...story, title: translated.title, narrative: translated.paragraphs.join('\n\n') } : story;
}
function syncReadingLanguage() {
  $$('[data-reading-language]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.readingLanguage === readingLanguage)));
}
function storeReadingLanguage(language) {
  readingLanguage = language;
  try { localStorage.setItem('balikbayan-reading-language', language); } catch { /* Reading works when preference storage is unavailable. */ }
  syncReadingLanguage();
}
function languageControl() {
  return '<div class="reading-language-switch" role="group" aria-label="Story language"><button type="button" data-reading-language="en" aria-pressed="' + (readingLanguage === 'en') + '" lang="en">English</button><button type="button" data-reading-language="fil" aria-pressed="' + (readingLanguage === 'fil') + '" lang="fil">Filipino</button></div>';
}
function byline(story) {
  return escapeHTML(story.author);
}
function thumbnail(story, className) {
  const image = story.media.find(medium => medium.kind === 'image');
  if (image) return '<img class="' + className + '" src="' + escapeHTML(mediaURL(image)) + '" alt="' + escapeHTML(image.description || 'Photograph accompanying ' + story.title) + '" loading="lazy">';
  return '<div class="' + className + ' media-placeholder" aria-hidden="true"><span>' + (story.media.some(medium => medium.kind === 'audio') ? 'A voice<br>from home' : 'A written<br>memory') + '</span></div>';
}
function renderSelected() {
  const ui = STORY_UI[readingLanguage];
  $('#selected-stories').innerHTML = [SAMPLE_STORIES[0], SAMPLE_STORIES[1]].map(story => {
    const edition = readingEdition(story);
    return '<a class="selected-story" href="' + storyLink(story) + '">' + thumbnail(story, 'selected-image') + '<div lang="' + readingLanguage + '"><p class="eyebrow">' + ui[story.perspective] + '</p><h3>' + escapeHTML(edition.title) + '</h3><span class="read-link">' + ui.preview + ' ↗</span></div></a>';
  }).join('');
}

function archiveParameters() {
  const query = location.hash.split('?')[1] || '';
  const parameters = new URLSearchParams(query);
  return {
    q: (parameters.get('q') || '').slice(0, 150),
    theme: THEMES.includes(parameters.get('theme')) ? parameters.get('theme') : 'all',
    perspective: Object.hasOwn(PERSPECTIVES, parameters.get('perspective')) ? parameters.get('perspective') : 'all',
    source: ['local', 'samples'].includes(parameters.get('source')) ? parameters.get('source') : 'all'
  };
}
function renderArchive() {
  const filters = archiveParameters();
  $('#search').value = filters.q;
  $('#perspective-filter').value = filters.perspective;
  $('#source-filter').value = filters.source;
  $$('#theme-filters button').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.theme === filters.theme)));
  const words = filters.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const results = stories.filter(story => {
    const translation = FILIPINO_STORIES[story.id];
    const searchable = [story.title, story.narrative, translation?.title, translation?.paragraphs.join(' '), story.author, story.theme, PERSPECTIVES[story.perspective], story.transcript].join(' ').toLocaleLowerCase();
    return words.every(word => searchable.includes(word)) &&
      (filters.theme === 'all' || story.theme === filters.theme) &&
      (filters.perspective === 'all' || story.perspective === filters.perspective) &&
      (filters.source === 'all' || (filters.source === 'samples' ? story.isSample : !story.isSample));
  });
  const ui = STORY_UI[readingLanguage];
  const unfiltered = !filters.q && filters.theme === 'all' && filters.perspective === 'all' && filters.source === 'all';
  $('#result-count').textContent = results.length + ' ' + (readingLanguage === 'en' && results.length === 1 ? 'story found' : ui.results);
  $('#clear-filters').hidden = unfiltered;
  $('#stories-view .archive-summary').hidden = unfiltered;
  $('#story-list').classList.toggle('is-filtered', !unfiltered);
  syncReadingLanguage();
  $('#story-list').innerHTML = results.length ? results.map((story, index) => {
    const featured = results.length > 3 && results.length % 3 === 1 && index === results.length - 1;
    const edition = readingEdition(story);
    const formats = [ui.read, ...(story.media.some(item => item.kind === 'audio') ? [ui.listen] : []), ...(story.media.some(item => item.kind === 'video') ? [ui.watch] : [])].join(' + ');
    return '<a class="archive-row' + (featured ? ' archive-feature' : '') + '" href="' + storyLink(story) + '"><div class="archive-visual">' + thumbnail(story, 'archive-image') + '</div><div class="archive-copy"' + (story.isSample ? ' lang="' + readingLanguage + '"' : '') + '><div class="story-tags"><span class="theme-chip">' + escapeHTML(story.theme) + '</span><span>' + escapeHTML(ui[story.perspective]) + '</span></div><h2>' + escapeHTML(edition.title) + '</h2><p class="story-byline">' + byline(story) + '</p>' + (featured ? '<p class="story-excerpt">' + escapeHTML(excerpt(story)) + '</p>' : '') + '<span class="read-link">' + formats + ' ↗</span></div></a>';
  }).join('') : '<div class="empty-state"><h2>No stories here just yet.</h2><p>Try a different word or theme, or add a memory of your own.</p><button class="button button-outline" type="button" data-reset-filters>Show all stories ↗</button></div>';
  $('#collection-count').textContent = localStories.length + ' local contribution' + (localStories.length === 1 ? '' : 's');
  lastArchiveHash = location.hash;
}

function updateArchive(patch) {
  const filters = { ...archiveParameters(), ...patch };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value && value !== 'all') query.set(key, value);
  if (readingLanguage === 'fil') query.set('lang', 'fil');
  history.replaceState(null, '', '#stories' + (query.size ? '?' + query : ''));
  renderArchive();
}
function companionFor(story) {
  return stories.find(other => other.id !== story.id && other.pairId === story.pairId && other.perspective !== story.perspective && other.isSample === story.isSample);
}
function renderMedia(story, language = readingLanguage) {
  return story.media.map(medium => {
    const url = escapeHTML(mediaURL(medium));
    let content;
    if (medium.kind === 'image') {
      content = '<img src="' + url + '" alt="' + escapeHTML(medium.description || 'Photograph accompanying ' + story.title + '. Full media description below.') + '">';
    } else if (medium.kind === 'audio') {
      content = '<audio controls preload="metadata" src="' + url + '" aria-label="' + escapeHTML(medium.name) + '">Your browser does not support this audio format.</audio>';
    } else {
      content = '<video controls playsinline preload="metadata" src="' + url + '" aria-label="' + escapeHTML(medium.name) + '">Your browser does not support this video format.</video>';
    }
    const caption = medium.kind === 'image' ? (medium.credit || 'Your photograph') : story.isSample ? STORY_UI[language][medium.kind === 'audio' ? 'narration' : 'video'] : (medium.description || medium.name);
    return '<figure class="story-media">' + content + '<figcaption>' + escapeHTML(caption) + (medium.kind !== 'image' && medium.credit ? ' — ' + escapeHTML(medium.credit) : '') +
      (medium.kind !== 'image' ? ' <a class="media-download" href="' + url + '" download="' + escapeHTML(medium.name) + '">Download ' + medium.kind + '</a>' : '') + '</figcaption></figure>';
  }).join('');
}
function accountHTML(story, single = false, language = readingLanguage) {
  const edition = readingEdition(story, language);
  const ui = STORY_UI[language];
  const paragraphs = edition.narrative.split(/\n\s*\n/).map(paragraph => '<p>' + escapeHTML(paragraph).replaceAll('\n', '<br>') + '</p>').join('');
  return '<article class="story-account' + (single ? ' single-story' : '') + '" data-story-id="' + escapeHTML(story.id) + '"' + (story.isSample ? ' lang="' + language + '"' : '') + '>' +
    '<div class="account-perspective">' + escapeHTML(ui[story.perspective]) + '</div>' +
    '<h2>' + escapeHTML(edition.title) + '</h2><div class="account-meta"><span class="account-author">' + byline(story) + '</span><span class="theme-chip">' + escapeHTML(story.theme) + '</span></div>' + renderMedia(story, language) + '<div class="story-narrative">' + paragraphs + '</div>' +
    (story.transcript ? '<details class="transcript"><summary>' + ui.transcript + '</summary><p>' + escapeHTML(story.transcript) + '</p></details>' : '') +
    (!story.isSample ? '<div class="local-actions"><span>Saved in this browser. You can manage your contribution here.</span><a class="text-link" href="#submit?edit=' +
    encodeURIComponent(story.id) + '">Edit story ↗</a><button type="button" class="text-link danger-link" data-delete="' + escapeHTML(story.id) + '">Remove story</button></div>' : '') + '</article>';
}

function renderDetail(id) {
  const story = stories.find(item => item.id === id);
  if (!story) {
    $('#story-detail').innerHTML = '<div class="route-error"><p class="eyebrow">An empty corner of the box</p><h1 tabindex="-1">This story is not here.</h1><p>It may have been removed, or it may be saved in another browser.</p><a class="button button-primary" href="#stories">Return to the collection ↗</a></div>';
    return;
  }
  const companion = companionFor(story);
  const pair = companion ? [story, companion].sort((a, b) => a.perspective === 'left' ? -1 : 1) : [story];
  const hasTranslation = pair.some(item => FILIPINO_STORIES[item.id]);
  const language = hasTranslation ? readingLanguage : 'en';
  const ui = STORY_UI[language];
  const edition = readingEdition(story, language);
  const headings = language === 'fil' ? FILIPINO_PAIR_HEADINGS : PAIR_HEADINGS;
  const pairHeading = headings[story.pairId] || { title: 'Two sides of\nthe same distance.', description: 'One shared experience. Two ways of remembering it.' };
  document.title = edition.title + ' — The Balikbayan Project';
  $('#story-detail').innerHTML = '<div class="story-reading-toolbar"><a class="back-link" href="' + escapeHTML(lastArchiveHash) + '">← ' + ui.back + '</a>' + (hasTranslation ? languageControl() : '') + '</div><header class="detail-header" lang="' + language + '">' +
    '<p class="eyebrow">Balikbayan Box / ' + (companion ? (language === 'fil' ? 'Pag-uusap sa magkabilang panig' : 'A conversation across distance') : escapeHTML(story.theme)) + '</p><h1 tabindex="-1">' +
    (companion ? escapeHTML(pairHeading.title).replaceAll('\n', '<br>') : escapeHTML(edition.title)) + '</h1><p>' +
    (companion ? escapeHTML(pairHeading.description) : 'Every account is a place to begin. This story is waiting for the other side of the conversation.') + '</p></header>' +
    '<div class="' + (companion ? 'paired-stories' : 'individual-story') + '">' + pair.map(item => accountHTML(item, !companion, language)).join('') + '</div>' +
    (!companion ? '<aside class="missing-companion"><p class="eyebrow">The conversation is still open</p><h3>The other perspective has not been contributed yet.</h3><p>' +
    (story.isSample ? 'This is a fictional sample. Share an independent account from your own experience to begin a real conversation.' : 'A loved one can add their own account and connect it to this story. Both voices will appear together.') + '</p><a class="text-link" href="' +
    (story.isSample ? '#submit' : '#submit?pair=' + encodeURIComponent(story.id)) + '">' + (story.isSample ? 'Share your own story' : 'Contribute the other perspective') + ' ↗</a></aside>' : '') +
    '<div class="detail-end"><a class="text-link" href="#explore">' + ui.related + ' ↗</a><a class="button button-outline" href="#submit">' + ui.share + ' ↗</a></div>';
  syncReadingLanguage();
  $$('#story-detail audio, #story-detail video').forEach(player => {
    player.addEventListener('error', () => {
      const caption = player.closest('figure').querySelector('figcaption');
      if (!caption.querySelector('.playback-error')) {
        const message = document.createElement('span');
        message.className = 'playback-error';
        message.textContent = ' Playback is unavailable for this file in this browser. Use the download link or read the transcript.';
        caption.append(message);
      }
    });
  });
}
function setNavigation(view) {
  $$('.main-nav [data-nav]').forEach(link => {
    if (link.dataset.nav === (view === 'story' ? 'stories' : view)) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
  $('#main-nav').classList.remove('is-open');
  $('.menu-toggle').setAttribute('aria-expanded', 'false');
}
function renderRoute() {
  const version = ++routeVersion;
  pageAnimation?.cancel();
  const [path, query] = (location.hash.slice(1) || 'home').split('?');
  const parameters = new URLSearchParams(query || '');
  const validViews = ['home', 'box', 'stories', 'explore', 'about', 'submit'];
  const alias = path === 'exhibit' ? 'about' : path;
  if (['en', 'fil'].includes(parameters.get('lang'))) {
    storeReadingLanguage(parameters.get('lang'));
    renderSelected();
  }
  const view = path.startsWith('story/') ? 'story' : validViews.includes(alias) ? alias : 'home';
  if (!validViews.includes(alias) && !path.startsWith('story/')) {
    history.replaceState(null, '', '#home');
    showToast('That page could not be found. You are at the entrance.');
  }
  $$('#story-detail audio, #story-detail video').forEach(player => player.pause());
  closeResourceVideo();
  $$('[data-view]').forEach(section => { section.hidden = section.dataset.view !== view; });
  setNavigation(view);
  const titles = { home: 'Stories we carry home', box: 'Inside the box', stories: 'Our Stories', explore: 'Explore & Watch', about: 'About the project', submit: 'Share your story' };
  document.title = (titles[view] || 'Our Stories') + ' — The Balikbayan Project';
  if (view === 'box') showBox(parameters);
  if (view === 'stories') renderArchive();
  if (view === 'explore') showResources(parameters);
  if (view === 'story') {
    let id;
    try { id = decodeURIComponent(path.slice(6)); } catch { id = ''; }
    renderDetail(id);
  }
  if (view === 'submit') renderForm(parameters);
  syncReadingLanguage();
  const section = document.querySelector('[data-view="' + view + '"]');
  if (document.documentElement.dataset.ready === 'true' && !matchMedia('(prefers-reduced-motion: reduce)').matches && section.animate) {
    pageAnimation = section.animate([{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
  }
  requestAnimationFrame(() => {
    if (version !== routeVersion) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    document.querySelector('[data-view="' + view + '"] h1')?.focus({ preventScroll: true });
  });
}

function pairCandidates(perspective) {
  return localStories.filter(candidate => candidate.id !== editingStory?.id &&
    (!perspective || candidate.perspective !== perspective) &&
    localStories.filter(item => item.pairId === candidate.pairId && item.id !== editingStory?.id).length === 1);
}
function updatePairOptions(selected = $('#related-story').value) {
  const candidates = pairCandidates($('#perspective').value);
  $('#related-story').innerHTML = '<option value="">Start a new story</option>' + candidates.map(candidate =>
    '<option value="' + escapeHTML(candidate.id) + '">' + escapeHTML(candidate.title) + ' — ' + escapeHTML(candidate.author) + '</option>'
  ).join('');
  $('#related-story').value = candidates.some(candidate => candidate.id === selected) ? selected : '';
}
function updateTranscriptRequired() {
  const hasAttachments = ['image', 'audio', 'video'].some(kind => $('#' + kind).files.length ||
    (editingStory?.media.some(medium => medium.kind === kind) && !$('#remove-' + kind)?.checked));
  $('#transcript').required = hasAttachments;
  $('#transcript-required').textContent = hasAttachments ? 'Required *' : 'Optional';
}
function clearFormErrors() {
  $$('#story-form [aria-invalid]').forEach(field => field.removeAttribute('aria-invalid'));
  $$('#story-form .field-error').forEach(field => { field.textContent = ''; });
  $('#form-errors').hidden = true;
}
function showFormErrors(errors) {
  clearFormErrors();
  for (const [id, message] of Object.entries(errors)) {
    const field = $('#' + id);
    field?.setAttribute('aria-invalid', 'true');
    if (field && !field.getAttribute('aria-describedby')?.includes(id + '-error')) {
      field.setAttribute('aria-describedby', [field.getAttribute('aria-describedby'), id + '-error'].filter(Boolean).join(' '));
    }
    const inline = $('#' + id + '-error');
    if (inline) inline.textContent = message;
  }
  $('#form-errors').innerHTML = '<p>A few things need your attention.</p><ul>' + Object.entries(errors).map(([id, message]) =>
    '<li><a href="#submit" data-focus-field="' + escapeHTML(id) + '">' + escapeHTML(message) + '</a></li>'
  ).join('') + '</ul>';
  $('#form-errors').hidden = false;
  $('#form-errors').focus();
}
function renderForm(parameters) {
  $('#story-form').reset();
  clearFormErrors();
  $('#submission-success').hidden = true;
  editingStory = localStories.find(story => story.id === parameters.get('edit')) || null;
  if (parameters.has('edit') && !editingStory) showToast('This contribution is not available to edit in this browser.');
  $('#form-heading').innerHTML = editingStory ? 'Give your story<br>another look.' : 'A small piece<br>of your world.';
  $('#save-story').innerHTML = (editingStory ? 'Save changes' : 'Place my story in the box') + ' ' + arrow;
  $('#cancel-edit').hidden = !editingStory;
  if (editingStory) {
    for (const field of ['title', 'author', 'perspective', 'theme', 'narrative', 'transcript']) $('#' + field).value = editingStory[field];
    $('#consent').checked = editingStory.consent;
    $('#cancel-edit').href = storyLink(editingStory);
  }
  for (const kind of ['image', 'audio', 'video']) {
    const medium = editingStory?.media.find(item => item.kind === kind);
    $('#' + kind + '-current').innerHTML = medium ? '<label><input type="checkbox" id="remove-' + kind + '">Remove current ' + kind + ': ' + escapeHTML(medium.name) + '</label><p class="field-help">Choosing a new file replaces the current attachment.</p>' : '';
  }
  const related = editingStory ? companionFor(editingStory) : localStories.find(story => story.id === parameters.get('pair'));
  if (related && !editingStory) {
    $('#perspective').value = related.perspective === 'left' ? 'stayed' : 'left';
    $('#theme').value = related.theme;
  }
  updatePairOptions(related?.id || '');
  updateTranscriptRequired();
  $$('[data-file-status]').forEach(output => { output.textContent = ''; });
}
async function submitStory(event) {
  event.preventDefault();
  if ($('#save-story').disabled) return;
  if (!storageAvailable) {
    showFormErrors({ title: 'Local storage is unavailable. Enable browser storage and reload before submitting.' });
    return;
  }
  const fields = Object.fromEntries(['title', 'author', 'perspective', 'theme', 'narrative', 'transcript'].map(field => [field, $('#' + field).value]));
  const media = [];
  const errors = {};
  for (const kind of ['image', 'audio', 'video']) {
    const file = $('#' + kind).files[0];
    if (file) {
      const error = fileError(file, kind);
      if (error) errors[kind] = error;
      else media.push({ kind, name: file.name, blob: file });
    } else {
      const current = editingStory?.media.find(item => item.kind === kind);
      if (current && !$('#remove-' + kind)?.checked) media.push(current);
    }
  }
  const draft = { ...fields, media, consent: $('#consent').checked };
  Object.assign(errors, validateDraft(draft));
  const related = localStories.find(story => story.id === $('#related-story').value);
  if (related && related.perspective === fields.perspective) errors['related-story'] = 'The related story must be from the other perspective.';
  if (Object.keys(errors).length) return showFormErrors(errors);
  const now = new Date().toISOString();
  const story = {
    ...draft, id: editingStory?.id || 'story-' + crypto.randomUUID(),
    pairId: related?.pairId || (editingStory && !companionFor(editingStory) ? editingStory.pairId : 'pair-' + crypto.randomUUID()),
    createdAt: editingStory?.createdAt || now, updatedAt: now, isSample: false
  };
  const isEditing = Boolean(editingStory);
  const version = routeVersion;
  $('#save-story').disabled = true;
  $('#save-story').textContent = 'Saving your story…';
  try {
    await saveStory(story);
    await refreshStories();
    if (version !== routeVersion) { showToast('Your story was saved in this browser.'); return; }
    renderForm(new URLSearchParams());
    const success = $('#submission-success');
    success.innerHTML = '<p class="eyebrow">A memory, safely placed</p><h2>' + (isEditing ? 'Your story has been updated.' : 'Your story is in the box.') + '</h2><p>“' +
      escapeHTML(story.title) + '” is saved in this browser, including its attachments. Download a backup to keep a separate copy.</p><a class="text-link" href="' + storyLink(story) + '">Read your story ↗</a>';
    success.hidden = false;
    success.tabIndex = -1;
    success.focus();
  } catch (error) {
    showFormErrors({ 'related-story': friendlyError(error) });
  } finally {
    $('#save-story').disabled = false;
    $('#save-story').innerHTML = (editingStory ? 'Save changes' : 'Place my story in the box') + ' ' + arrow;
  }
}
function openBackup() {
  $('#backup-status').textContent = storageAvailable ? 'Your contributions stay in this browser until you export a backup.' : 'Local storage is unavailable. Enable browser storage and reload first.';
  $('#backup-status').classList.remove('error');
  $('#export-button').disabled = !storageAvailable;
  $('#import-button').disabled = !storageAvailable;
  $('#backup-dialog').showModal();
}
function backupStatus(message, error = false) {
  $('#backup-status').textContent = message;
  $('#backup-status').classList.toggle('error', error);
}
function backupBusy(busy) {
  $('#export-button').disabled = busy;
  $('#import-button').disabled = busy;
}
async function exportCollection() {
  backupBusy(true);
  backupStatus('Packing your stories and media…');
  try {
    const { blob, count } = await createBackup();
    downloadBackup(blob);
    backupStatus('Backup downloaded: ' + count + ' local contribution' + (count === 1 ? '' : 's') + ', including all uploaded media. Samples remain part of the website.');
  } catch (error) { backupStatus(friendlyError(error), true); }
  finally { backupBusy(false); }
}
async function importCollection() {
  backupBusy(true);
  backupStatus('Checking your backup…');
  try {
    const result = await restoreBackup($('#import-file').files[0]);
    await refreshStories();
    backupStatus('Restored ' + result.added + ' local contribution' + (result.added === 1 ? '' : 's') + '. Skipped ' + result.skipped + ' existing ID' + (result.skipped === 1 ? '' : 's') + '.');
    $('#import-file').value = '';
    if (!$('#stories-view').hidden) renderArchive();
    if (!$('#story-view').hidden) {
      const id = location.hash.slice(7).split('?')[0];
      renderDetail(decodeURIComponent(id));
    }
    if (!$('#submit-view').hidden) updatePairOptions();
  } catch (error) { backupStatus(friendlyError(error), true); }
  finally { backupBusy(false); }
}
function openDelete(id) {
  const story = localStories.find(item => item.id === id);
  if (!story) return;
  deleteId = id;
  $('#delete-description').textContent = 'Remove “' + story.title + '” and its attachments from this browser? Its companion account, if any, stays in the collection. You can export a backup first.';
  $('#delete-status').textContent = '';
  $('#confirm-delete').disabled = false;
  $('#delete-dialog').showModal();
}
async function confirmDelete() {
  $('#confirm-delete').disabled = true;
  try {
    await deleteStory(deleteId);
    await refreshStories();
    $('#delete-dialog').close();
    location.hash = '#stories';
    showToast('Your local story has been removed. Any companion account has been kept.');
  } catch (error) {
    $('#delete-status').textContent = friendlyError(error);
    $('#confirm-delete').disabled = false;
  }
}
function bindInteractions() {
  window.addEventListener('hashchange', renderRoute);
  $('.menu-toggle').addEventListener('click', () => {
    const open = $('.menu-toggle').getAttribute('aria-expanded') !== 'true';
    $('.menu-toggle').setAttribute('aria-expanded', String(open));
    $('#main-nav').classList.toggle('is-open', open);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && $('#main-nav').classList.contains('is-open')) {
      $('#main-nav').classList.remove('is-open');
      $('.menu-toggle').setAttribute('aria-expanded', 'false');
      $('.menu-toggle').focus();
    }
  });
  $('.skip-link').addEventListener('click', event => {
    event.preventDefault();
    $('#main-content').focus();
    $('#main-content').scrollIntoView();
  });
  document.addEventListener('click', event => {
    const target = event.target.closest('button, a');
    if (!target) return;
    if (target.matches('[data-reading-language]')) {
      const language = target.dataset.readingLanguage;
      if (!['en', 'fil'].includes(language) || language === readingLanguage) return;
      const scroll = window.scrollY;
      $$('#story-detail audio, #story-detail video').forEach(player => player.pause());
      storeReadingLanguage(language);
      const [path, query] = location.hash.slice(1).split('?');
      const parameters = new URLSearchParams(query || '');
      if (language === 'fil') parameters.set('lang', 'fil'); else parameters.delete('lang');
      history.replaceState(null, '', '#' + path + (parameters.size ? '?' + parameters : ''));
      renderSelected();
      if (!$('#stories-view').hidden) renderArchive();
      if (!$('#story-view').hidden) renderDetail(decodeURIComponent(path.slice(6)));
      document.querySelector('[data-view]:not([hidden]) [data-reading-language="' + language + '"]')?.focus({ preventScroll: true });
      window.scrollTo({ top: scroll, behavior: 'instant' });
    }
    if (target.matches('[data-open-backup]')) openBackup();
    if (target.matches('[data-open-credits]')) $('#credits-dialog').showModal();
    if (target.matches('[data-close-dialog]')) target.closest('dialog').close();
    if (target.matches('[data-delete]')) openDelete(target.dataset.delete);
    if (target.matches('[data-reset-filters], #clear-filters')) updateArchive({ q: '', theme: 'all', perspective: 'all', source: 'all' });
    if (target.matches('[data-focus-field]')) {
      event.preventDefault();
      $('#' + target.dataset.focusField)?.focus();
    }
    if (target.matches('.main-nav a, .brand, .footer-links a') && target.hash === location.hash) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      document.querySelector('[data-view]:not([hidden]) h1')?.focus({ preventScroll: true });
    }
    if (target.matches('.main-nav a')) {
      $('#main-nav').classList.remove('is-open');
      $('.menu-toggle').setAttribute('aria-expanded', 'false');
    }
  });
  $$('[data-language]').forEach(button => button.addEventListener('click', () => {
    $$('[data-language]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    $('#intro-en').hidden = button.dataset.language !== 'en';
    $('#intro-fil').hidden = button.dataset.language !== 'fil';
  }));
  $('#archive-search').addEventListener('submit', event => { event.preventDefault(); updateArchive({ q: $('#search').value }); });
  let searchTimer;
  $('#search').addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(() => { if (!$('#stories-view').hidden) updateArchive({ q: $('#search').value }); }, 180); });
  $('#perspective-filter').addEventListener('change', () => updateArchive({ perspective: $('#perspective-filter').value }));
  $('#source-filter').addEventListener('change', () => updateArchive({ source: $('#source-filter').value }));
  $$('#theme-filters button').forEach(button => button.addEventListener('click', () => updateArchive({ theme: button.dataset.theme })));
  $('#story-form').addEventListener('submit', submitStory);
  $('#perspective').addEventListener('change', () => updatePairOptions());
  $('#related-story').addEventListener('change', () => {
    const related = localStories.find(item => item.id === $('#related-story').value);
    if (related && !$('#perspective').value) $('#perspective').value = related.perspective === 'left' ? 'stayed' : 'left';
  });
  $('#story-form').addEventListener('change', updateTranscriptRequired);
  for (const kind of ['image', 'audio', 'video']) $('#' + kind).addEventListener('change', () => {
    const file = $('#' + kind).files[0];
    $('[data-file-status="' + kind + '"]').textContent = file?.name || '';
    $('#' + kind + '-error').textContent = file ? fileError(file, kind) : '';
    $('#' + kind).setAttribute('aria-invalid', String(Boolean(file && fileError(file, kind))));
  });
  $('#export-button').addEventListener('click', exportCollection);
  $('#import-button').addEventListener('click', importCollection);
  $('#confirm-delete').addEventListener('click', confirmDelete);
  $('#credits-button').addEventListener('click', () => $('#credits-dialog').showModal());
}
function renderCredits() {
  $('#credits-content').innerHTML = MEDIA_CREDITS.map(item => '<p><strong>' + escapeHTML(item.title) + '</strong> — ' + escapeHTML(item.creator) + '. <a href="' + escapeHTML(item.url) + '" target="_blank" rel="noopener noreferrer">Original source</a>' + (item.license ? ' · <a href="' + escapeHTML(item.license) + '" target="_blank" rel="noopener noreferrer">License</a>' : '') + '.</p>').join('') +
    '<p>Photographs illustrate the places and themes; they do not identify the fictional narrators. Images are resized and cropped for the layout.</p><p>The ten sample stories and their pseudonyms are fictional. The sample narration is computer-voiced. The silent sample film uses the credited jeepney photograph.</p>';
}

async function initialize() {
  document.documentElement.dataset.ready = 'loading';
  bindInteractions();
  bindObjects();
  bindResources();
  renderSelected();
  renderCredits();
  try { await refreshStories(); }
  catch (error) {
    storageAvailable = false;
    $('#storage-notice').hidden = false;
    $('#storage-notice').textContent = 'Local storage is unavailable. The built-in stories remain available, but saving, backup, and restore require browser storage. ' + friendlyError(error);
  }
  renderRoute();
  document.documentElement.dataset.ready = 'true';
}
initialize().catch(error => {
  document.documentElement.dataset.ready = 'error';
  $('#storage-notice').hidden = false;
  $('#storage-notice').textContent = 'The exhibit could not finish loading. Reload the page. ' + friendlyError(error);
});
