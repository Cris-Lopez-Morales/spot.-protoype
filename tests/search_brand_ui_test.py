"""v4.3 area-search and identity checks. Offline Chromium, not native GPS.
Physical phone keyboard behavior, Safari, and real geocoding are not certified.
"""
import json,shutil,unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
class SearchBrandUI(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start();cls.b=cls.p.chromium.launch(executable_path=shutil.which('chromium'),args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.b.close();cls.p.stop()
 def setUp(self):
  self.context=self.b.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,device_scale_factor=1)
  self.page=self.context.new_page();self.errors=[];self.requests=[];self.page.set_default_timeout(3000)
  self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.page.on('request',lambda r:self.requests.append(r.url))
  self.page.set_content(HTML);self.page.wait_for_function('window.SpotDemo');self.page.evaluate('SpotDemo.flushMap()')
 def tearDown(self):
  try:self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])
  finally:self.context.close()
 def search(self,q):self.page.locator('#venueSearch').fill(q);self.page.evaluate('SpotDemo.flushMap()')
 def camera(self):return self.page.evaluate('SpotDemo.getCamera()')
 def test_01_exact_east_campus_autojumps_and_shows_nearby(self):
  before=self.camera();self.search('East Campus');after=self.camera();self.assertNotEqual(before,after)
  self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'East Campus');self.assertEqual(self.page.locator('.place-card').count(),17)
  self.assertTrue(self.page.locator('#searchAreaContext').is_visible());self.assertEqual(self.page.locator('#venueSearch').get_attribute('aria-expanded'),'false')
 def test_02_anchor_matches_real_area_not_nearest_venue(self):
  self.search('East Campus');a=self.page.evaluate('SpotDemo.getSearchArea()');c=self.camera()
  self.assertEqual(c['x'],a['x']);self.assertEqual(c['y'],a['y']);self.assertTrue(self.page.locator('#searchAnchor').is_visible());self.assertIn('East Campus',self.page.locator('#searchAnchor').inner_text())
 def test_03_qualifiers_and_aliases(self):
  for q in ['UNL East','East Campus, Lincoln NE','eastcampus','near East Campus']:
   self.search(q);self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'East Campus')
 def test_04_partial_search_has_options_without_jumping(self):
  before=self.camera();self.search('east');self.page.wait_for_timeout(300);self.assertEqual(self.camera(),before)
  self.assertTrue(self.page.locator('#locationSuggestions').is_visible());self.assertEqual(self.page.locator('[data-location]').count(),2)
 def test_05_keyboard_arrow_enter_selects_area(self):
  self.search('east');self.page.keyboard.press('ArrowDown');self.assertEqual(self.page.locator('#venueSearch').get_attribute('aria-activedescendant'),'geo-option-0')
  self.page.keyboard.press('Enter');self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'East Campus');self.assertFalse(self.page.locator('#locationSuggestions').is_visible())
 def test_06_touch_selects_second_area(self):
  self.search('east');self.page.locator('[data-location="east-lincoln"]').tap();self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'East Lincoln')
 def test_07_mobile_list_search_returns_to_map(self):
  self.page.locator('.map-top-tools [data-action="view-list"]').tap();self.search('East Campus');self.assertTrue(self.page.locator('#mapViewport').is_visible());self.assertEqual(self.page.evaluate('SpotDemo.getState().mobileView'),'map')
 def test_08_filters_keep_selected_geography_and_camera(self):
  self.search('East Campus');before=self.camera();self.page.locator('[data-category="cafe"]').tap();self.assertEqual(self.camera(),before)
  self.assertTrue(self.page.evaluate('SpotDemo.getNearbyIds().every(id=>SpotCore.venueById(id).category==="cafe")'));self.assertGreater(self.page.locator('.place-card').count(),0)
 def test_09_saved_filter_does_not_invent_nearby_results(self):
  self.search('East Campus');self.page.locator('[data-action="saved-filter"]').tap();self.assertEqual(self.page.locator('.place-card').count(),0);self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'East Campus')
 def test_10_nearby_list_and_markers_use_identical_scope(self):
  self.search('East Campus');self.page.evaluate('SpotDemo.flushMap()');self.assertTrue(self.page.evaluate('''()=>{const ids=new Set(SpotDemo.getNearbyIds());return[...document.querySelectorAll('[data-members]')].every(n=>n.dataset.members.split(',').every(id=>ids.has(id)));}'''))
 def test_11_clear_area_restores_global_results(self):
  self.search('East Campus');self.page.locator('[data-action="clear-area"]').tap();self.assertEqual(self.page.locator('.place-card').count(),336);self.assertIsNone(self.page.evaluate('SpotDemo.getSearchArea()'))
 def test_12_region_preset_clears_area_scope(self):
  self.search('East Campus');self.page.locator('[data-action="region"]').tap();self.assertEqual(self.page.locator('.place-card').count(),336);self.assertEqual(self.page.locator('#venueSearch').input_value(),'')
 def test_13_ordinary_venue_search_still_works(self):
  self.search('Juniper Coffee');self.assertEqual(self.page.locator('.place-card').count(),10);self.assertEqual(self.page.locator('[data-card="juniper"]').count(),1);self.assertIsNone(self.page.evaluate('SpotDemo.getSearchArea()'))
 def test_14_unknown_address_is_not_fabricated(self):
  self.search('123 imaginary address New York');self.assertIsNone(self.page.evaluate('SpotDemo.getSearchArea()'));self.assertEqual(self.page.locator('.place-card').count(),0);self.assertIn('does not search every address',self.page.locator('.empty-state').inner_text())
 def test_15_escape_dismisses_suggestions_before_clearing_query(self):
  self.search('east');self.page.keyboard.press('Escape');self.assertFalse(self.page.locator('#locationSuggestions').is_visible());self.assertEqual(self.page.locator('#venueSearch').input_value(),'east')
 def test_16_escape_on_resolved_area_clears_it(self):
  self.search('East Campus');self.page.keyboard.press('Escape');self.assertIsNone(self.page.evaluate('SpotDemo.getSearchArea()'));self.assertEqual(self.page.locator('.place-card').count(),336)
 def test_17_search_never_injects_user_html(self):
  self.search('<img src=x onerror="alert(1)">');self.assertEqual(self.page.locator('img[src=x]').count(),0)
 def test_18_map_can_pan_after_area_jump_without_later_snapback(self):
  self.search('East Campus');c=self.camera();self.page.evaluate('SpotDemo.setCamera({x:5700});SpotDemo.flushMap()');self.page.wait_for_timeout(350)
  self.assertEqual(self.camera()['x'],5700);self.assertEqual(self.camera()['zoom'],c['zoom']);self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'East Campus')
 def test_19_expiration_does_not_recenter_or_invent_zero_trends(self):
  self.search('East Campus');before=self.camera();self.page.evaluate('SpotDemo.advanceTime(20*60000);SpotDemo.flushMap()');self.assertEqual(self.camera(),before);self.assertEqual(self.page.locator('.place-card').count(),17);self.assertIn('—',self.page.locator('.count-pill').first.inner_text())
 def test_20_selecting_another_venue_never_requires_close(self):
  self.search('East Campus');self.page.locator('#mobilePreview [data-venue]').tap();self.assertTrue(self.page.locator('.detail-card').is_visible());self.search('Holmes Lake');self.assertFalse(self.page.locator('.detail-card').is_visible());self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),'Holmes Lake')
 def test_21_explicit_enter_blurs_mobile_keyboard_target(self):
  self.search('East Campus');self.page.keyboard.press('Enter');self.assertFalse(self.page.locator('#venueSearch').evaluate('e=>e===document.activeElement'))
 def test_22_locations_are_not_saved_as_user_location(self):
  before=self.page.evaluate('SpotDemo.getOwnVisibility()');self.search('East Campus');self.assertEqual(self.page.evaluate('SpotDemo.getOwnVisibility()'),before);self.assertFalse(self.page.evaluate('SpotDemo.getState().sharing'))
 def test_23_dark_palette_is_midnight_not_forest(self):
  self.search('East Campus');self.page.evaluate('SpotTheme.apply("dark");SpotDemo.flushMap()')
  self.assertEqual(self.page.locator('.places-panel').evaluate('e=>getComputedStyle(e).backgroundColor'),'rgb(16, 18, 32)');self.assertEqual(self.page.locator('meta[name="theme-color"]').get_attribute('content'),'#101220')
 def test_24_light_palette_is_cool_white_with_indigo(self):
  self.page.evaluate('SpotTheme.apply("light");SpotDemo.flushMap()');self.assertEqual(self.page.locator('.places-panel').evaluate('e=>getComputedStyle(e).backgroundColor'),'rgb(247, 248, 252)');self.assertEqual(self.page.locator('[data-category="all"]').evaluate('e=>getComputedStyle(e).backgroundColor'),'rgb(89, 68, 214)')
 def test_25_header_icon_and_favicon_share_new_mark(self):
  self.assertTrue(self.page.locator('.header-mark svg').is_visible());self.assertEqual(self.page.locator('.brand-mark .logo-glyph').count(),0)
  self.assertIn('6250E8',self.page.locator('link[rel="icon"]').get_attribute('href'));self.assertEqual(self.page.locator('.header-mark circle').get_attribute('fill'),'#FF947D')
 def test_26_both_themes_preserve_search_and_demo_population(self):
  self.search('East Campus');before=self.page.evaluate('({s:SpotDemo.getStats(),a:SpotDemo.getSearchArea(),c:SpotDemo.getCamera(),ids:SpotDemo.getNearbyIds()})')
  for t in ['dark','light']:
   self.page.evaluate(f'SpotTheme.apply("{t}");SpotDemo.flushMap()');self.assertEqual(self.page.evaluate('({s:SpotDemo.getStats(),a:SpotDemo.getSearchArea(),c:SpotDemo.getCamera(),ids:SpotDemo.getNearbyIds()})'),before)
 def test_27_search_and_palettes_do_not_overflow_small_screens(self):
  for w in [320,390,768,1440]:
   self.page.set_viewport_size({'width':w,'height':844});self.search('East Campus')
   for t in ['light','dark']:
    self.page.evaluate(f'SpotTheme.apply("{t}");SpotDemo.flushMap()');self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w)
 def test_28_favorite_towns_and_parks_are_searchable(self):
  for q in ['Waverly','Seward','Holmes Lake','Pioneers Park','City Campus','Havelock']:
   self.search(q);self.assertEqual(self.page.evaluate('SpotDemo.getSearchArea().name'),q);self.assertEqual(self.page.locator('.place-card').count(),self.page.evaluate('SpotPlaceSearch.nearby(SpotCore.VENUES,SpotDemo.getSearchArea()).length'))
 def test_29_leaving_explore_cancels_pending_search_camera(self):
  self.search('Juniper');self.page.locator('#mobileNavigation [data-screen="friends"]').tap();self.page.wait_for_timeout(300);self.assertEqual(self.page.evaluate('SpotDemo.getState().screen'),'friends')
 def test_30_entry_and_exit_do_not_change_privacy_permissions(self):
  before=self.page.evaluate('SpotDemo.getState()');self.search('East Campus');self.page.locator('[data-action="clear-area"]').tap();after=self.page.evaluate('SpotDemo.getState()')
  for k in ['sharing','friendSharing','shareWith','relations','savedVenues']:self.assertEqual(before[k],after[k])

 def test_31_sparse_area_shows_no_sample_places_not_empty_occupancy(self):
  self.search('Pioneers Park');self.assertEqual(self.page.locator('.place-card').count(),0)
  self.assertIn('No matching demo places in this area',self.page.locator('.empty-state').inner_text());self.assertTrue(self.page.locator('#searchAnchor').is_visible())

 def test_32_panning_reuses_area_anchor_dom(self):
  self.search('East Campus');self.page.evaluate('window._anchorCaption=document.querySelector(".anchor-caption");SpotDemo.setCamera({x:5500});SpotDemo.flushMap()')
  self.assertTrue(self.page.evaluate('document.querySelector(".anchor-caption")===window._anchorCaption'))

if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(SearchBrandUI))
 (ROOT/'artifacts/v4.3-search-brand-results.json').write_text(json.dumps({'tests':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failed':len(result.failures)+len(result.errors),'method':'Chromium mobile emulation plus responsive desktop layouts, offline set_content; no physical phones or Safari'},indent=2))
 raise SystemExit(not result.wasSuccessful())
