/* Haven-inspired semantic appearance, independent of demo sharing/friend state. */
(function(){'use strict';
 const key='spot.appearance.v1',media=matchMedia('(prefers-color-scheme: dark)');let mode=document.documentElement.dataset.appearance||'system';
 const icons={light:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.4 1.4M17.6 17.6 19 19M5 19l1.4-1.4M17.6 6.4 19 5"/>',dark:'<path d="M20.5 13A8.6 8.6 0 0 1 11 3.5 8.6 8.6 0 1 0 20.5 13Z"/>',system:'<rect x="3" y="4" width="18" height="13" rx="2"/><path d="M8 21h8m-4-4v4"/>'};
 const svg=n=>`<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]}</svg>`;
 const host=document.querySelector('#appearanceControl');
 host.innerHTML=`<button class="appearance-toggle" data-theme-toggle aria-label="Change appearance" aria-haspopup="menu" aria-expanded="false" aria-controls="appearanceMenu"></button><div id="appearanceMenu" class="appearance-menu" role="menu" aria-label="Appearance" hidden><p>A little change of light</p>${['light','dark','system'].map(m=>`<button role="menuitemradio" data-theme-choice="${m}" aria-checked="false" tabindex="-1">${svg(m)}<span>${m==='system'?'Use device setting':m==='dark'?'Dark':'Light'}</span><span class="theme-check" aria-hidden="true">✓</span></button>`).join('')}</div>`;
 const toggle=host.querySelector('[data-theme-toggle]'),menu=host.querySelector('#appearanceMenu');
 function apply(next,persist=false){if(!['light','dark','system'].includes(next))return;mode=next;const actual=mode==='system'?(media.matches?'dark':'light'):mode;
  document.documentElement.dataset.theme=actual;document.documentElement.dataset.appearance=mode;document.querySelector('meta[name="theme-color"]').content=actual==='dark'?'#141d18':'#fbfaf7';
  toggle.innerHTML=svg(actual);toggle.title='Appearance: '+mode;toggle.setAttribute('aria-label','Change appearance. Current setting: '+mode);
  host.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-checked',String(b.dataset.themeChoice===mode)));
  if(persist)try{localStorage.setItem(key,mode);}catch{}
  window.dispatchEvent(new Event('spot-theme-change'));
 }
 function close(focus=false){menu.hidden=true;toggle.setAttribute('aria-expanded','false');if(focus)toggle.focus({preventScroll:true});}
 toggle.addEventListener('click',()=>{menu.hidden=!menu.hidden;toggle.setAttribute('aria-expanded',String(!menu.hidden));if(!menu.hidden)menu.querySelector('[aria-checked="true"]').focus();});
 host.addEventListener('click',e=>{const b=e.target.closest('[data-theme-choice]');if(b){apply(b.dataset.themeChoice,true);close(true);}});
 document.addEventListener('click',e=>{if(!host.contains(e.target))close();});
 host.addEventListener('keydown',e=>{if(menu.hidden)return;const choices=[...menu.querySelectorAll('[data-theme-choice]')],i=choices.indexOf(document.activeElement);if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close(true);}else if(['ArrowDown','ArrowUp','Home','End'].includes(e.key)){e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowDown'?1:2))%3;choices[j].focus();}else if(e.key==='Tab')close();});
 media.addEventListener('change',()=>{if(mode==='system')apply(mode);});window.addEventListener('storage',e=>{if(e.key===key)apply(['light','dark','system'].includes(e.newValue)?e.newValue:'system');});
 window.SpotTheme={getMode:()=>mode,apply};apply(mode);
})();
