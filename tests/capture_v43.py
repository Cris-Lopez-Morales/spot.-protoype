from pathlib import Path
from playwright.sync_api import sync_playwright
import shutil,json
R=Path(__file__).resolve().parents[1];html=(R/'dist/spot-prototype.html').read_text()
with sync_playwright() as p:
 b=p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 for mobile in (False,True):
  for theme in ('light','dark'):
   c=b.new_context(viewport={'width':390 if mobile else 1440,'height':844 if mobile else 960},is_mobile=mobile,has_touch=mobile,device_scale_factor=1)
   page=c.new_page();errors=[];page.on('pageerror',lambda e: errors.append(str(e)))
   page.set_content(html);page.wait_for_function('window.SpotDemo');page.evaluate(f"SpotTheme.apply('{theme}');SpotDemo.flushMap()")
   page.locator('#venueSearch').fill('East Campus');page.wait_for_timeout(280);page.evaluate('SpotDemo.flushMap()')
   page.screenshot(path=str(R/'artifacts'/f'v4.3-{ "mobile" if mobile else "desktop"}-east-{theme}.png'))
   print(mobile,theme,page.evaluate('({area:SpotDemo.getSearchArea()?.name,nearby:SpotDemo.getNearbyIds().length,camera:SpotDemo.getCamera(),overflow:document.documentElement.scrollWidth>innerWidth})'),errors)
   page.locator('#venueSearch').fill('east');page.wait_for_timeout(40)
   page.screenshot(path=str(R/'artifacts'/f'v4.3-{ "mobile" if mobile else "desktop"}-search-{theme}.png'))
   c.close()
 b.close()
