/* Pure demo-domain logic. No device location, network requests, or real accounts. */
(function (root, factory) {
  const api = factory(typeof module === 'object' && module.exports ? require('./lincoln-data.js') : root.SpotData);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpotCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (D) {
  'use strict';
  const TTL = 15 * 60 * 1000;
  if (!D) throw new Error('Lincoln demo data must load before core.js.');
  const VENUES = Object.freeze(D.venues.map(v => Object.freeze(v)));
  const PEOPLE = Object.freeze(D.people.map(p => Object.freeze(p)));
  const USERS = Object.freeze(D.users.map(u => Object.freeze(u)));
  const DEFAULT_RELATIONS = Object.freeze(D.relations);
  const MAP = Object.freeze(D.map);
  const POPULATION = D.population;
  const venuesById = new Map(VENUES.map(v => [v.id, v]));
  const peopleById = new Map(PEOPLE.map(p => [p.id, p]));
  const namedAt = new Map(VENUES.map(v => [v.id, PEOPLE.filter(p => p.venueId === v.id)]));
  const participants = new Map(VENUES.map(v => [v.id, USERS.filter(p => p.venueId === v.id).length]));
  const RELATION_STATES = ['accepted', 'incoming', 'sent', 'blocked'];
  function normalize(text) { return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function venueById(id) { return venuesById.get(id) || null; }
  function personById(id) { return peopleById.get(id) || null; }
  // Version 4 stores preferences, never observed location history. The v2 key is
  // retained by the app so an existing browser can migrate without losing friends.
  function initialState(saved) {
    const state = { version: 4, screen: 'explore', category: 'all', query: '', friendsOnly: false,
      savedOnly: false, savedVenues: [], compareIds: [], selected: 'juniper', mobileView: 'map',
      sharing: false, friendSharing: false, shareWith: [], relations: { ...DEFAULT_RELATIONS } };
    if (!saved || ![2,4].includes(saved.version)) return state;
    state.sharing = saved.sharing === true;
    if (saved.relations && typeof saved.relations === 'object' && !Array.isArray(saved.relations)) {
      state.relations = {};
      PEOPLE.forEach(p => { if (RELATION_STATES.includes(saved.relations[p.id])) state.relations[p.id] = saved.relations[p.id]; });
    }
    if (saved.version === 4) {
      state.savedVenues = validVenueIds(saved.savedVenues);
      state.shareWith = validAudience(saved.shareWith, state);
      state.friendSharing = saved.friendSharing === true && state.shareWith.length > 0;
    }
    // Legacy "sharing" never grants the new named-sharing permission.
    return state;
  }
  function persistent(state) {
    const shareWith = validAudience(state.shareWith, state);
    return { version: 4, sharing: state.sharing === true, friendSharing: state.friendSharing === true && shareWith.length > 0,
      shareWith, savedVenues: validVenueIds(state.savedVenues), relations: { ...state.relations } };
  }
  function validVenueIds(ids) { return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string' && venuesById.has(id)))] : []; }
  function validAudience(ids, state) { return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === 'string' && peopleById.has(id) && state.relations[id] === 'accepted'))] : []; }
  function toggleSaved(state, id) {
    if (!venueById(id)) return false;
    state.savedVenues = state.savedVenues.includes(id) ? state.savedVenues.filter(x => x !== id) : [...state.savedVenues, id];
    return true;
  }
  function toggleCompare(state, id) {
    if (!venueById(id)) return 'invalid';
    if (state.compareIds.includes(id)) { state.compareIds = state.compareIds.filter(x => x !== id); return 'removed'; }
    if (state.compareIds.length >= 3) return 'limit';
    state.compareIds.push(id); return 'added';
  }
  function makeSnapshot(now = Date.now()) {
    return { createdAt: now, ownSeenAt: null };
  }
  function isFresh(seenAt, now) { return Number.isFinite(seenAt) && seenAt <= now && now - seenAt < TTL; }
  function seenAtForAge(age, snapshot) { return age === null ? null : snapshot.createdAt - age * 60000; }
  function friendVisible(person, state, snapshot, now) {
    return state.relations[person.id] === 'accepted' && person.shares && !!person.venueId && isFresh(seenAtForAge(person.age, snapshot), now);
  }
  function friendsAt(venueId, state, snapshot, now) { return (namedAt.get(venueId) || []).filter(p => friendVisible(p, state, snapshot, now)); }
  function activity(venue, state, snapshot, now) {
    const venueSeenAt = seenAtForAge(venue.age, snapshot);
    const totalParticipants = participants.get(venue.id) || 0;
    const baseFresh = totalParticipants > 0 && isFresh(venueSeenAt, now);
    const ownFresh = state.sharing && venue.id === 'juniper' && isFresh(snapshot.ownSeenAt, now);
    const count = (baseFresh ? totalParticipants : 0) + (ownFresh ? 1 : 0);
    const latest = count ? Math.max(baseFresh ? venueSeenAt : 0, ownFresh ? snapshot.ownSeenAt : 0) : null;
    return { count, own: !!ownFresh, latest, hasData: count > 0, friends: friendsAt(venue.id, state, snapshot, now) };
  }
  function filteredVenues(state, snapshot, now) {
    const q = normalize(state.query);
    return VENUES.filter(v => (state.category === 'all' || v.category === state.category)
      && (!q || normalize(`${v.name} ${v.street} ${v.area} ${v.address} Nebraska ${v.category === 'cafe' ? 'café cafe coffee' : 'club nightclub dance'}`).includes(q))
      && (!state.friendsOnly || friendsAt(v.id, state, snapshot, now).length > 0)
      && (!state.savedOnly || state.savedVenues.includes(v.id)));
  }
  function timeLabel(timestamp, now) {
    if (!Number.isFinite(timestamp)) return 'No recent activity';
    const mins = Math.max(0, Math.floor((now - timestamp) / 60000));
    return mins === 0 ? 'Just now' : `${mins} min ago`;
  }
  function changeRelation(state, personId, action) {
    if (!personById(personId)) return false;
    const current = state.relations[personId];
    if (action === 'accept' && current === 'incoming') state.relations[personId] = 'accepted';
    else if (action === 'decline' && current === 'incoming') delete state.relations[personId];
    else if (action === 'request' && !current) state.relations[personId] = 'sent';
    else if (action === 'cancel' && current === 'sent') delete state.relations[personId];
    else if (action === 'remove' && current === 'accepted') delete state.relations[personId];
    else if (action === 'block' && current !== 'blocked') state.relations[personId] = 'blocked';
    else if (action === 'unblock' && current === 'blocked') delete state.relations[personId];
    else return false;
    state.shareWith = validAudience(state.shareWith, state);
    if (!state.shareWith.length) state.friendSharing = false;
    return true;
  }
  function setSharing(state, snapshot, enabled, now) {
    state.sharing = enabled === true;
    if (state.sharing) snapshot.ownSeenAt = now;
    else if (!state.friendSharing) snapshot.ownSeenAt = null;
  }
  function setFriendSharing(state, snapshot, enabled, now) {
    state.shareWith = validAudience(state.shareWith, state);
    state.friendSharing = enabled === true && state.shareWith.length > 0;
    if (state.friendSharing) snapshot.ownSeenAt = now;
    else if (!state.sharing) snapshot.ownSeenAt = null;
    return state.friendSharing;
  }
  function setAudience(state, ids) {
    state.shareWith = validAudience(ids, state);
    if (!state.shareWith.length) state.friendSharing = false;
  }
  function pauseAll(state, snapshot) { state.sharing = false; state.friendSharing = false; snapshot.ownSeenAt = null; }
  function ownVisibility(state, snapshot, now) {
    const fresh = isFresh(snapshot.ownSeenAt, now);
    return { countIncluded: fresh && state.sharing,
      visibleTo: fresh && state.friendSharing ? validAudience(state.shareWith, state) : [] };
  }
  // Authored sample history, deterministic for each fictional venue. This is not
  // telemetry, a predictor, or a sequence of observed arrivals/departures.
  function sampleHistory(id, snapshot, now) {
    const venue = venueById(id); if (!venue) return null;
    const count = participants.get(id) || 0;
    if (!count || venue.age === null) return null;
    const lastAt = seenAtForAge(venue.age, snapshot);
    const patterns = [[.48,.56,.69,.66,.8,.93,1],[1.45,1.37,1.23,1.27,1.15,1.06,1],[.97,1.05,.96,1.02,.99,1.04,1]];
    const seed = [...id].reduce((n,ch) => n + ch.charCodeAt(0), 0);
    const pattern = patterns[seed % patterns.length];
    const values = pattern.map((ratio, i) => ({ at: lastAt - (6-i)*5*60000, count: Math.max(1, Math.round(count * ratio)) }));
    const delta = values[6].count - values[0].count;
    return { values, lastAt, fresh: isFresh(lastAt, now), direction: Math.abs(delta) <= Math.max(2,count*.1) ? 'steady' : delta > 0 ? 'up' : 'down', isDemo: true };
  }
  function parsePlaceHash(hash) {
    const match = /^#place\/([^/?#]+)$/.exec(String(hash || ''));
    if (!match) return null;
    try { const id=decodeURIComponent(match[1]); return venueById(id) ? id : null; } catch (_) { return null; }
  }
  function publicPlaceUrl(id, href) {
    if (!venueById(id)) return null;
    try {
      const url = new URL(href);
      const host = url.hostname.toLowerCase();
      // Never copy file paths, localhost, credentials, query strings, or state.
      if (url.protocol !== 'https:' || url.username || url.password || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.test') || /^\d+\.\d+\.\d+\.\d+$/.test(host) || host.includes(':')) return null;
      url.search = ''; url.hash = 'place/' + encodeURIComponent(id); return url.href;
    } catch (_) { return null; }
  }
  function sharePayload(id, href) {
    const venue = venueById(id); if (!venue) return null;
    const url = publicPlaceUrl(id, href);
    const text = `${venue.name} · ${venue.area}, Nebraska.\nFictional place in the Spot prototype.\n${url ? 'Open this place in Spot.' : 'Open your copy of Spot and search for “' + venue.name + '”.'}`;
    return { title: `${venue.name} · Spot demo`, text, ...(url ? { url } : {}) };
  }
  function populationStats(state, snapshot, now) {
    const present = VENUES.reduce((n, v) => n + activity(v, state, snapshot, now).count, 0);
    return { total: POPULATION, present, notAtVenues: POPULATION - present,
      friends: PEOPLE.filter(p => state.relations[p.id] === 'accepted').length,
      friendsPresent: PEOPLE.filter(p => friendVisible(p, state, snapshot, now)).length,
      requests: PEOPLE.filter(p => state.relations[p.id] === 'incoming').length, venues: VENUES.length };
  }
  function project(lng, lat) {
    if (!Number.isFinite(lng) || !Number.isFinite(lat) || Math.abs(lat) >= 85) throw new TypeError('Invalid coordinate.');
    const s = 256 * 2 ** MAP.baseZoom;
    return { x: (lng + 180) / 360 * s - MAP.worldOrigin[0], y: (1 - Math.asinh(Math.tan(lat * Math.PI / 180)) / Math.PI) / 2 * s - MAP.worldOrigin[1] };
  }
  return { TTL, VENUES, PEOPLE, USERS, DEFAULT_RELATIONS, POPULATION, MAP, project, populationStats, normalize, venueById, personById, initialState, persistent, makeSnapshot, isFresh, friendVisible, friendsAt, activity, filteredVenues, timeLabel, changeRelation, setSharing, setFriendSharing, setAudience, pauseAll, ownVisibility, validVenueIds, validAudience, toggleSaved, toggleCompare, sampleHistory, parsePlaceHash, publicPlaceUrl, sharePayload };
});
