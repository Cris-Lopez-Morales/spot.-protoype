/* Pure category header. No venue-name fragment, occupancy claim, or remote asset. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SpotVenueCover = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const coffee = '<path d="M27 40h39v17c0 12-8 21-20 21S27 69 27 57V40Z" class="cover-cup-fill"/><path d="M66 43h5a11 11 0 0 1 0 22h-7M25 81h47"/><path d="M38 30c-6-8 6-9 0-17M51 30c-6-8 6-9 0-17" class="cover-steam"/>';
  const glass = '<path d="M26 34h49L51 61 26 34Z" class="cover-glass-fill"/><path d="m30 40 21 23 21-23M51 63v19M38 83h27M62 34l9-18"/><path d="M65 18a12 12 0 0 1 17 16" class="cover-steam"/>';
  function render(venue) {
    const cafe = venue?.category === 'cafe';
    const category = cafe ? 'cafe' : 'club';
    const label = cafe ? 'Café' : 'Bar / club';
    return `<header class="detail-cover venue-cover venue-cover--${category}" data-cover-category="${category}"><div class="venue-cover-copy"><span class="venue-cover-eyebrow">PLACE OVERVIEW</span><span class="venue-cover-type">${label}</span></div><div class="venue-cover-art" aria-hidden="true"><svg viewBox="0 0 104 104" fill="none" focusable="false"><circle cx="52" cy="52" r="47" class="cover-disc"/><circle cx="52" cy="52" r="39" class="cover-orbit"/><g stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${cafe ? coffee : glass}</g><circle cx="88" cy="23" r="4" class="cover-dot"/></svg></div><button class="icon-button venue-cover-close" data-action="close-detail" aria-label="Close place details"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18"/></svg></button></header>`;
  }
  return Object.freeze({ render });
});
