const OBJECTS = [
  { id: 'letter', title: 'A letter', image: 'writing.jpg', alt: 'A person writing in a notebook over coffee', story: 'sample-lina', quote: 'Some words take longer to arrive.\nSome stay with us for years.', description: 'Begin with a story about the small ways families stay connected.' },
  { id: 'photograph', title: 'A photograph', image: 'home.jpg', alt: 'A wooden house in Moalboal, Cebu', story: 'sample-mika', quote: 'A familiar place.\nA life continuing at home.', description: 'See the same distance through the eyes of the family who stayed.' },
  { id: 'journey', title: 'A journey', image: 'airport-luggage.jpg', alt: 'Bags and travelers in an airport waiting area', story: 'sample-joel', quote: 'The road is familiar.\nThe person returning has changed.', description: 'Follow a homecoming, and the ordinary routines that help us belong again.' },
  { id: 'taste', title: 'A taste of home', image: 'adobo.jpg', alt: 'Chicken adobo served on a plate', story: 'sample-ben', quote: 'A recipe crosses an ocean.\nA conversation begins.', description: 'Discover how food carries memories between generations and countries.' }
];
const $ = selector => document.querySelector(selector);
function card(object, index, selectable) {
  const tag = selectable ? 'button' : 'a';
  const attributes = selectable ? 'type="button" data-object-select="' + object.id + '" aria-pressed="false"' : 'href="#story/' + object.story + '"';
  return '<' + tag + ' class="object-card" data-object="' + object.id + '" ' + attributes + '><img src="assets/' + object.image + '" alt="' + object.alt + '" width="640" height="480" loading="lazy"><div class="object-card-body"><span class="object-number" aria-hidden="true">' + (index + 1) + '</span><div><h3>' + object.title + '</h3><span class="text-link">' + (selectable ? 'Explore' : 'Read a story') + ' <span aria-hidden="true">↗</span></span></div></div></' + tag + '>';
}
export function showBox(parameters = new URLSearchParams()) {
  const object = OBJECTS.find(item => item.id === parameters.get('object')) || OBJECTS[0];
  $('#selected-object-image').src = 'assets/' + object.image;
  $('#selected-object-image').alt = object.alt;
  $('#selected-object-title').textContent = object.title;
  $('#selected-object-quote').textContent = object.quote;
  $('#selected-object-description').textContent = object.description;
  $('#selected-object-story').href = '#story/' + object.story;
  document.querySelectorAll('[data-object-select]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.objectSelect === object.id)));
}
export function bindObjects() {
  $('#home-objects').innerHTML = OBJECTS.map((object, index) => card(object, index, false)).join('');
  $('#box-objects').innerHTML = OBJECTS.map((object, index) => card(object, index, true)).join('');
  $('#box-objects').addEventListener('click', event => {
    const button = event.target.closest('[data-object-select]');
    if (!button) return;
    const parameters = new URLSearchParams({ object: button.dataset.objectSelect });
    history.replaceState(null, '', '#box?' + parameters);
    showBox(parameters);
  });
}
