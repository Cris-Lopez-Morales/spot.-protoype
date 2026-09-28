"""Capture representative v4 screens through actual UI actions."""
from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,os
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
ART=ROOT/'artifacts'
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
 page.set_content(HTML);page.wait_for_function('window.SpotDemo')
 def theme(mode):
  page.locator('[data-theme-toggle]').click();page.locator(f'[data-theme-choice="{mode}"]').click()
 def shot(name):
  page.evaluate('document.querySelector("#toast").classList.remove("visible");const list=document.querySelector("#placesList");if(list)list.scrollTop=0;SpotDemo.flushMap()');page.wait_for_timeout(150);page.screenshot(path=str(ART/name),animations='disabled')
 for id in ['juniper','common','after']:
  page.locator(f'.place-row [data-save="{id}"]').click();page.locator(f'.place-row [data-compare="{id}"]').click()
 page.locator('[data-action="downtown"]').click();page.locator('[data-action="review-compare"]').click();theme('dark');shot('v4-desktop-compare-dark.png')
 theme('light');shot('v4-desktop-compare-light.png')
 page.locator('.compare-place-name[data-venue="juniper"]').click();page.locator('[data-action="clear-compare"]').click();theme('dark');shot('v4-desktop-detail-dark.png')
 page.locator('[data-action="saved-filter"]').click();shot('v4-desktop-saved-dark.png')
 page.locator('#desktopNavigation [data-screen="privacy"]').click();page.locator('[data-action="toggle-sharing"]').click();page.locator('[data-action="enable-sharing"]').click();shot('v4-privacy-count-only-dark.png')
 page.locator('[data-action="toggle-friend-sharing"]').click();page.locator('[data-audience="maya"]').check();page.locator('[data-audience="elliot"]').check();shot('v4-audience-dark.png');page.locator('[data-action="save-audience"]').click();shot('v4-privacy-selected-dark.png')
 # Mobile screenshots start from the ordinary defaults; saved places come from explicit taps.
 page.set_viewport_size({'width':390,'height':844});page.evaluate('SpotDemo.reset()');theme('light')
 page.locator('.map-top-tools [data-action="view-list"]').click();page.locator('[data-card="juniper"]').click();page.locator('.spot-toolbar [data-save="juniper"]').click();shot('v4-mobile-detail-light.png')
 page.locator('[data-action="expand-detail"]').click();shot('v4-mobile-history-light.png')
 page.locator('[data-action="share-place"]').click();shot('v4-mobile-share-light.png');page.locator('[data-action="close-modal"]').click()
 page.locator('.map-top-tools [data-action="view-list"]').click();page.locator('.place-row [data-compare="juniper"]').click();page.locator('.place-row [data-compare="common"]').click();page.locator('[data-action="review-compare"]').click();None
 # The list toggle stays independent; select map view behind the comparison without closing it.
 page.evaluate('document.querySelector(".explore-layout").classList.remove("list-mode");SpotDemo.flushMap()')
 shot('v4-mobile-compare-light.png');theme('dark');shot('v4-mobile-compare-dark.png')
 page.locator('#mobileNavigation [data-screen="privacy"]').click();shot('v4-mobile-privacy-dark.png')
 browser.close()
