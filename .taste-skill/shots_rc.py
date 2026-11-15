import sys, os
from playwright.sync_api import sync_playwright
out = sys.argv[1]
tag = sys.argv[2] if len(sys.argv) > 2 else "r1"
theme = sys.argv[3] if len(sys.argv) > 3 else None
routes = {"pront": "#/prontuario", "sleep": "#/prontuario/sleep_duration", "bp": "#/prontuario/bp_systolic"}
with sync_playwright() as p:
    b = p.chromium.launch()
    for (w, h) in [(1440, 900), (390, 844)]:
        ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, reduced_motion="reduce")
        pg = ctx.new_page()
        pg.on("console", lambda m: print("console:", m.type, m.text) if m.type in ("error", "warning") else None)
        pg.goto("http://localhost:4173/")
        if theme:
            pg.evaluate(f"""() => {{ localStorage.setItem('astra-theme', '{theme}'); }}""")
        for name, r in routes.items():
            pg.goto("http://localhost:4173/" + r)
            if theme:
                pg.reload()
            pg.wait_for_timeout(700)
            sw = pg.evaluate("document.documentElement.scrollWidth")
            if sw > w: print("H-SCROLL", name, w, sw)
            pg.screenshot(path=os.path.join(out, f"{tag}-{name}-{w}.png"), full_page=True)
        ctx.close()
    b.close()
print("ok")
