"""Capture the installed UI design in a network-free fixture; no model is loaded."""
import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from integration_harness import parent_html,parent_script
ROOT=Path(__file__).resolve().parents[1]
async def capture():
 async with async_playwright() as p:
  b=await p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
  page=await b.new_page(viewport={'width':1440,'height':960})
  await page.set_content(parent_html());await page.add_script_tag(content=parent_script())
  await page.evaluate("SpotAssistantMap.navigate({type:'area',id:SpotPlaceSearch.exact('East Campus').id})")
  await page.click('#askSpot');fr=page.frame_locator('#spotAssistantFrame');await fr.locator('#boot-notice').wait_for(state='hidden');await page.wait_for_timeout(250)
  await page.screenshot(path=ROOT/'artifacts/preview-desktop.png')
  await page.set_viewport_size({'width':390,'height':844});await page.evaluate("document.documentElement.dataset.theme='dark';dispatchEvent(new CustomEvent('spot-theme-change'))");await page.wait_for_timeout(250)
  await page.screenshot(path=ROOT/'artifacts/preview-mobile.png')
  await b.close()
asyncio.run(capture())
