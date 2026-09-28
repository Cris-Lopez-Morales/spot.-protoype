"""Chromium UI regression tests for the offline Lincoln-region demo.
Uses set_content for deterministic desktop and mobile-sized layout tests.
Does not certify native GPS, iOS/Android background behavior, or real occupancy.
"""
import io,json,os,shutil,unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
ART=ROOT/'artifacts';ART.mkdir(exist_ok=True)
class LincolnUI(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':960},device_scale_factor=1)
  self.page=self.context.new_page();self.page.set_default_timeout(2500);self.errors=[];self.requests=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.page.on('request',lambda r:self.requests.append(r.url))
  self.page.set_content(HTML);self.page.wait_for_function('window.SpotDemo && document.querySelectorAll(".place-card").length===336')
 def tearDown(self):
  try:self.assertEqual(self.errors,[])
  finally:self.context.close()
 def nav(self,screen):
  parent='#mobileNavigation' if self.page.viewport_size['width']<761 else '#desktopNavigation'
  self.page.locator(f'{parent} [data-screen="{screen}"]').click()
 def stats(self):return self.page.evaluate('SpotDemo.getStats()')
 def test_01_seed_totals_and_desktop(self):
  self.assertEqual(self.stats(),dict(total=5000,present=3500,notAtVenues=1500,friends=60,friendsPresent=42,requests=6,venues=336))
  self.assertEqual(self.page.locator('.place-card').count(),336)
  self.page.screenshot(path=str(ART/'lincoln-desktop.png'),animations='disabled')
 def test_02_full_city_markers_do_not_double_count(self):
  result=self.page.evaluate('''()=>{const pins=[...document.querySelectorAll('[data-members]')];const ids=pins.flatMap(p=>p.dataset.members.split(','));return {total:pins.reduce((n,p)=>n+Number(p.dataset.count),0),ids:ids.length,unique:new Set(ids).size}}''')
  self.assertEqual(result,{'total':3500,'ids':336,'unique':336})
 def test_03_clusters_zoom_into_places(self):
  before=self.page.evaluate('SpotDemo.getCamera().zoom');self.page.locator('.cluster-pin').first.click()
  self.assertGreater(self.page.evaluate('SpotDemo.getCamera().zoom'),before)
 def test_04_downtown_and_city_controls(self):
  before=self.page.evaluate('SpotDemo.getCamera().zoom');self.page.locator('[data-action="downtown"]').click();self.assertGreater(self.page.evaluate('SpotDemo.getCamera().zoom'),before)
  self.page.locator('[data-action="recenter"]').click();self.assertAlmostEqual(self.page.evaluate('SpotDemo.getCamera().zoom'),before,places=3)
 def test_05_category_filters(self):
  self.page.locator('[data-category="bar"]').click();bars=self.page.locator('.place-card').count()
  self.page.locator('[data-category="cafe"]').click();cafes=self.page.locator('.place-card').count()
  self.assertEqual(bars+cafes,336)
 def test_06_area_search(self):
  self.page.locator('#venueSearch').fill('Haymarket');self.assertEqual(self.page.locator('.place-card').count(),62);self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'Haymarket')
  self.page.locator('[data-action="clear-search"]').click();self.assertEqual(self.page.locator('.place-card').count(),336)
 def test_07_empty_search_and_recovery(self):
  self.page.locator('#venueSearch').fill('not-a-real-place-abc');self.assertTrue(self.page.get_by_text('No spots found',exact=True).is_visible())
  self.page.locator('[data-action="clear-filters"]').first.click();self.assertEqual(self.page.locator('.place-card').count(),336)
 def test_08_friends_place_filter(self):
  self.page.locator('.friends-filter').click();n=self.page.locator('.place-card').count();self.assertGreater(n,20);self.assertLess(n,336)
 def test_09_detail_has_seven_named_friends(self):
  self.page.locator('[data-card="juniper"]').click();self.assertEqual(self.page.locator('.detail-friend').count(),7)
  self.assertEqual(self.page.locator('.activity-number').inner_text(),'58');self.assertIn('haymarket',self.page.locator('.detail-category').inner_text().lower())
  self.page.screenshot(path=str(ART/'lincoln-desktop-detail.png'),animations='disabled')
 def test_10_unknown_does_not_mean_empty(self):
  self.page.locator('[data-venue="sunday"]').click();self.assertEqual(self.page.locator('.activity-number').inner_text(),'—')
  self.assertIn('does not mean',self.page.locator('.activity-box').inner_text())
 def test_11_see_on_map_focuses_selected_place(self):
  self.page.locator('[data-venue="willow"]').click();self.page.locator('[data-action="show-on-map"]').click()
  cam=self.page.evaluate('SpotDemo.getCamera()');v=self.page.evaluate('SpotCore.venueById("willow")');self.assertEqual(cam['x'],v['x']);self.assertEqual(cam['y'],v['y'])
  self.assertTrue(self.page.locator('[data-pin="willow"]').is_visible())
 def test_12_sixty_friends_and_screenshot(self):
  self.nav('friends');self.assertEqual(self.page.locator('.friend-card').count(),60)
  self.page.screenshot(path=str(ART/'lincoln-desktop-friends.png'),animations='disabled')
 def test_13_around_and_requests_tabs(self):
  self.nav('friends');self.page.locator('.friend-tabs [data-friends-tab="around"]').click();self.assertEqual(self.page.locator('.friend-card').count(),42)
  self.page.locator('.friend-tabs [data-friends-tab="requests"]').click();self.assertEqual(self.page.locator('[data-request]').count(),6)
 def test_14_friend_search(self):
  self.nav('friends');self.page.locator('#friendsListSearch').fill('Maya Chen');self.assertEqual(self.page.locator('.friend-card').count(),1)
  self.page.locator('#friendsListSearch').fill('no-such-friend-abc');self.assertTrue(self.page.get_by_text('No matching friends').is_visible())
 def test_15_shared_area_search(self):
  self.nav('friends');self.page.locator('#friendsListSearch').fill('Haymarket');n=self.page.locator('.friend-card').count();self.assertGreater(n,0);self.assertLess(n,60)
 def test_16_accept_request_does_not_inflate_count(self):
  self.nav('friends');self.page.locator('.friend-tabs [data-friends-tab="requests"]').click()
  self.page.locator('[data-relation="accept"][data-person="alex"]').click();self.assertEqual(self.stats()['friends'],61);self.assertEqual(self.stats()['present'],3500);self.assertEqual(self.stats()['requests'],5)
 def test_17_decline_request(self):
  self.nav('friends');self.page.locator('.friend-tabs [data-friends-tab="requests"]').click();self.page.locator('[data-relation="decline"][data-person="alex"]').click();self.assertEqual(self.stats()['requests'],5);self.assertEqual(self.stats()['friends'],60)
 def test_18_remove_and_block_hide_only_names(self):
  self.nav('friends');self.page.locator('[data-manage-friend="maya"]').click();self.page.locator('[data-action="confirm-remove"]').click();self.page.locator('[data-relation="remove"][data-person="maya"]').click()
  self.assertEqual(self.stats()['friends'],59);self.assertEqual(self.stats()['present'],3500)
  self.page.locator('[data-manage-friend="elliot"]').click();self.page.locator('[data-action="confirm-block"]').click();self.page.locator('[data-relation="block"][data-person="elliot"]').click();self.assertEqual(self.stats()['friends'],58);self.assertEqual(self.stats()['present'],3500)
 def test_19_directory_request_stays_pending(self):
  self.nav('friends');self.page.locator('[data-action="add-friend"]').click();self.page.locator('#friendSearch').fill('jordan.lee');self.page.locator('[data-relation="request"][data-person="jordan"]').click()
  self.assertEqual(self.page.evaluate('SpotDemo.getState().relations.jordan'),'sent');self.assertEqual(self.stats()['friends'],60)
 def test_20_friend_place_link_opens_correct_venue(self):
  self.nav('friends');self.page.locator('[data-friend-card="maya"] [data-friend-venue]').click();self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Juniper Coffee')
 def test_21_share_and_stop_keep_population_fixed(self):
  self.nav('privacy');self.page.locator('[data-action="toggle-sharing"]').click();self.assertEqual(self.stats()['present'],3500)
  self.page.locator('[data-action="enable-sharing"]').click();self.assertEqual(self.stats()['present'],3501);self.assertEqual(self.stats()['total'],5000)
  self.page.locator('[data-action="toggle-sharing"]').click();self.assertEqual(self.stats()['present'],3500)
 def test_22_declining_sharing_does_not_enable(self):
  self.nav('privacy');self.page.locator('[data-action="toggle-sharing"]').click();self.page.get_by_role('button',name='Not now',exact=True).click();self.assertFalse(self.page.evaluate('SpotDemo.getState().sharing'))
 def test_23_expiration_clears_counts_and_named_presence(self):
  self.page.evaluate('SpotDemo.advanceTime(15*60*1000)');self.assertEqual(self.stats()['present'],0);self.assertEqual(self.stats()['friendsPresent'],0)
  self.page.locator('[data-card="juniper"]').click();self.assertEqual(self.page.locator('.detail-friend').count(),0);self.assertEqual(self.page.locator('.activity-number').inner_text(),'—')
 def test_24_reset_restores_larger_demo(self):
  self.page.evaluate('SpotDemo.advanceTime(15*60*1000)');self.page.evaluate('SpotDemo.reset()');self.assertEqual(self.stats()['present'],3500);self.assertEqual(self.stats()['friends'],60)
 def test_25_zoom_keyboard_and_drag(self):
  before=self.page.evaluate('SpotDemo.getCamera()');self.page.locator('#mapViewport').focus();self.page.keyboard.press('ArrowRight');self.page.keyboard.press('+');after=self.page.evaluate('SpotDemo.getCamera()');self.assertGreater(after['x'],before['x']);self.assertGreater(after['zoom'],before['zoom'])
  box=self.page.locator('#mapViewport').bounding_box();x=box['x']+box['width']*.8;y=box['y']+box['height']*.7
  self.page.mouse.move(x,y);self.page.mouse.down();self.page.mouse.move(x-70,y+30,steps=6);self.page.mouse.up();self.assertNotEqual(self.page.evaluate('SpotDemo.getCamera().x'),after['x'])
 def test_26_dialog_escape_and_focus(self):
  self.page.locator('[data-card="juniper"]').click();self.assertFalse(self.page.evaluate('document.querySelector(".app-shell").inert'))
  self.page.locator('#venueSearch').focus();self.assertTrue(self.page.locator('#venueSearch').evaluate('(el)=>document.activeElement===el'))
  self.page.keyboard.press('Escape');self.assertEqual(self.page.locator('.detail-card').count(),0);self.assertFalse(self.page.evaluate('document.querySelector(".app-shell").inert'))
 def test_27_mobile_map_list_detail(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.wait_for_timeout(100)
  self.page.screenshot(path=str(ART/'lincoln-mobile.png'),animations='disabled')
  self.page.locator('.map-top-tools [data-action="view-list"]').click();self.assertTrue(self.page.locator('.explore-layout').evaluate('(e)=>e.classList.contains("list-mode")'))
  self.page.locator('[data-venue="juniper"]').first.click();self.assertEqual(self.page.locator('.detail-friend').count(),7)
  self.page.screenshot(path=str(ART/'lincoln-mobile-detail.png'),animations='disabled')
  self.page.locator('[data-action="expand-detail"]').click();self.page.locator('[data-action="show-on-map"]').click();self.assertTrue(self.page.locator('[data-pin="juniper"]').is_visible())
 def test_28_mobile_friend_tabs(self):
  self.page.set_viewport_size({'width':390,'height':844});self.nav('friends')
  self.assertEqual(self.page.locator('.friend-card').count(),60)
  self.page.screenshot(path=str(ART/'lincoln-mobile-friends.png'),animations='disabled')
  self.page.locator('[data-friends-tab="requests"]').first.click();self.assertEqual(self.page.locator('[data-request]').count(),6)
 def test_29_responsive_no_horizontal_overflow(self):
  for w,h in [(320,568),(375,812),(390,844),(768,1024),(1024,768),(1440,960)]:
   self.page.set_viewport_size({'width':w,'height':h})
   for screen in ['explore','friends','privacy']:
    self.nav(screen);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w,f'{screen} at {w}')
 def test_30_offline_mode_makes_no_network_requests(self):
  self.nav('friends');self.nav('privacy');self.nav('explore');self.assertEqual(self.requests,[]);self.assertEqual(self.page.evaluate('SpotDemo.getMapMode()'),'offline-canvas-regional')

 def theme(self,mode):
  self.page.locator('[data-theme-toggle]').click();self.page.locator(f'[data-theme-choice="{mode}"]').click();self.page.wait_for_timeout(40)
 def test_31_dark_theme_applies_to_map_and_surfaces(self):
  before=self.page.locator('#mapCanvas').evaluate('(c)=>c.toDataURL()');self.theme('dark')
  self.assertEqual(self.page.evaluate('document.documentElement.dataset.theme'),'dark')
  self.assertEqual(self.page.locator('.places-panel').evaluate('(e)=>getComputedStyle(e).backgroundColor'),'rgb(16, 18, 32)')
  self.assertNotEqual(before,self.page.locator('#mapCanvas').evaluate('(c)=>c.toDataURL()'))
 def test_32_theme_retains_query_selection_and_camera(self):
  self.page.locator('#venueSearch').fill('Waverly');self.page.locator('.place-card').first.click()
  camera=self.page.evaluate('SpotDemo.getCamera()');state=self.page.evaluate('SpotDemo.getState()');title=self.page.locator('#detailTitle').inner_text()
  self.theme('dark');self.assertEqual(self.page.evaluate('SpotDemo.getCamera()'),camera);self.assertEqual(self.page.evaluate('SpotDemo.getState()'),state);self.assertEqual(self.page.locator('#detailTitle').inner_text(),title)
  self.theme('light');self.assertEqual(self.page.evaluate('document.documentElement.dataset.theme'),'light')
 def test_33_detail_allows_another_place_without_close(self):
  self.page.locator('[data-card="juniper"]').click();self.page.locator('[data-card="common"]').click();self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Common Ground')
  self.assertEqual(self.page.locator('.detail-backdrop').count(),0);self.assertEqual(self.page.locator('[aria-modal="true"]').count(),0)
 def test_34_search_works_while_detail_is_open(self):
  self.page.locator('[data-card="juniper"]').click();self.page.locator('#venueSearch').fill('Hickman');self.assertEqual(self.page.locator('.place-card').count(),10);self.assertEqual(self.page.locator('.detail-card').count(),0)
  self.page.locator('.place-card').first.click();self.assertIn('hickman',self.page.locator('.detail-category').inner_text().lower())
 def test_35_map_pin_switch_keeps_zoom_and_camera(self):
  self.page.locator('[data-card="juniper"]').click();self.page.evaluate('SpotDemo.setCamera({zoom:4});SpotDemo.flushMap()')
  self.page.wait_for_timeout(40)
  ids=self.page.locator('[data-pin]').evaluate_all('(nodes)=>nodes.filter(n=>{const r=n.getBoundingClientRect(),x=r.x+r.width/2,y=r.y+r.height/2;return n.dataset.pin!=="juniper"&&document.elementFromPoint(x,y)?.closest("[data-pin]")===n}).map(n=>n.dataset.pin)')
  self.assertTrue(ids);camera=self.page.evaluate('SpotDemo.getCamera()');self.page.locator(f'[data-pin="{ids[0]}"]').click();self.assertEqual(self.page.evaluate('SpotDemo.getCamera()'),camera);self.assertEqual(self.page.locator('#detailTitle').inner_text(),self.page.evaluate(f'SpotCore.venueById("{ids[0]}").name'))
 def test_36_search_surrounding_towns(self):
  for town,n in [('Waverly',12),('Seward',12),('Eagle',8),('Hickman',10),('Crete',8)]:
   self.page.locator('#venueSearch').fill(town);self.assertEqual(self.page.locator('.place-card').count(),n)
 def test_37_region_city_and_downtown_extents(self):
  self.page.locator('[data-action="region"]').click();region=self.page.evaluate('SpotDemo.getCamera().zoom')
  self.page.locator('[data-action="city"]').click();city=self.page.evaluate('SpotDemo.getCamera().zoom')
  self.page.locator('[data-action="downtown"]').click();downtown=self.page.evaluate('SpotDemo.getCamera().zoom')
  self.assertLess(region,city);self.assertLess(city,downtown)
 def test_38_cursor_zoom_is_anchored(self):
  box=self.page.locator('#mapViewport').bounding_box();x=round(box['x']+box['width']*.72);y=round(box['y']+box['height']*.6)
  before=self.page.evaluate('SpotDemo.getCamera()');px=x-box['x']-box['width']/2;py=y-box['y']-box['height']/2
  self.page.mouse.move(x,y);self.page.mouse.wheel(0,-100);self.page.wait_for_timeout(80);after=self.page.evaluate('SpotDemo.getCamera()')
  self.assertAlmostEqual(before['x']+px/before['zoom'],after['x']+px/after['zoom'],places=4);self.assertAlmostEqual(before['y']+py/before['zoom'],after['y']+py/after['zoom'],places=4)
 def test_39_panning_reuses_marker_dom(self):
  self.page.evaluate('window._nodes=new Map([...document.querySelectorAll("[data-members]")].map(n=>[n.dataset.members,n]));SpotDemo.setCamera({x:SpotDemo.getCamera().x+20});SpotDemo.flushMap()')
  result=self.page.evaluate('(()=>{let common=0,reused=0;for(const n of document.querySelectorAll("[data-members]")){if(window._nodes.has(n.dataset.members)){common++;if(window._nodes.get(n.dataset.members)===n)reused++;}}return{common,reused}})()')
  self.assertGreater(result['common'],0);self.assertEqual(result['common'],result['reused'])
 def test_40_pan_does_not_rebuild_clusters(self):
  before=self.page.evaluate('SpotDemo.getRenderStats().clusterBuilds')
  self.page.evaluate('SpotDemo.setCamera({x:SpotDemo.getCamera().x+100});SpotDemo.flushMap()');self.assertEqual(self.page.evaluate('SpotDemo.getRenderStats().clusterBuilds'),before)
 def test_41_input_burst_coalesces_to_one_frame(self):
  delta=self.page.evaluate('(()=>{const n=SpotDemo.getRenderStats().frames;for(let i=0;i<30;i++)document.querySelector("[data-action=zoom-in]").click();SpotDemo.flushMap();return SpotDemo.getRenderStats().frames-n})()');self.assertEqual(delta,1)
 def test_42_high_zoom_limits_map_dom(self):
  self.page.locator('[data-action="downtown"]').click();self.page.evaluate('SpotDemo.setCamera({zoom:8});SpotDemo.flushMap()');self.assertLess(self.page.locator('#mapViewport *').count(),250);self.assertEqual(self.page.locator('#mapCanvas').count(),1);self.assertEqual(self.page.locator('#mapArtwork').count(),0)
 def test_43_mobile_search_and_filters_after_detail(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.wait_for_timeout(40)
  self.page.locator('.map-top-tools [data-action="view-list"]').click();self.page.locator('[data-card="juniper"]').click()
  self.assertTrue(self.page.locator('#venueSearch').is_visible());self.assertFalse(self.page.evaluate('document.querySelector(".app-shell").inert'))
  self.page.locator('[data-category="bar"]').click();self.assertGreater(self.page.locator('.place-card').count(),0)
  self.page.locator('#venueSearch').fill('After Hours');self.assertGreater(self.page.locator('.place-card').count(),0)
 def test_44_mobile_expanded_details_still_leave_search_and_nav(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.locator('.map-top-tools [data-action="view-list"]').click();self.page.locator('[data-card="juniper"]').click();self.page.locator('[data-action="expand-detail"]').click()
  self.assertTrue(self.page.locator('.detail-card').evaluate('(e)=>e.classList.contains("expanded")'));self.page.locator('#venueSearch').fill('Roca');self.assertEqual(self.page.locator('.place-card').count(),6);self.nav('friends');self.assertEqual(self.page.locator('.friend-card').count(),60)
 def test_45_system_theme_follows_device(self):
  self.theme('system');self.page.emulate_media(color_scheme='dark');self.page.wait_for_function("document.documentElement.dataset.theme==='dark'");self.page.emulate_media(color_scheme='light');self.page.wait_for_function("document.documentElement.dataset.theme==='light'")
 def test_46_explicit_theme_ignores_device_changes(self):
  self.theme('dark');self.page.emulate_media(color_scheme='light');self.assertEqual(self.page.evaluate('document.documentElement.dataset.theme'),'dark')
 def test_47_theme_menu_keyboard(self):
  self.page.locator('[data-theme-toggle]').click();self.page.keyboard.press('Home');self.page.keyboard.press('ArrowDown');self.page.keyboard.press('Enter');self.assertEqual(self.page.evaluate('document.documentElement.dataset.appearance'),'dark');self.assertTrue(self.page.locator('#appearanceMenu').is_hidden())
 def test_48_theme_keeps_friend_changes_and_sharing(self):
  self.nav('privacy');self.page.locator('[data-action="toggle-sharing"]').click();self.page.locator('[data-action="enable-sharing"]').click();self.theme('dark');self.assertTrue(self.page.evaluate('SpotDemo.getState().sharing'));self.assertEqual(self.stats()['present'],3501)
 def test_49_dark_no_horizontal_overflow(self):
  self.theme('dark')
  for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,960)]:
   self.page.set_viewport_size({'width':w,'height':h})
   for screen in ['explore','friends','privacy']:
    self.nav(screen);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w,f'{screen} dark at {w}')
 def test_50_modal_confirmations_still_trap_focus(self):
  self.nav('privacy');self.page.locator('[data-action="toggle-sharing"]').click();self.assertTrue(self.page.evaluate('document.querySelector(".app-shell").inert'));self.page.keyboard.press('Tab');self.assertTrue(self.page.evaluate('!!document.activeElement.closest(".modal")'));self.page.keyboard.press('Escape');self.assertFalse(self.page.evaluate('document.querySelector(".app-shell").inert'))
 def test_51_canvas_high_dpi_and_resize(self):
  for w,h in [(390,844),(1440,960)]:
   self.page.set_viewport_size({'width':w,'height':h});self.page.wait_for_timeout(50);self.page.evaluate('SpotDemo.flushMap()')
   result=self.page.locator('#mapCanvas').evaluate('(c)=>({w:c.width,h:c.height,r:c.getBoundingClientRect().width})');self.assertGreater(result['w'],0);self.assertAlmostEqual(result['w'],result['r'],delta=1)
 def test_52_unknown_and_detail_survive_theme_change(self):
  self.page.locator('[data-card="sunday"]').click();self.theme('dark');self.assertEqual(self.page.locator('.activity-number').inner_text(),'—');self.assertIn('does not mean',self.page.locator('.activity-box').inner_text())

if __name__=='__main__':
 suite=unittest.defaultTestLoader.loadTestsFromTestCase(LincolnUI)
 result=unittest.TextTestRunner(verbosity=2).run(suite)
 summary={'tests':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failures':len(result.failures),'errors':len(result.errors),'method':'Chromium set_content, desktop and mobile-sized layouts; offline bundled map; native GPS and native mobile apps are not implemented'}
 (ART/'v4-regression-ui-results.json').write_text(json.dumps(summary,indent=2))
 raise SystemExit(not result.wasSuccessful())
