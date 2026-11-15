import sys
from playwright.sync_api import sync_playwright
out = sys.argv[1]
with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, theme in [(1440, 900, "dark"), (390, 844, "dark"), (1440, 900, "light")]:
        pg = b.new_page(viewport={"width": w, "height": h})
        if theme == "light":
            pg.add_init_script("try{localStorage.setItem('astra-theme','light')}catch(e){}")
        pg.goto("http://localhost:4173/#/integracoes")
        pg.wait_for_timeout(900)
        if theme == "dark" and w == 1440:
            btn = pg.get_by_role("button", name="Sincronizar agora").first
            btn.click(); pg.wait_for_timeout(800)
            print("cenario-demo sync visible:", pg.locator("#con-cenario-demo").locator("xpath=ancestor::li[1]").get_by_role("button", name="Sincronizar agora").count())
            print("sw scroll:", pg.evaluate("document.documentElement.scrollWidth"), w)
        else:
            print("sw scroll:", pg.evaluate("document.documentElement.scrollWidth"), w)
        pg.screenshot(path=f"{out}/integ-{w}-{theme}.png", full_page=True)
        pg.close()
    b.close()
