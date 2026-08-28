from io import BytesIO
from pathlib import Path

import qrcode
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, StreamingResponse

from app.api.routes.transcription import router as transcription_router


WEB_INDEX = Path(__file__).resolve().parents[2] / "web" / "index.html"


app = FastAPI(
    title="Cortext Backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(transcription_router)

@app.get("/")
def root():
    return {
        "message": "Cortext backend is running",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }


@app.get("/app")
def web_app():
    return FileResponse(WEB_INDEX)


def get_app_url(request: Request) -> str:
    scheme = request.headers.get("x-forwarded-proto", request.url.scheme)
    host = request.headers.get("host", request.url.netloc)
    return f"{scheme}://{host}/app"


@app.get("/qr", response_class=HTMLResponse)
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


@app.get("/qr.png")
def qr_image(request: Request):
    app_url = get_app_url(request)
    image = qrcode.make(app_url)
    buffer = BytesIO()

    image.save(buffer, format="PNG")
    buffer.seek(0)

    return StreamingResponse(buffer, media_type="image/png")
