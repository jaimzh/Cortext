"""Verify FastAPI serves Vite's generated page and assets."""
import unittest
from html.parser import HTMLParser
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app, WEB_INDEX


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.assets = []

    def handle_starttag(self, tag, attrs):
        for name, value in attrs:
            if name in {"src", "href"} and value and "/assets/" in value:
                self.assets.append(value)


class FrontendTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_built_app_and_assets(self):
        self.assertTrue(WEB_INDEX.is_file(), "Run npm run build in web/ first")
        for path in ("/app", "/app/"):
            response = self.client.get(path)
            self.assertEqual(response.status_code, 200)
            self.assertIn('id="root"', response.text)
            parser = AssetParser()
            parser.feed(response.text)
            self.assertTrue(parser.assets)
            for asset in parser.assets:
                self.assertTrue(asset.startswith("/app/assets/"))
                self.assertEqual(self.client.get(asset).status_code, 200)

    def test_missing_build_has_setup_message(self):
        with patch("app.main.WEB_INDEX", Path("missing-frontend/index.html")):
            response = self.client.get("/app")
        self.assertEqual(response.status_code, 503)
        self.assertIn("npm run build", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()
