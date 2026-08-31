from pyfiglet import figlet_format
from textual.app import App, ComposeResult
from textual.containers import Container, Horizontal, Vertical
from textual.screen import Screen
from textual.widgets import Button, Footer, Header, Static


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
        yield Header()
        yield Container(
            Vertical(
                Static("Scan to connect", classes="page-title"),
                Static("[ QR code will go here ]", id="qr-placeholder"),
                Static("Open your phone camera and scan this QR code.", classes="page-subtitle"),
                Static("Waiting for phone...", id="connection-status"),
                id="qr",
            ),
            id="shell",
        )
        yield Footer()

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

    #qr-placeholder {
        color: $heading;
        border: round $subtle;
        height: 10;
        margin-top: 3;
        padding: 1 4;
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
