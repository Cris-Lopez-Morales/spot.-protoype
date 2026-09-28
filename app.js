/* Spot: intentionally offline, fictional-data interaction prototype.
 * No analytics, GPS access, real accounts, or live location sharing. The illustrative regional map is bundled; no tile or API requests.
 */
(function () {
  'use strict';
  const C = window.SpotCore;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const ICONS = {
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Z"/><path d="M9 3v15M15 6v15"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5L16 8Z"/>',
    friends: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    shield: '<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z"/><path d="m9 12 2 2 4-4"/>',
    eyeOff: '<path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.5 5.3A11 11 0 0 1 12 5c7 0 10 7 10 7a15 15 0 0 1-3.4 4.2M6.1 6.1A16 16 0 0 0 2 12s3 7 10 7a11 11 0 0 0 5.5-1.5"/>',
    eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
    coffee: '<path d="M4 8h13v7a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V8ZM17 9h1a3 3 0 0 1 0 6h-1M3 22h16M7 2v2M11 2v2M15 2v2"/>',
    glass: '<path d="m4 3 8 10 8-10H4ZM12 13v8M7 21h10M6.5 6h11"/>',
    pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/>',
    chevron: '<path d="m9 5 7 7-7 7"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    more: '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M20 7v6M17 10h6"/><circle cx="9" cy="7" r="4"/>',
    heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
    reset: '<path d="M3 11a9 9 0 1 1 2.4 7M3 4v7h7"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 21v-2a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v2"/>',
    block: '<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
    trash: '<path d="M3 6h18M5 6l1 15h12l1-15M9 6V3h6v3M10 10v7M14 10v7"/>',
    spark: '<path d="m12 3 2.3 6.7L21 12l-6.7 2.3L12 21l-2.3-6.7L3 12l6.7-2.3L12 3Z"/>',
    bookmark: '<path d="M6 4h12v17l-6-4-6 4V4Z"/>',
    compare: '<rect x="3" y="5" width="7" height="15" rx="2"/><rect x="14" y="3" width="7" height="17" rx="2"/>',
    directions: '<path d="m12 2 10 10-10 10L2 12 10 2Z"/><path d="M8 15v-4h8m-3-3 3 3-3 3"/>',
    share: '<path d="M12 16V3m-4 4 4-4 4 4M5 13v7h14v-7"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/>',
    sliders: '<path d="M4 7h7M17 7h3M4 17h3M13 17h7"/><circle cx="14" cy="7" r="3"/><circle cx="10" cy="17" r="3"/>'
  };
  function icon(name, size = 20) { return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.pin}</svg>`; }
  function avatar(p, size = '') { return `<span class="avatar ${escape(p.color)} ${size}" aria-hidden="true">${escape(p.initials)}</span>`; }
  function avatars(people, size = 'sm') { return `<span class="mini-avatars" aria-hidden="true">${people.slice(0, 3).map(p => avatar(p, size)).join('')}</span>`; }
  function friendNames(people) { return people.length <= 2 ? people.map(p => p.name.split(' ')[0]).join(' & ') + ' here' : people[0].name.split(' ')[0] + ' + ' + (people.length - 1) + ' friends here'; }
  function monogram(v) { return `<span class="place-monogram ${v.theme}" aria-hidden="true">${v.mark}</span>`; }
  const storageKey = 'spot-prototype-lincoln-v2';
  let storageAvailable = true, saved;
  try { saved = JSON.parse(localStorage.getItem(storageKey) || 'null'); } catch (_) { storageAvailable = false; }
  let state = C.initialState(saved);
  let snapshot = C.makeSnapshot();
  let timeOffset = 0;
  let modalType = null, modalPerson = null, detailId = null, modalReturnFocus = null, detailReturnFocus = null;
  let toastTimeout, refreshInterval;
  const now = () => Date.now() + timeOffset;
  if (state.sharing || state.friendSharing) snapshot.ownSeenAt = now();
  const initialPlace = C.parsePlaceHash(location.hash);
  const screenHash = location.hash.replace('#', '');
  if (['explore', 'friends', 'privacy'].includes(screenHash)) state.screen = screenHash;
  function persist() { try { localStorage.setItem(storageKey, JSON.stringify(C.persistent(state))); } catch (_) { storageAvailable = false; } }
  function isMobile() { return matchMedia('(max-width:760px)').matches; }
  function activeFriends() { return C.PEOPLE.filter(p => C.friendVisible(p, state, snapshot, now())); }
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('visible'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => el.classList.remove('visible'), 3300); }
  function navMarkup() { return [['explore', 'compass', 'Explore'], ['friends', 'friends', 'Friends'], ['privacy', 'shield', 'Privacy']].map(([screen, symbol, title]) => `<a href="#${screen}" class="nav-item ${state.screen === screen ? 'active' : ''}" data-screen="${screen}" ${state.screen === screen ? 'aria-current="page"' : ''}>${icon(symbol, 21)}<span>${title}</span></a>`).join(''); }
  function renderNav() {
    $('#desktopNavigation').innerHTML = navMarkup(); $('#mobileNavigation').innerHTML = navMarkup(); $('.rail-bottom').innerHTML = icon('info', 19);
    const enabled=state.sharing||state.friendSharing;
    const status = $('#privacyStatus'); status.classList.toggle('enabled', enabled);
    const label=state.sharing&&state.friendSharing?'Count + friends · demo':state.friendSharing?'Friends only · demo':state.sharing?'Count only · demo':'You’re not sharing';
    status.innerHTML = `${icon(enabled ? 'shield' : 'eyeOff', 16)}<span class="status-text">${label}</span>`;
    status.setAttribute('aria-label', label+'. Open privacy settings');
  }

  function navigate(screen, focus = true) {
    if (!['explore', 'friends', 'privacy'].includes(screen)) return;
    state.screen = screen; detailId = null; closeModal(false); closeDetail(false);
    if (location.hash !== '#' + screen) { try { history.replaceState(null, '', '#' + screen); } catch (_) {} }
    render(); if (focus) $('#main').focus({ preventScroll: true }); window.scrollTo(0, 0);
  }
  function render() {
    renderNav();
    if(state.screen!=='explore')document.body.classList.remove('has-compare');
    if (state.screen === 'explore') renderExplore();
    else if (state.screen === 'friends') renderFriends();
    else renderPrivacy();
  }
  function filterMarkup() {
    return [['all', '', 'All places'], ['cafe', 'coffee', 'Cafés'], ['bar', 'glass', 'Bars']].map(([value, symbol, text]) => `<button class="filter-chip ${state.category === value ? 'active' : ''}" data-category="${value}" aria-pressed="${state.category === value}">${symbol ? icon(symbol, 13) : ''}${text}</button>`).join('') + `<button class="filter-chip saved-filter ${state.savedOnly ? 'active' : ''}" data-action="saved-filter" aria-pressed="${state.savedOnly}">${icon('bookmark',13)} Saved${state.savedVenues.length ? `<span class="saved-count">${state.savedVenues.length}</span>` : ''}</button><button class="mobile-friends-filter ${state.friendsOnly ? 'active' : ''}" data-action="friends-filter" aria-label="Only places with friends" aria-pressed="${state.friendsOnly}">${icon('friends', 15)}</button>`;
  }
  function friendFilterMarkup() {
    const people = activeFriends();
    return `${people.length ? avatars(people) : icon('friends', 18)}<span>${state.friendsOnly ? 'Showing places with friends' : `${people.length} ${people.length === 1 ? 'friend' : 'friends'} around Lincoln`}</span>${icon(state.friendsOnly ? 'check' : 'chevron', 13)}`;
  }
  function cardMarkup(v) {
    const a = C.activity(v, state, snapshot, now());
    const friendsText = a.friends.length ? friendNames(a.friends) : (a.hasData ? `${C.timeLabel(a.latest, now())} · sample activity` : 'Activity unknown');
    return `<div class="place-row"><button class="place-card ${state.selected === v.id ? 'selected' : ''}" data-venue="${v.id}" data-card="${v.id}" aria-label="${escape(v.name)}, ${a.hasData ? a.count + ' participating app users in demo' : 'no recent app activity'}. View details.">
      ${monogram(v)}<span class="place-card-info"><h3>${escape(v.name)}</h3><span class="place-meta">${v.category === 'cafe' ? 'Café' : 'Bar'}<span>·</span>${escape(v.street)}</span><span class="card-bottom ${!a.hasData ? 'no-data' : ''}">${a.friends.length ? icon('friends', 11) : (a.hasData ? '<span class="quiet-dot"></span>' : icon('clock', 10))}${friendsText}</span></span><span class="count-pill ${a.hasData ? '' : 'unknown'}">${a.hasData ? a.count : '—'}</span></button><div class="entry-tools">${saveButton(v.id,true)}${compareButton(v.id,true)}</div></div>`;
  }
  function renderExplore() {
    $('#main').innerHTML = `<div class="explore-layout ${state.mobileView === 'list' ? 'list-mode' : ''}">
      <section class="places-panel" aria-label="Explore places">
        <div class="panel-intro"><div class="eyebrow">${icon('pin', 11)} LINCOLN & BEYOND</div><h1>A little further.<br>Your next spot.</h1><p>Lincoln and the places around it.<br>Find your people. Discover your next spot.</p><div class="city-stats"><span><strong>5,000</strong> demo users</span><span><strong id="presentCount">3,500</strong> at places</span></div></div>
        <div class="search-wrap">${icon('search', 17)}<label class="sr-only" for="venueSearch">Search places or streets</label><input id="venueSearch" class="search-input" type="search" autocomplete="off" maxlength="100" placeholder="Search Lincoln, Waverly, cafés…" value="${escape(state.query)}"><button class="clear-search" data-action="clear-search" aria-label="Clear search" ${state.query ? '' : 'hidden'}>${icon('close', 14)}</button></div>
        <div class="filters" aria-label="Place categories">${filterMarkup()}</div>
        <button class="friends-filter ${state.friendsOnly ? 'active' : ''}" data-action="friends-filter" aria-pressed="${state.friendsOnly}">${friendFilterMarkup()}</button>
        <div class="compare-tray" id="compareTray" role="region" aria-label="Selected places to compare" hidden></div><div class="list-heading"><span id="placeCount"></span><span class="heading-caption">Fictional venues</span><button class="mobile-view-switch" data-action="view-map">${icon('map', 13)} Map view</button></div>
        <div class="places-list" id="placesList"></div>
        <div class="panel-footnote">${icon('info', 13)}<span>Fictional venues and people. Counts are app users, not total occupancy. No GPS is collected.</span></div>
      </section>
      <section class="map-panel" aria-label="Lincoln region map with fictional establishments">
        <div class="map-viewport" id="mapViewport" tabindex="0" aria-label="Venue map. Drag to pan, use arrow keys to move, or select a place from the list."><canvas id="mapCanvas" class="map-canvas" aria-hidden="true"></canvas><div class="map-pins" id="mapPins"></div></div>
        <div class="map-location">${icon('pin', 15)} Lincoln & nearby <span>Regional demo</span></div>
        <div class="map-top-tools"><div class="map-view-tabs" aria-label="Map extent"><button data-action="region" aria-pressed="true">Region</button><button data-action="city" aria-pressed="false">Lincoln</button><button data-action="downtown" aria-pressed="false">Downtown</button></div><button class="icon-button" data-action="about" aria-label="How to read the map">${icon('info', 17)}</button><button class="mobile-view-switch" data-action="view-list">${icon('list', 14)} List</button></div>
        <div class="map-controls"><div class="zoom-group"><button class="icon-button" data-action="zoom-in" aria-label="Zoom in">${icon('plus', 17)}</button><button class="icon-button" data-action="zoom-out" aria-label="Zoom out">${icon('minus', 17)}</button></div><button class="icon-button" data-action="recenter" aria-label="Show Lincoln and surrounding places">${icon('locate', 17)}</button></div>
        <div class="map-legend"><span class="legend-icon">${icon('friends', 16)}</span><div><strong>A place, not a person.</strong><p>Venue counts · Zoom in to separate grouped places.</p></div></div>
        <div class="map-scale" id="mapScale" aria-label="Approximate map scale"></div><div class="map-watermark"><span id="mapSource">Illustrative regional map · Fictional places</span></div>
        <div class="mobile-preview" id="mobilePreview"></div><div id="mapEmpty"></div><div id="ownPresence"></div>
      </section>
    </div>`;
    setupMap(); refreshExplore();
    $('#venueSearch').addEventListener('input', e => { if(detailId||compareOpen)closeDetail(false); state.query = e.target.value; refreshExplore(); fitSearchResults(); });
    $('#venueSearch').addEventListener('keydown', e => { if (e.key === 'Escape' && state.query) { state.query = ''; e.target.value = ''; refreshExplore(); } });
  }
  function refreshExplore() {
    if (state.screen !== 'explore' || !$('#placesList')) return;
    const places = C.filteredVenues(state, snapshot, now());
    if (!places.some(v => v.id === state.selected)) state.selected = places[0]?.id || null;
    $('#placesList').innerHTML = places.length ? places.map(cardMarkup).join('') : `<div class="empty-state">${icon(state.savedOnly?'bookmark':'search', 29)}<h3>${state.savedOnly&&!state.savedVenues.length?'Your usuals start here.':'No spots found'}</h3><p>${state.savedOnly&&!state.savedVenues.length?'Save a place with the bookmark, then find it here in a tap.':'Try another name, street, or filter.'}</p><button class="secondary-button" data-action="clear-filters">${state.savedOnly?'Explore all places':'Clear filters'}</button></div>`;
    $('#placeCount').textContent = `${places.length} ${places.length === 1 ? 'place' : 'places'} in the region`;
    $('.clear-search').hidden = !state.query;
    $('.filters').innerHTML = filterMarkup();
    const friendFilter = $('.friends-filter'); friendFilter.innerHTML = friendFilterMarkup(); friendFilter.classList.toggle('active', state.friendsOnly); friendFilter.setAttribute('aria-pressed', String(state.friendsOnly));
    const stats = C.populationStats(state, snapshot, now());
    if ($('#presentCount')) $('#presentCount').textContent = stats.present.toLocaleString();
    $('#mapEmpty').innerHTML = places.length ? '' : `<div class="map-empty"><strong>No matching places</strong><p>There’s more to explore.</p><button class="secondary-button" data-action="clear-filters">Clear filters</button></div>`;
    const selected = C.venueById(state.selected);
    const preview = $('#mobilePreview'); preview.classList.toggle('empty-preview', !selected);
    if (selected) {
      const a = C.activity(selected, state, snapshot, now());
      preview.innerHTML = `<div class="preview-eyebrow"><span>${places.length} ${places.length === 1 ? 'place' : 'places'} around Lincoln</span><button data-action="view-list">See all ${icon('arrow', 12)}</button></div><button class="preview-card" data-venue="${selected.id}" aria-label="View ${escape(selected.name)} details"><span class="preview-top">${monogram(selected)}<span class="place-card-info"><h3>${escape(selected.name)}</h3><span class="place-meta">${selected.category === 'cafe' ? 'Café' : 'Bar'} · ${escape(selected.street)}</span></span><span class="count-pill ${a.hasData ? '' : 'unknown'}">${a.hasData ? a.count : '—'}</span></span><span class="preview-bottom"><span class="${a.friends.length ? 'friends-label' : ''}">${a.friends.length ? icon('friends', 12) : icon('clock', 11)}${a.friends.length ? friendNames(a.friends) : (a.hasData ? C.timeLabel(a.latest, now()) : 'Activity unknown')}</span><span>App users · demo ${icon('chevron', 12)}</span></span></button>`;
    } else preview.innerHTML = '';
    const own = C.activity(C.venueById('juniper'), state, snapshot, now()).own;
    $('#ownPresence').innerHTML = own ? `<div class="friend-presence-label">${icon('shield', 12)} You’re included at Juniper · demo</div>` : '';
    renderCompareTray();
    updateMapData(places);
  }
  /* A single rAF frame, cached clusters, keyed pins, and a culled canvas basemap. */
  const MC=window.SpotMapCore;
  const camera={x:C.MAP.center[0],y:C.MAP.center[1],zoom:.12,initialized:false};
  let currentGroups=new Map(),mapResizeObserver,drag=null,pointers=new Map(),pinch=null,suppressClickUntil=0;
  let frameRequest=0,dimensions=null,mapPlaces=[],mapActivity=new Map(),mapRevision=0,groupKey='',groups=[];
  let pinNodes=new Map(),frameTimes=[],clusterBuilds=0;
  function scheduleMap(){if(!frameRequest)frameRequest=requestAnimationFrame(()=>{frameRequest=0;drawMapNow();});}
  function updateMapData(places){
    mapPlaces=places||C.filteredVenues(state,snapshot,now());
    mapActivity=new Map(mapPlaces.map(v=>[v.id,C.activity(v,state,snapshot,now())]));mapRevision++;scheduleMap();
  }
  function mapDimensions(){
    const el=$('#mapViewport');if(!el)return null;
    if(!dimensions){const rect=el.getBoundingClientRect();dimensions={width:rect.width,height:rect.height,centerX:rect.width/2,centerY:isMobile()?Math.max(95,(rect.height-130)/2):rect.height/2,left:rect.left,top:rect.top};}
    return dimensions;
  }
  function clampCamera(){camera.x=Math.max(0,Math.min(C.MAP.width,camera.x));camera.y=Math.max(0,Math.min(C.MAP.height,camera.y));camera.zoom=Math.max(.025,Math.min(8,camera.zoom));}
  function setupMap(){
    mapResizeObserver?.disconnect();if(frameRequest)cancelAnimationFrame(frameRequest);frameRequest=0;
    const viewport=$('#mapViewport');if(!viewport)return;
    dimensions=null;pinNodes=new Map();groupKey='';pointers.clear();drag=null;pinch=null;
    SpotCartography.attach($('#mapCanvas'));
    if(!camera.initialized)fitMap();
    mapResizeObserver=new ResizeObserver(()=>{dimensions=null;drawMap();});mapResizeObserver.observe(viewport);
    viewport.addEventListener('pointerdown',e=>{
      if(e.button!==0)return;
      pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pointers.size===2){const pp=[...pointers.values()],d=mapDimensions();pinch={distance:Math.hypot(pp[0].x-pp[1].x,pp[0].y-pp[1].y),camera:{...camera},mid:{x:(pp[0].x+pp[1].x)/2-d.left,y:(pp[0].y+pp[1].y)/2-d.top}};drag=null;}
      else drag={id:e.pointerId,x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,moved:false};
      if(!e.target.closest('button'))viewport.setPointerCapture(e.pointerId);
    });
    viewport.addEventListener('pointermove',e=>{
      if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
      if(pinch&&pointers.size===2){
        const pp=[...pointers.values()],d=mapDimensions(),distance=Math.hypot(pp[0].x-pp[1].x,pp[0].y-pp[1].y),mid={x:(pp[0].x+pp[1].x)/2-d.left,y:(pp[0].y+pp[1].y)/2-d.top};
        Object.assign(camera,MC.anchoredZoom(pinch.camera,distance/Math.max(1,pinch.distance),pinch.mid,d,.025,8));
        camera.x-=(mid.x-pinch.mid.x)/camera.zoom;camera.y-=(mid.y-pinch.mid.y)/camera.zoom;clampCamera();suppressClickUntil=Date.now()+220;drawMap();return;
      }
      if(!drag||drag.id!==e.pointerId)return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;
      if(Math.abs(dx)+Math.abs(dy)>5){drag.moved=true;viewport.classList.add('dragging');viewport.setPointerCapture(e.pointerId);}
      if(drag.moved){camera.x=drag.cx-dx/camera.zoom;camera.y=drag.cy-dy/camera.zoom;clampCamera();drawMap();}
    });
    const end=e=>{
      pointers.delete(e.pointerId);if(drag?.moved||pinch)suppressClickUntil=Date.now()+220;
      drag=null;pinch=null;viewport.classList.remove('dragging');if(viewport.hasPointerCapture(e.pointerId))viewport.releasePointerCapture(e.pointerId);
      // A remaining finger starts a fresh pan, rather than jumping to the old origin.
      if(pointers.size===1){const [id,p]=[...pointers][0];drag={id,x:p.x,y:p.y,cx:camera.x,cy:camera.y,moved:false};}
    };
    viewport.addEventListener('pointerup',end);viewport.addEventListener('pointercancel',end);
    viewport.addEventListener('wheel',e=>{e.preventDefault();const d=mapDimensions(),unit=e.deltaMode===1?16:e.deltaMode===2?d.height:1;const dy=Math.max(-150,Math.min(150,e.deltaY*unit));zoomMap(Math.exp(-dy*.003),{x:e.clientX-d.left,y:e.clientY-d.top});},{passive:false});
    viewport.addEventListener('dblclick',e=>{if(!e.target.closest('button')){const d=mapDimensions();zoomMap(1.8,{x:e.clientX-d.left,y:e.clientY-d.top});}});
    viewport.addEventListener('keydown',e=>{
      if(e.target!==viewport)return;const delta={ArrowLeft:[-70,0],ArrowRight:[70,0],ArrowUp:[0,-70],ArrowDown:[0,70]}[e.key];
      if(delta){e.preventDefault();camera.x+=delta[0]/camera.zoom;camera.y+=delta[1]/camera.zoom;clampCamera();drawMap();}
      else if(['+','='].includes(e.key)){e.preventDefault();zoomMap(1.3);}else if(e.key==='-'){e.preventDefault();zoomMap(1/1.3);}
    });
  }
  function fitMap(scope='region'){
    const d=mapDimensions();if(!d?.width||!d?.height)return;
    const places=scope==='city'?C.VENUES.slice(0,240):C.VENUES;
    const xs=places.map(v=>v.x),ys=places.map(v=>v.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    camera.x=(x0+x1)/2;camera.y=(y0+y1)/2;
    camera.zoom=Math.max(.025,Math.min((d.width-90)/(x1-x0+200),(d.height-(isMobile()?245:180))/(y1-y0+200),.7));
    camera.initialized=true;camera.scope=scope;drawMap();
  }
  function focusMap(id,zoom){const v=C.venueById(id);if(!v)return;camera.x=v.x;camera.y=v.y;if(zoom)camera.zoom=zoom;camera.scope='custom';drawMap();}
  function drawMap(){scheduleMap();}
  function markerContent(g){
    const aa=g.ids.map(id=>mapActivity.get(id)).filter(Boolean),count=aa.reduce((n,a)=>n+a.count,0),friends=aa.flatMap(a=>a.friends);
    if(g.ids.length>1)return{cls:`cluster-pin ${friends.length?'has-friends':''}`,count,label:`${g.ids.length} places, ${count.toLocaleString()} participating app users. Zoom in to separate venues.`,html:`<span class="cluster-count">${count?count.toLocaleString():'—'}</span><span class="cluster-places">${g.ids.length} places</span>${friends.length?`<span class="cluster-friends">${icon('friends',9)}</span>`:''}`};
    const v=C.venueById(g.ids[0]),a=aa[0]||{count:0,hasData:false,friends:[]};
    return{cls:`venue-pin ${state.selected===v.id?'selected':''} ${a.hasData?'':'unknown'}`,count:a.count,label:`${v.name}, ${a.hasData?a.count+' app users in demo':'no recent app activity'}`,html:`<span class="pin-bubble">${icon(v.category==='cafe'?'coffee':'glass',14)}<span>${a.hasData?a.count:'—'}</span>${a.friends.length?`<span class="pin-friends-count">${icon('friends',9)}${a.friends.length}</span>`:''}</span><span class="pin-label">${escape(v.name)}</span>`};
  }
  function drawMapNow(){
    const start=performance.now(),d=mapDimensions(),layer=$('#mapPins');if(!d||!layer||state.screen!=='explore')return;
    SpotCartography.draw(camera,d);
    const key=[mapRevision,MC.zoomLevel(camera.zoom),camera.zoom>=.6?state.selected:null,isMobile()].join(':');
    if(groupKey!==key){groups=MC.cluster(mapPlaces,camera.zoom,camera.zoom>=.6?state.selected:null,isMobile()?62:68);groupKey=key;clusterBuilds++;}
    currentGroups=new Map();const needed=new Set();
    for(const g of groups){const p=MC.project(g,camera,d);if(p.x< -70||p.y< -65||p.x>d.width+70||p.y>d.height+80)continue;
      needed.add(g.key);if(g.ids.length>1)currentGroups.set(g.key,{x:g.x,y:g.y,venues:g.ids});
      let node=pinNodes.get(g.key);
      if(!node){node=document.createElement('button');node.type='button';node.style.left='0';node.style.top='0';pinNodes.set(g.key,node);layer.appendChild(node);}
      const version=key+':'+g.ids.join(',');
      if(node.dataset.version!==version){const m=markerContent(g);node.className=m.cls;node.innerHTML=m.html;node.setAttribute('aria-label',m.label);node.dataset.count=m.count;node.dataset.members=g.ids.join(',');node.dataset.version=version;
        if(g.ids.length>1){node.dataset.cluster=g.key;delete node.dataset.pin;}else{node.dataset.pin=g.ids[0];delete node.dataset.cluster;}}
      node.style.transform=`translate3d(${Math.round(p.x)}px,${Math.round(p.y)}px,0) translate(-50%,-50%)`;
    }
    for(const [key,node]of pinNodes){if(!needed.has(key)){node.remove();pinNodes.delete(key);}}
    const scale=$('#mapScale');if(scale){const metersPerWorldPixel=Math.cos(40.8*Math.PI/180)*40075016.686/(256*2**C.MAP.baseZoom),raw=80/camera.zoom*metersPerWorldPixel,pow=10**Math.floor(Math.log10(raw)),rounded=[1,2,5,10].find(n=>n*pow>=raw)*pow;scale.style.width=(rounded/metersPerWorldPixel*camera.zoom)+'px';scale.textContent=rounded>=1000?(rounded/1000)+' km':rounded+' m';}
    $$('[data-action="region"], [data-action="city"], [data-action="downtown"]').forEach(b=>{const active=b.dataset.action===camera.scope;b.classList.toggle('active',active);b.setAttribute('aria-pressed',String(active));});
    frameTimes.push(performance.now()-start);if(frameTimes.length>240)frameTimes.shift();
  }
  function zoomMap(factor,point){const d=mapDimensions();if(!d)return;Object.assign(camera,MC.anchoredZoom(camera,factor,point||{x:d.centerX,y:d.centerY},d,.025,8));camera.scope='custom';clampCamera();drawMap();}
  function fitSearchResults(){
    if(!state.query.trim()&&!state.savedOnly)return;
    const vs=C.filteredVenues(state,snapshot,now()),d=mapDimensions();if(!vs.length||!d)return;
    const xs=vs.map(v=>v.x),ys=vs.map(v=>v.y),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);
    camera.x=(x0+x1)/2;camera.y=(y0+y1)/2;camera.zoom=Math.min(2,Math.max(.025,Math.min((d.width-110)/(x1-x0+150),(d.height-(isMobile()?230:150))/(y1-y0+150))));camera.scope='custom';drawMap();
  }
  function selectVenue(id,open=false,fromPin=false){
    const v=C.venueById(id);if(!v)return;
    if(!fromPin && !mapPlaces.some(place=>place.id===id)){
      state.query='';state.category='all';state.savedOnly=false;state.friendsOnly=false;
      if($('#venueSearch'))$('#venueSearch').value='';refreshExplore();
    }
    state.selected=id;
    $$('[data-card]').forEach(el=>{const yes=el.dataset.card===id;el.classList.toggle('selected',yes);el.setAttribute('aria-pressed',String(yes));});
    // Do not rebuild the list or reset the map camera when tapping a visible pin.
    if(!fromPin){if(isMobile()&&state.mobileView==='list'){state.mobileView='map';$('.explore-layout').classList.remove('list-mode');dimensions=null;}
      focusMap(id,Math.max(camera.zoom,isMobile()?1.1:1.15));}
    drawMap();if(open)openDetail(id);
  }
  function showVenueFromFriend(id) {
    state.category = 'all'; state.query = ''; state.friendsOnly = false; state.savedOnly = false; state.selected = id; state.mobileView = 'map';
    navigate('explore', false);focusMap(id,1.5);openDetail(id);
  }
  function renderDetail() {
    const v=C.venueById(detailId); if(!v)return;
    const old=$('.detail-card'), expanded=!!old?.classList.contains('expanded'), scroll=old?.scrollTop||0;
    const a=C.activity(v,state,snapshot,now());
    $('#detailHost').innerHTML=`<section class="detail-card ${expanded?'expanded':''}" role="region" aria-labelledby="detailTitle" tabindex="-1"><div class="detail-cover ${v.theme}"><span class="detail-live-label">${icon('pin',12)} PLACE OVERVIEW</span><span class="cover-word" aria-hidden="true">${escape(v.name.split(' ')[0].toLowerCase())}.</span><span class="cover-icon">${icon(v.category==='cafe'?'coffee':'glass',34)}</span><button class="icon-button" data-action="close-detail" aria-label="Close place details">${icon('close',17)}</button></div><div class="detail-content"><p class="detail-category">${v.category==='cafe'?'Café':'Bar'} · ${escape(v.area)}</p><h2 id="detailTitle">${escape(v.name)}</h2><div class="spot-toolbar">${saveButton(v.id)}${compareButton(v.id)}<button class="place-action" data-action="share-place" data-id="${v.id}">${icon('share',15)}<span>Share</span></button><button class="place-action" data-action="directions" data-id="${v.id}" aria-label="Preview directions to ${escape(v.name)}">${icon('directions',15)}<span>Directions</span></button></div><div class="activity-box ${a.hasData?'':'unknown'}"><div class="activity-top"><span class="activity-number">${a.hasData?a.count:'—'}</span><div class="activity-text"><strong>${a.hasData?'participating app '+(a.count===1?'user':'users'):'No recent app activity'}</strong><span>${a.hasData?C.timeLabel(a.latest,now())+' · demo data':'Current activity is unknown'}</span></div></div><p>${a.hasData?'A sample of app users, not everyone inside. This doesn’t tell us whether seats are available.':'No recent activity does not mean this place is empty. Visitors may not use the app.'}</p>${a.own?`<span class="you-label">${icon('check',12)} Your count contribution is included once.</span>`:''}</div><button class="detail-expand" data-action="expand-detail" aria-expanded="${expanded}">${expanded?'Less detail':'More details'} ${icon('chevron',12)}</button><p class="detail-description">${escape(v.description)}</p>${timelineMarkup(v)}<div class="detail-section"><h3>Friends here <span>Sharing with you</span></h3>${a.friends.length?a.friends.map(p=>`<div class="detail-friend">${avatar(p,'sm')}<strong>${escape(p.name)}</strong><span>In this demo</span></div>`).join(''):'<p class="no-friends-text">No friends are sharing this place right now.</p>'}</div><div class="detail-address">${icon('pin',15)} ${escape(v.address)} · approximate pin</div><div class="detail-actions"><button class="secondary-button" data-action="show-on-map" data-id="${v.id}">${icon('map',15)} See on map</button><button class="secondary-button" data-screen="friends">${icon('friends',15)} Friends</button></div><p class="detail-footer">Fictional venue · Not a real business listing</p></div></section>`;
    $('.detail-card').scrollTop=scroll;
  }
  function setBackgroundInert(value) { $('.app-shell').inert = value; $('.skip-link').inert = value; $('#detailHost').inert=value; }
  function openDetail(id) {
    closeModal(false); compareOpen=false;document.body.classList.remove('has-comparison'); detailReturnFocus=document.activeElement;detailId=id;renderDetail();renderCompareTray();
    try { history.replaceState(null,'','#place/'+encodeURIComponent(id)); } catch (_) {}
    document.body.classList.add('has-detail');setBackgroundInert(false);document.body.style.overflow='';
    // Non-modal: no focus trap, backdrop, or inert app. Search and pins stay active.
    if(!isMobile())$('.detail-card').focus({preventScroll:true});
  }
  function restoreFocus(element, fallback) {
    if (element && element.isConnected && typeof element.focus === 'function') element.focus({ preventScroll: true });
    else if (fallback) fallback.focus({ preventScroll: true });
  }
  function closeDetail(focus = true) {
    const hadDetail=!!detailId||compareOpen;detailId=null;compareOpen=false;$('#detailHost').innerHTML='';document.body.classList.remove('has-detail','has-comparison');
    if(C.parsePlaceHash(location.hash))try{history.replaceState(null,'','#explore');}catch(_){}
    renderCompareTray();
    if (!modalType) { setBackgroundInert(false); document.body.style.overflow = ''; }
    if (focus && hadDetail) restoreFocus(detailReturnFocus, $(`[data-card="${state.selected}"]`) || $('#main'));
  }
  let friendsTab='all', friendsQuery='';
  function friendsTabMarkup() {
    const stats=C.populationStats(state,snapshot,now());
    return [['all','All friends',stats.friends],['around','Around now',stats.friendsPresent],['requests','Requests',stats.requests]].map(([id,title,count])=>`<button class="friend-tab ${friendsTab===id?'active':''}" data-friends-tab="${id}" aria-pressed="${friendsTab===id}">${title}<span>${count}</span></button>`).join('');
  }
  function renderFriends() {
    $('#main').innerHTML=`<section class="content-page friends-page"><div class="page-heading"><div><div class="eyebrow">YOUR LINCOLN CIRCLE</div><h1>Your people.</h1><p>A familiar face at your next favorite place.</p></div><button class="primary-button" data-action="add-friend">${icon('userPlus',15)} Add friend</button></div><div class="friend-tabs" id="friendTabs" aria-label="Filter friends">${friendsTabMarkup()}</div><div class="friend-search search-wrap">${icon('search',17)}<label class="sr-only" for="friendsListSearch">Search your friends or their shared places</label><input id="friendsListSearch" class="search-input" type="search" autocomplete="off" maxlength="100" placeholder="Search a name, place, or area…" value="${escape(friendsQuery)}"></div><div class="friend-page-grid"><div><div class="friend-results-caption" id="friendResultsCount"></div><div class="friends-cards-grid" id="friendsCards"></div><div id="relationshipExtras"></div></div><aside><div class="friend-summary"><div class="mini-avatars">${activeFriends().slice(0,4).map(p=>avatar(p,'sm')).join('')}</div><h3>${activeFriends().length} friends around Lincoln.</h3><p>See their shared spots, then tap a place to find it on the map.</p><button class="text-button" data-friends-tab="around">See who’s around ${icon('arrow',13)}</button></div><div class="friend-note">${icon('shield',22)}<h3>Friends, not followers.</h3><p>Outside your friends, people see a venue’s count—not your name or a personal pin.</p></div><div class="friend-note">${icon('info',19)}<h3>All familiar faces are fictional.</h3><p>60 sample friends and 6 requests are included to try a larger network. Nothing is shared with another person.</p></div></aside></div></section>`;
    $('#friendsListSearch').addEventListener('input',e=>{friendsQuery=e.target.value;refreshFriendCards();});
    refreshFriendCards();
  }
  function refreshFriendCards() {
    if(!$('#friendsCards'))return;
    $('#friendTabs').innerHTML=friendsTabMarkup();
    const q=C.normalize(friendsQuery);
    const candidates=C.PEOPLE.filter(p=>state.relations[p.id]===(friendsTab==='requests'?'incoming':'accepted')).filter(p=>friendsTab!=='around'||C.friendVisible(p,state,snapshot,now()));
    const people=candidates.filter(p=>{const v=C.friendVisible(p,state,snapshot,now())?C.venueById(p.venueId):null;return !q||C.normalize(`${p.name} ${p.handle} ${v?v.name+' '+v.area:''}`).includes(q);}).sort((a,b)=>Number(C.friendVisible(b,state,snapshot,now()))-Number(C.friendVisible(a,state,snapshot,now())));
    $('#friendResultsCount').textContent=`${people.length} ${friendsTab==='requests'?'requests':'friends'}${q?' matching your search':friendsTab==='around'?' sharing a place':' in this demo'}`;
    $('#friendsCards').innerHTML=people.length?people.map(p=>{
      const visible=C.friendVisible(p,state,snapshot,now()),v=visible?C.venueById(p.venueId):null;
      if(friendsTab==='requests')return `<div class="request-card" data-request="${p.id}"><div class="request-person">${avatar(p)}<div><strong>${escape(p.name)}</strong><p>@${escape(p.handle)}</p></div></div><p>Adding a friend does not share your location. Choose your audience separately in Privacy.</p><div class="button-row"><button class="primary-button" data-relation="accept" data-person="${p.id}">${icon('check',12)} Accept</button><button class="secondary-button" data-relation="decline" data-person="${p.id}">Decline</button></div></div>`;
      return `<div class="friend-card" data-friend-card="${p.id}"><span class="friend-avatar-wrap">${avatar(p)}${visible?'<span class="presence-dot"></span>':''}</span><div class="friend-info"><h3>${escape(p.name)}</h3><p>@${escape(p.handle)}</p>${v?`<button class="friend-location" data-friend-venue="${v.id}">${icon('pin',12)}<span>${escape(v.name)}</span>${icon('chevron',11)}</button><span class="friend-area">${escape(v.area)}</span>`:`<span class="friend-location muted">${icon('eyeOff',12)} Not sharing a place</span>`}</div><button class="icon-button" data-manage-friend="${p.id}" aria-label="Manage ${escape(p.name)}">${icon('more',18)}</button></div>`;
    }).join(''):`<div class="empty-state">${icon('search',28)}<h3>${q?'No matching friends':'Nobody here yet'}</h3><p>${q?'Try a different name or a shared place.':'Try another tab or add a demo friend.'}</p></div>`;
    const extras=C.PEOPLE.filter(p=>['sent','blocked'].includes(state.relations[p.id]));
    $('#relationshipExtras').innerHTML=friendsTab==='all'&&extras.length?`<h2 class="section-label">Other connections</h2>${extras.map(p=>`<div class="pending-row">${avatar(p,'sm')}<div><strong>${escape(p.name)}</strong><p>${state.relations[p.id]==='sent'?'Demo request pending':'Blocked in this demo'}</p></div><button class="text-button" data-relation="${state.relations[p.id]==='sent'?'cancel':'unblock'}" data-person="${p.id}">${state.relations[p.id]==='sent'?'Cancel':'Unblock'}</button></div>`).join('')}`:'';
  }
  function renderPrivacy() {
    const visibility=C.ownVisibility(state,snapshot,now()), enabled=state.sharing||state.friendSharing;
    const title=!enabled?'You’re not sharing your location.':state.sharing&&state.friendSharing?'Sharing on your terms.':state.sharing?'A count, not your name.':'Visible only to selected friends.';
    $('#main').innerHTML=`<section class="content-page privacy-page"><div class="page-heading"><div><div class="eyebrow">ALWAYS YOUR CALL</div><h1>Your presence. Your choice.</h1><p>Two separate choices. Nothing shared by default.</p></div><button class="secondary-button pause-all" data-action="pause-all" ${!enabled?'disabled':''}>${icon('eyeOff',15)} Pause all sharing</button></div><div class="privacy-banner"><span class="banner-icon">${icon(enabled?'shield':'eyeOff',23)}</span><div><h2>${title}</h2><p>These are simulated settings. Your device location is never accessed.</p></div></div><div class="privacy-settings-grid"><div class="settings-card"><div class="setting-row"><div><span class="setting-kicker">THE PUBLIC MAP</span><h3>Contribute to activity counts</h3><p>Include your demo presence in a venue’s total. No name or individual public pin.</p></div><button class="toggle ${state.sharing?'on':''}" role="switch" aria-checked="${state.sharing}" aria-label="Contribute to activity counts in this demo" data-action="toggle-sharing"></button></div><div class="setting-note">${icon('map',15)}<span>Independent of friend sharing. Turn this off without changing who can see your name.</span></div></div><div class="settings-card"><div class="setting-row"><div><span class="setting-kicker">YOUR SELECTED FRIENDS</span><h3>Share my venue with friends</h3><p>Only friends you choose can see your name at a spot. Friendship alone never enables this.</p></div><button class="toggle ${state.friendSharing?'on':''}" role="switch" aria-checked="${state.friendSharing}" aria-label="Share my venue with selected friends in this demo" data-action="toggle-friend-sharing"></button></div><div class="audience-setting"><span>${state.shareWith.length?`${state.shareWith.length} selected ${state.shareWith.length===1?'friend':'friends'}`:'No friends selected'} <small>· ${state.friendSharing?'enabled in demo':'sharing off'}</small></span><button class="text-button" data-action="choose-audience">${state.shareWith.length?'Edit friends':'Choose friends'} ${icon('chevron',13)}</button></div></div></div><section class="visibility-preview" aria-labelledby="visibilityTitle"><div class="visibility-heading"><div><div class="eyebrow">AT JUNIPER COFFEE</div><h2 id="visibilityTitle">What your settings show</h2></div><span class="sample-label">LOCAL SIMULATION</span></div><div class="visibility-columns"><div><span class="visibility-icon">${icon('map',20)}</span><h3>On the public map</h3><strong id="publicVisibility">${visibility.countIncluded?'Included in the venue count':'Your presence is not included'}</strong><p>${visibility.countIncluded?'One contribution. No public name or personal pin.':'You can still browse every place.'}</p></div><div><span class="visibility-icon">${icon('friends',20)}</span><h3>For selected friends</h3><strong id="friendVisibility">${visibility.visibleTo.length?`Your name at Juniper · ${visibility.visibleTo.length} ${visibility.visibleTo.length===1?'friend':'friends'}`:'Your venue is hidden'}</strong><p>${visibility.visibleTo.length?'Only your selected audience can see this in the intended app.':'No named venue is visible from your settings.'}</p></div></div></section><div class="privacy-rules"><div class="privacy-rule">${icon('shield',19)}<div><h3>Being visible is not an invitation.</h3><p>Friends can ask before joining. There’s no availability status to manage.</p></div></div><div class="privacy-rule">${icon('friends',19)}<div><h3>You choose each connection.</h3><p>New friends are not added to your sharing audience. Removing or blocking someone also revokes their permission to see your venue.</p></div></div><div class="privacy-rule">${icon('clock',19)}<div><h3>Fresh presence, not personal history.</h3><p>Presence expires after 15 minutes without an observation. The place timeline uses authored sample counts, never your location history.</p></div></div><div class="privacy-rule">${icon('lock',19)}<div><h3>A local prototype.</h3><p>Saved spots, appearance, and demo sharing choices stay in this browser. No GPS, analytics, live accounts, or background tracking. Sharing place info is an explicit action you control.</p></div></div></div><div class="reset-row"><p>Reset clears saved spots, comparison selections, demo friend changes, and sharing settings. Your chosen appearance is kept.</p><button class="secondary-button" data-action="confirm-reset">${icon('reset',14)} Reset demo</button></div>${storageAvailable?'':'<p class="storage-warning">Browser storage is unavailable. Changes work in this tab but may not survive closing it.</p>'}</section>`;
  }
  function showModal(type, personId = null) {
    modalReturnFocus = document.activeElement; modalType = type; modalPerson = personId;
    renderModal(); setBackgroundInert(true); document.body.style.overflow = 'hidden';
    const focusTarget = type === 'add-friend' ? $('#friendSearch') : $('.modal');
    focusTarget?.focus({ preventScroll: true });
  }
  function closeModal(focus = true) {
    const hadModal = !!modalType; modalType = null; modalPerson = null; $('#modalHost').innerHTML = '';
    setBackgroundInert(false); document.body.style.overflow = '';
    if (focus && hadModal) restoreFocus(modalReturnFocus, $('#main'));
  }
  function renderModal() {
    let content = extraModalContent(modalType);
    if (content) { /* New local-only feature dialogs are built above. */ }
    else if (modalType === 'about') content = `<div class="modal-symbol">${icon('map', 25)}</div><div class="eyebrow">SPOT · LINCOLN EDITION</div><h2>A little local insight.</h2><p>See recent app activity at a place without asking anyone to check in. Friends add a familiar face; everyone else is part of a count.</p><div class="modal-callout"><strong>Lincoln, with 5,000 demo accounts.</strong><br>336 made-up places · 60 friends · 42 sharing at the start. 3,500 accounts start at venues; 1,500 are not mapped. This is not a complete building inventory. Pins are approximate placeholders, not real businesses.</div><div class="modal-facts"><div class="modal-fact">${icon('pin', 15)}<span>Each pin represents one establishment, not an individual person.</span></div><div class="modal-fact">${icon('friends', 15)}<span>A count is participating app users—not total visitors, a “full” status, or available seats.</span></div><div class="modal-fact">${icon('clock', 15)}<span>Stale activity disappears. A dash means unknown, not empty. All activity is simulated.</span></div></div><p class="map-explanation">The map covers Lincoln and nearby towns with an original illustrative layout. It is not a street survey, building inventory, or navigation map. Map artwork, demo venues and theme palettes are bundled, so the prototype works without internet access.</p><button class="primary-button" data-action="close-modal" style="width:100%">Explore the demo ${icon('arrow', 15)}</button><details class="prototype-tools"><summary>Prototype testing tools</summary><p>Advance the demo clock to see activity expire, or restore the fictional scenario. These are testing controls, not app features.</p><div class="button-row"><button class="secondary-button" data-action="advance-time">${icon('clock', 12)} Advance 15 min</button><button class="secondary-button" data-action="confirm-reset">${icon('reset', 12)} Reset demo</button></div></details>`;
    else if (modalType === 'share') content = `<div class="modal-symbol">${icon('shield', 25)}</div><h2>Contribute to the count?</h2><p>In this demo, switching on adds one fictional visitor—you—to Juniper Coffee.</p><div class="modal-facts"><div class="modal-fact">${icon('map', 15)}<span>People outside your friends see only the combined venue count.</span></div><div class="modal-fact">${icon('friends', 15)}<span>Your name stays hidden from friends unless you separately choose them and enable friend sharing.</span></div><div class="modal-fact">${icon('eyeOff', 15)}<span>You can switch it off at any time. Your sample presence is removed immediately.</span></div></div><div class="modal-callout"><strong>Simulation only.</strong> This does not request GPS permission, run in the background, or share anything with another person.</div><div class="button-row"><button class="secondary-button" data-action="close-modal">Not now</button><button class="primary-button" data-action="enable-sharing">Enable count contribution</button></div>`;
    else if (modalType === 'add-friend') content = `<div class="modal-symbol">${icon('userPlus', 25)}</div><h2>Find your people.</h2><p>Search the sample directory by name or handle.</p><div class="search-wrap">${icon('search', 17)}<label class="sr-only" for="friendSearch">Search demo people</label><input id="friendSearch" class="search-input" autocomplete="off" maxlength="80" placeholder="Try Jordan or @casey.r"></div><div id="directoryList" class="directory-list"></div><p class="modal-note">Demo only. Requests stay in this browser and do not contact anyone.</p>`;
    else if (modalType === 'manage') {
      const p = C.personById(modalPerson); if (!p) return closeModal();
      content = `<div class="manage-profile">${avatar(p)}<div><h2>${escape(p.name)}</h2><p>@${escape(p.handle)}</p></div></div><p>You control your connections. Removing or blocking this demo friend hides their name at venues, but does not remove their anonymous contribution to a venue’s count.</p><div class="manage-actions"><button class="secondary-button" data-action="confirm-remove" data-person="${p.id}">${icon('person', 16)} Remove friend</button><button class="danger-button" data-action="confirm-block" data-person="${p.id}">${icon('block', 16)} Block in demo</button></div>`;
    } else if (modalType === 'confirm-remove' || modalType === 'confirm-block') {
      const p = C.personById(modalPerson); if (!p) return closeModal(); const block = modalType === 'confirm-block';
      content = `<div class="modal-symbol">${icon(block ? 'block' : 'person', 24)}</div><h2>${block ? 'Block' : 'Remove'} ${escape(p.name.split(' ')[0])}?</h2><p>Their name and venue will no longer appear in your friends view. The venue’s public count stays the same.</p><div class="button-row"><button class="secondary-button" data-action="close-modal">Keep friend</button><button class="danger-button" data-relation="${block ? 'block' : 'remove'}" data-person="${p.id}">${block ? 'Block' : 'Remove'}</button></div>`;
    } else if (modalType === 'reset') content = `<div class="modal-symbol">${icon('reset', 24)}</div><h2>A fresh start?</h2><p>This clears saved spots, comparison selections, audience choices, and demo friend changes. It restores the original sample places and turns both kinds of sharing off. Appearance is kept.</p><div class="button-row"><button class="secondary-button" data-action="close-modal">Keep exploring</button><button class="primary-button" data-action="reset-demo">Reset demo</button></div>`;
    $('#modalHost').innerHTML = `<div class="modal-backdrop" data-action="modal-backdrop"><section class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" tabindex="-1"><button class="icon-button modal-close" data-action="close-modal" aria-label="Close dialog">${icon('close', 18)}</button>${content}</section></div>`;
    const title = $('.modal h2'); if (title) title.id = 'modalTitle';
    if (modalType === 'add-friend') { renderDirectory(''); $('#friendSearch').addEventListener('input', e => renderDirectory(e.target.value)); }
    if (modalType === 'audience') {renderAudienceList();$('#audienceSearch').addEventListener('input',e=>{audienceQuery=e.target.value;renderAudienceList();});}
  }
  function renderDirectory(query) {
    const target = $('#directoryList'); if (!target) return;
    const normalized = C.normalize(query).replace(/^@/, '');
    const found = C.PEOPLE.filter(p => state.relations[p.id] !== 'blocked' && (!normalized || C.normalize(`${p.name} ${p.handle}`).includes(normalized)));
    target.innerHTML = found.length ? found.map(p => {
      const status = state.relations[p.id];
      let action;
      if (status === 'accepted') action = `<span class="directory-status">Friends</span>`;
      else if (status === 'sent') action = `<button class="secondary-button" data-relation="cancel" data-person="${p.id}" aria-label="Cancel request to ${escape(p.name)}">Sent · cancel</button>`;
      else if (status === 'incoming') action = `<button class="secondary-button" data-relation="accept" data-person="${p.id}" aria-label="Accept ${escape(p.name)}. Adding this friend will not share your own venue.">Accept</button>`;
      else action = `<button class="secondary-button" data-relation="request" data-person="${p.id}" aria-label="Add ${escape(p.name)}">${icon('plus', 12)} Add</button>`;
      return `<div class="directory-person">${avatar(p)}<div class="friend-info"><h3>${escape(p.name)}</h3><p>@${escape(p.handle)}</p></div>${action}</div>`;
    }).join('') : `<div class="empty-state"><h3>No matching demo people</h3><p>Try Jordan, Casey, or another sample name.</p></div>`;
  }
  function relationAction(person, action) {
    if (!C.changeRelation(state, person, action)) return;
    persist();
    const stayOpen = modalType === 'add-friend'; const query = stayOpen ? $('#friendSearch')?.value || '' : '';
    if (!stayOpen) closeModal(false);
    render();
    if (stayOpen) { setBackgroundInert(true); renderDirectory(query); $('#friendSearch')?.focus({ preventScroll: true }); }
    const messages = { accept: 'Demo friend added. Their shared place is now visible.', decline: 'Demo request declined.', request: 'Demo request saved. Nothing was sent to a real person.', cancel: 'Demo request canceled.', remove: 'Friend removed. Their named presence is hidden.', block: 'Demo friend blocked. Their named presence is hidden.', unblock: 'Unblocked. You are not automatically friends again.' };
    toast(messages[action] || 'Demo updated.');
  }
  function resetDemo() {
    try { localStorage.removeItem(storageKey); } catch (_) { storageAvailable = false; }
    closeModal(false); closeDetail(false);friendsTab='all';friendsQuery=''; state = C.initialState();compareOpen=false;document.body.classList.remove('has-compare','has-comparison'); snapshot = C.makeSnapshot(); timeOffset = 0; camera.initialized = false;
    navigate('explore'); toast('Fresh start. Sharing is off and demo data is restored.');
  }
  // Small, explicit tools: no extra main navigation or social status system.
  let compareOpen = false, audienceDraft = new Set(), audienceQuery = '';
  function saveButton(id, compact = false) {
    const saved = state.savedVenues.includes(id), name = C.venueById(id)?.name || '';
    return `<button class="${compact ? 'entry-tool' : 'place-action'} ${saved ? 'is-active' : ''}" data-save="${id}" aria-pressed="${saved}" aria-label="${saved ? 'Unsave' : 'Save'} ${escape(name)}" title="${saved ? 'Remove from saved' : 'Save spot'}">${icon('bookmark',15)}${compact ? '' : `<span>${saved ? 'Saved' : 'Save'}</span>`}</button>`;
  }
  function compareButton(id, compact = false) {
    const added = state.compareIds.includes(id), name = C.venueById(id)?.name || '';
    return `<button class="${compact ? 'entry-tool' : 'place-action'} ${added ? 'is-active' : ''}" data-compare="${id}" aria-pressed="${added}" aria-label="${added ? 'Remove' : 'Add'} ${escape(name)} ${added ? 'from' : 'to'} comparison" title="${added ? 'Remove from comparison' : 'Compare this spot'}">${icon(added ? 'check' : 'compare',15)}${compact ? '' : `<span>${added ? 'Added' : 'Compare'}</span>`}</button>`;
  }
  function refreshPlaceTools(source, id) {
    const list = $('#placesList'), scroll = list?.scrollTop;
    if (state.screen === 'explore') refreshExplore();
    if (list && Number.isFinite(scroll)) list.scrollTop = scroll;
    if (detailId) renderDetail();
    if (compareOpen) renderComparison();
    const scope = source?.closest('.detail-card') ? $('#detailHost') : source?.closest('.comparison-card') ? $('#detailHost') : $('#placesList');
    const selector = source?.hasAttribute('data-save') ? `[data-save="${id}"]` : `[data-compare="${id}"]`;
    (scope?.querySelector(selector) || $('[data-action="saved-filter"]'))?.focus({preventScroll:true});
  }
  function renderCompareTray() {
    const host = $('#compareTray'); if (!host) return;
    const ids = state.compareIds;
    document.body.classList.toggle('has-compare', ids.length > 0 && !compareOpen);
    host.hidden = !ids.length || compareOpen;
    if (host.hidden) { host.innerHTML=''; return; }
    host.innerHTML = `<div class="compare-tray-top"><div><strong>${ids.length} ${ids.length === 1 ? 'spot' : 'spots'} selected</strong><span>${ids.length < 2 ? 'Add one more to compare' : 'Compare up to 3 places'}</span></div><button class="primary-button" data-action="review-compare" ${ids.length < 2 ? 'disabled' : ''}>Compare ${icon('arrow',13)}</button><button class="entry-tool" data-action="clear-compare" aria-label="Clear comparison">${icon('close',15)}</button></div><div class="compare-chips">${ids.map(id=>`<button data-compare="${id}" aria-label="Remove ${escape(C.venueById(id).name)} from comparison">${escape(C.venueById(id).name)} ${icon('close',11)}</button>`).join('')}</div>`;
  }
  function openComparison() {
    if (state.compareIds.length < 2) return toast('Choose at least two spots to compare.');
    closeModal(false); closeDetail(false); compareOpen=true;
    document.body.classList.add('has-detail','has-comparison');
    renderComparison(); renderCompareTray();
    $('.comparison-card')?.focus({preventScroll:true});
  }
  function renderComparison() {
    if (!compareOpen) return;
    const ids = state.compareIds.filter(id=>C.venueById(id));
    if (ids.length < 2) { closeDetail(false); renderCompareTray(); return; }
    const old = $('.compare-table-wrap'); const left=old?.scrollLeft||0, top=$('.comparison-card')?.scrollTop||0;
    const data = ids.map(id=>({v:C.venueById(id), a:C.activity(C.venueById(id),state,snapshot,now())}));
    $('#detailHost').innerHTML = `<section class="detail-card comparison-card" role="region" aria-labelledby="compareTitle" tabindex="-1"><div class="comparison-header"><div><div class="eyebrow">YOUR SHORTLIST</div><h2 id="compareTitle">A closer look.</h2><p>Same moment. Different spots.</p></div><button class="icon-button" data-action="close-detail" aria-label="Close comparison">${icon('close',17)}</button></div><div class="comparison-explainer">${icon('info',15)}<span>App participation varies by place. These counts don’t rank crowding or tell you whether seats are available.</span></div><div class="compare-table-wrap" tabindex="0" aria-label="Comparison of selected places. Scroll sideways to see all columns."><table class="compare-table ${ids.length===3?'three-places':''}"><caption class="sr-only">Recent sample app activity for your selected places. No crowding ranking.</caption><thead><tr><th scope="col">Place</th>${data.map(({v})=>`<th scope="col"><div class="compare-place-head">${monogram(v)}<button class="entry-tool" data-compare="${v.id}" aria-label="Remove ${escape(v.name)} from comparison">${icon('close',13)}</button></div><button class="compare-place-name" data-venue="${v.id}">${escape(v.name)}</button><span class="compare-subtitle">${v.category==='cafe'?'Café':'Bar'} · ${escape(v.area)}</span></th>`).join('')}</tr></thead><tbody><tr><th scope="row">App users<small>Recently detected<br>Demo only</small></th>${data.map(({a})=>`<td><strong class="compare-count">${a.hasData?a.count:'—'}</strong>${!a.hasData?'<small>Unknown, not empty</small>':''}</td>`).join('')}</tr><tr><th scope="row">Friends here<small>Sharing with you</small></th>${data.map(({a})=>`<td>${icon('friends',13)} ${a.friends.length}</td>`).join('')}</tr><tr><th scope="row">Updated</th>${data.map(({a})=>`<td>${a.hasData?C.timeLabel(a.latest,now()):'No recent activity'}</td>`).join('')}</tr><tr><th scope="row">Your usuals</th>${data.map(({v})=>`<td>${saveButton(v.id)}</td>`).join('')}</tr><tr><th scope="row">Explore</th>${data.map(({v})=>`<td><button class="text-button" data-venue="${v.id}">View spot ${icon('arrow',12)}</button></td>`).join('')}</tr></tbody></table></div><p class="comparison-footnote">Keep searching or select any map pin. Your shortlist stays here until you clear it.</p></section>`;
    $('.compare-table-wrap').scrollLeft=left; $('.comparison-card').scrollTop=top;
  }
  function timelineMarkup(v) {
    const history = C.sampleHistory(v.id,snapshot,now());
    if (!history) return `<section class="activity-timeline"><div class="timeline-heading"><h3>Activity over time</h3><span class="sample-label">SAMPLE HISTORY</span></div><p class="history-empty">No sample history for this place. Missing activity does not mean it is empty.</p></section>`;
    const max=Math.max(...history.values.map(p=>p.count),1), plot=history.values.map((p,i)=>[12+i*44,70-(p.count/max)*52]);
    const line=plot.map(p=>p.join(',')).join(' '), area=`M${plot.map(p=>p.join(',')).join(' L')} L276,78 L12,78 Z`;
    const summary=history.fresh ? ({up:'Sample activity increased',down:'Sample activity decreased',steady:'Sample activity stayed similar'}[history.direction]) : 'No fresh sample activity';
    return `<section class="activity-timeline ${history.fresh?'':'stale-history'}"><div class="timeline-heading"><h3>Activity over time</h3><span class="sample-label">SAMPLE HISTORY</span></div><div class="timeline-summary"><strong>${summary}</strong><span>30-minute example</span></div><svg class="history-chart" viewBox="0 0 288 86" role="img" aria-label="Illustrative app-user counts at five-minute intervals: ${history.values.map(p=>p.count).join(', ')}. These are authored sample values, not measured activity."><path class="chart-guide" d="M12 26H276 M12 52H276 M12 78H276"/><path class="chart-area" d="${area}"/><polyline class="chart-line" points="${line}"/>${plot.map(([x,y],i)=>`<circle class="chart-dot" cx="${x}" cy="${y}" r="${i===6?3.5:2}"/>`).join('')}</svg><div class="timeline-axis"><span>30 min before</span><span>15 min before</span><span>Latest sample</span></div><p class="history-note">Latest sample: ${C.timeLabel(history.lastAt,now())}. ${history.fresh?'Illustrative values, not measured visits or a prediction.':'History is stale; no new points are invented when presence expires.'}</p></section>`;
  }
  function renderAudienceList() {
    const host=$('#audienceList'); if(!host)return;
    const people=C.PEOPLE.filter(p=>state.relations[p.id]==='accepted' && (!audienceQuery || C.normalize(p.name+' '+p.handle).includes(C.normalize(audienceQuery))));
    host.innerHTML=people.length?people.map(p=>`<label class="audience-person">${avatar(p,'sm')}<span><strong>${escape(p.name)}</strong><small>@${escape(p.handle)}</small></span><input type="checkbox" data-audience="${p.id}" ${audienceDraft.has(p.id)?'checked':''} aria-label="Let ${escape(p.name)} see my venue"></label>`).join(''):'<p class="history-empty">No matching friends. Only accepted friends can be selected.</p>';
    $('#audienceCount').textContent=`${audienceDraft.size} selected`;
  }
  function setPrivacyView() {
    persist(); renderNav();
    if(state.screen==='privacy')renderPrivacy();
    else if(state.screen==='explore')refreshExplore();
    if(detailId)renderDetail();
    if(compareOpen)renderComparison();
  }
  function extraModalContent(type) {
    const v=C.venueById(modalPerson);
    if(type==='audience') return `<div class="modal-symbol">${icon('friends',24)}</div><h2>Choose who sees you.</h2><p>Only selected friends can see your demo venue. Adding a friend never adds them to this list automatically.</p><div class="audience-search search-wrap">${icon('search',16)}<label class="sr-only" for="audienceSearch">Search friends to share with</label><input id="audienceSearch" class="search-input" maxlength="80" placeholder="Search your friends…" value="${escape(audienceQuery)}"></div><div class="audience-meta"><strong id="audienceCount">${audienceDraft.size} selected</strong><span>No real location is collected</span></div><div id="audienceList" class="audience-list"></div><div class="modal-callout"><strong>Separate from public counts.</strong> Friend sharing does not turn on your contribution to venue counts. Being visible is not an invitation to join.</div><div class="button-row"><button class="secondary-button" data-action="close-modal">Cancel</button><button class="primary-button" data-action="save-audience">${state.friendSharing?'Save selection':'Save & enable demo'}</button></div><p class="modal-note">Saving an empty selection keeps friend visibility off.</p>`;
    if(type==='share-place' && v){
      const payload=C.sharePayload(v.id,location.href), text=payload.text+(payload.url?'\n'+payload.url:'');
      return `<div class="modal-symbol">${icon('share',24)}</div><h2>Share the spot.</h2><p>A place to meet, without sharing anyone’s location.</p><label class="share-label" for="shareText">Place information</label><textarea id="shareText" class="share-text" rows="5" readonly>${escape(text)}</textarea><p class="share-safety">${icon('shield',14)} No friend names, presence counts, or personal location are included.</p><p class="modal-note">${payload.url?'This link opens this fictional place in the hosted prototype.':'This is a local demo, not a public website. Shareable text is included instead of a link to a file on your device.'}</p><div class="button-row"><button class="primary-button" data-action="copy-place">${icon('copy',15)} Copy ${payload.url?'place link':'place info'}</button>${typeof navigator.share==='function'?`<button class="secondary-button" data-action="native-share">${icon('share',15)} Share…</button>`:''}</div><p id="shareStatus" class="share-status" role="status" aria-live="polite"></p>`;
    }
    if(type==='directions' && v)return `<div class="modal-symbol">${icon('directions',25)}</div><div class="eyebrow">DIRECTIONS PREVIEW</div><h2>Your next stop.</h2><div class="route-preview"><span class="route-dot"></span><div><small>DESTINATION · FICTIONAL</small><strong>${escape(v.name)}</strong><p>${escape(v.address)}</p></div></div><div class="modal-callout"><strong>This spot is a placeholder.</strong><br>Directions are a preview only. We won’t route you to a made-up business or ask for your location. Real navigation can be connected when real venues are added.</div><button class="primary-button preview-directions" disabled>${icon('directions',15)} Open in Maps · preview only</button><button class="text-button" data-action="close-modal">Back to the spot ${icon('arrow',13)}</button>`;
    return '';
  }
  async function copyPlace() {
    const field=$('#shareText'), status=$('#shareStatus'); if(!field||!status)return;
    let copied=false;
    try { if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(field.value);copied=true;} } catch (_) { /* Explicit manual fallback below. */ }
    if(!copied){field.focus();field.select();try{copied=document.execCommand('copy')===true;}catch(_){}}
    status.textContent=copied?'Copied. Only the place information is included.':'Copy is unavailable here. The text is selected so you can copy it manually.';
  }
  async function nativeShare() {
    const payload=C.sharePayload(modalPerson,location.href), status=$('#shareStatus'); if(!payload||typeof navigator.share!=='function')return;
    try { await navigator.share(payload); if(status?.isConnected)status.textContent='Place information passed to your device’s share menu.'; }
    catch(error){if(status?.isConnected)status.textContent=error?.name==='AbortError'?'Sharing canceled.':'Sharing is unavailable here. Use Copy place info or copy the text above.';}
  }
  function handleFeatureAction(target) {
    if(target.hasAttribute('data-save')){
      const id=target.dataset.save;C.toggleSaved(state,id);persist();refreshPlaceTools(target,id);
      toast(state.savedVenues.includes(id)?'Saved to your usuals.':'Removed from saved spots.');return true;
    }
    if(target.hasAttribute('data-compare')){
      const id=target.dataset.compare,result=C.toggleCompare(state,id);
      if(result==='limit'){toast('Compare up to 3 spots. Remove one to add another.');return true;}
      refreshPlaceTools(target,id);return true;
    }
    const action=target.dataset.action;
    if(action==='saved-filter'){if(detailId||compareOpen)closeDetail(false);state.savedOnly=!state.savedOnly;refreshExplore();fitSearchResults();return true;}
    if(action==='review-compare'){openComparison();return true;}
    if(action==='clear-compare'){state.compareIds=[];if(compareOpen)closeDetail(false);refreshExplore();if(detailId)renderDetail();return true;}
    if(action==='toggle-friend-sharing'){
      if(state.friendSharing){C.setFriendSharing(state,snapshot,false,now());setPrivacyView();toast('Hidden from friends. Your count contribution is unchanged.');}
      else {audienceDraft=new Set(state.shareWith);audienceQuery='';showModal('audience');}return true;
    }
    if(action==='choose-audience'){audienceDraft=new Set(state.shareWith);audienceQuery='';showModal('audience');return true;}
    if(action==='save-audience'){C.setAudience(state,[...audienceDraft]);C.setFriendSharing(state,snapshot,state.shareWith.length>0,now());closeModal(false);setPrivacyView();toast(state.friendSharing?`Demo venue visible to ${state.shareWith.length} selected ${state.shareWith.length===1?'friend':'friends'}.`:'No friends selected. Named sharing is off.');return true;}
    if(action==='pause-all'){C.pauseAll(state,snapshot);setPrivacyView();toast('All sharing paused. Your demo presence has been removed.');return true;}
    if(action==='share-place'||action==='directions'){showModal(action,target.dataset.id);return true;}
    if(action==='copy-place'){copyPlace();return true;}
    if(action==='native-share'){nativeShare();return true;}
    return false;
  }
  document.addEventListener('change', event=>{
    const id=event.target.dataset?.audience;if(!id)return;
    if(event.target.checked)audienceDraft.add(id);else audienceDraft.delete(id);
    if($('#audienceCount'))$('#audienceCount').textContent=`${audienceDraft.size} selected`;
  });

  document.addEventListener('click', e => {
    const target = e.target.closest('button, a, [data-action]'); if (!target) return;
    // The backdrop itself, not clicks bubbling from content inside a modal.
    if (target.dataset.action === 'modal-backdrop') { if (e.target === target) closeModal(); return; }
    if (handleFeatureAction(target)) return;
    if (target.dataset.screen) { e.preventDefault(); navigate(target.dataset.screen); return; }
    if (target.dataset.category) { if(detailId||compareOpen)closeDetail(false); state.category = target.dataset.category; refreshExplore(); return; }
    if (target.dataset.venue) { selectVenue(target.dataset.venue, true); return; }
    if (target.dataset.cluster) { if(Date.now()<suppressClickUntil)return;const group=currentGroups.get(target.dataset.cluster);if(group){camera.x=group.x;camera.y=group.y;zoomMap(1.9);}return; }
    if (target.dataset.pin) { if (Date.now() < suppressClickUntil) return; selectVenue(target.dataset.pin, true, true); return; }
    if (target.dataset.friendVenue) { showVenueFromFriend(target.dataset.friendVenue); return; }
    if (target.dataset.friendsTab) {friendsTab=target.dataset.friendsTab;refreshFriendCards();return;}
    if (target.dataset.manageFriend) { showModal('manage', target.dataset.manageFriend); return; }
    if (target.dataset.relation) { relationAction(target.dataset.person, target.dataset.relation); return; }
    const action = target.dataset.action;
    if (action === 'about') showModal('about');
    else if (action === 'close-modal') closeModal();
    else if(action==='close-detail')closeDetail();
    else if(action==='expand-detail'){const card=$('.detail-card');const expanded=card.classList.toggle('expanded');target.setAttribute('aria-expanded',String(expanded));target.innerHTML=(expanded?'Less detail':'More details')+icon('chevron',12);}
    else if (action === 'clear-search') { state.query = ''; $('#venueSearch').value = ''; refreshExplore(); $('#venueSearch').focus(); }
    else if (action === 'clear-filters') { state.query = ''; state.category = 'all'; state.friendsOnly = false; state.savedOnly = false; $('#venueSearch').value = ''; refreshExplore(); fitMap(); }
    else if (action === 'friends-filter') { state.friendsOnly = !state.friendsOnly; refreshExplore(); }
    else if (action === 'view-list' || action === 'view-map') { state.mobileView = action === 'view-list' ? 'list' : 'map'; $('.explore-layout').classList.toggle('list-mode', state.mobileView === 'list'); dimensions=null;if(state.mobileView==='list'&&detailId)closeDetail(false);requestAnimationFrame(()=>drawMap()); }
    else if (action === 'zoom-in') zoomMap(1.2);
    else if (action === 'zoom-out') zoomMap(1 / 1.2);
    else if(action==='recenter'||action==='region'){fitMap('region');}
    else if(action==='city'){fitMap('city');}
    else if (action === 'downtown') {camera.x=C.MAP.downtown[0];camera.y=C.MAP.downtown[1];camera.zoom=isMobile()?1.4:1.5;camera.scope='downtown';drawMap();}
    else if (action === 'show-on-map') {
      const id = target.dataset.id; closeDetail(false); state.mobileView = 'map'; $('.explore-layout')?.classList.remove('list-mode');
      state.selected = id; refreshExplore(); focusMap(id); restoreFocus($(`[data-pin="${id}"]`), $('#main'));
    }
    else if (action === 'add-friend') showModal('add-friend');
    else if (action === 'toggle-sharing') {
      if (state.sharing) { C.setSharing(state, snapshot, false, now()); persist(); render(); toast('Count contribution off. Your friend-sharing choice is unchanged.'); }
      else showModal('share');
    }
    else if (action === 'enable-sharing') { C.setSharing(state, snapshot, true, now()); persist(); closeModal(false); render(); toast('Count contribution on. Your name stays private unless you share with friends.'); }
    else if (action === 'confirm-remove' || action === 'confirm-block') { modalType = action; modalPerson = target.dataset.person; renderModal(); $('.modal').focus(); }
    else if (action === 'confirm-reset') showModal('reset');
    else if (action === 'reset-demo') resetDemo();
    else if (action === 'advance-time') {
      timeOffset += C.TTL; closeModal(false); render(); toast('Demo clock advanced. Unsupported activity has expired.');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !e.target.closest('.appearance')) { if (modalType) { e.preventDefault(); closeModal(); } else if (detailId||compareOpen) { e.preventDefault(); closeDetail(); } }
    if (e.key !== 'Tab') return;
    const dialog = $('.modal'); if (!dialog) return;
    const focusable = $$('a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), summary, [tabindex="0"]', dialog).filter(el => {
      if (!el.getClientRects().length || getComputedStyle(el).visibility === 'hidden') return false;
      // Descendants of a closed <details> can still report a layout box.
      // Only its summary participates in the actual keyboard tab order.
      for (let parent = el.parentElement; parent && parent !== dialog; parent = parent.parentElement) {
        if (parent.matches('details:not([open])') && !parent.querySelector(':scope > summary')?.contains(el)) return false;
      }
      return true;
    });
    if (!focusable.length) return;
    const first = focusable[0], last = focusable.at(-1);
    if (!dialog.contains(document.activeElement)) { e.preventDefault(); first.focus(); return; }
    if (e.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
  window.addEventListener('hashchange', () => { const id=C.parsePlaceHash(location.hash);if(id){if(state.screen!=='explore')navigate('explore',false);state.savedOnly=false;state.friendsOnly=false;state.query='';state.category='all';if($('#venueSearch'))$('#venueSearch').value='';refreshExplore();selectVenue(id,true);return;}const next=location.hash.slice(1);if(['explore','friends','privacy'].includes(next)&&(next!==state.screen||detailId||compareOpen))navigate(next); });
  let previousMobile = isMobile();
  window.addEventListener('resize', () => { if (previousMobile !== isMobile()) { previousMobile = isMobile(); dimensions=null; if(state.screen==='explore')drawMap(); } });
  // Freshness uses wall-clock time rather than timer ticks, so returning from a
  // suspended tab expires records correctly. Do not invent fresh observations.
  function refreshTimeSensitiveViews() {
    if (modalType) return;
    if (detailId) { const active = document.activeElement; const activeAction = active?.dataset?.action; renderDetail(); if (activeAction) $(`[data-action="${activeAction}"]`, $('.detail-card'))?.focus({ preventScroll: true }); }
    if (compareOpen) renderComparison();
    if (state.screen === 'explore') refreshExplore();
    else if(state.screen === 'privacy')renderPrivacy();
    else if (state.screen === 'friends') {
      const active = document.activeElement;
      if (!active || active === document.body || active === $('#main')) renderFriends();
      else if (now() - snapshot.createdAt >= C.TTL) renderFriends();
    }
  }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refreshTimeSensitiveViews(); });
  refreshInterval = setInterval(refreshTimeSensitiveViews, 15000);
  window.addEventListener('pagehide', () => clearInterval(refreshInterval));
  window.addEventListener('pageshow', e => { if (e.persisted) { clearInterval(refreshInterval); refreshInterval = setInterval(refreshTimeSensitiveViews, 15000); refreshTimeSensitiveViews(); } });
  // In-page testing hooks contain fictional state only. Never ship a comparable
  // client-authoritative friend/location API as real access control.
  window.SpotDemo = Object.freeze({ getState: () => JSON.parse(JSON.stringify(state)), getOwnVisibility:()=>C.ownVisibility(state,snapshot,now()),getHistory:id=>C.sampleHistory(id,snapshot,now()),getSharePayload:id=>C.sharePayload(id,location.href),getCompareOpen:()=>compareOpen, getActivity: id => { const v = C.venueById(id); return v ? C.activity(v, state, snapshot, now()) : null; }, getCamera: () => ({ ...camera }), getStats: () => C.populationStats(state,snapshot,now()), getMapMode:()=> 'offline-canvas-regional', getRenderStats:()=>({frames:frameTimes.length,frameTimes:[...frameTimes],clusterBuilds,pinNodes:pinNodes.size,geometry:SpotCartography.featureCount}), flushMap:()=>{if(frameRequest)cancelAnimationFrame(frameRequest);frameRequest=0;drawMapNow();}, setCamera:(update)=>{for(const k of ['x','y','zoom'])if(Number.isFinite(update[k]))camera[k]=update[k];clampCamera();drawMap();}, advanceTime: ms => { if (!Number.isFinite(ms) || ms < 0) throw new TypeError('Use a positive demo time offset.'); timeOffset += ms; refreshTimeSensitiveViews(); }, reset: resetDemo });
  window.addEventListener('spot-theme-change',()=>{SpotCartography.invalidate();drawMap();});
  render();
  if(initialPlace)selectVenue(initialPlace,true);
})();
