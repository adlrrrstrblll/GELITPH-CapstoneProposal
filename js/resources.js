// Curated original sources. This collection is edited locally; it is not a live feed.
export const RESOURCES = [
  {
    "id": "balikbayan-essay",
    "title": "Out of the Balikbayan Box",
    "creator": "Luz Rimban · VERA Files",
    "format": "read",
    "type": "Personal essay",
    "theme": "Family & memory",
    "country": "Philippines",
    "year": "2015",
    "image": "assets/packed-box.jpg",
    "imageAlt": "Illustrative photograph of a packed balikbayan box",
    "illustrative": true,
    "url": "https://verafiles.org/articles/out-of-the-balikbayan-box",
    "summary": "A recollection of receiving gifts from relatives abroad, and the family relationships carried in those packages."
  },
  {
    "id": "paglalayag",
    "title": "Paglalayag",
    "creator": "Philippine Arts Council",
    "format": "watch",
    "type": "Documentary teaser",
    "theme": "Migration",
    "country": "Canada",
    "year": "2021",
    "length": "1:02",
    "image": "assets/paglalayag.jpg",
    "imageAlt": "Official Paglalayag teaser thumbnail",
    "youtube": "DztANt3UDr8",
    "url": "https://www.youtube.com/watch?v=DztANt3UDr8",
    "source": "https://www.philippineartscouncil.com/paglalayag",
    "summary": "Filipino voices introduce a documentary project about moving to Canada and building a life there."
  },
  {
    "id": "filipino-pride",
    "title": "Am I Proud To Be a Filipino?",
    "creator": "Trixia Marie Policarpio · Positively Filipino",
    "format": "read",
    "type": "First-person reflection",
    "theme": "Identity & belonging",
    "country": "South Korea",
    "year": "2025",
    "cover": "Identity, seen from elsewhere.",
    "url": "https://www.positivelyfilipino.com/magazine/am-i-proud-to-be-a-filipino",
    "summary": "A Filipina exchange student reflects on national identity and how people perceive Filipinos in South Korea.",
    "image": "assets/korea-story.jpg",
    "imageAlt": "The author in Daejeon, South Korea, as published with her essay"
  },
  {
    "id": "family-photos",
    "title": "From Family Photos to Filipiniana",
    "creator": "Smithsonian Center for Folklife and Cultural Heritage",
    "format": "read",
    "type": "Identity essay",
    "theme": "Identity & belonging",
    "country": "United States",
    "cover": "Memory becomes a way of belonging.",
    "url": "https://folklife.si.edu/magazine/family-photos-filipiniana-filipino-american-identity",
    "summary": "Family photographs and Filipiniana become starting points for thinking about Filipino American identity.",
    "image": "assets/writing.jpg",
    "imageAlt": "Illustrative photograph of writing in a notebook",
    "illustrative": true
  },
  {
    "id": "winged-wishes",
    "title": "Winged wishes for my daughter",
    "creator": "PositiveNegatives · MigrationRhythms / PRIO",
    "format": "watch",
    "type": "Research-based animation",
    "theme": "Family & memory",
    "country": "Vietnam",
    "year": "2025",
    "image": "assets/winged-wishes.jpg",
    "imageAlt": "Official thumbnail of Winged wishes for my daughter",
    "youtube": "vRR3Las9eEQ",
    "url": "https://www.youtube.com/watch?v=vRR3Las9eEQ",
    "source": "https://www.prio.org/news/3603",
    "summary": "A story from Vietnam about movement, opportunity, and the connections between generations. A companion perspective beyond the Filipino diaspora."
  },
  {
    "id": "filipino-kitchens",
    "title": "Exploring Filipino Kitchens",
    "creator": "Nastasha Alli",
    "format": "read",
    "type": "Food, culture & podcast guide",
    "theme": "Food & culture",
    "country": "Canada",
    "image": "assets/adobo.jpg",
    "imageAlt": "Illustrative photograph of chicken adobo",
    "illustrative": true,
    "url": "https://www.exploringfilipinokitchens.com/about",
    "summary": "Discover a Toronto-based project connecting Filipino food, cultural memory, and life across the diaspora."
  }
];
const $ = selector => document.querySelector(selector);
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[character]);
let filters = {q:'',format:'all',theme:'all',country:'all'};
function card(resource) {
  const r=resource;
  return '<article class="resource-card"><a class="resource-visual" href="'+escape(r.url)+'" target="_blank" rel="noopener noreferrer" aria-label="'+(r.format==='watch'?'Watch ':'Read ')+escape(r.title)+'"><img src="'+escape(r.image)+'" alt="'+escape(r.imageAlt)+'" width="640" height="400" loading="lazy"><span class="format-tag">'+r.format.toUpperCase()+(r.length?' · '+escape(r.length):'')+'</span></a><p class="resource-meta">'+r.format.toUpperCase()+' / '+escape(r.country)+'</p><h3><a href="'+escape(r.url)+'" target="_blank" rel="noopener noreferrer">'+escape(r.title)+'</a></h3><p class="resource-creator">'+escape(r.creator)+'</p><p class="resource-description">'+escape(r.summary)+'</p><div class="resource-card-actions">'+(r.youtube?'<button class="text-link" type="button" data-video="'+escape(r.id)+'">Watch here ▷</button>':'')+'<a class="text-link" href="'+escape(r.url)+'" target="_blank" rel="noopener noreferrer">'+(r.youtube?'YouTube ↗':'Read at source ↗')+'</a></div></article>';
}
function updateURL() {
  const query=new URLSearchParams();
  for(const [key,value] of Object.entries(filters))if(value&&value!=='all')query.set(key,value);
  history.replaceState(null,'','#explore'+(query.size?'?'+query:''));
}
function renderResults() {
  const terms=filters.q.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const results=RESOURCES.filter(r=>(filters.format==='all'||r.format===filters.format)&&(filters.theme==='all'||r.theme===filters.theme)&&(filters.country==='all'||r.country===filters.country)&&terms.every(term=>[r.title,r.creator,r.summary,r.theme,r.country,r.type].join(' ').toLocaleLowerCase().includes(term)));
  $('#resource-grid').innerHTML=results.length?results.map(card).join(''):'<div class="resource-empty"><h2>No matching resources.</h2><p>Try another word, place, or theme.</p><button type="button" class="button button-outline" data-resource-reset>Show all resources</button></div>';
  $('#resource-count').textContent=results.length+' curated resource'+(results.length===1?'':'s');
  $('#resource-clear').hidden=!filters.q&&filters.format==='all'&&filters.theme==='all'&&filters.country==='all';
  document.querySelectorAll('[data-format]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.format===filters.format)));
}
export function showResources(parameters=new URLSearchParams()) {
  filters={q:(parameters.get('q')||'').slice(0,150),format:['read','watch'].includes(parameters.get('format'))?parameters.get('format'):'all',theme:parameters.get('theme')||'all',country:parameters.get('country')||'all'};
  for(const [key,id] of [['theme','resource-theme'],['country','resource-country']]) {
    if(![...$('#'+id).options].some(option=>option.value===filters[key]))filters[key]='all';
    $('#'+id).value=filters[key];
  }
  $('#resource-search').value=filters.q;
  renderResults();
}
export function closeResourceVideo() {
  const dialog=$('#resource-video-dialog');
  if(dialog.open)dialog.close();
  $('#resource-player').replaceChildren();
}
function openVideo(id) {
  const resource=RESOURCES.find(item=>item.id===id&&item.youtube);
  if(!resource)return;
  $('#resource-video-title').textContent=resource.title;
  $('#resource-video-source').textContent=resource.creator+' · '+resource.type;
  $('#resource-video-link').href=resource.url;
  const frame=document.createElement('iframe');
  frame.src='https://www.youtube-nocookie.com/embed/'+resource.youtube+'?rel=0';
  frame.title=resource.title;frame.allow='encrypted-media; picture-in-picture; fullscreen';
  frame.referrerPolicy='strict-origin-when-cross-origin';
  $('#resource-player').replaceChildren(frame);$('#resource-video-dialog').showModal();
}
export function bindResources() {
  [...new Set(RESOURCES.map(resource=>resource.country))].sort().forEach(place=>{
    const option=document.createElement('option');option.value=place;option.textContent=place;$('#resource-country').append(option);
  });
  const reset=()=>{filters={q:'',format:'all',theme:'all',country:'all'};$('#resource-search').value='';$('#resource-theme').value='all';$('#resource-country').value='all';updateURL();renderResults();};
  $('#resource-search-form').addEventListener('submit',event=>{event.preventDefault();filters.q=$('#resource-search').value;updateURL();renderResults();});
  let searchTimer;
  $('#resource-search').addEventListener('input',()=>{clearTimeout(searchTimer);searchTimer=setTimeout(()=>{if(!$('#explore-view').hidden){filters.q=$('#resource-search').value;updateURL();renderResults();}},180);});
  $('#resource-theme').addEventListener('change',()=>{filters.theme=$('#resource-theme').value;updateURL();renderResults();});
  $('#resource-country').addEventListener('change',()=>{filters.country=$('#resource-country').value;updateURL();renderResults();});
  $('#resource-clear').addEventListener('click',reset);
  document.addEventListener('click',event=>{
    const button=event.target.closest('button');if(!button)return;
    if(button.dataset.format){filters.format=button.dataset.format;updateURL();renderResults();}
    if(button.dataset.video)openVideo(button.dataset.video);
    if(button.hasAttribute('data-resource-reset'))reset();
  });
  $('#close-resource-video').addEventListener('click',closeResourceVideo);
  $('#resource-video-dialog').addEventListener('close',()=>$('#resource-player').replaceChildren());
}
