"""Tiny Python server for the phone-friendly NYU Shanghai shuttle planner."""
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os

ROOT = Path(__file__).resolve().parent


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        super().end_headers()


if __name__ == "__main__":
    port = int(os.environ.get("PORT", "8000"))
    print(f"Shuttle planner running at http://0.0.0.0:{port}")
    ThreadingHTTPServer(("0.0.0.0", port), AppHandler).serve_forever()
