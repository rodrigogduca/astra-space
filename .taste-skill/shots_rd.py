# Capturas da frente R-D (check-in, contexto, desafios, linha do tempo). Uso: python -I shots_rd.py [tag]
import sys, pathlib
from playwright.sync_api import sync_playwright
OUT = pathlib.Path(__file__).parent / "shots-rd"
TAG = sys.argv[1] if len(sys.argv) > 1 else "r1"
BASE = "http://localhost:4173/"
SIZES = {"d": (1440, 900), "m": (390, 844)}

def shot(page, name):
    page.wait_for_timeout(500)
    page.screenshot(path=str(OUT / f"{TAG}-{name}.png"), full_page=True)

with sync_playwright() as p:
    b = p.chromium.launch()
    for theme in ("dark", "light"):
        for k, (w, h) in SIZES.items():
            if theme == "light" and k == "m":
                continue
            ctx = b.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce")
            if theme == "light":
                ctx.add_init_script("try{localStorage.setItem('astra-theme','light')}catch(e){}")
            pg = ctx.new_page()
            sfx = f"{k}-{theme}"
            pg.goto(BASE + "#/checkin"); pg.wait_for_timeout(800)
            pg.get_by_role("button", name="Começar em 7 h").click()
            pg.get_by_role("button", name="Energia 6 de 10").click()
            pg.get_by_role("button", name="Pular esta pergunta").click()
            pg.get_by_role("button", name="Sim, quero registrar").click()
            shot(pg, f"checkin-{sfx}")
            pg.get_by_role("button", name="Revisar").click()
            shot(pg, f"review-{sfx}")
            pg.get_by_role("button", name="Salvar").click()
            shot(pg, f"done-{sfx}")
            pg.goto(BASE + "#/noturno"); pg.wait_for_timeout(600)
            shot(pg, f"noturno-{sfx}")
            pg.goto(BASE + "#/contexto"); pg.wait_for_timeout(600)
            shot(pg, f"contexto-{sfx}")
            pg.goto(BASE + "#/desafios"); pg.wait_for_timeout(600)
            shot(pg, f"desafios-{sfx}")
            pg.goto(BASE + "#/linha-do-tempo"); pg.wait_for_timeout(600)
            pg.get_by_role("switch").click()
            pg.goto(BASE + "#/checkin"); pg.wait_for_timeout(400)
            pg.get_by_role("button", name="Começar em 7 h").click()
            pg.get_by_role("button", name="Energia 3 de 10").click()
            pg.get_by_role("button", name="Não", exact=False).first.click()
            pg.get_by_role("button", name="Revisar").click()
            pg.get_by_role("button", name="Salvar").click()
            pg.goto(BASE + "#/linha-do-tempo"); pg.wait_for_timeout(3500)
            shot(pg, f"linha-{sfx}")
            pg.get_by_role("button", name="Registros").click()
            pg.get_by_role("button", name="Reiniciar demo").click()
            shot(pg, f"registros-{sfx}")
            ctx.close()
    b.close()
print("ok")
