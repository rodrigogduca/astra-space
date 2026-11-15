import sys
from playwright.sync_api import sync_playwright
OUT=sys.argv[1]
with sync_playwright() as p:
    b=p.chromium.launch(); pg=b.new_page(viewport={"width":1440,"height":900})
    pg.goto("http://localhost:4173/#/"); pg.wait_for_timeout(800)
    pg.evaluate("""document.querySelector('meta[name=color-scheme]') ? document.querySelector('meta[name=color-scheme]').setAttribute('content','light') : (()=>{const m=document.createElement('meta');m.name='color-scheme';m.content='light';document.head.appendChild(m)})()""")
    pg.wait_for_timeout(500)
    pg.mouse.wheel(0,500); pg.wait_for_timeout(400)
    pg.screenshot(path=f"{OUT}/light.png"); b.close()
