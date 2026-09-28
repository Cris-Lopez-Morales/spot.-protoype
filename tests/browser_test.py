"""Compatibility entry point for the integrated UI harness; fixture tests only."""
import runpy
from pathlib import Path
runpy.run_path(str(Path(__file__).with_name("integration_browser.py")),run_name="__main__")
