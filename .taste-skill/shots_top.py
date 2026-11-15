import sys
from playwright.sync_api import sync_playwright
sys.stdout.reconfigure(encoding="utf-8")
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, vp in [("d", {"width": 1440, "height": 900}), ("m", {"width": 390, "height": 844})]:
        pg = b.new_page(viewport=vp)
        pg.goto("http://localhost:4173/#/prontuario"); pg.wait_for_timeout(900)
        pg.screenshot(path=f".taste-skill/top-{name}.png")
        pg.mouse.wheel(0, 900); pg.wait_for_timeout(700)
        pg.screenshot(path=f".taste-skill/top-{name}-scrolled.png")
        if name == "d":
            pg.mouse.wheel(0, -300); pg.wait_for_timeout(700)
            pg.screenshot(path=f".taste-skill/top-{name}-up.png")
            pg.click(".menu-btn"); pg.wait_for_timeout(300)
            pg.screenshot(path=f".taste-skill/top-{name}-menu.png")
        pg.close()
    b.close()
print("ok")
