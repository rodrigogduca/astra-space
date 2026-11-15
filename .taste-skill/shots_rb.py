# Capturas da frente R2-B (Jornada sistema solar). Uso: python -I shots_rb.py [tag]
import sys, pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).parent / "shots-rb"
TAG = sys.argv[1] if len(sys.argv) > 1 else "r1"
BASE = "http://localhost:4173/"
SIZES = {"d": (1440, 900), "m": (390, 844)}
with sync_playwright() as p:
    b = p.chromium.launch()
    for theme in ("dark", "light"):
        for k, (w, h) in SIZES.items():
            ctx = b.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce")
            if theme == "light":
                ctx.add_init_script("try{localStorage.setItem('astra-theme','light')}catch(e){}")
            pg = ctx.new_page()
            pg.goto(BASE + "#/"); pg.wait_for_timeout(900)
            pg.screenshot(path=str(OUT / f"{TAG}-{k}-{theme}.png"), full_page=True)
            if theme == "dark":
                pg.get_by_role("button", name="Hidratação, a fazer").click()
                pg.get_by_role("button", name="Sinais do dia, a fazer").click()
                pg.wait_for_timeout(400)
                pg.screenshot(path=str(OUT / f"{TAG}-{k}-{theme}-acted.png"), full_page=True)
            ctx.close()
    b.close()
print("ok")
