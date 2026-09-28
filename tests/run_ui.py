"""Runs both retained regression tests and new v4 interaction tests."""
import json,unittest
from pathlib import Path
from ui_test import LincolnUI
from features_ui_test import FeatureUI
root=Path(__file__).resolve().parents[1]
suite=unittest.TestSuite([unittest.defaultTestLoader.loadTestsFromTestCase(cls) for cls in (LincolnUI,FeatureUI)])
result=unittest.TextTestRunner(verbosity=2).run(suite)
summary={'tests':result.testsRun,'passed':result.testsRun-len(result.failures)-len(result.errors),'failures':len(result.failures),'errors':len(result.errors),'method':'Headless desktop Chromium with set_content; desktop and mobile-sized viewports, not physical phones. Clipboard and native-share API branches mocked. No external requests.','limitations':['No native iOS/Android background location implementation','No real accounts or backend authorization','No durable browser-origin storage integration certification','Direct file navigation blocked by the test environment; HTML content tested through set_content']}
(root/'artifacts'/'v4-ui-results.json').write_text(json.dumps(summary,indent=2)+'\n')
raise SystemExit(not result.wasSuccessful())
