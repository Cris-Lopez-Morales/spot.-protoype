"""Smoke test the actual standalone HTML; no model/storage/network test doubles."""
import asyncio,json,os
from pathlib import Path
from playwright.async_api import async_playwright
ROOT=Path(__file__).resolve().parents[1]
async def main():
 checks=[];errors=[];requests=[]
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path=os.environ.get('CHROMIUM_PATH','/usr/bin/chromium'),headless=True,args=['--no-sandbox'])
  page=await browser.new_page(viewport={'width':390,'height':844})
  page.on('pageerror',lambda e:errors.append(str(e)))
  page.on('request',lambda req:requests.append(req.url))
  await page.set_content((ROOT/'preview/spot-v4.6-map-preview.html').read_text(),wait_until='load')
  await page.wait_for_function('!!window.SpotDemo')
  async def check(name,result):
   if not result:raise AssertionError(name)
   checks.append(name)
  await check('standalone uses the updated 32-venue fixture',await page.evaluate('SpotDemo.getStats().venues===32'))
  await check('standalone displays real activity-card components',await page.locator('.activity-marker-count').count()>0)
  await page.locator('#venueSearch').fill('East Campus');await page.wait_for_timeout(150)
  await check('standalone search moves to East Campus',await page.evaluate("SpotDemo.getSearchArea().name==='East Campus'"))
  await page.click('#askSpot')
  await check('Ask explains full-project setup, never pretends inference',await page.locator('#spotAssistantBody').inner_text()!= '' and 'no model' in (await page.locator('#spotAssistantBody').inner_text()).lower())
  await page.click('#closeSpotAssistant')
  await check('map remains available after preview explanation closes',await page.locator('#spotAssistantPanel').is_hidden())
  await check('no external requests made by standalone HTML',len(requests)==0)
  await check('no uncaught JavaScript errors',len(errors)==0)
  await browser.close()
 report={'passed':len(checks),'failed':0,'checks':checks,'errors':errors,'requests':requests,'method':'Actual self-contained HTML in Chromium set_content. No storage/model doubles, no network navigation; file-origin persistence not tested.'}
 (ROOT/'artifacts/standalone-preview-smoke.json').write_text(json.dumps(report,indent=2)+'\n')
 print(json.dumps(report,indent=2))
asyncio.run(main())
