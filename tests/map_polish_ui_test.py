"""Map-only v4.2 visual behavior checks; headless Chromium, not physical phones."""
import json,os,shutil,unittest,hashlib
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
BASE=(ROOT/'rollback/spot-lincoln-v4.1.html').read_text()
class MapPolishUI(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1)
  self.page=self.context.new_page();self.errors=[];self.requests=[];self.page.set_default_timeout(2500)
  self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.page.on('request',lambda r:self.requests.append(r.url));self.load()
 def tearDown(self):
  try:self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])
  finally:self.context.close()
 def load(self,html=HTML):
  self.page.set_content(html);self.page.wait_for_function('window.SpotDemo');self.page.evaluate('SpotDemo.flushMap()')
 def extent(self,name):self.page.locator(f'[data-action="{name}"]').tap();self.page.evaluate('SpotDemo.flushMap()');self.page.wait_for_timeout(30)
 def test_01_rollback_snapshot_is_byte_identical(self):
  self.assertEqual(hashlib.sha256((ROOT/'rollback/spot-lincoln-v4.1.html').read_bytes()).hexdigest(),'a585f0caad4ab5fcb2822ff28719b48e7d1ef0f47f977a1fbcf5fbfa4312ff5a')
  self.assertEqual(self.page.evaluate('SpotDemo.getMapStyle()'),'quiet-v4.2')
 def test_02_entire_region_count_is_conserved(self):
  out=self.page.evaluate('''()=>{const pins=[...document.querySelectorAll('[data-members]')],ids=pins.flatMap(p=>p.dataset.members.split(','));return{n:ids.length,unique:new Set(ids).size,count:pins.reduce((n,p)=>n+Number(p.dataset.count),0)}}''')
  self.assertEqual(out,{'n':336,'unique':336,'count':3500})
 def test_03_smaller_downtown_marker_footprint_than_v41(self):
  self.extent('downtown')
  def footprint():return self.page.locator('[data-members]').evaluate_all('(ns)=>ns.reduce((n,e)=>{const b=e.querySelector(".pin-bubble,.cluster-body")||e,r=b.getBoundingClientRect();return n+r.width*r.height},0)')
  after=footprint();self.load(BASE);self.extent('downtown');before=footprint();self.assertLess(after,before*.9)
 def test_04_selected_name_is_visible_at_mobile_downtown(self):
  self.extent('downtown');self.assertTrue(self.page.locator('[data-pin="juniper"] .pin-label').is_visible())
  self.assertEqual(self.page.locator('[data-pin="juniper"] .pin-label').inner_text(),'Juniper Coffee')
 def test_05_progressive_names_reveal_at_close_zoom(self):
  self.extent('downtown');self.page.evaluate('SpotDemo.setCamera({zoom:1.4});SpotDemo.flushMap()')
  before=self.page.locator('.venue-pin.label-visible').count()
  self.page.evaluate('SpotDemo.setCamera({zoom:2.6});SpotDemo.flushMap()');after=self.page.locator('.venue-pin.label-visible').count()
  self.assertGreater(after,before)
 def test_06_visible_place_names_do_not_overlap(self):
  self.extent('downtown');self.page.evaluate('SpotDemo.setCamera({zoom:2.6});SpotDemo.flushMap()')
  collisions=self.page.locator('.venue-pin.label-visible .pin-label').evaluate_all('''es=>{const rs=es.map(e=>e.getBoundingClientRect());let n=0;for(let i=0;i<rs.length;i++)for(let j=i+1;j<rs.length;j++)if(rs[i].left<rs[j].right&&rs[i].right>rs[j].left&&rs[i].top<rs[j].bottom&&rs[i].bottom>rs[j].top)n++;return n}''')
  self.assertEqual(collisions,0)
 def test_07_high_zoom_uses_one_canvas_without_a_building_dom_grid(self):
  self.extent('downtown');self.page.evaluate('SpotDemo.setCamera({zoom:8});SpotDemo.flushMap()')
  self.assertEqual(self.page.locator('canvas#mapCanvas').count(),1);self.assertLess(self.page.locator('#mapViewport *').count(),250)
  self.assertLess(self.page.evaluate('SpotCartography.featureCount'),2000)
 def test_08_bookmarked_marker_updates_without_a_new_navigation_tab(self):
  self.page.locator('.map-top-tools [data-action="view-list"]').tap();self.page.locator('[data-card="juniper"]').tap();self.page.locator('.spot-toolbar [data-save="juniper"]').tap();self.page.evaluate('SpotDemo.flushMap()')
  self.assertIn('is-saved',self.page.locator('[data-pin="juniper"]').get_attribute('class'));self.assertEqual(self.page.locator('#mobileNavigation .nav-item').count(),3)
 def test_09_both_appearances_change_basemap_without_changing_counts(self):
  self.extent('downtown');before=self.page.evaluate('SpotDemo.getStats()');images=[]
  for theme in ['dark','light']:
   self.page.locator('[data-theme-toggle]').tap();self.page.locator(f'[data-theme-choice="{theme}"]').tap();self.page.evaluate('SpotDemo.flushMap()');images.append(self.page.locator('#mapCanvas').screenshot());self.assertEqual(self.page.evaluate('SpotDemo.getStats()'),before)
  self.assertNotEqual(images[0],images[1])
 def test_10_map_does_not_request_network_or_device_location(self):
  self.extent('city');self.extent('downtown');self.extent('region')
  self.assertEqual(self.requests,[]);self.assertNotIn('watchPosition(',HTML);self.assertNotIn('getCurrentPosition(',HTML)
if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(MapPolishUI))
 summary={'tests':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failures':len(result.failures),'errors':len(result.errors),'method':'Headless Chromium, mobile emulation. v4.1 baseline loaded from byte-identical rollback snapshot. No physical-phone or Safari certification.'}
 (ROOT/'artifacts/v4.2-map-polish-results.json').write_text(json.dumps(summary,indent=2)+'\n')
 raise SystemExit(not result.wasSuccessful())
