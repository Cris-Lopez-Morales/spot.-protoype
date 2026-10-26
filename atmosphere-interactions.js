/* Atmosphere destination motion. Visual-only: no application state or storage access. */
(() => {
  'use strict';
  if (window.AtmosphereInteractions) return;
  const doc = document;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const ownSelector = '.sp-profile-nav,[data-profile-open="you"]';
  const triggerSelector = '.nav-item[data-screen],#privacyStatus,' + ownSelector;
  const kinds = new Set(['explore', 'friends', 'privacy', 'profile']);
  const live = new Set(), frames = new Set(), observers = [];
  const ariaOriginals = new Map();
  const totals = { explore: 0, friends: 0, privacy: 0, profile: 0, destinations: 0, cancelled: 0 };
  let reduced = media.matches, dead = false, ready = false;
  let destination = '', ownOpen = false, profilePresent = false, pending = null;
  const ease = 'cubic-bezier(.22,.65,.3,1)';

  function stop(record, cancelled = false) {
    if (!live.delete(record)) return;
    if (cancelled) totals.cancelled++;
    record.animations.forEach(a => { try { a.cancel(); } catch (_) {} });
    record.cleanups.reverse().forEach(fn => fn());
  }
  function cancelAll() {
    frames.forEach(id => cancelAnimationFrame(id)); frames.clear();
    Array.from(live).forEach(r => stop(r, true));
  }
  function later(fn) {
    const id = requestAnimationFrame(() => { frames.delete(id); if (!dead && !reduced) fn(); });
    frames.add(id);
  }
  function recordFor(root) {
    // A repeated preview/activation replaces only this module's own effects.
    Array.from(live).filter(r => r.root === root).forEach(r => stop(r, true));
    const r = { root, animations: [], cleanups: [] }; live.add(r); return r;
  }
  function animate(r, node, keys, duration = 420, delay = 0) {
    if (!node || typeof node.animate !== 'function') return;
    const added = !node.classList.contains('at-nav-motion');
    if (added) { node.classList.add('at-nav-motion'); r.cleanups.push(() => node.classList.remove('at-nav-motion')); }
    try { r.animations.push(node.animate(keys, { duration, delay, easing: ease, fill: 'none', iterations: 1 })); } catch (_) {}
  }
  function seal(r) {
    if (!r.animations.length) { stop(r); return false; }
    Promise.all(r.animations.map(a => a.finished)).then(() => stop(r), () => stop(r));
    return true;
  }
  function draw(r, node, duration = 400, delay = 0) {
    let length = 0; try { length = node.getTotalLength(); } catch (_) {}
    if (!(length > 0)) return;
    animate(r, node, [
      { strokeDasharray: length + ' ' + length, strokeDashoffset: length },
      { strokeDasharray: length + ' ' + length, strokeDashoffset: 0 }
    ], duration, delay);
  }
  function move(r, node, from, duration = 420, delay = 0) {
    animate(r, node, [{ transform: from, transformOrigin: '12px 12px' },
      { transform: 'none', transformOrigin: '12px 12px' }], duration, delay);
  }
  function splitPeople(r, path) {
    const d = path.getAttribute('d') || '';
    const at = d.indexOf('M22');
    if (at < 0) return [path, null];
    const rear = path.cloneNode(false);
    rear.setAttribute('d', d.slice(at)); path.setAttribute('d', d.slice(0, at));
    path.after(rear);
    r.cleanups.push(() => { path.setAttribute('d', d); rear.remove(); });
    return [path, rear];
  }
  function preview(kind, svg) {
    if (dead || reduced || !kinds.has(kind) || !svg || svg.localName !== 'svg' || typeof svg.querySelector !== 'function') return false;
    const r = recordFor(svg);
    const paths = Array.from(svg.querySelectorAll(':scope > path'));
    const circles = Array.from(svg.querySelectorAll(':scope > circle'));
    if (kind === 'explore') {
      // The housing stays fixed; the needle finds north through a bounded 49-degree sweep.
      if (paths[0]) animate(r, paths[0], [
        { transform: 'rotate(-35deg)', transformOrigin: '12px 12px', offset: 0 },
        { transform: 'rotate(14deg)', transformOrigin: '12px 12px', offset: .58 },
        { transform: 'rotate(0deg)', transformOrigin: '12px 12px', offset: 1 }
      ], 460);
    } else if (kind === 'friends') {
      // Split the existing two-body path, not an unrelated decorative symbol.
      if (paths[0]) {
        const [front, rear] = splitPeople(r, paths[0]);
        move(r, front, 'translateX(-2px)', 420);
        move(r, circles[0], 'translateX(-2px)', 420);
        move(r, rear, 'translateX(2.5px)', 460);
        move(r, paths[1], 'translateX(2.5px)', 460);
      }
    } else if (kind === 'privacy') {
      // Outline closes first, followed by its actual checkmark sealing the promise.
      if (paths.length > 1) { draw(r, paths[0], 360); draw(r, paths[1], 320, 120); }
    } else if (kind === 'profile') {
      // Person, never account initials or avatar art: the head settles as its outline resolves.
      move(r, circles[0], 'translateY(-1.6px)', 360);
      if (paths[0]) draw(r, paths[0], 380, 60);
    }
    const accepted = seal(r); if (accepted) totals[kind]++; return accepted;
  }
  function screen() {
    const active = doc.querySelector('.nav-item[data-screen].active,.nav-item[data-screen][aria-current="page"]');
    if (active && kinds.has(active.dataset.screen)) return active.dataset.screen;
    if (doc.querySelector('#main > .friends-page')) return 'friends';
    if (doc.querySelector('#main > .privacy-page')) return 'privacy';
    return 'explore';
  }
  function ownDialog() { return doc.querySelector('#spotProfileHost > .sp-backdrop > .sp-dialog[data-profile-id="you"]'); }
  function updateAria() {
    ownOpen = !!ownDialog();
    doc.querySelectorAll(ownSelector).forEach(el => {
      if (!ariaOriginals.has(el)) ariaOriginals.set(el, ['aria-expanded','aria-haspopup'].map(a => el.getAttribute(a)));
      el.setAttribute('aria-haspopup', 'dialog'); el.setAttribute('aria-expanded', String(ownOpen));
    });
    // Do not retain detached route nodes indefinitely.
    for (const el of ariaOriginals.keys()) if (!el.isConnected) ariaOriginals.delete(el);
  }
  function enterSurface(root, profile = false) {
    if (!root || reduced || dead) return;
    const heading = root.querySelector(profile ? '#spTitle' : '.page-heading h1');
    const cover = profile ? root.querySelector('.sp-cover') : null;
    // Only noninteractive text/cover art moves; never a dialog, button, card or map.
    [heading, cover].filter(Boolean).forEach((el, i) => {
      if (el.matches('button,a,[role="button"]') || el.querySelector('button,a,input,[role="button"]') || el.closest('button,a,[role="button"]')) return;
      const r = recordFor(el);
      animate(r, el, [{ transform: i ? 'translateY(3px)' : 'translateY(5px)', opacity: .78 }, { transform: 'none', opacity: 1 }], i ? 460 : 400);
      seal(r);
    });
  }
  function activate(kind, source) {
    if (kind === 'profile') {
      if (!ownOpen) return;
      // Profile triggers containing avatar artwork use the actual nav person glyph instead.
      const candidates = doc.querySelectorAll('.sp-profile-nav svg');
      if (source?.matches('.sp-profile-nav') && source.isConnected) preview(kind, source.querySelector('svg'));
      else candidates.forEach(svg => preview(kind, svg));
      return;
    }
    if (screen() !== kind) return;
    // Preserve the not-sharing eye-off glyph: never morph it into a sharing shield.
    // When a real shield exists in the header, seal that exact geometry too.
    if (kind === 'privacy' && source?.id === 'privacyStatus' && source.isConnected) {
      const svg = source.querySelector('svg');
      if (/^M12 22/.test(svg?.querySelector('path')?.getAttribute('d') || '')) preview(kind, svg);
    }
    const selector = '.nav-item[data-screen="' + kind + '"] svg';
    if (source?.matches('.nav-item') && source.isConnected) preview(kind, source.querySelector('svg'));
    else doc.querySelectorAll(selector).forEach(svg => preview(kind, svg));
  }
  function reconcile(initial = false) {
    if (dead) return;
    const next = screen(), previousOwn = ownOpen;
    const present = !!doc.querySelector('#spotProfileHost > .sp-backdrop > .sp-dialog');
    updateAria();
    const routeChanged = next !== destination;
    const profileChanged = previousOwn !== ownOpen || present !== profilePresent;
    if (!initial && (routeChanged || profileChanged)) {
      cancelAll();
      if (routeChanged) { totals.destinations++; enterSurface(doc.querySelector('#main')); }
      if (ownOpen && !previousOwn) { totals.destinations++; enterSurface(ownDialog(), true); }
    }
    destination = next; profilePresent = present;
    if (pending) {
      const p = pending; pending = null;
      if (!reduced) later(() => activate(p.kind, p.source));
    }
  }
  function traceSubtab(event) {
    const selector='.friend-tab,.map-view-tabs button,.filter-chip[data-category]';
    const source=event.target?.closest?.(selector);
    if(!source||!source.matches(selector))return false;
    if(reduced||source.classList.contains('active')||source.getAttribute('aria-pressed')==='true')return true;
    const attribute=source.hasAttribute('data-friend-tab')?'data-friend-tab':source.hasAttribute('data-category')?'data-category':'data-action';
    const value=source.getAttribute(attribute);
    queueMicrotask(()=>later(()=>{
      const target=Array.from(doc.querySelectorAll(selector)).find(n=>n.getAttribute(attribute)===value&&n.getClientRects().length);
      if(!target)return;
      const ink=doc.createElement('span');ink.className='at-tab-ink';ink.setAttribute('aria-hidden','true');target.append(ink);
      const r=recordFor(ink);r.cleanups.push(()=>ink.remove());
      animate(r,ink,[{transform:'scaleX(.15)',opacity:.8},{transform:'scaleX(1)',opacity:0}],320);seal(r);
    }));return true;
  }
  function capture(event) {
    if (dead || (event.type === 'click' && (event.button > 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey))) return;
    if (event.type === 'keydown' && !['Enter',' '].includes(event.key)) return;
    if(event.type==='click'&&traceSubtab(event))return;
    const source = event.target?.closest?.(triggerSelector);
    if (!source || source.matches(':disabled,[aria-disabled="true"]')) return;
    // Native buttons/anchors synthesize click; only custom own-profile triggers need key capture.
    if (event.type === 'keydown' && source.matches('button,a')) return;
    const kind = source.matches(ownSelector) ? 'profile' : source.id === 'privacyStatus' ? 'privacy' : source.dataset.screen;
    if (!kinds.has(kind)) return;
    const isSame = kind === 'profile' ? !!ownDialog() : screen() === kind;
    if (isSame) return;
    pending = { kind, source };
    // Capture is installed immediately, before the profile handler stops propagation.
    // Read the accepted DOM only after that handler and the route renderer finish.
    queueMicrotask(() => { if (!dead) reconcile(); });
  }
  function onReduced(event) {
    reduced = event.matches; pending = null; cancelAll();
  }
  function init() {
    if (dead || ready) return; ready = true;
    reconcile(true);
    ['#main', '#spotProfileHost', '#desktopNavigation', '#mobileNavigation'].forEach(selector => {
      const root = doc.querySelector(selector); if (!root) return;
      const observer = new MutationObserver(() => reconcile());
      observer.observe(root, { childList: true }); observers.push(observer);
    });
  }
  function destroy() {
    if (dead) return; dead = true; pending = null; cancelAll();
    observers.forEach(o => o.disconnect()); observers.length = 0;
    doc.removeEventListener('click', capture, true); doc.removeEventListener('keydown', capture, true);
    doc.removeEventListener('DOMContentLoaded', init);
    if (media.removeEventListener) media.removeEventListener('change', onReduced); else media.removeListener(onReduced);
    ariaOriginals.forEach((values, el) => ['aria-expanded','aria-haspopup'].forEach((a, i) => values[i] === null ? el.removeAttribute(a) : el.setAttribute(a, values[i])));
    ariaOriginals.clear();
  }
  doc.addEventListener('click', capture, true); doc.addEventListener('keydown', capture, true);
  if (media.addEventListener) media.addEventListener('change', onReduced); else media.addListener(onReduced);
  window.AtmosphereInteractions = Object.freeze({
    getStats: () => Object.freeze({ ...totals, active: live.size, pending: frames.size, reducedMotion: reduced, destroyed: dead }),
    destroy, preview
  });
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', init, { once: true }); else init();
})();
