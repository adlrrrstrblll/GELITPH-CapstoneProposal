// Prototype totals are seeded in samples.js. Each browser can add one like per story.
const STORAGE_KEY = 'balikbayan-story-likes';
function readLikes() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return new Set(Array.isArray(saved) ? saved.filter(id => typeof id === 'string') : []);
  } catch { return new Set(); }
}
let likedStories = readLikes();

export function likeState(story) {
  const liked = likedStories.has(story.id);
  return { liked, count: (story.isSample ? story.likes || 0 : 0) + Number(liked) };
}

export function toggleLike(story) {
  if (likedStories.has(story.id)) likedStories.delete(story.id);
  else likedStories.add(story.id);
  let persisted = true;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify([...likedStories])); }
  catch { persisted = false; }
  return { ...likeState(story), persisted };
}

export function syncLikes() { likedStories = readLikes(); }
export function isLikesStorageKey(key) { return key === STORAGE_KEY || key === null; }
