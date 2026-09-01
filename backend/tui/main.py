from pathlib import Path
import json
import ssl
import sys
from urllib.error import URLError
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


def fetch_session_status() -> dict:
    context = ssl._create_unverified_context()

    with urlopen(get_session_status_url(), context=context, timeout=1) as response:
        return json.loads(response.read().decode("utf-8"))


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
                Static("No active session", id="session-status"),
                id="home",
            ),
            id="shell",
        )
        yield Footer()

    def on_button_pressed(self, event: Button.Pressed) -> None:
        if event.button.id == "new-session":
            self.app.push_screen("connection")


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
        except URLError:
            self.query_one("#connection-status", Static).update("Backend not reachable")
            return
        except TimeoutError:
            self.query_one("#connection-status", Static).update("Backend not reachable")
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
    $background: #0f1115;
    $text: #e5e7eb;
    $heading: #ffffff;
    $muted: #9ca3af;
    $subtle: #6b7280;
    $accent: #3b82f6;
    $accent-dark: #1d4ed8;

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
    #qr {
        width: 80;
        height: auto;
        align-horizontal: center;
    }

    #brand {
        text-style: bold;
        color: $heading;
        text-align: center;
        width: 100%;
    }

    #tagline,
    .page-subtitle {
        color: $muted;
        margin-top: 1;
        text-align: center;
        width: 100%;
    }

    .page-title {
        color: $heading;
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
        margin-bottom: 2;
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

    #qr-code {
        color: $heading;
        background: $background;
        margin-top: 2;
        margin-bottom: 2;
        text-align: center;
        content-align: center middle;
    }

    #connection-status,
    #session-status {
        color: $subtle;
        margin-top: 2;
        text-align: center;
        width: 100%;
    }

    #connection-status.connected {
        color: #22c55e;
        text-style: bold;
    }

    #app-url {
        color: $muted;
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
        "qr": QrScreen,
    }

    def on_mount(self) -> None:
        self.push_screen("home")


if __name__ == "__main__":
    app = CortextApp()
    app.run()
