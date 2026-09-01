from pathlib import Path
import asyncio
import json
import ssl
import sys
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request
from urllib.request import urlopen

import qrcode
from pyfiglet import figlet_format

from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Static


BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.append(str(BACKEND_ROOT))

from app.config.config import SESSION_TOKEN
from app.utils.network import get_lan_ip


def get_local_app_url() -> str:
    return f"https://{get_lan_ip()}:8001/app?token={SESSION_TOKEN}"


def get_session_status_url() -> str:
    return f"https://127.0.0.1:8001/session/status?token={SESSION_TOKEN}"


def get_models_url() -> str:
    return f"https://127.0.0.1:8001/models?token={SESSION_TOKEN}"


def get_model_download_url(model_name: str) -> str:
    query = urlencode({"model": model_name, "token": SESSION_TOKEN})
    return f"https://127.0.0.1:8001/models/download?{query}"


def fetch_session_status() -> dict:
    context = ssl._create_unverified_context()

    with urlopen(get_session_status_url(), context=context, timeout=1) as response:
        return json.loads(response.read().decode("utf-8"))


def fetch_model_status() -> dict:
    context = ssl._create_unverified_context()

    with urlopen(get_models_url(), context=context, timeout=2) as response:
        return json.loads(response.read().decode("utf-8"))


def download_model_from_backend(model_name: str) -> dict:
    context = ssl._create_unverified_context()
    request = Request(get_model_download_url(model_name), method="POST")

    with urlopen(request, context=context, timeout=120) as response:
        return json.loads(response.read().decode("utf-8"))


def get_backend_error_message(error: Exception) -> str:
    if isinstance(error, HTTPError):
        if error.code == 401:
            return "Invalid session token. Restart backend."
        if error.code == 404:
            return "Backend route missing. Restart backend."
        return f"Backend returned {error.code}"

    if isinstance(error, TimeoutError):
        return "Request timed out. Try again."

    if isinstance(error, URLError):
        return "Could not reach backend. Check server."

    return "Unexpected backend error"


def make_qr_text(url: str) -> str:
    qr = qrcode.QRCode(
        border=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
    )
    qr.add_data(url)
    qr.make(fit=True)

    matrix = qr.get_matrix()
    rows = []

    for index in range(0, len(matrix), 2):
        top_row = matrix[index]
        bottom_row = matrix[index + 1] if index + 1 < len(matrix) else [False] * len(top_row)
        line = ""
        for top_cell, bottom_cell in zip(top_row, bottom_row):
            if top_cell and bottom_cell:
                line += "█"
            elif top_cell:
                line += "▀"
            elif bottom_cell:
                line += "▄"
            else:
                line += " "
        rows.append(line)

    return "\n".join(rows)


class HomeScreen(Screen):
    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Vertical(
                Static(figlet_format("CORTEXT", font="big"), id="brand"),
                Static("Your voice, anywhere.", id="tagline"),
                Horizontal(
                    Button("New Session", id="new-session", variant="primary"),
                    id="actions",
                ),
                Horizontal(
                    Button("Models", id="models-button"),
                    id="models-action",
                    classes="button-row",
                ),
                id="home",
            ),
            id="shell",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "new-session":
            self.app.push_screen("connection")
        elif event.button.id == "models-button":
            self.app.push_screen("models")


class ModelsScreen(Screen):
    BINDINGS = [
        ("r", "refresh", "Refresh"),
        ("escape", "back", "Back"),
    ]

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Vertical(
                Static("Models", classes="page-title"),
                Static("Manage local transcription models.", classes="page-subtitle"),
                Vertical(id="models-list"),
                Static("", id="models-status"),
                id="models",
            ),
            id="shell",
        )
        yield Footer()

    def on_mount(self) -> None:
        self.refresh_models()

    def refresh_models(self) -> None:
        models_list = self.query_one("#models-list", Vertical)
        models_status = self.query_one("#models-status", Static)
        models_list.remove_children()

        try:
            data = fetch_model_status()
        except HTTPError as error:
            models_status.update(get_backend_error_message(error))
            return
        except TimeoutError:
            models_status.update("Request timed out. Press R to retry.")
            return
        except URLError:
            models_status.update("Could not refresh models. Press R to retry.")
            return

        for model in data["models"]:
            name = model["name"]
            label = f"{model['label']} - {model['description']}"
            status = "Installed" if model["installed"] else "Missing"
            action = "Installed" if model["installed"] else "Download"

            models_list.mount(
                Horizontal(
                    Static(label, classes="model-name"),
                    Static(status, classes="model-state"),
                    Button(action, id=f"model-{name}", disabled=model["installed"]),
                    classes="model-row",
                )
            )

        models_status.update("Ready")

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if not event.button.id or not event.button.id.startswith("model-"):
            return

        model_name = event.button.id.removeprefix("model-")
        button_id = event.button.id
        models_status = self.query_one("#models-status", Static)

        event.button.disabled = True
        event.button.label = "Downloading..."
        event.button.add_class("loading")
        models_status.update(f"Downloading {model_name}...")
        models_status.add_class("downloading")
        self.refresh(layout=True)

        self.set_timer(
            0.2,
            lambda: asyncio.create_task(
                self.download_selected_model(model_name, button_id)
            ),
        )

    async def download_selected_model(self, model_name: str, button_id: str) -> None:
        models_status = self.query_one("#models-status", Static)

        try:
            await asyncio.to_thread(download_model_from_backend, model_name)
        except Exception as error:
            button = self.query_one(f"#{button_id}", Button)
            button.disabled = False
            button.label = "Download"
            button.remove_class("loading")
            models_status.update(get_backend_error_message(error))
            models_status.remove_class("downloading")
            return

        models_status.update(f"{model_name} is ready")
        models_status.remove_class("downloading")
        self.refresh_models()

    def action_refresh(self) -> None:
        self.refresh_models()

    def action_back(self) -> None:
        self.app.pop_screen()


