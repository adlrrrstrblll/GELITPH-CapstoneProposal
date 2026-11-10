import { MAX_BACKUP_SIZE, MAX_STORIES, MEDIA_RULES, validateRecord } from './validation.js';
import { getStories, mergeStories } from './db.js';

const APP_ID = 'balikbayan-box';
const toDataURL = blob => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = () => reject(new Error('An attachment could not be read.'));
  reader.readAsDataURL(blob);
});

export async function createBackup() {
  const stories = await getStories();
  const serialized = [];
  let totalBytes = 0;
  for (const story of stories) {
    const media = [];
    for (const medium of story.media) {
      totalBytes += medium.blob.size;
      if (totalBytes * 1.38 > MAX_BACKUP_SIZE - 1000000) throw new Error('The collection is too large for a 150 MB backup. Save smaller media files before exporting.');
      media.push({ kind: medium.kind, name: medium.name, data: await toDataURL(medium.blob) });
    }
    serialized.push({ ...story, media });
  }
  const backup = { app: APP_ID, version: 1, exportedAt: new Date().toISOString(), sampleStoriesIncluded: false, stories: serialized };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  if (blob.size > MAX_BACKUP_SIZE) throw new Error('This backup exceeds the 150 MB import limit.');
  return { blob, count: stories.length };
}

// Validate the whole file before starting one atomic database transaction.
export async function restoreBackup(file) {
  if (!file || file.size === 0) throw new Error('Choose an exhibit JSON backup first.');
  if (file.size > MAX_BACKUP_SIZE) throw new Error('Choose a backup smaller than 150 MB.');
  let backup;
  try { backup = JSON.parse(await file.text()); } catch { throw new Error('This file is not valid JSON. Choose a backup made by this exhibit.'); }
  if (backup?.app !== APP_ID || backup.version !== 1 || !Array.isArray(backup.stories)) throw new Error('This is not a supported Balikbayan Box backup.');
  if (backup.stories.length > MAX_STORIES) throw new Error('A backup may contain at most 500 stories.');
  const stories = [];
  for (const record of backup.stories) {
    if (!record || !Array.isArray(record.media) || record.media.length > 3) throw new Error('A story has invalid media.');
    const media = [];
    for (const medium of record.media) {
      if (!medium || !MEDIA_RULES[medium.kind] || typeof medium.name !== 'string' || typeof medium.data !== 'string') throw new Error('An attachment is invalid.');
      const match = medium.data.match(/^data:([a-z0-9/+-]+);base64,([A-Za-z0-9+/]*={0,2})$/);
      if (!match || !match[2] || match[2].length % 4 !== 0) throw new Error('An attachment contains invalid encoded media.');
      if (match[2].length / 4 * 3 > MEDIA_RULES[medium.kind].max + 2) throw new Error('An attachment exceeds its size limit.');
      let binary;
      try { binary = atob(match[2]); } catch { throw new Error('An attachment could not be decoded.'); }
      const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
      media.push({ kind: medium.kind, name: medium.name, blob: new Blob([bytes], { type: match[1] }) });
    }
    stories.push(validateRecord({ ...record, media }));
  }
  return mergeStories(stories);
}

export function downloadBackup(blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'balikbayan-box-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.append(link);
  link.click();
  link.remove();
  // Keep the URL alive long enough for browsers to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
