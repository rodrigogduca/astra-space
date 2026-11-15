import sys
from playwright.sync_api import sync_playwright
OUT = sys.argv[1]
tag = sys.argv[2] if len(sys.argv) > 2 else "a"
routes = [("jornada", "#/"), ("respirar", "#/respirar"), ("gratidao", "#/gratidao")]
with sync_playwright() as p:
    b = p.chromium.launch()
    for vw, vh, name in [(1440, 900, "d"), (390, 844, "m")]:
        ctx = b.new_context(viewport={"width": vw, "height": vh}, device_scale_factor=1)
        page = ctx.new_page()
        errs = []
        page.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        page.on("pageerror", lambda e: errs.append(str(e)))
        for rn, h in routes:
            page.goto("http://localhost:4173/" + h)
            page.wait_for_timeout(1200)
            page.screenshot(path=f"{OUT}/{tag}-{rn}-{name}.png", full_page=(rn == "jornada"))
        # sobreposições e rolagem horizontal
        page.goto("http://localhost:4173/#/")
        page.wait_for_timeout(800)
        sw = page.evaluate("document.documentElement.scrollWidth")
        print(name, "scrollWidth", sw, "errors", errs[:5])
        ctx.close()
    b.close()
