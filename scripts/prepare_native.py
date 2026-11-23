"""Apply the native location disclosures/permissions after Capacitor creates platforms."""
from pathlib import Path
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]


def patch_ios() -> None:
    plist = ROOT / "ios/App/App/Info.plist"
    if plist.exists():
        text = plist.read_text()
        location_strings = {
            "NSLocationWhenInUseUsageDescription": "Location is used only to determine whether you are inside the NYU Shanghai Qiantan campus reminder area.",
            "NSLocationAlwaysAndWhenInUseUsageDescription": "If you opt in, location is checked in the background only to decide whether campus-to-dorm bus reminders should be active. Location is not uploaded or stored as a history.",
        }
        def insert_top_level(snippet: str) -> None:
            nonlocal text
            outer_close = text.rfind("</dict>")
            text = text[:outer_close] + snippet + text[outer_close:]

        for key, value in location_strings.items():
            if f"<key>{key}</key>" not in text:
                insert_top_level(f"<key>{key}</key><string>{value}</string>")
        if "<key>UIBackgroundModes</key>" not in text:
            insert_top_level("<key>UIBackgroundModes</key><array><string>location</string></array>")
        elif "<string>location</string>" not in text:
            text = re.sub(r"(<key>UIBackgroundModes</key>\s*<array>)", r"\1<string>location</string>", text, count=1)
        plist.write_text(text)

    delegate = ROOT / "ios/App/App/AppDelegate.swift"
    if delegate.exists():
        text = delegate.read_text()
        import_block = "#if canImport(CapgoBackgroundGeolocationPlugin)\nimport CapgoBackgroundGeolocationPlugin\n#endif\n"
        if "import CapgoBackgroundGeolocationPlugin" not in text:
            text = text.replace("import UIKit\n", "import UIKit\n" + import_block, 1)
        relay_block = "#if canImport(CapgoBackgroundGeolocationPlugin)\n        GeofenceRelay.shared.start()\n        #endif\n"
        if "GeofenceRelay.shared.start()" not in text:
            text = text.replace("return true", relay_block + "        return true", 1)
        delegate.write_text(text)


def patch_android() -> None:
    manifest = ROOT / "android/app/src/main/AndroidManifest.xml"
    if manifest.exists():
        ET.register_namespace("android", "http://schemas.android.com/apk/res/android")
        tree = ET.parse(manifest)
        root = tree.getroot()
        android_name = "{http://schemas.android.com/apk/res/android}name"
        permission = "android.permission.ACCESS_BACKGROUND_LOCATION"
        if not any(node.tag == "uses-permission" and node.get(android_name) == permission for node in root):
            node = ET.Element("uses-permission", {android_name: permission})
            app = root.find("application")
            root.insert(list(root).index(app) if app is not None else len(root), node)
        tree.write(manifest, encoding="utf-8", xml_declaration=True)


if __name__ == "__main__":
    patch_ios()
    patch_android()
