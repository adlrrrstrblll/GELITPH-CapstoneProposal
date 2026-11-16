const OBJECTS = [
  { id: 'letter', title: 'A letter', image: 'writing.jpg', alt: 'A person writing in a notebook over coffee', story: 'sample-lina', quote: 'A message connects a family.\nWork abroad helps build a safer home.', description: 'Read about Susan, whose work as a caretaker and nanny supported her seven children in the Philippines.' },
  { id: 'photograph', title: 'A photograph', image: 'home.jpg', alt: 'A wooden house in Moalboal, Cebu', story: 'sample-mika', quote: 'A childhood recorded on cassette.\nA mother listening from far away.', description: 'Explore Angeli Gabriel’s memories of growing up with relatives while her mother worked as a nurse in Saudi Arabia.' },
  { id: 'journey', title: 'A journey', image: 'airport-luggage.jpg', alt: 'Bags and travelers in an airport waiting area', story: 'sample-joel', quote: 'Returning is a beginning.\nA livelihood takes time to rebuild.', description: 'Follow Elsilyn Nitura’s return to the Philippines, her online food business, and her work helping other migrants.' },
  { id: 'taste', title: 'A taste of home', image: 'adobo.jpg', alt: 'Chicken adobo served on a plate', story: 'sample-ben', quote: 'Food opens a conversation.\nA memory leads back to our roots.', description: 'Discover Nastasha Alli’s Exploring Filipino Kitchens, a project connecting food, cultural memory, and the diaspora.' }
];
const $ = selector => document.querySelector(selector);
function card(object, index) {
  return '<button class="object-card" data-object="' + object.id + '" type="button" data-object-select="' + object.id + '" aria-pressed="false" aria-controls="keepsake-preview"><img src="assets/' + object.image + '" alt="' + object.alt + '" width="640" height="480" loading="lazy"><span class="object-card-body"><span class="object-number" aria-hidden="true">' + (index + 1) + '</span><span><span class="object-card-title">' + object.title + '</span><span class="text-link">Explore</span></span></span></button>';
}
let previewAnimation;
export function showKeepsake(parameters = new URLSearchParams(), animate = false) {
  const object = OBJECTS.find(item => item.id === parameters.get('object')) || OBJECTS[0];
  $('#selected-object-image').src = 'assets/' + object.image;
  $('#selected-object-image').alt = object.alt;
  $('#selected-object-title').textContent = object.title;
  $('#selected-object-quote').textContent = object.quote;
  $('#selected-object-description').textContent = object.description;
  $('#selected-object-story').href = '#story/' + object.story;
  document.querySelectorAll('[data-object-select]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.objectSelect === object.id)));
  if (animate) {
    $('#keepsake-status').textContent = object.title + ' selected. ' + object.description;
    previewAnimation?.cancel();
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
      previewAnimation = $('#keepsake-preview').animate([{ opacity: .5, transform: 'translateY(6px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 220, easing: 'ease-out' });
    }
  }
}
export function bindObjects() {
  $('#home-objects').innerHTML = OBJECTS.map(card).join('');
  $('#home-objects').addEventListener('click', event => {
    const button = event.target.closest('[data-object-select]');
    if (!button) return;
    const parameters = new URLSearchParams({ object: button.dataset.objectSelect });
    if (button.getAttribute('aria-pressed') === 'true') return;
    history.replaceState(null, '', '#home?' + parameters);
    showKeepsake(parameters, true);
  });
}
