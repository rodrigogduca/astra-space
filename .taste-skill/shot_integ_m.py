import sys
from playwright.sync_api import sync_playwright
out = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={"width": 390, "height": 844}, device_scale_factor=1)
    pg.goto("http://localhost:4173/#/integracoes"); pg.wait_for_timeout(900)
    pg.screenshot(path=f"{out}/m-0.png", full_page=True, clip={"x":0,"y":0,"width":390,"height":1700})
    pg.screenshot(path=f"{out}/m-1.png", full_page=True, clip={"x":0,"y":1700,"width":390,"height":1700})
    b.close()
