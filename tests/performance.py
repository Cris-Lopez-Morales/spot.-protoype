"""Sample JS render work only, not total frame latency or a device FPS guarantee."""
import json,os,shutil,platform,statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
ROOT=Path(__file__).resolve().parents[1]
HTML=(ROOT/'dist/spot-prototype.html').read_text()
with sync_playwright() as p:
    browser=p.chromium.launch(headless=True, executable_path=os.environ.get('CHROMIUM_PATH') or shutil.which('chromium'), args=['--no-sandbox'])
    page=browser.new_page(viewport={'width':1440,'height':960},device_scale_factor=1)
    page.set_content(HTML);page.wait_for_function('window.SpotDemo');page.evaluate('SpotDemo.flushMap()')
    version=browser.version
    result=page.evaluate('''async()=>{
        const venue=SpotCore.venueById('juniper'),zooms=[.06,.12,.3,.6,1,2,4,8],samples=[];
        // Yield between samples; timings below still cover the JS function only.
        for(let i=0;i<100;i++){
            await new Promise(requestAnimationFrame);
            const t=performance.now();
            SpotDemo.setCamera({x:venue.x+(i%5)*3,y:venue.y,zoom:zooms[i%zooms.length]});
            SpotDemo.flushMap(); samples.push(performance.now()-t);
        }
        return {samples,mapDOMNodes:document.querySelectorAll('#mapViewport *').length,renderStats:SpotDemo.getRenderStats()};
    }''')
    values=sorted(result['samples'])
    result.update({'test':'100 mixed-zoom/pan JavaScript render calls; not whole-frame latency','browser':version,'platform':platform.platform(),'viewport':'1440x960, DPR 1, headless Chromium','medianMs':round(statistics.median(values),3),'p95Ms':round(values[94],3),'maxMs':round(max(values),3),'baseline':None,'limitations':'No valid prior-version baseline. No claim of guaranteed frame rate, physical mobile performance, or live-map performance.'})
    (ROOT/'artifacts'/'v4-performance.json').write_text(json.dumps(result,indent=2))
    print(json.dumps({k:result[k] for k in ['test','medianMs','p95Ms','maxMs','mapDOMNodes']},indent=2))
    browser.close()
