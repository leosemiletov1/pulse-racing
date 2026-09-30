"""
Render screenshots of the website in every paint scheme, plus one comparison sheet.

    py serve.py                      (in another window: the site must be running)
    py tools/render_previews.py
    py tools/render_previews.py --views home team --schemes pastel-blue pulse-green
    py tools/render_previews.py --schemes pulse-green --wheels white black gold     (compare wheel finishes)

Images are saved in colour-previews/. Uses Google Chrome or Microsoft Edge in the background.
"""
import argparse, re, shutil, subprocess, tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "colour-previews"
BROWSERS = [
    Path(r"C:\Program Files\Google\Chrome\Application\chrome.exe"),
    Path(r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"),
]


def schemes_from_config():
    text = (ROOT / "config" / "render.js").read_text(encoding="utf-8")
    block = text.split("paintSchemes:", 1)[1]
    return re.findall(r"^\s{4}'([\w-]+)':\s*\{", block, re.M)


def shoot(browser, profile, url, path, size):
    subprocess.run([str(browser), "--headless=new", "--hide-scrollbars", "--force-device-scale-factor=1",
                    f"--window-size={size[0]},{size[1]}", f"--user-data-dir={profile}",
                    "--virtual-time-budget=25000", f"--screenshot={path}", url],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def contact_sheet(files, rows, views, path):
    from PIL import Image, ImageDraw, ImageFont
    thumb_w = 640
    sample = Image.open(files[(rows[0], views[0])])
    thumb_h = round(sample.height * thumb_w / sample.width)
    label_w, pad = 300, 12
    sheet = Image.new("RGB", (label_w + len(views) * (thumb_w + pad) + pad, len(rows) * (thumb_h + pad) + pad), "#111")
    draw = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype("segoeuib.ttf", 26)
    except OSError:
        font = ImageFont.load_default()
    for r, s in enumerate(rows):
        y = pad + r * (thumb_h + pad)
        draw.text((pad + 6, y + thumb_h // 2 - 14), s.replace("__", "\n+ ") + (" wheels" if "__" in s else ""), fill="#f1f3f7", font=font)
        for c, v in enumerate(views):
            im = Image.open(files[(s, v)]).convert("RGB").resize((thumb_w, thumb_h), Image.LANCZOS)
            sheet.paste(im, (label_w + pad + c * (thumb_w + pad), y))
    sheet.save(path, optimize=True)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--schemes", nargs="*", help="default: every scheme in config/render.js")
    ap.add_argument("--views", nargs="*", default=["home", "manufacturing", "budget"], help="stop ids from config/tour.js")
    ap.add_argument("--wheels", nargs="*", default=[None], help="wheel finishes from config/render.js (wheelFinishes)")
    ap.add_argument("--url", default="http://localhost:8080/")
    ap.add_argument("--size", default="1600x900")
    args = ap.parse_args()

    browser = next((b for b in BROWSERS if b.exists()), None)
    if not browser:
        raise SystemExit("Needs Google Chrome or Microsoft Edge installed.")
    schemes = args.schemes or schemes_from_config()
    size = tuple(int(n) for n in args.size.split("x"))
    OUT.mkdir(exist_ok=True)
    profile = tempfile.mkdtemp(prefix="pulse-shots-")
    files, rows = {}, []
    try:
        for s in schemes:
            for w in args.wheels:
                row = f"{s}__{w}" if w else s
                rows.append(row)
                for v in args.views:
                    path = OUT / f"{row}__{v}.png"
                    url = f"{args.url}?paint={s}&stop={v}&still" + (f"&wheels={w}" if w else "")
                    shoot(browser, profile, url, path, size)
                    files[(row, v)] = path
                    print("saved", path.name)
    finally:
        shutil.rmtree(profile, ignore_errors=True)
    sheet = "_wheels_comparison.png" if args.wheels != [None] else "_comparison.png"
    contact_sheet(files, rows, args.views, OUT / sheet)
    print("saved", sheet)


if __name__ == "__main__":
    main()
