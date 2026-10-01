"""Draw the PNG versions of assets/favicon.svg (for browsers / iPhones that don't use SVG icons).
    py tools/make_favicons.py
Keep the shapes here in step with favicon.svg if you change the logo."""
from pathlib import Path
from PIL import Image, ImageDraw

ASSETS = Path(__file__).resolve().parent.parent / "assets"
PULSE = [(85, 316), (212, 293), (292, 125), (365, 390), (415, 290), (570, 316),
         (437, 338), (355, 505), (283, 238), (232, 340)]
VIEW_X, VIEW_Y, VIEW, RADIUS = 57, 45, 540, 48  # same viewBox / corner radius as the SVG


def draw(size, rounded=True):
    s = size * 8  # draw big, then shrink = smooth edges
    k = s / VIEW
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((0, 0, s - 1, s - 1), radius=RADIUS * k if rounded else 0, fill=(0, 0, 0, 255))
    d.polygon([((x - VIEW_X) * k, (y - VIEW_Y) * k) for x, y in PULSE], fill=(56, 214, 106, 255))
    return img.resize((size, size), Image.LANCZOS)


# iOS rounds the corners itself and dislikes transparency, so the home-screen icon is a full square.
for name, size, rounded in [("favicon-32.png", 32, True), ("favicon-192.png", 192, True), ("apple-touch-icon.png", 180, False)]:
    img = draw(size, rounded)
    (img.convert("RGB") if not rounded else img).save(ASSETS / name, optimize=True)
    print("saved", name)
