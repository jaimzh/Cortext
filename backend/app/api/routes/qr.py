from io import BytesIO
import socket

import qrcode
from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, StreamingResponse

from app.config.config import SESSION_TOKEN


router = APIRouter()


def get_lan_ip() -> str:
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
        sock.connect(("8.8.8.8", 80))
        return sock.getsockname()[0]


def get_app_url(request: Request) -> str:
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", request.url.netloc)

    if host.startswith("127.0.0.1") or host.startswith("localhost"):
        host = f"{get_lan_ip()}:8001"

    return f"{scheme}://{host}/app?token={SESSION_TOKEN}"


@router.get("/qr", response_class=HTMLResponse)
def qr_page(request: Request):
    app_url = get_app_url(request)
    return f"""
    <!doctype html>
    <html lang="en">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Cortext QR</title>
        <style>
            body {{
                min-height: 100vh;
                margin: 0;
                display: grid;
                place-items: center;
                background: #101114;
                color: #f4f4f5;
                font-family: Arial, sans-serif;
            }}

            main {{
                width: min(92vw, 420px);
                padding: 32px;
                border: 1px solid #2a2d34;
                border-radius: 8px;
                background: #17191f;
                text-align: center;
            }}

            h1 {{
                margin: 0 0 16px;
            }}

            img {{
                width: 260px;
                height: 260px;
                padding: 12px;
                border-radius: 8px;
                background: white;
            }}

            a {{
                display: block;
                margin-top: 16px;
                color: #8ab4ff;
                overflow-wrap: break-word;
            }}
        </style>
    </head>
    <body>
        <main>
            <h1>Cortext</h1>
            <img src="/qr.png" alt="QR code for Cortext recorder">
            <a href="{app_url}">{app_url}</a>
        </main>
    </body>
    </html>
    """


@router.get("/qr.png")
def qr_image(request: Request):
    app_url = get_app_url(request)
    image = qrcode.make(app_url)
    buffer = BytesIO()

    image.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")
