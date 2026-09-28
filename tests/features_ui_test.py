"""v4 interaction checks. set_content runs without outgoing requests.
Clipboard/native-share success and failure paths are mocked explicitly.
These are not physical-device or browser-origin persistence certifications.
"""
import json, os, shutil, unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
class FeatureUI(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':1440,'height':960});self.page=self.context.new_page();self.page.set_default_timeout(2500)
  self.errors=[];self.requests=[];self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.page.on('request',lambda r:self.requests.append(r.url))
  self.page.set_content(HTML);self.page.wait_for_function('window.SpotDemo && document.querySelectorAll(".place-card").length===336')
 def tearDown(self):
  try:self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])
  finally:self.context.close()
 def state(self):return self.page.evaluate('SpotDemo.getState()')
 def stats(self):return self.page.evaluate('SpotDemo.getStats()')
 def nav(self,screen):
  selector='#mobileNavigation' if self.page.viewport_size['width']<=760 else '#desktopNavigation'
  self.page.locator(f'{selector} [data-screen="{screen}"]').click()
 def spot(self,id='juniper'):self.page.locator(f'[data-card="{id}"]').click()
 def save(self,id='juniper'):self.page.locator(f'.place-row [data-save="{id}"]').click()
 def compare(self,id):self.page.locator(f'.place-row [data-compare="{id}"]').click()
 def review(self):self.page.locator('[data-action="review-compare"]').click()
 def count_on(self):
  self.page.locator('[data-action="toggle-sharing"]').click();self.page.locator('[data-action="enable-sharing"]').click()
 def friend_on(self,ids=('maya',)):
  self.page.locator('[data-action="toggle-friend-sharing"]').click()
  for id in ids:self.page.locator(f'[data-audience="{id}"]').check()
  self.page.locator('[data-action="save-audience"]').click()
 def theme(self,mode):
  self.page.locator('[data-theme-toggle]').click();self.page.locator(f'[data-theme-choice="{mode}"]').click()
 def test_01_bookmark_is_synchronized_between_list_and_detail(self):
  self.spot();self.page.locator('.spot-toolbar [data-save="juniper"]').click();self.assertEqual(self.state()['savedVenues'],['juniper']);self.assertEqual(self.page.locator('.place-row [data-save="juniper"]').get_attribute('aria-pressed'),'true')
  self.page.locator('.spot-toolbar [data-save="juniper"]').click();self.assertEqual(self.state()['savedVenues'],[])
 def test_02_saved_empty_state_is_explicit(self):
  self.page.locator('[data-action="saved-filter"]').click();self.assertTrue(self.page.get_by_text('Your usuals start here.').is_visible());self.assertEqual(self.page.locator('.place-card').count(),0)
  self.page.locator('#placesList [data-action="clear-filters"]').click();self.assertEqual(self.page.locator('.place-card').count(),336)
 def test_03_saved_intersects_category_and_search(self):
  self.save('juniper');self.save('after');self.page.locator('[data-action="saved-filter"]').click();self.assertEqual(self.page.locator('.place-card').count(),2)
  self.page.locator('[data-category="bar"]').click();self.assertEqual(self.page.locator('.place-card').count(),1);self.assertTrue(self.page.locator('[data-card="after"]').is_visible())
  self.page.locator('#venueSearch').fill('not here');self.assertEqual(self.page.locator('.place-card').count(),0)
 def test_04_saving_preserves_detail_and_camera(self):
  self.spot();camera=self.page.evaluate('SpotDemo.getCamera()');self.page.locator('.spot-toolbar [data-save="juniper"]').click();self.assertEqual(self.page.evaluate('SpotDemo.getCamera()'),camera);self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Juniper Coffee')
 def test_05_unsaving_last_saved_spot_recovers(self):
  self.save();self.page.locator('[data-action="saved-filter"]').click();self.save();self.assertEqual(self.state()['savedVenues'],[]);self.assertTrue(self.page.get_by_text('Your usuals start here.').is_visible())
 def test_06_one_comparison_is_not_enough(self):
  self.compare('juniper');self.assertTrue(self.page.locator('[data-action="review-compare"]').is_disabled());self.assertIn('Add one more',self.page.locator('#compareTray').inner_text())
 def test_07_comparison_rejects_a_fourth_without_replacement(self):
  for id in ['juniper','common','after','daybreak']:self.compare(id)
  self.assertEqual(self.state()['compareIds'],['juniper','common','after']);self.assertIn('up to 3',self.page.locator('#toast').inner_text())
 def test_08_comparison_displays_only_selected_venues_and_actual_demo_values(self):
  self.compare('juniper');self.compare('common');self.review();self.assertEqual(self.page.locator('.compare-count').all_inner_texts(),['58','26']);self.assertEqual(self.page.locator('.compare-place-name').all_inner_texts(),['Juniper Coffee','Common Ground']);self.assertFalse(self.page.evaluate('document.querySelector(".app-shell").inert'))
 def test_09_unknown_compare_is_not_zero_or_empty(self):
  self.compare('juniper');self.compare('sunday');self.review();self.assertEqual(self.page.locator('.compare-count').all_inner_texts(),['58','—']);self.assertIn('Unknown, not empty',self.page.locator('.compare-table').inner_text())
 def test_10_search_from_comparison_keeps_shortlist(self):
  self.compare('juniper');self.compare('common');self.review();self.page.locator('#venueSearch').fill('Waverly');self.assertEqual(self.page.locator('.comparison-card').count(),0);self.assertEqual(self.state()['compareIds'],['juniper','common']);self.assertTrue(self.page.locator('#compareTray').is_visible());self.assertEqual(self.page.locator('.place-card').count(),12)
 def test_11_selecting_place_from_comparison_requires_no_close(self):
  self.compare('juniper');self.compare('common');self.review();self.page.locator('.compare-place-name[data-venue="common"]').click();self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Common Ground');self.assertEqual(len(self.state()['compareIds']),2)
 def test_12_bookmark_inside_comparison_keeps_comparison_open(self):
  self.compare('juniper');self.compare('common');self.review();self.page.locator('.comparison-card [data-save="juniper"]').click();self.assertTrue(self.page.locator('#compareTitle').is_visible());self.assertEqual(self.state()['savedVenues'],['juniper'])
 def test_13_removing_comparison_down_to_one_returns_disabled_tray(self):
  for id in ['juniper','common','after']:self.compare(id)
  self.review();self.page.locator('.comparison-card [data-compare="after"]').click();self.assertEqual(self.page.locator('.compare-place-name').count(),2)
  self.page.locator('.comparison-card [data-compare="common"]').click();self.assertEqual(self.page.locator('.comparison-card').count(),0);self.assertTrue(self.page.locator('[data-action="review-compare"]').is_disabled())
 def test_14_comparison_expires_without_inventing_zeroes(self):
  self.compare('juniper');self.compare('common');self.review();self.page.evaluate('SpotDemo.advanceTime(15*60*1000)');self.assertEqual(self.page.locator('.compare-count').all_inner_texts(),['—','—']);self.assertIn('No recent activity',self.page.locator('.compare-table').inner_text())
 def test_15_shortlist_survives_other_screens(self):
  self.compare('juniper');self.compare('common');self.nav('friends');self.nav('explore');self.assertEqual(self.state()['compareIds'],['juniper','common']);self.review();self.assertTrue(self.page.locator('#compareTitle').is_visible())
 def test_16_share_dialog_returns_to_same_place(self):
  self.spot();camera=self.page.evaluate('SpotDemo.getCamera()');self.page.locator('[data-action="share-place"]').click();self.assertTrue(self.page.evaluate('document.querySelector("#detailHost").inert'));self.page.keyboard.press('Escape');self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Juniper Coffee');self.assertEqual(self.page.evaluate('SpotDemo.getCamera()'),camera);self.assertFalse(self.page.evaluate('document.querySelector("#detailHost").inert'))
 def test_17_local_share_contains_no_people_counts_or_local_path(self):
  self.spot();self.page.locator('[data-action="share-place"]').click();text=self.page.locator('#shareText').input_value();self.assertIn('Fictional place',text)
  for secret in ['Maya','58','file:','about:','mailto:','latitude']:self.assertNotIn(secret,text)
  self.assertIn('not a public website',self.page.locator('.modal').inner_text())
 def test_18_failed_clipboard_offers_selected_manual_text(self):
  self.page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('denied')}}});document.execCommand=()=>false")
  self.spot();self.page.locator('[data-action="share-place"]').click();self.page.locator('[data-action="copy-place"]').click();self.assertIn('copy it manually',self.page.locator('#shareStatus').inner_text());self.assertGreater(self.page.locator('#shareText').evaluate('(e)=>e.selectionEnd-e.selectionStart'),0)
 def test_19_successful_clipboard_only_gets_public_place_info(self):
  self.page.evaluate("Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.testClipboard=text}}})")
  self.spot();self.page.locator('[data-action="share-place"]').click();self.page.locator('[data-action="copy-place"]').click();self.assertEqual(self.page.evaluate('window.testClipboard'),self.page.locator('#shareText').input_value());self.assertIn('Copied.',self.page.locator('#shareStatus').inner_text())
 def test_20_native_share_cancellation_does_not_claim_delivery(self):
  self.page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('cancel','AbortError')}})")
  self.spot();self.page.locator('[data-action="share-place"]').click();self.page.locator('[data-action="native-share"]').click();self.assertEqual(self.page.locator('#shareStatus').inner_text(),'Sharing canceled.')
 def test_21_directions_cannot_route_to_fictional_business(self):
  self.spot();self.page.locator('[data-action="directions"]').click();self.assertTrue(self.page.locator('.preview-directions').is_disabled());self.assertIn('preview only',self.page.locator('.modal').inner_text());self.assertEqual(self.page.locator('.modal a[href]').count(),0);self.page.keyboard.press('Escape');self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Juniper Coffee')
 def test_22_count_on_does_not_enable_named_visibility(self):
  self.nav('privacy');self.count_on();self.assertEqual(self.stats()['present'],3501);self.assertFalse(self.state()['friendSharing']);self.assertEqual(self.page.locator('#friendVisibility').inner_text(),'Your venue is hidden')
 def test_23_friend_only_sharing_does_not_change_public_counts(self):
  self.nav('privacy');self.friend_on();self.assertFalse(self.state()['sharing']);self.assertTrue(self.state()['friendSharing']);self.assertEqual(self.stats()['present'],3500);self.assertIn('1 friend',self.page.locator('#friendVisibility').inner_text())
 def test_24_turning_off_count_keeps_named_sharing(self):
  self.nav('privacy');self.count_on();self.friend_on();self.page.locator('[data-action="toggle-sharing"]').click();self.assertEqual(self.stats()['present'],3500);self.assertTrue(self.state()['friendSharing']);self.assertIn('Your name at Juniper',self.page.locator('#friendVisibility').inner_text())
 def test_25_turning_off_friend_visibility_keeps_count(self):
  self.nav('privacy');self.count_on();self.friend_on();self.page.locator('[data-action="toggle-friend-sharing"]').click();self.assertEqual(self.stats()['present'],3501);self.assertFalse(self.state()['friendSharing']);self.assertIn('Included',self.page.locator('#publicVisibility').inner_text())
 def test_26_pause_all_revokes_both_forms(self):
  self.nav('privacy');self.count_on();self.friend_on();self.page.locator('[data-action="pause-all"]').click();self.assertFalse(self.state()['sharing']);self.assertFalse(self.state()['friendSharing']);self.assertEqual(self.stats()['present'],3500);self.assertTrue(self.page.locator('[data-action="pause-all"]').is_disabled())
 def test_27_audience_never_preselects_or_includes_incoming_connections(self):
  self.nav('privacy');self.page.locator('[data-action="choose-audience"]').click();self.assertEqual(self.page.locator('[data-audience]').count(),60);self.assertEqual(self.page.locator('[data-audience]:checked').count(),0);self.assertEqual(self.page.locator('[data-audience="alex"]').count(),0)
 def test_28_audience_search_keeps_selected_people_not_in_search_results(self):
  self.nav('privacy');self.page.locator('[data-action="choose-audience"]').click();self.page.locator('[data-audience="maya"]').check();self.page.locator('#audienceSearch').fill('Elliot');self.assertEqual(self.page.locator('[data-audience]').count(),1);self.page.locator('[data-audience="elliot"]').check();self.page.locator('[data-action="save-audience"]').click();self.assertEqual(self.state()['shareWith'],['maya','elliot'])
 def test_29_canceled_audience_does_not_grant_permission(self):
  self.nav('privacy');self.page.locator('[data-action="choose-audience"]').click();self.page.locator('[data-audience="maya"]').check();self.page.get_by_role('button',name='Cancel',exact=True).click();self.assertEqual(self.state()['shareWith'],[]);self.assertFalse(self.state()['friendSharing'])
 def test_30_accepting_friend_does_not_extend_outgoing_audience(self):
  self.nav('privacy');self.friend_on();self.nav('friends');self.page.locator('[data-friends-tab="requests"]').first.click();self.page.locator('[data-relation="accept"][data-person="alex"]').click();self.assertEqual(self.state()['shareWith'],['maya']);self.assertEqual(self.stats()['friends'],61)
 def test_31_blocking_last_selected_friend_revokes_permission(self):
  self.nav('privacy');self.friend_on();self.nav('friends');self.page.locator('[data-manage-friend="maya"]').click();self.page.locator('[data-action="confirm-block"]').click();self.page.locator('[data-relation="block"]').click();self.assertEqual(self.state()['shareWith'],[]);self.assertFalse(self.state()['friendSharing'])
 def test_32_own_visibility_preview_expires_in_privacy(self):
  self.nav('privacy');self.count_on();self.friend_on();self.page.evaluate('SpotDemo.advanceTime(15*60*1000)');self.assertEqual(self.page.locator('#friendVisibility').inner_text(),'Your venue is hidden');self.assertEqual(self.page.locator('#publicVisibility').inner_text(),'Your presence is not included')
 def test_33_activity_history_is_clearly_sample_data(self):
  self.spot();self.assertTrue(self.page.locator('.sample-label',has_text='SAMPLE HISTORY').is_visible());self.assertIn('Illustrative',self.page.locator('.history-note').inner_text());self.assertIn('authored sample values',self.page.locator('.history-chart').get_attribute('aria-label'))
 def test_34_unknown_venue_does_not_get_fake_history(self):
  self.spot('sunday');self.assertEqual(self.page.locator('.history-chart').count(),0);self.assertIn('No sample history',self.page.locator('.history-empty').inner_text())
 def test_35_history_does_not_invent_a_drop_when_expired(self):
  self.spot();before=self.page.evaluate('SpotDemo.getHistory("juniper").values');self.page.evaluate('SpotDemo.advanceTime(15*60*1000)');self.assertEqual(self.page.evaluate('SpotDemo.getHistory("juniper").values'),before);self.assertIn('No fresh sample',self.page.locator('.timeline-summary').inner_text());self.assertEqual(self.page.locator('.activity-number').inner_text(),'—')
 def test_36_dark_new_surfaces_no_page_overflow(self):
  self.theme('dark');self.compare('juniper');self.compare('common');self.compare('after');self.review()
  for w,h in [(320,568),(390,844),(768,1024),(1024,768),(1440,960)]:
   self.page.set_viewport_size({'width':w,'height':h});self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w);self.assertTrue(self.page.locator('#compareTitle').is_visible())
 def test_37_mobile_saved_and_compare_keep_search_available(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.locator('.map-top-tools [data-action="view-list"]').click();self.save('juniper');self.save('common');self.page.locator('[data-action="saved-filter"]').click();self.assertEqual(self.page.locator('.place-card').count(),2)
  self.compare('juniper');self.compare('common');self.review();self.page.locator('#venueSearch').fill('Juniper');self.assertEqual(self.page.locator('.place-card').count(),1);self.assertEqual(len(self.state()['compareIds']),2)
 def test_38_expanded_mobile_detail_keeps_new_tools_and_history(self):
  self.page.set_viewport_size({'width':390,'height':844});self.page.locator('.map-top-tools [data-action="view-list"]').click();self.spot();self.page.locator('[data-action="expand-detail"]').click();self.assertTrue(self.page.locator('.activity-timeline').is_visible());self.page.locator('.spot-toolbar [data-save="juniper"]').click();self.assertTrue(self.page.locator('.detail-card').evaluate('(e)=>e.classList.contains("expanded")'));self.page.locator('#venueSearch').fill('Hickman');self.assertEqual(self.page.locator('.detail-card').count(),0)
 def test_39_theme_change_keeps_all_new_choices(self):
  self.save();self.compare('common');self.nav('privacy');self.friend_on();before=self.state();self.theme('dark');self.assertEqual(self.state(),before)
 def test_40_reset_clears_new_choices_not_theme(self):
  self.save();self.compare('common');self.nav('privacy');self.friend_on();self.theme('dark');self.page.locator('[data-action="confirm-reset"]').click();self.page.locator('[data-action="reset-demo"]').click();self.assertEqual(self.state()['savedVenues'],[]);self.assertEqual(self.state()['compareIds'],[]);self.assertEqual(self.state()['shareWith'],[]);self.assertFalse(self.state()['friendSharing']);self.assertEqual(self.page.evaluate('document.documentElement.dataset.theme'),'dark')
 def test_41_place_hash_uses_known_venue_only(self):
  self.page.evaluate("location.hash='#place/common'");self.page.wait_for_function("document.querySelector('#detailTitle')?.textContent==='Common Ground'");self.page.evaluate("location.hash='#place/%ZZ'");self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Common Ground')
 def test_42_filter_buttons_have_clickable_height(self):
  for category in ['all','cafe','bar']:
   button=self.page.locator(f'[data-category="{category}"]');self.assertGreaterEqual(button.bounding_box()['height'],30);button.click()
 def test_43_keyboard_modal_includes_share_text_and_restores_place(self):
  self.spot();self.page.locator('[data-action="share-place"]').click();self.page.locator('#shareText').focus();self.page.keyboard.press('Tab');self.assertTrue(self.page.evaluate('!!document.activeElement.closest(".modal")'));self.page.keyboard.press('Escape');self.assertTrue(self.page.evaluate('document.activeElement.closest(".spot-toolbar")!==null'))
 def test_44_new_tools_do_not_add_extra_navigation_tabs_or_join_status(self):
  self.assertEqual(self.page.locator('#desktopNavigation .nav-item').count(),3);self.nav('privacy');self.assertEqual(self.page.locator('[role="switch"]').count(),2);self.assertNotIn('Open to company',self.page.locator('body').inner_text())

 def test_45_open_comparison_target_clears_filters_that_hide_it(self):
  self.compare('juniper');self.compare('after');self.page.locator('[data-category="cafe"]').click();self.review();self.page.locator('.compare-place-name[data-venue="after"]').click();self.assertEqual(self.state()['category'],'all');self.assertEqual(self.page.locator('#detailTitle').inner_text(),'After Hours');self.assertTrue(self.page.locator('[data-card="after"]').is_visible())
 def test_46_share_payload_mock_success_excludes_unauthorized_data(self):
  self.page.evaluate("Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.sharedData=data}})")
  self.spot();self.page.locator('[data-action="share-place"]').click();self.page.locator('[data-action="native-share"]').click();payload=self.page.evaluate('window.sharedData');self.assertEqual(payload['title'],'Juniper Coffee · Spot demo');self.assertNotIn('url',payload);self.assertNotIn('Maya',json.dumps(payload));self.assertIn('share menu',self.page.locator('#shareStatus').inner_text())

if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(FeatureUI))
 (ROOT/'artifacts'/'v4-feature-ui-results.json').write_text(json.dumps({'tests':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failures':len(result.failures),'errors':len(result.errors),'method':'Headless Chromium set_content; clipboard and native-share branch tests use explicit mocks.'},indent=2))
 raise SystemExit(not result.wasSuccessful())
