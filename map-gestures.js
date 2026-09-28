/* Spot map interaction: a single contact can pan, never scale.
 * Pure gesture state is independently testable. The binding captures on the
 * stable viewport, not changing pins. CSS touch-action:none is map-only.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SpotMapGestures = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const copyCamera = c => ({ x: c.x, y: c.y, zoom: c.zoom });
  const midpoint = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

  function createSession({ getCamera, setCamera, getDimensions, minZoom = .025, maxZoom = 8, slop = 6 }) {
    const points = new Map();
    let origin = null, tap = null, moved = false, multi = false;
    const valid = p => Number.isFinite(p.x) && Number.isFinite(p.y);
    function rebase() {
      const pp = [...points.values()], camera = copyCamera(getCamera());
      if (pp.length === 1) origin = { mode: 'pan', point: { ...pp[0] }, camera };
      else if (pp.length === 2 && pp.every(p => p.type === 'touch')) {
        origin = { mode: 'pinch', camera, mid: midpoint(...pp), distance: Math.max(1, distance(...pp)), scaling: false };
      } else origin = null; // 3+ fingers: pause until back to one or two.
    }
    function reset() { points.clear(); origin = tap = null; moved = multi = false; }
    function begin(p) {
      if (!valid(p) || points.has(p.id)) return false;
      if (points.size && [...points.values()][0].type !== p.type) return false;
      if (!points.size) { moved = multi = false; tap = { id: p.id, target: p.target, type: p.type, x: p.x, y: p.y }; }
      points.set(p.id, { ...p });
      if (points.size > 1) { multi = true; tap = null; }
      rebase();
      return true;
    }
    function move(p) {
      if (!points.has(p.id) || !valid(p)) return false;
      const previous = points.get(p.id);
      // A repeated pointerup coordinate must not reapply an old camera.
      if (previous.x === p.x && previous.y === p.y) return false;
      points.set(p.id, { ...previous, x: p.x, y: p.y });
      if (tap && distance(tap, p) > slop) { moved = true; tap = null; }
      if (!origin) return false;
      const pp = [...points.values()], c = origin.camera;
      if (points.size === 1 && origin.mode === 'pan') {
        const dx = p.x - origin.point.x, dy = p.y - origin.point.y;
        if (!moved && Math.hypot(dx, dy) <= slop) return false;
        moved = true;
        setCamera({ x: c.x - dx / c.zoom, y: c.y - dy / c.zoom, zoom: c.zoom });
        return true;
      }
      if (points.size === 2 && origin.mode === 'pinch') {
        moved = true;
        const mid = midpoint(...pp), span = distance(...pp), d = getDimensions();
        if (Math.abs(span - origin.distance) >= 4) origin.scaling = true;
        const z = origin.scaling ? Math.max(minZoom, Math.min(maxZoom, c.zoom * span / origin.distance)) : c.zoom;
        // Keep the world point beneath the original midpoint beneath the new
        // midpoint. Zoom clamping must happen BEFORE this anchor calculation.
        const worldX = c.x + (origin.mid.x - d.centerX) / c.zoom;
        const worldY = c.y + (origin.mid.y - d.centerY) / c.zoom;
        setCamera({ x: worldX - (mid.x - d.centerX) / z, y: worldY - (mid.y - d.centerY) / z, zoom: z });
        return true;
      }
      return false;
    }
    function end(p, cancelled = false) {
      if (!points.has(p.id)) return { handled: false };
      if (!cancelled) move(p); // account for a final move delivered only on up
      const result = { handled: true, tap: !cancelled && !multi && !moved && tap?.id === p.id ? tap : null, dragged: moved || multi || cancelled };
      points.delete(p.id); tap = null;
      if (!points.size) reset();
      else { multi = true; rebase(); } // remaining finger starts a fresh pan
      return result;
    }
    return { begin, move, end, reset, has: id => points.has(id), ids: () => [...points.keys()],
      info: () => ({ count: points.size, mode: origin?.mode || 'idle', moved, multi }) };
  }

  function bind(viewport, { getCamera, setCamera, getDimensions, onTap, onWheel, onDoubleClick }) {
    const doc = viewport.ownerDocument, win = doc.defaultView, removers = [];
    let lastTouch = -Infinity, lastType = '', ignoreNativeClickUntil = 0, destroyed = false;
    const session = createSession({ getCamera, setCamera, getDimensions });
    const listen = (el, type, fn, options) => {
      el.addEventListener(type, fn, options); removers.push(() => el.removeEventListener(type, fn, options));
    };
    const local = e => { const r = viewport.getBoundingClientRect(); return { id: e.pointerId, type: e.pointerType || 'mouse', x: e.clientX - r.left, y: e.clientY - r.top, target: e.target.closest?.('[data-pin],[data-cluster]') || null }; };
    const release = id => { try { if (viewport.hasPointerCapture(id)) viewport.releasePointerCapture(id); } catch (_) {} };
    function reset() {
      const ids = session.ids(); session.reset();
      if (ids.length) ignoreNativeClickUntil = Date.now() + 750;
      ids.forEach(release); viewport.classList.remove('dragging');
    }
    listen(viewport, 'pointerdown', e => {
      if (e.pointerType !== 'touch' && e.button !== 0) return;
      // A new primary touch cannot be the second finger of an old gesture.
      // Clear stale state after a browser/OS interruption even if its end was lost.
      if (e.pointerType === 'touch' && e.isPrimary && session.info().count) reset();
      if (!session.begin(local(e))) return;
      lastType = e.pointerType || 'mouse';
      if (lastType === 'touch') lastTouch = Date.now();
      // Stable capture for markers too: clustering may replace their DOM nodes.
      try { viewport.setPointerCapture(e.pointerId); } catch (_) {}
      if (e.cancelable) e.preventDefault();
    });
    listen(viewport, 'pointermove', e => {
      if (!session.has(e.pointerId)) return;
      if (e.pointerType === 'mouse' && e.buttons === 0) { reset(); return; }
      if (session.move(local(e))) viewport.classList.add('dragging');
      if (e.cancelable) e.preventDefault();
    });
    function end(e) {
      const result = session.end(local(e), e.type !== 'pointerup');
      if (!result.handled) return;
      if (e.pointerType === 'touch') lastTouch = Date.now();
      ignoreNativeClickUntil = Date.now() + 750;
      release(e.pointerId);
      if (!session.info().count) viewport.classList.remove('dragging');
      if (result.tap?.target?.isConnected) onTap(result.tap.target, result.tap.type);
    }
    // Capture-phase document listeners still clean up when a pointer finishes
    // over a card or outside the map; unrelated pointer IDs are ignored.
    listen(doc, 'pointerup', end, true);
    listen(doc, 'pointercancel', end, true);
    listen(viewport, 'lostpointercapture', e => { if (e.target === viewport) end(e); });
    listen(viewport, 'click', e => {
      // Low-level pointer handling activates each pin once. Block compatibility
      // clicks from reactivating it after dragging, while keeping keyboard and
      // assistive clicks (detail 0) and deliberate programmatic taps available.
      if (e.detail > 0 && Date.now() < ignoreNativeClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
    }, true);
    listen(viewport, 'dblclick', e => {
      e.preventDefault();
      if (lastType !== 'mouse' || Date.now() - lastTouch < 900 || e.sourceCapabilities?.firesTouchEvents) return;
      if (!e.target.closest('button')) onDoubleClick?.(e);
    });
    listen(viewport, 'wheel', e => {
      e.preventDefault();
      if (session.info().count || Date.now() - lastTouch < 750) return;
      onWheel?.(e);
    }, { passive: false });
    listen(viewport, 'contextmenu', e => { if (lastType === 'touch' && Date.now() - lastTouch < 1200) e.preventDefault(); });
    // Safari's native gesture stream must not also scale the page underneath
    // Pointer Events. Do not cancel browser zoom anywhere outside the map.
    ['gesturestart', 'gesturechange', 'gestureend'].forEach(t => listen(viewport, t, e => { if (e.cancelable) e.preventDefault(); }, { passive: false }));
    listen(win, 'blur', reset); listen(win, 'pagehide', reset); listen(win, 'resize', reset);
    listen(doc, 'visibilitychange', () => { if (doc.hidden) reset(); });
    return { info: session.info, reset, destroy() { if (destroyed) return; destroyed = true; reset(); removers.splice(0).forEach(fn => fn()); } };
  }
  return { createSession, bind };
});