class ConnectionScreen(Screen):
    BINDINGS = [
        ("enter", "continue", "Continue"),
        ("escape", "back", "Back"),
    ]

    def compose(self) -> ComposeResult:
        yield Header()
        yield Container(
            Vertical(
                Static("New Session", classes="page-title"),
                Static("How do you want to connect?", classes="page-subtitle"),
                Horizontal(
                    Button("Local", id="local-session", variant="primary"),
                    id="local-row",
                    classes="button-row",
                ),
                Horizontal(
                    Button("Remote - Coming soon", id="remote-session", disabled=True),
                    id="remote-row",
                    classes="button-row",
                ),
                id="connection",
            ),
            id="shell",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "local-session":
            self.app.push_screen("qr")

    def action_continue(self) -> None:
        self.app.push_screen("qr")

    def action_back(self) -> None:
        self.app.pop_screen()


class QrScreen(Screen):
    BINDINGS = [
        ("escape", "back", "Back"),
    ]

    def compose(self) -> ComposeResult:
        app_url = get_local_app_url()
        qr_text = make_qr_text(app_url)

        yield Header()
        yield Container(
            Vertical(
                Static("Scan to connect", classes="page-title"),
                Static("Open your phone camera and scan this QR code.", classes="page-subtitle"),
                Static(app_url, id="app-url"),
                Static(qr_text, id="qr-code"),
                Static("Waiting for phone...", id="connection-status"),
                id="qr",
            ),
            id="shell",
        )
        yield Footer()

    def on_mount(self) -> None:
        # Keep the QR screen alive by checking whether the phone has opened /app.
        self.set_interval(1, self.refresh_session_status)

    def refresh_session_status(self) -> None:
        try:
            status = fetch_session_status()
        except HTTPError as error:
            self.query_one("#connection-status", Static).update(
                get_backend_error_message(error)
            )
            return
        except TimeoutError:
            return
        except URLError:
            return

        if status.get("connected"):
            connection_status = self.query_one("#connection-status", Static)
            connection_status.update("Phone connected")
            connection_status.add_class("connected")
            # Later, this is where we can move into an ActiveSessionScreen.
            return

        connection_status = self.query_one("#connection-status", Static)
        connection_status.update("Waiting for phone...")
        connection_status.remove_class("connected")

    def action_back(self) -> None:
        self.app.pop_screen()


class CortextApp(App):
    CSS = """
    Screen {
        background: $background;
        color: $text;
    }

    #shell {
        width: 100%;
        height: 100%;
        align: center middle;
    }

    #home,
    #connection,
    #qr,
    #models {
        width: 80;
        height: auto;
        align-horizontal: center;
    }

    #brand {
        text-style: bold;
        color: $text;
        text-align: center;
        width: 100%;
    }

    #tagline,
    .page-subtitle {
        color: $text-muted;
        margin-top: 1;
        text-align: center;
        width: 100%;
    }

    .page-title {
        color: $text;
        text-style: bold;
        text-align: center;
        width: 100%;
    }

    Button {
        width: 30;
        content-align: center middle;
    }

    #new-session {
        margin: 0;
    }

    #actions {
        width: 100%;
        height: auto;
        align-horizontal: center;
        margin-top: 2;
        margin-bottom: 1;
    }

    .button-row {
        width: 100%;
        height: auto;
        align-horizontal: center;
    }

    #local-row {
        margin-top: 3;
    }

    #remote-row {
        margin-top: 1;
    }

    #models-action {
        margin-bottom: 2;
    }

    #models-list {
        width: 70;
        height: auto;
        margin-top: 3;
    }

    .model-row {
        width: 100%;
        height: 3;
        align: center middle;
    }

    .model-name {
        width: 32;
        color: $text;
    }

    .model-state {
        width: 14;
        color: $text-muted;
    }

    .model-row Button {
        width: 18;
    }

    #models-status {
        color: $text-muted;
        margin-top: 2;
        text-align: center;
        width: 100%;
    }

    #models-status.downloading {
        color: $primary;
        text-style: bold;
    }

    Button.loading {
        text-style: bold;
    }

    #qr-code {
        color: $text;
        background: $background;
        margin-top: 2;
        margin-bottom: 2;
        text-align: center;
        content-align: center middle;
    }

    #connection-status {
        color: $text-muted;
        margin-top: 2;
        text-align: center;
        width: 100%;
    }

    #connection-status.connected {
        color: $success;
        text-style: bold;
    }

    #app-url {
        color: $text-muted;
        margin-top: 2;
        text-align: center;
        width: 100%;
    }
    """

    BINDINGS = [
        ("q", "quit", "Quit"),
    ]

    SCREENS = {
        "home": HomeScreen,
        "connection": ConnectionScreen,
        "models": ModelsScreen,
        "qr": QrScreen,
    }

    def on_mount(self) -> None:
        self.push_screen("home")


if __name__ == "__main__":
    app = CortextApp()
    app.run()
