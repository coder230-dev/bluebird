import os
import sys
import json
import subprocess
import webbrowser

from PyQt6.QtCore import Qt, QUrl, QObject, pyqtSlot, QTimer
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QToolBar, QLineEdit, QMessageBox,
    QDialog, QVBoxLayout, QPushButton, QLabel, QWidget
)
from PyQt6.QtGui import QAction, QIcon
from PyQt6.QtWebEngineWidgets import QWebEngineView
from PyQt6.QtWebEngineCore import QWebEngineSettings, QWebEnginePage
from PyQt6.QtWebChannel import QWebChannel

DATA_DIR = os.path.join(os.path.expanduser("~"), "PortalAppData")
os.makedirs(DATA_DIR, exist_ok=True)

SETTINGS_FILE = os.path.join(DATA_DIR, "settings.json")

def save_json(filepath, data):
    with open(filepath, "w") as f:
        json.dump(data, f, indent=4)

def load_json(filepath):
    if os.path.exists(filepath):
        try:
            with open(filepath, "r") as f:
                return json.load(f)
        except Exception:
            return {}
    return {}

def open_in_default_browser(url: QUrl):
    """Opens the given URL in the system's default web browser."""
    webbrowser.open(url.toString())

class SettingsHandler(QObject):
    def __init__(self):
        super().__init__()
        self.settings = load_json(SETTINGS_FILE)
        self.settings.setdefault("localStorage", {})
        self.settings.setdefault("sessionStorage", {})
        self.settings.setdefault("indexedDB", {})
        self.settings.setdefault("zoom", 1.0)
        self.auto_save_timer = QTimer()
        self.auto_save_timer.timeout.connect(self.save_settings)
        self.auto_save_timer.start(1000)  # Auto-save every second

    @pyqtSlot(str, str)
    def updateLocalStorage(self, key, value):
        self.settings["localStorage"][key] = value

    @pyqtSlot(str)
    def removeLocalStorage(self, key):
        self.settings["localStorage"].pop(key, None)

    @pyqtSlot(str, str)
    def updateSessionStorage(self, key, value):
        self.settings["sessionStorage"][key] = value

    @pyqtSlot(str)
    def removeSessionStorage(self, key):
        self.settings["sessionStorage"].pop(key, None)

    @pyqtSlot(str, str)
    def updateIndexedDB(self, key, value):
        self.settings["indexedDB"][key] = value

    def save_settings(self):
        save_json(SETTINGS_FILE, self.settings)

class CustomWebEnginePage(QWebEnginePage):
    def acceptNavigationRequest(self, url: QUrl, nav_type: QWebEnginePage.NavigationType, isMainFrame: bool) -> bool:
        """Intercept all <a> link clicks and open in the default browser."""
        if nav_type == QWebEnginePage.NavigationType.NavigationTypeLinkClicked:
            open_in_default_browser(url)
            return False  # Prevent internal navigation
        return True

class CustomWebEngineView(QWebEngineView):
    def __init__(self, parent=None):
        super().__init__(parent)
        settings = self.settings()
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        settings.setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)

        self.channel = QWebChannel()
        self.settingsHandler = SettingsHandler()
        self.channel.registerObject("settingsHandler", self.settingsHandler)

        custom_page = CustomWebEnginePage(self)
        custom_page.setWebChannel(self.channel)
        self.setPage(custom_page)

    def createWindow(self, _type):
        self.page().urlChanged.connect(lambda url: open_in_default_browser(url))
        return None

