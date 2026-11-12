// Shared rules for the form and restored backups.
export const THEMES = ['Leaving', 'Staying', 'Remembering', 'Coming Home', 'Belonging'];
export const PERSPECTIVES = { left: 'The Person Who Left', stayed: 'The Family Who Stayed' };
export const MEDIA_RULES = {
  image: { max: 10 * 1024 * 1024, types: { jpg: ['image/jpeg'], jpeg: ['image/jpeg'], png: ['image/png'], webp: ['image/webp'], gif: ['image/gif'] } },
  audio: { max: 25 * 1024 * 1024, types: { mp3: ['audio/mpeg'], wav: ['audio/wav', 'audio/x-wav', 'audio/wave'], m4a: ['audio/mp4', 'audio/x-m4a'], ogg: ['audio/ogg'], webm: ['audio/webm'] } },
  video: { max: 50 * 1024 * 1024, types: { mp4: ['video/mp4'], webm: ['video/webm'], ogv: ['video/ogg'] } }
};
export const MAX_BACKUP_SIZE = 150 * 1024 * 1024;
export const MAX_STORIES = 500;

export function fileError(file, kind) {
  const rule = MEDIA_RULES[kind];
  if (!rule || !(file instanceof Blob)) return 'Choose a supported media file.';
  const name = file.name || '';
  const extension = name.split('.').pop().toLowerCase();
  const acceptedTypes = rule.types[extension];
  const type = file.type.split(';')[0].toLowerCase();
  if (!acceptedTypes || !acceptedTypes.includes(type)) return 'This file type is not supported. Choose ' + Object.keys(rule.types).map(type => type.toUpperCase()).join(', ') + '.';
  if (name.length > 200) return 'Please shorten the filename to 200 characters or fewer.';
  if (!file.size) return 'This file is empty. Please choose another.';
  if (file.size > rule.max) return 'This file exceeds the ' + rule.max / 1024 / 1024 + ' MB limit.';
  return '';
}

export function validateDraft(story) {
  const errors = {};
  if (!story.title?.trim() || story.title.trim().length > 120) errors.title = 'Enter a story title of 1–120 characters.';
  if (!story.author?.trim() || story.author.trim().length > 80) errors.author = 'Enter a name or pseudonym of 1–80 characters.';
  if (!Object.hasOwn(PERSPECTIVES, story.perspective)) errors.perspective = 'Choose your perspective.';
  if (!THEMES.includes(story.theme)) errors.theme = 'Choose a story theme.';
  if (!story.narrative?.trim() || story.narrative.trim().length < 30 || story.narrative.length > 30000) errors.narrative = 'Tell your story in 30–30,000 characters.';
  if (story.media?.length && !story.transcript?.trim()) errors.transcript = 'Add a transcript or description for your attachments.';
  if (story.transcript?.length > 30000) errors.transcript = 'Keep the transcript or description within 30,000 characters.';
  if (story.consent !== true) errors.consent = 'Please give permission to display your contribution.';
  return errors;
}

// Never trust IDs or field types from an imported file.
export function validateRecord(story) {
  if (!story || typeof story !== 'object') throw new Error('A story is not a valid record.');
  for (const field of ['title', 'author', 'perspective', 'theme', 'narrative', 'transcript', 'id', 'pairId', 'createdAt', 'updatedAt']) {
    if (typeof story[field] !== 'string') throw new Error('A story is missing a valid ' + field + '.');
  }
  if (!/^story-[a-f0-9-]{36}$/.test(story.id) || !/^pair-[a-f0-9-]{36}$/.test(story.pairId)) throw new Error('The backup contains an invalid story or pairing ID.');
  if (!Number.isFinite(Date.parse(story.createdAt)) || !Number.isFinite(Date.parse(story.updatedAt))) throw new Error('A story contains an invalid date.');
  if (!Array.isArray(story.media) || story.media.length > 3) throw new Error('A story may have at most three attachments.');
  const kinds = new Set();
  for (const medium of story.media) {
    if (!medium || !MEDIA_RULES[medium.kind] || kinds.has(medium.kind)) throw new Error('A story may have only one attachment of each type.');
    kinds.add(medium.kind);
    if (!(medium.blob instanceof Blob) || typeof medium.name !== 'string') throw new Error('An attachment is invalid.');
    const file = new File([medium.blob], medium.name, { type: medium.blob.type });
    const error = fileError(file, medium.kind);
    if (error) throw new Error(medium.name + ': ' + error);
  }
  const errors = validateDraft(story);
  if (Object.keys(errors).length) throw new Error(Object.values(errors).join(' '));
  return {
    id: story.id, pairId: story.pairId, title: story.title.trim(), author: story.author.trim(),
    perspective: story.perspective, theme: story.theme, narrative: story.narrative.trim(),
    transcript: story.transcript.trim(), consent: true, isSample: false,
    media: story.media.map(medium => ({ kind: medium.kind, name: medium.name, blob: medium.blob })),
    createdAt: story.createdAt, updatedAt: story.updatedAt
  };
}

export function assertPairing(stories) {
  const occupied = new Set();
  if (stories.length > MAX_STORIES) throw new Error('This prototype supports up to 500 local stories. Export a backup before removing any.');
  for (const story of stories) {
    const key = story.pairId + ':' + story.perspective;
    if (occupied.has(key)) throw new Error('This pair already has an account from that perspective. Choose another related story.');
    occupied.add(key);
  }
}
