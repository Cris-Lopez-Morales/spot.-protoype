"""v4.1 gesture regressions using Chrome DevTools Input.dispatchTouchEvent.
Runs actual browser touch input dispatch in mobile emulation, not physical phones.
Lost-capture/blur/late compatibility-event cases explicitly inject those events.
"""
import json, os, shutil, unittest
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
class TouchUI(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.p=sync_playwright().start();cls.browser=cls.p.chromium.launch(headless=True,executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'),args=['--no-sandbox'])
 @classmethod
 def tearDownClass(cls):cls.browser.close();cls.p.stop()
 def setUp(self):
  self.context=self.browser.new_context(viewport={'width':390,'height':844},is_mobile=True,has_touch=True,device_scale_factor=2)
  self.page=self.context.new_page();self.page.set_default_timeout(3000);self.errors=[];self.requests=[]
  self.page.on('pageerror',lambda e:self.errors.append(str(e)));self.page.on('request',lambda r:self.requests.append(r.url))
  self.page.set_content(HTML);self.page.wait_for_function('window.SpotDemo && window.SpotMapGestures')
  self.cdp=self.context.new_cdp_session(self.page);self.contacts={};self.id=0
  self.page.locator('[data-action="downtown"]').tap();self.settle()
 def tearDown(self):
  try:self.assertEqual(self.errors,[]);self.assertEqual(self.requests,[])
  finally:self.context.close()
 def settle(self):self.page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
 def cam(self):self.settle();return self.page.evaluate('SpotDemo.getCamera()')
 def gesture(self):return self.page.evaluate('SpotDemo.getGestureState()')
 def pt(self,id,xy):return {'id':id,'x':xy[0],'y':xy[1],'radiusX':2,'radiusY':2,'force':1}
 def send(self,t,pts):self.cdp.send('Input.dispatchTouchEvent',{'type':t,'touchPoints':pts});self.settle()
 def down(self,x,y):
  self.id+=1;self.contacts[self.id]=(x,y);self.send('touchStart',[self.pt(i,xy) for i,xy in self.contacts.items()]);return self.id
 def move(self,updates):
  self.contacts.update(updates);self.send('touchMove',[self.pt(i,xy) for i,xy in self.contacts.items()])
 def up(self,id=None):
  if id is None:self.send('touchEnd',[]);self.contacts.clear()
  else:self.send('touchEnd',[self.pt(id,self.contacts[id])]);self.contacts.pop(id)
 def cancel(self):self.send('touchCancel',[]);self.contacts.clear()
 def swipe(self,x,y,dx,dy,n=6):
  id=self.down(x,y)
  for i in range(1,n+1):self.move({id:(x+dx*i/n,y+dy*i/n)})
  self.up();return self.cam()
 def blank(self):
  return self.page.evaluate('''()=>{const r=document.querySelector('#mapViewport').getBoundingClientRect();
   for(let y=r.top+95;y<r.bottom-195;y+=18)for(let x=82;x<r.right-25;x+=18){const e=document.elementFromPoint(x,y);if(e?.closest('#mapViewport')&&!e.closest('button'))return[x,y];}throw Error('No visible map background');}''')
 def center(self,selector):
  return self.page.locator(selector).first.evaluate('e=>{const r=e.getBoundingClientRect();return[r.x+r.width/2,r.y+Math.min(r.height,32)/2]}')
 def pinch(self,start=80,end=140):
  a=self.down(195-start/2,390);b=self.down(195+start/2,390)
  for i in range(1,7):
   span=start+(end-start)*i/6;self.move({a:(195-span/2,390),b:(195+span/2,390)})
  return a,b
 def test_01_horizontal_single_finger_only_pans(self):
  c=self.cam();x,y=self.blank();after=self.swipe(x,y,65,0);self.assertEqual(after['zoom'],c['zoom']);self.assertLess(after['x'],c['x'])
 def test_02_vertical_single_finger_only_pans(self):
  c=self.cam();x,y=self.blank();after=self.swipe(x,y,0,80);self.assertEqual(after['zoom'],c['zoom']);self.assertLess(after['y'],c['y'])
 def test_03_diagonal_single_finger_only_pans(self):
  c=self.cam();x,y=self.blank();after=self.swipe(x,y,55,70);self.assertEqual(after['zoom'],c['zoom']);self.assertLess(after['x'],c['x']);self.assertLess(after['y'],c['y'])
 def test_04_drag_starting_on_cluster_does_not_zoom_or_select(self):
  self.page.locator('[data-action="recenter"]').tap();self.settle();x,y=self.center('.cluster-pin');c=self.cam();after=self.swipe(x,y,55,45);self.assertEqual(after['zoom'],c['zoom']);self.assertNotEqual(after['x'],c['x']);self.assertEqual(self.page.locator('.detail-card').count(),0)
 def test_05_tap_single_place_opens_it_without_zooming(self):
  self.page.evaluate("SpotDemo.setCamera({zoom:2});SpotDemo.flushMap()");x,y=self.center('[data-pin="juniper"]');c=self.cam();self.down(x,y);self.up();self.assertEqual(self.page.locator('#detailTitle').inner_text(),'Juniper Coffee');self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_06_drag_from_single_place_does_not_open_it(self):
  self.page.evaluate("SpotDemo.setCamera({zoom:2});SpotDemo.flushMap()");x,y=self.center('[data-pin="juniper"]');c=self.cam();after=self.swipe(x,y,70,-45);self.assertEqual(after['zoom'],c['zoom']);self.assertEqual(self.page.locator('.detail-card').count(),0)
 def test_07_cluster_tap_is_not_a_touch_zoom_shortcut(self):
  self.page.locator('[data-action="recenter"]').tap();self.settle();x,y=self.center('.cluster-pin');c=self.cam();self.down(x,y);self.up();self.assertEqual(self.cam(),c);self.assertIn('Pinch',self.page.locator('#toast').inner_text())
 def test_08_rapid_double_tap_on_background_does_not_zoom(self):
  x,y=self.blank();c=self.cam()
  for i in range(2):self.down(x,y);self.up()
  self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_09_repeated_single_finger_swipes_do_not_zoom(self):
  c=self.cam()
  for i in range(8):
   x,y=self.blank();self.swipe(x,y,30 if i%2 else -30,20,n=2)
  self.assertEqual(self.cam()['zoom'],c['zoom']);self.assertEqual(self.gesture()['count'],0)
 def test_10_pinch_out_increases_map_zoom(self):
  c=self.cam();self.pinch(80,160);self.assertAlmostEqual(self.cam()['zoom'],c['zoom']*2,places=5);self.up()
 def test_11_pinch_in_decreases_map_zoom(self):
  c=self.cam();self.pinch(160,80);self.assertAlmostEqual(self.cam()['zoom'],c['zoom']/2,places=5);self.up()
 def test_12_lift_either_finger_then_continue_panning_no_jump(self):
  for which in [0,1]:
   with self.subTest(which=which):
    ids=self.pinch(90,150);c=self.cam();self.up(ids[which]);self.assertEqual(self.cam(),c);self.assertEqual(self.gesture()['count'],1)
    id=ids[1-which];x,y=self.contacts[id];self.move({id:(x+40,y+20)});after=self.cam();self.assertEqual(after['zoom'],c['zoom']);self.assertAlmostEqual(after['x'],c['x']-40/c['zoom'],places=4);self.up()
 def test_13_pinch_ending_does_not_open_pin_or_leave_ghost_fingers(self):
  self.pinch();self.up();self.assertEqual(self.gesture()['count'],0);self.assertEqual(self.page.locator('.detail-card').count(),0);c=self.cam();x,y=self.blank();self.swipe(x,y,40,40);self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_14_touch_cancel_clears_tracking(self):
  self.pinch();self.cancel();self.assertEqual(self.gesture()['count'],0);c=self.cam();x,y=self.blank();self.swipe(x,y,40,40);self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_15_lost_capture_resets_interrupted_contact(self):
  x,y=self.blank();self.down(x,y);self.move({self.id:(x+1,y+1)});self.assertEqual(self.gesture()['count'],1)
  self.page.evaluate("()=>{const el=document.querySelector('#mapViewport');for(let id=0;id<30;id++)if(el.hasPointerCapture(id))el.releasePointerCapture(id)}")
  self.move({self.id:(x+10,y+10)});self.assertEqual(self.gesture()['count'],0);self.up();c=self.cam();self.swipe(x,y,35,30);self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_16_window_blur_discards_stale_gesture(self):
  x,y=self.blank();self.down(x,y);self.page.evaluate("window.dispatchEvent(new Event('blur'))");self.assertEqual(self.gesture()['count'],0);self.up();c=self.cam();self.swipe(x,y,30,30);self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_17_three_contacts_pause_and_resume_safely(self):
  a=self.down(100,380);b=self.down(230,380);c=self.down(300,430);before=self.cam();self.move({a:(80,380),c:(310,440)});self.assertEqual(self.cam(),before);self.up(c);self.assertEqual(self.cam(),before);self.move({a:(60,380),b:(250,380)});self.assertGreater(self.cam()['zoom'],before['zoom']);self.up()
 def test_18_map_capture_survives_finger_leaving_viewport(self):
  x,y=self.blank();id=self.down(x,y);before=self.cam();self.move({id:(x,50)});self.up();self.assertEqual(self.gesture()['count'],0);self.assertEqual(self.cam()['zoom'],before['zoom'])
 def test_19_plus_minus_buttons_are_still_explicit_zoom_controls(self):
  c=self.cam();self.page.locator('[data-action="zoom-in"]').tap();self.assertGreater(self.cam()['zoom'],c['zoom']);self.page.locator('[data-action="zoom-out"]').tap();self.assertAlmostEqual(self.cam()['zoom'],c['zoom'],places=5)
 def test_20_friend_list_can_scroll_without_moving_map(self):
  c=self.cam();self.page.locator('#mobileNavigation [data-screen="friends"]').tap();self.settle()
  before=self.page.evaluate('document.scrollingElement.scrollTop');self.swipe(190,650,0,-270);after=self.page.evaluate('document.scrollingElement.scrollTop');self.assertGreater(after,before);self.assertEqual(self.cam(),c);self.assertEqual(self.gesture()['count'],0)
 def test_21_details_scroll_and_search_still_work(self):
  self.page.locator('.map-top-tools [data-action="view-list"]').tap();self.page.locator('[data-card="juniper"]').tap();self.page.locator('[data-action="expand-detail"]').tap();self.settle();c=self.cam()
  box=self.page.locator('.detail-card').bounding_box();x=box['x']+box['width']/2;y=min(700,box['y']+box['height']-40);before=self.page.locator('.detail-card').evaluate('e=>e.scrollTop');self.swipe(x,y,0,-140)
  self.assertGreater(self.page.locator('.detail-card').evaluate('e=>e.scrollTop'),before);self.assertEqual(self.cam(),c);self.page.locator('#venueSearch').fill('Hickman');self.assertEqual(self.page.locator('.detail-card').count(),0)
 def test_22_dark_mode_preserves_gestures(self):
  self.page.locator('[data-theme-toggle]').tap();self.page.locator('[data-theme-choice="dark"]').tap();self.settle();x,y=self.blank();c=self.cam();self.swipe(x,y,40,40);self.assertEqual(self.cam()['zoom'],c['zoom']);self.pinch(80,160);self.assertGreater(self.cam()['zoom'],c['zoom']);self.up()
 def test_23_pinch_scales_map_not_browser_page(self):
  before=self.page.evaluate('visualViewport.scale');self.pinch(80,160);self.up();self.assertEqual(self.page.evaluate('visualViewport.scale'),before);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),390)
 def test_24_late_compatibility_double_click_is_ignored_after_touch(self):
  x,y=self.blank();self.down(x,y);self.up();c=self.cam();self.page.locator('#mapViewport').dispatch_event('dblclick',{'clientX':x,'clientY':y,'bubbles':True});self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_25_delayed_wheel_after_touch_cannot_zoom(self):
  x,y=self.blank();self.swipe(x,y,25,25);c=self.cam();self.page.locator('#mapViewport').dispatch_event('wheel',{'deltaY':-100,'clientX':x,'clientY':y,'bubbles':True,'cancelable':True});self.assertEqual(self.cam()['zoom'],c['zoom'])
 def test_26_switching_screens_removes_gesture_listeners(self):
  for screen in ['friends','privacy','explore','friends','explore']:
   self.page.locator(f'#mobileNavigation [data-screen="{screen}"]').tap();self.settle();self.assertEqual(self.gesture()['count'],0)
  c=self.cam();x,y=self.blank();after=self.swipe(x,y,30,30);self.assertEqual(after['zoom'],c['zoom']);self.assertAlmostEqual(after['x'],c['x']-30/c['zoom'],places=4)
 def test_27_map_only_owns_touch_gestures(self):
  self.assertEqual(self.page.locator('#mapViewport').evaluate('e=>getComputedStyle(e).touchAction'),'none');self.assertNotEqual(self.page.locator('#venueSearch').evaluate('e=>getComputedStyle(e).touchAction'),'none');self.assertEqual(self.page.evaluate('SpotDemo.getStats().total'),5000)
 def test_28_single_finger_zoom_invariant_small_and_large_phone(self):
  for w,h in [(320,650),(430,932)]:
   self.page.set_viewport_size({'width':w,'height':h});self.settle();self.assertEqual(self.gesture()['count'],0);x,y=self.blank();c=self.cam();self.swipe(x,y,25,25);self.assertEqual(self.cam()['zoom'],c['zoom']);self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'),w)

if __name__=='__main__':
 result=unittest.TextTestRunner(verbosity=2).run(unittest.defaultTestLoader.loadTestsFromTestCase(TouchUI))
 summary={'tests':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failures':len(result.failures),'errors':len(result.errors),'method':'Headless Chromium, CDP touch input dispatch with is_mobile and has_touch, DPR 2. Interruption and compatibility cases inject events explicitly.','limitations':['No physical iPhone or Android testing','No Safari mobile engine certification']}
 (ROOT/'artifacts/v4.1-touch-results.json').write_text(json.dumps(summary,indent=2)+'\n')
 raise SystemExit(not result.wasSuccessful())