class SettingsWindow(QDialog):
    def __init__(self, settingsHandler, parent=None):
        super().__init__(parent)
        self.settingsHandler = settingsHandler
        self.setWindowTitle("Settings - Manage Storage & Zoom")
        self.resize(300, 250)
        layout = QVBoxLayout(self)

        layout.addWidget(QLabel("Select storage to clear:"))

        self.btn_clear_local = QPushButton("Clear LocalStorage")
        self.btn_clear_local.clicked.connect(self.clear_local)
        layout.addWidget(self.btn_clear_local)

        self.btn_clear_session = QPushButton("Clear SessionStorage")
        self.btn_clear_session.clicked.connect(self.clear_session)
        layout.addWidget(self.btn_clear_session)

        self.btn_clear_indexed = QPushButton("Clear IndexedDB")
        self.btn_clear_indexed.clicked.connect(self.clear_indexed)
        layout.addWidget(self.btn_clear_indexed)

        self.btn_clear_all = QPushButton("Clear All")
        self.btn_clear_all.clicked.connect(self.clear_all)
        layout.addWidget(self.btn_clear_all)

        self.btn_save = QPushButton("Save Settings")
        self.btn_save.clicked.connect(self.save_settings)
        layout.addWidget(self.btn_save)

        self.btn_close = QPushButton("Close")
        self.btn_close.clicked.connect(self.close)
        layout.addWidget(self.btn_close)

    def clear_local(self):
        self.settingsHandler.settings["localStorage"] = {}
        QMessageBox.information(self, "Settings", "LocalStorage cleared.")

    def clear_session(self):
        self.settingsHandler.settings["sessionStorage"] = {}
        QMessageBox.information(self, "Settings", "SessionStorage cleared.")

    def clear_indexed(self):
        self.settingsHandler.settings["indexedDB"] = {}
        QMessageBox.information(self, "Settings", "IndexedDB cleared.")

    def clear_all(self):
        self.settingsHandler.settings = {"localStorage": {}, "sessionStorage": {}, "indexedDB": {}, "zoom": 1.0}
        QMessageBox.information(self, "Settings", "All settings cleared.")

    def save_settings(self):
        self.settingsHandler.save_settings()
        QMessageBox.information(self, "Settings", "Settings saved.")

class MainWindow(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Portal App")
        self.resize(1024, 768)

        self.setup_menu_bar()
        self.setup_nav_toolbar()

        self.webview = CustomWebEngineView(self)
        zoom_info = load_json(SETTINGS_FILE)
        self.webview.setZoomFactor(zoom_info.get("zoom", 1.0))

        self.webview.settings().setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessFileUrls, True)
        self.webview.settings().setAttribute(QWebEngineSettings.WebAttribute.LocalContentCanAccessRemoteUrls, True)
        self.webview.settings().setAttribute(QWebEngineSettings.WebAttribute.JavascriptEnabled, True)

        portal_path = os.path.abspath("website/portal/index.html")
        if os.path.exists(portal_path):
            self.webview.load(QUrl.fromLocalFile(portal_path))
        else:
            self.webview.load(QUrl("https://www.example.com"))
        self.setCentralWidget(self.webview)

    def setup_menu_bar(self):
        menu_bar = self.menuBar()
        file_menu = menu_bar.addMenu("File")

        settings_action = QAction("Settings", self)
        settings_action.triggered.connect(self.open_settings)
        file_menu.addAction(settings_action)

        exit_action = QAction("Exit", self)
        exit_action.setShortcut("Ctrl+Q")
        exit_action.triggered.connect(self.close)
        file_menu.addAction(exit_action)

    def setup_nav_toolbar(self):
        nav_toolbar = QToolBar("Navigation", self)
        nav_toolbar.setMovable(False)
        self.addToolBar(nav_toolbar)

        home_action = QAction("Home", self)
        home_action.triggered.connect(self.go_home)
        nav_toolbar.addAction(home_action)

        self.url_bar = QLineEdit()
        self.url_bar.setPlaceholderText("Enter URL or search query...")
        self.url_bar.returnPressed.connect(self.navigate_to_url)
        nav_toolbar.addWidget(self.url_bar)

    def open_settings(self):
        settings_win = SettingsWindow(self.webview.settingsHandler, self)
        settings_win.exec()

    def go_home(self):
        self.webview.load(QUrl.fromLocalFile(os.path.abspath("website/portal/index.html")))

    def navigate_to_url(self):
        self.webview.load(QUrl(self.url_bar.text().strip()))

if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec())
