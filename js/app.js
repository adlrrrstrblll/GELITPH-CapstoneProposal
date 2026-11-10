import { SAMPLE_STORIES } from './samples.js';
import { getStories, saveStory, deleteStory } from './db.js';
import { THEMES, PERSPECTIVES, validateDraft, fileError } from './validation.js';
import { createBackup, restoreBackup, downloadBackup } from './backup.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
const excerpt = story => story.narrative.split('\n')[0].slice(0, 155) + (story.narrative.split('\n')[0].length > 155 ? '…' : '');
const storyLink = story => '#story/' + encodeURIComponent(story.id);
const arrow = '<span aria-hidden="true">↗</span>';
let localStories = [];
let stories = [...SAMPLE_STORIES];
let storageAvailable = true;
let editingStory = null;
let deleteId = null;
let lastArchiveHash = '#stories';
let routeVersion = 0;
let toastTimer;
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
function badges(story) {
  return '<div class="story-tags"><span>' + escapeHTML(story.theme) + '</span><span aria-hidden="true">·</span><span>' + escapeHTML(PERSPECTIVES[story.perspective]) + '</span>' + (story.isSample ? '<span class="sample-badge">SAMPLE</span>' : '<span class="sample-badge">LOCAL</span>') + '</div>';
}
function byline(story) {
  return escapeHTML(story.author) + (story.isSample ? ' · sample pseudonym' : ' · local contribution');
}
function thumbnail(story, className) {
  const image = story.media.find(medium => medium.kind === 'image');
  if (image) return '<img class="' + className + '" src="' + escapeHTML(mediaURL(image)) + '" alt="' + escapeHTML(image.description || 'Photograph accompanying ' + story.title) + '" loading="lazy">';
  return '<div class="' + className + ' media-placeholder" aria-hidden="true"><span>' + (story.media.some(medium => medium.kind === 'audio') ? 'A voice<br>from home' : 'A written<br>memory') + '</span></div>';
}
function renderSelected() {
  $('#selected-stories').innerHTML = [SAMPLE_STORIES[0], SAMPLE_STORIES[2], SAMPLE_STORIES[4]].map(story =>
    '<a class="selected-story" href="' + storyLink(story) + '">' + thumbnail(story, 'selected-image') + badges(story) +
    '<h3>' + escapeHTML(story.title) + '</h3><p class="story-byline">' + byline(story) + '</p><p class="story-excerpt">' +
    escapeHTML(excerpt(story)) + '</p><span class="read-link">Open the story ↗</span></a>'
  ).join('');
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
    const searchable = [story.title, story.narrative, story.author, story.theme, PERSPECTIVES[story.perspective], story.transcript].join(' ').toLocaleLowerCase();
    return words.every(word => searchable.includes(word)) &&
      (filters.theme === 'all' || story.theme === filters.theme) &&
      (filters.perspective === 'all' || story.perspective === filters.perspective) &&
      (filters.source === 'all' || (filters.source === 'samples' ? story.isSample : !story.isSample));
  });
  const sampleCount = results.filter(story => story.isSample).length;
  $('#result-count').textContent = results.length + (results.length === 1 ? ' story' : ' stories') + ' · ' + sampleCount + ' SAMPLE · ' + (results.length - sampleCount) + ' local';
  $('#clear-filters').hidden = filters.q === '' && filters.theme === 'all' && filters.perspective === 'all' && filters.source === 'all';
  $('#story-list').innerHTML = results.length ? results.map((story, index) =>
    '<a class="archive-row" href="' + storyLink(story) + '"><span class="archive-index" aria-hidden="true">' + String(index + 1).padStart(2, '0') + '</span>' +
    thumbnail(story, 'archive-image') + '<div>' + badges(story) + '<h2>' + escapeHTML(story.title) + '</h2><p class="story-excerpt">' +
    escapeHTML(excerpt(story)) + '</p><p class="story-byline">' + byline(story) + (companionFor(story) ? ' · Paired account' : '') +
    '</p></div><span class="archive-arrow" aria-hidden="true">↗</span></a>'
  ).join('') : '<div class="empty-state"><p class="eyebrow">A little more to discover</p><h2>No stories here just yet.</h2><p>Try a different word or theme, or add a memory of your own.</p><button class="button button-outline" type="button" data-reset-filters>Show all stories ↗</button></div>';
  $('#collection-count').textContent = localStories.length + ' local contribution' + (localStories.length === 1 ? '' : 's') + ' · Collection target: at least 10 personal accounts. SAMPLE stories are excluded.';
  lastArchiveHash = location.hash;
}
function updateArchive(patch) {
  const filters = { ...archiveParameters(), ...patch };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) if (value && value !== 'all') query.set(key, value);
  history.replaceState(null, '', '#stories' + (query.size ? '?' + query : ''));
  renderArchive();
}
function companionFor(story) {
  return stories.find(other => other.id !== story.id && other.pairId === story.pairId && other.perspective !== story.perspective && other.isSample === story.isSample);
}
function renderMedia(story) {
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
    const caption = medium.description || medium.name;
    return '<figure class="story-media">' + content + '<figcaption>' + escapeHTML(caption) + (medium.credit ? ' — ' + escapeHTML(medium.credit) : '') +
      (medium.kind !== 'image' ? ' <a class="media-download" href="' + url + '" download="' + escapeHTML(medium.name) + '">Download ' + medium.kind + '</a>' : '') + '</figcaption></figure>';
  }).join('');
}
function accountHTML(story, single = false) {
  const paragraphs = story.narrative.split(/\n\s*\n/).map(paragraph => '<p>' + escapeHTML(paragraph).replaceAll('\n', '<br>') + '</p>').join('');
  return '<article class="story-account' + (single ? ' single-story' : '') + '" data-story-id="' + escapeHTML(story.id) + '">' +
    '<div class="account-perspective"><span aria-hidden="true">' + (story.perspective === 'left' ? 'I.' : 'II.') + '</span>' + PERSPECTIVES[story.perspective] + '</div>' +
    '<h2>' + escapeHTML(story.title) + '</h2><div class="account-meta"><span>' + byline(story) + '</span><span>/' + escapeHTML(story.theme) + '</span>' +
    (story.isSample ? '<span class="sample-badge">SAMPLE</span>' : '') + '</div>' + renderMedia(story) + '<div class="story-narrative">' + paragraphs + '</div>' +
    (story.transcript ? '<details class="transcript"><summary>Media transcript & description</summary><p>' + escapeHTML(story.transcript) + '</p></details>' : '') +
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
  document.title = story.title + ' — The Balikbayan Project';
  $('#story-detail').innerHTML = '<a class="back-link" href="' + escapeHTML(lastArchiveHash) + '">← Back to the stories</a><header class="detail-header">' +
    '<p class="eyebrow">Balikbayan Box / ' + (companion ? 'A conversation across distance' : escapeHTML(story.theme)) + '</p><h1 tabindex="-1">' +
    (companion ? 'Two sides of the<br><em>same distance.</em>' : escapeHTML(story.title)) + '</h1><p>' +
    (companion ? 'One shared experience. Two ways of remembering it. Read these accounts beside each other, and let each voice have its place.' : 'Every account is a place to begin. This story is waiting for the other side of the conversation.') + '</p></header>' +
    (story.isSample ? '<aside class="sample-disclosure"><strong>SAMPLE · Fictional demonstration content.</strong> These stories and pseudonyms were written for this prototype. They are not interviews or verified personal accounts. Images are illustrative; the sample voice is computer-generated.</aside>' : '') +
    '<div class="pair-heading"><strong>' + (companion ? 'Connected accounts / The person who left + the family who stayed' : 'An individual account') + '</strong><span>' + (story.isSample ? 'Sample collection · not counted toward the 10-story target' : 'Local contribution · saved on this device') + '</span></div>' +
    '<div class="' + (companion ? 'paired-stories' : 'individual-story') + '">' + pair.map(item => accountHTML(item, !companion)).join('') + '</div>' +
    (!companion ? '<aside class="missing-companion"><p class="eyebrow">The conversation is still open</p><h3>The other perspective has not been contributed yet.</h3><p>' +
    (story.isSample ? 'This is a fictional sample. Share an independent account from your own experience to begin a real conversation.' : 'A loved one can add their own account and connect it to this story. Both voices will appear together.') + '</p><a class="text-link" href="' +
    (story.isSample ? '#submit' : '#submit?pair=' + encodeURIComponent(story.id)) + '">' + (story.isSample ? 'Share your own story' : 'Contribute the other perspective') + ' ↗</a></aside>' : '') +
    '<div class="detail-end"><a class="text-link" href="' + escapeHTML(lastArchiveHash) + '">← Back to the collection</a><a class="button button-outline" href="#submit">Share your story ↗</a></div>';
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
  routeVersion++;
  const [path, query] = (location.hash.slice(1) || 'home').split('?');
  const parameters = new URLSearchParams(query || '');
  let view = path.startsWith('story/') ? 'story' : path === 'stories' ? 'stories' : path === 'submit' ? 'submit' : 'home';
  if (!['home', 'exhibit', 'stories', 'submit'].includes(path) && !path.startsWith('story/')) {
    history.replaceState(null, '', '#home');
    showToast('That page could not be found. You are at the exhibit entrance.');
  }
  $$('#story-detail audio, #story-detail video').forEach(player => player.pause());
  $$('[data-view]').forEach(section => { section.hidden = section.dataset.view !== view; });
  setNavigation(view);
  document.title = (view === 'stories' ? 'The story archive' : view === 'submit' ? 'Share your story' : 'Balikbayan Box') + ' — The Balikbayan Project';
  if (view === 'stories') renderArchive();
  if (view === 'story') {
    let id;
    try { id = decodeURIComponent(path.slice(6)); } catch { id = ''; }
    renderDetail(id);
  }
  if (view === 'submit') renderForm(parameters);
  requestAnimationFrame(() => {
    if (path === 'exhibit') {
      $('#exhibit').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      $('#intro-title').setAttribute('tabindex', '-1');
      $('#intro-title').focus({ preventScroll: true });
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      const heading = document.querySelector('[data-view="' + view + '"] h1');
      heading?.focus({ preventScroll: true });
    }
  });
}
function pairCandidates(perspective) {
  return localStories.filter(candidate => candidate.id !== editingStory?.id &&
    (!perspective || candidate.perspective !== perspective) &&
    localStories.filter(item => item.pairId === candidate.pairId && item.id !== editingStory?.id).length === 1);
}
function updatePairOptions(selected = $('#related-story').value) {
  const candidates = pairCandidates($('#perspective').value);
  $('#related-story').innerHTML = '<option value="">Start a new, independent story</option>' + candidates.map(candidate =>
    '<option value="' + escapeHTML(candidate.id) + '">' + escapeHTML(candidate.title) + ' — ' + escapeHTML(candidate.author) + '</option>'
  ).join('');
  $('#related-story').value = candidates.some(candidate => candidate.id === selected) ? selected : '';
}
function updateTranscriptRequired() {
  const hasAttachments = ['image', 'audio', 'video'].some(kind => $('#' + kind).files.length ||
    (editingStory?.media.some(medium => medium.kind === kind) && !$('#remove-' + kind)?.checked));
  $('#transcript').required = hasAttachments;
  $('#transcript-required').textContent = hasAttachments ? 'Required *' : 'Required with attachments';
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
  $('#form-heading').textContent = editingStory ? 'Give your story another look.' : 'A small piece of your world.';
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
  $('#character-count').textContent = $('#narrative').value.length.toLocaleString() + ' / 30,000';
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
    if (target.matches('[data-open-backup]')) openBackup();
    if (target.matches('[data-close-dialog]')) target.closest('dialog').close();
    if (target.matches('[data-delete]')) openDelete(target.dataset.delete);
    if (target.matches('[data-reset-filters], #clear-filters')) updateArchive({ q: '', theme: 'all', perspective: 'all', source: 'all' });
    if (target.matches('[data-focus-field]')) {
      event.preventDefault();
      $('#' + target.dataset.focusField)?.focus();
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
  $('#narrative').addEventListener('input', () => { $('#character-count').textContent = $('#narrative').value.length.toLocaleString() + ' / 30,000'; });
  $('#perspective').addEventListener('change', () => updatePairOptions());
  $('#related-story').addEventListener('change', () => {
    const related = localStories.find(item => item.id === $('#related-story').value);
    if (related && !$('#perspective').value) $('#perspective').value = related.perspective === 'left' ? 'stayed' : 'left';
  });
  $('#story-form').addEventListener('change', updateTranscriptRequired);
  for (const kind of ['image', 'audio', 'video']) $('#' + kind).addEventListener('change', () => {
    const file = $('#' + kind).files[0];
    $('#' + kind + '-error').textContent = file ? fileError(file, kind) : '';
    $('#' + kind).setAttribute('aria-invalid', String(Boolean(file && fileError(file, kind))));
  });
  $('#export-button').addEventListener('click', exportCollection);
  $('#import-button').addEventListener('click', importCollection);
  $('#confirm-delete').addEventListener('click', confirmDelete);
  $('#credits-button').addEventListener('click', () => $('#credits-dialog').showModal());
}
function renderCredits() {
  $('#credits-content').innerHTML = '<p><strong>Open boxes</strong> — Luke Heibert, <a href="https://unsplash.com/photos/gthSas4oYC0" target="_blank" rel="noopener noreferrer">Unsplash</a>.</p>' +
    '<p><strong>House in Moalboal, Cebu</strong> — Jan Ledermann, <a href="https://unsplash.com/photos/g7lZM1-jZbY" target="_blank" rel="noopener noreferrer">Unsplash</a>.</p>' +
    '<p><strong>Jeepney in Manila</strong> — Sadia Afreen, <a href="https://unsplash.com/photos/arotIBcpPBA" target="_blank" rel="noopener noreferrer">Unsplash</a>.</p>' +
    '<p>Photographs are used as illustrations under the <a href="https://unsplash.com/license" target="_blank" rel="noopener noreferrer">Unsplash License</a>, resized and displayed with muted color. They do not depict the fictional storytellers.</p>' +
    '<p><strong>Sample audio</strong> — an offline computer-voiced reading of an original fictional excerpt. <strong>Sample video</strong> — a silent photographic study made for this prototype, using the credited jeepney image. Neither is an interview or submitted testimony.</p>' +
    '<p>All six SAMPLE narratives and their pseudonyms are fictional. Sample accounts are separate from local contributions and the collection goal of at least 10 personal accounts.</p>';
}
async function initialize() {
  document.documentElement.dataset.ready = 'loading';
  bindInteractions();
  renderSelected();
  renderCredits();
  try { await refreshStories(); }
  catch (error) {
    storageAvailable = false;
    $('#storage-notice').hidden = false;
    $('#storage-notice').textContent = 'Local storage is unavailable. Sample stories remain available, but saving, backup, and restore require browser storage. ' + friendlyError(error);
  }
  renderRoute();
  document.documentElement.dataset.ready = 'true';
}
initialize().catch(error => {
  document.documentElement.dataset.ready = 'error';
  $('#storage-notice').hidden = false;
  $('#storage-notice').textContent = 'The exhibit could not finish loading. Reload the page. ' + friendlyError(error);
});
