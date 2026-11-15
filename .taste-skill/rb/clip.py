import sys
from playwright.sync_api import sync_playwright
OUT, route, y, h, name = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]), sys.argv[5]
w = int(sys.argv[6]) if len(sys.argv) > 6 else 390
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={"width": w, "height": 844}, device_scale_factor=2 if w < 600 else 1)
    page.goto("http://localhost:4173/" + route)
    page.wait_for_timeout(1200)
    page.screenshot(path=f"{OUT}/{name}.png", full_page=True, clip={"x": 0, "y": y, "width": w, "height": h})
    b.close()
