import sys
from playwright.sync_api import sync_playwright
OUT=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch()
    for w,h,n in [(1440,900,"d"),(390,844,"m")]:
        pg=b.new_page(viewport={"width":w,"height":h})
        pg.goto("http://localhost:4173/#/respirar"); pg.wait_for_timeout(800)
        pg.get_by_role("button", name="Começar").click(); pg.wait_for_timeout(3000)
        pg.screenshot(path=f"{OUT}/br-{n}.png")
        print(n, pg.locator("[aria-live]").all_inner_texts())
        pg.goto("http://localhost:4173/#/gratidao"); pg.wait_for_timeout(800)
        for t in ["Minha família","Música","Minha equipe"]:
            pg.get_by_role("button", name=t).click()
        pg.screenshot(path=f"{OUT}/gr-{n}.png", full_page=True)
        pg.close()
    b.close()
