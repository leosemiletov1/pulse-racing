"""
Preview the website locally:   py serve.py
Then open http://localhost:8080   (camera editor: http://localhost:8080/?edit)

Caching is switched off, so after editing config/*.js just refresh the page.
Options:  --port 9000   --no-open (don't open a browser tab)
"""
import argparse, functools, http.server, webbrowser
from pathlib import Path

ROOT = Path(__file__).resolve().parent


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows sometimes maps .js to text/plain, which breaks JS modules. Pin the types.
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".js": "text/javascript", ".css": "text/css", ".html": "text/html",
        ".glb": "model/gltf-binary", ".json": "application/json", ".svg": "image/svg+xml",
    }

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, fmt, *args):
        pass  # keep the terminal quiet


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--port", type=int, default=8080)
    ap.add_argument("--no-open", action="store_true")
    args = ap.parse_args()
    url = f"http://localhost:{args.port}/"
    server = http.server.ThreadingHTTPServer(("127.0.0.1", args.port), functools.partial(Handler, directory=str(ROOT)))
    print(f"Serving {ROOT}\n  Site:          {url}\n  Camera editor: {url}?edit\nPress Ctrl+C to stop.")
    if not args.no_open:
        webbrowser.open(url)
    server.serve_forever()
