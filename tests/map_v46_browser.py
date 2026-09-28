"""Exercise real map DOM/canvas and touch dispatch in an offline harness.
No browser network/model access: assistant inference/storage use the existing
integration fixture. Does not certify physical devices or live inference.
"""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright
from integration_harness import parent_html,parent_script
ROOT=Path(__file__).resolve().parents[1]
async def main():
 checks=[];errors=[];metrics={}
 async with async_playwright() as p:
  browser=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  async def check(name,value):
   if not value:raise AssertionError(name)
   checks.append(name);print("PASS",name,flush=True)
  async def boot(page):
   page.set_default_timeout(6000)
   page.on('pageerror',lambda e:errors.append(str(e)))
   await page.set_content(parent_html());await page.add_script_tag(content=parent_script());await page.wait_for_function('!!window.SpotDemo');await page.wait_for_timeout(100)
  page=await browser.new_page(viewport={'width':1440,'height':960})
  await boot(page)
  await check('region includes all 32 venue IDs without duplicate markers',await page.evaluate("(()=>{const ids=[...document.querySelectorAll('[data-members]')].flatMap(e=>e.dataset.members.split(','));return ids.length===32&&new Set(ids).size===32})()"))
  await check('all regional markers sum to 610 participating demo accounts',await page.evaluate("[...document.querySelectorAll('[data-count][data-members]')].reduce((n,e)=>n+Number(e.dataset.count),0)===610"))
  await check('map no longer displays naked number-only markers',await page.locator('.activity-marker').evaluate_all("xs=>xs.length>0&&xs.every(x=>x.querySelector('.activity-marker-title')&&/app users?|No recent data/.test(x.innerText))"))
  await check('every marker is a labeled keyboard-accessible button',await page.locator('.activity-marker').evaluate_all("xs=>xs.every(x=>x.tagName==='BUTTON'&&x.getAttribute('aria-label').includes('Not total occupancy'))"))
  await check('new fixture count is reflected in the UI', '32 places' in await page.locator('#placeCount').inner_text() and await page.locator('#presentCount').inner_text()=='610')
  await page.click('[data-action="city"]');await page.wait_for_timeout(150)
  await page.screenshot(path=ROOT/'artifacts/spot-v46-desktop-light.png')
  await check('city view contains readable category icons',await page.locator('.activity-marker-symbol').count()>0)
  await page.click('[data-action="downtown"]');await page.wait_for_timeout(150)
  await check('downtown still exposes fictional venues',await page.locator('.activity-marker').count()>0)
  await check('desktop page has no horizontal overflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
  await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(100)
  overlap_count=await page.evaluate("""()=>{let overlaps=0;const v=SpotCore.venueById('juniper');for(const z of [.5,.7,.85,1,1.4,2]){SpotDemo.setCamera({x:v.x,y:v.y,zoom:z});SpotDemo.flushMap();const vr=document.querySelector('#mapViewport').getBoundingClientRect();const boxes=[...document.querySelectorAll('.activity-marker')].map(e=>e.getBoundingClientRect()).filter(r=>r.x>=0&&r.right<=innerWidth&&r.y>vr.y+60&&r.bottom<vr.bottom-170);for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];if(a.x<b.right&&a.right>b.x&&a.y<b.bottom&&a.bottom>b.y)overlaps++;}}return overlaps}""")
  await check('readable cards do not overlap across tested mobile downtown zooms',overlap_count==0)
  for width,height in [(320,740),(360,800),(390,844),(430,932)]:
   await page.set_viewport_size({'width':width,'height':height});await page.wait_for_timeout(100)
   await page.locator('#venueSearch').fill('East Campus');await page.wait_for_timeout(150)
   await check(f'{width}px: area search still targets East Campus',await page.evaluate("SpotDemo.getSearchArea()?.name==='East Campus'"))
   await check(f'{width}px: no horizontal page overflow',await page.evaluate('document.documentElement.scrollWidth<=innerWidth'))
   await check(f'{width}px: markers retain 52px touch surfaces',await page.locator('.activity-marker').evaluate_all('xs=>xs.every(x=>x.offsetHeight>=52&&x.offsetWidth>=144)'))
   await check(f'{width}px: counts fit inside their labels',await page.locator('.activity-marker-count').evaluate_all('xs=>xs.every(x=>x.scrollWidth<=x.clientWidth+1)'))
   await check(f'{width}px: campus buildings are drawn on the canvas',await page.evaluate('SpotDemo.getRenderStats().cartography.buildings>0'))
   await page.locator('#venueSearch').fill('');await page.wait_for_timeout(50)
  await page.set_viewport_size({'width':390,'height':844});await page.wait_for_timeout(100)
  await page.locator('#venueSearch').fill('East Campus');await page.wait_for_timeout(150)
  await page.click('[data-theme-toggle]');await page.click('[data-theme-choice="dark"]');await page.wait_for_timeout(150)
  await check('dark mode still applies to the map',await page.locator('html').get_attribute('data-theme')=='dark')
  await page.screenshot(path=ROOT/'artifacts/spot-v46-mobile-dark.png')
  # The activity display must never turn expiry into a quiet/full assertion.
  await page.evaluate('SpotDemo.advanceTime(15*60*1000)');await page.wait_for_timeout(100)
  await check('expired observations read No recent data',await page.locator('.activity-marker').evaluate_all("xs=>xs.every(x=>x.innerText.includes('No recent data'))"))
  await check('expiry also clears public source counts',await page.evaluate("SpotAssistantContext.snapshot(SpotCore,SpotDemo,SpotPlaceSearch).venues.every(v=>v.count===null)"))
  await page.close()
  # Trusted Chromium touch events on a mobile-emulated page (not a real phone).
  context=await browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
  mobile=await context.new_page();await boot(mobile);cdp=await context.new_cdp_session(mobile)
  async def touch(kind,points):
   await cdp.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[{'x':x,'y':y,'id':i,'radiusX':3,'radiusY':3,'force':1} for i,x,y in points]})
  await mobile.evaluate("(()=>{const v=SpotCore.venueById('juniper');SpotDemo.setCamera({x:v.x,y:v.y,zoom:1.4})})()");await mobile.wait_for_timeout(100)
  before=await mobile.evaluate('SpotDemo.getCamera()');await touch('touchStart',[(1,195,365)]);await touch('touchMove',[(1,255,405)]);await touch('touchEnd',[]);await mobile.wait_for_timeout(100)
  after=await mobile.evaluate('SpotDemo.getCamera()')
  await check('one finger pans without changing zoom',before['zoom']==after['zoom'] and (before['x']!=after['x'] or before['y']!=after['y']))
  await check('single-finger pan does not open a place',await mobile.evaluate('SpotDemo.getSelectedVenueId()===null'))
  before=await mobile.evaluate('SpotDemo.getCamera()');await touch('touchStart',[(1,140,375),(2,240,375)]);await touch('touchMove',[(1,115,375),(2,265,375)]);await mobile.wait_for_timeout(70)
  after=await mobile.evaluate('SpotDemo.getCamera()');await check('two-finger pinch outward zooms in',after['zoom']>before['zoom'])
  await touch('touchMove',[(1,155,375),(2,225,375)]);await mobile.wait_for_timeout(70);smaller=await mobile.evaluate('SpotDemo.getCamera()');await check('two-finger pinch inward zooms out',smaller['zoom']<after['zoom']);await touch('touchEnd',[])
  await mobile.click('[data-action="region"]');await mobile.wait_for_timeout(150)
  # Choose a group actually hit-testable, not covered by map controls/cards.
  key=await mobile.evaluate("(()=>{for(const n of document.querySelectorAll('[data-cluster]')){const r=n.getBoundingClientRect();if(document.elementFromPoint(r.x+r.width/2,r.y+r.height/2)?.closest('[data-cluster]')===n)return n.dataset.cluster}return null})()")
  await check('at least one regional group is reachable by touch',bool(key))
  before=await mobile.evaluate('SpotDemo.getCamera()');await mobile.locator(f'[data-cluster="{key}"]').tap();await mobile.wait_for_timeout(120);after=await mobile.evaluate('SpotDemo.getCamera()')
  await check('tapping a group jumps inward, not a pinch instruction',after['zoom']>before['zoom'])
  await mobile.evaluate("(()=>{const v=SpotCore.venueById('juniper');SpotDemo.setCamera({x:v.x,y:v.y,zoom:2})})()");await mobile.wait_for_timeout(100)
  rect=await mobile.locator('[data-pin="juniper"]').bounding_box();x=rect['x']+rect['width']/2;y=rect['y']+rect['height']/2
  before=await mobile.evaluate('SpotDemo.getCamera()');await touch('touchStart',[(1,x,y)]);await touch('touchMove',[(1,x+50,y+30)]);await touch('touchEnd',[]);await mobile.wait_for_timeout(100)
  await check('dragging from a label pans without opening it',await mobile.evaluate('SpotDemo.getSelectedVenueId()===null'))
  await check('dragging from a label never zooms',before['zoom']==(await mobile.evaluate('SpotDemo.getCamera()'))['zoom'])
  await mobile.evaluate("(()=>{const v=SpotCore.venueById('juniper');SpotDemo.setCamera({x:v.x,y:v.y,zoom:2})})()");await mobile.wait_for_timeout(70)
  await mobile.locator('[data-pin="juniper"]').tap();await mobile.wait_for_timeout(100)
  await check('tapping a venue opens its actual detail card',await mobile.locator('#detailTitle').inner_text()=='Juniper Coffee')
  await mobile.locator('#venueSearch').fill('East Campus');await mobile.wait_for_timeout(120)
  await check('search still works without closing place details',await mobile.evaluate("SpotDemo.getSearchArea()?.name==='East Campus'"))
  before=await mobile.evaluate('SpotDemo.getRenderStats().clusterBuilds')
  await mobile.evaluate("(()=>{let c=SpotDemo.getCamera();for(let i=0;i<20;i++){SpotDemo.setCamera({x:c.x+i*2});SpotDemo.flushMap()}})()")
  after=await mobile.evaluate('SpotDemo.getRenderStats().clusterBuilds');await check('repeated same-scale pan reuses clusters',before==after)
  metrics=await mobile.evaluate('SpotDemo.getRenderStats()')
  await check('no uncaught UI script errors',not errors)
  await browser.close()
 report={'passed':len(checks),'failed':0,'checks':checks,'errors':errors,'renderSample':metrics,'method':'Offline srcdoc harness, actual map DOM/canvas and Chromium touch dispatch, mobile emulation. AI model, storage and network are test doubles; not physical-device/live-inference verification.'}
 (ROOT/'artifacts/map-v46-browser.json').write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
asyncio.run(main())
