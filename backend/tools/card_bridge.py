"""USB bridge between the ESP32 RFID reader and the backend.

The ESP32 prints a line like 'UID: 73 66 E7 06' on its serial port whenever a card is tapped. This script reads
those lines and posts each UID to POST /api/card/tap with the shared device secret. The backend then answers
whichever request the browser has open (register a card, or verify one). The UID only travels laptop -> server;
it is never printed in full or saved here.

Run (from backend/, with the server already running):
    SMARTGULLAK_DEVICE_SECRET='dev-secret-change-me' .venv/bin/python tools/card_bridge.py [port]
The port defaults to the first /dev/cu.usbserial* or /dev/cu.SLAB* (macOS) or /dev/ttyUSB* (Linux).
Close the Arduino IDE Serial Monitor first: only one program can hold the port. This script echoes the
sketch's other output (prefixed 'ESP32 |'), so the Serial Monitor is not needed while it runs.
"""
import glob
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

import serial

SERVER = os.environ.get("SMARTGULLAK_SERVER", "http://localhost:8000")
SECRET = os.environ.get("SMARTGULLAK_DEVICE_SECRET")
BAUD = 115200  # must match Serial.begin() in the sketch
UID_LINE = re.compile(r"UID:\s*([0-9A-Fa-f][0-9A-Fa-f :]*)")
REPEAT_SECONDS = 2  # the same card read twice within this is one tap, not two


def find_port():
    ports = sorted(glob.glob("/dev/cu.usbserial*") + glob.glob("/dev/cu.SLAB*") + glob.glob("/dev/ttyUSB*"))
    if not ports:
        sys.exit("No ESP32 found on USB. Plug it in, or pass the port: card_bridge.py /dev/cu.usbserial-0001")
    return ports[0]


def open_port(port):
    """Open the port WITHOUT touching DTR/RTS. On ESP32 boards those lines drive reset (EN) and boot mode (GPIO0):
    pyserial's default asserts them, which holds the board in a reset loop instead of running the sketch."""
    device = serial.Serial()
    device.port, device.baudrate, device.timeout = port, BAUD, 1
    device.dtr = device.rts = False
    device.open()
    return device


def post_tap(uid):
    """POST the UID; returns (HTTP status, JSON body). Network failures come back as status 0."""
    req = urllib.request.Request(f"{SERVER}/api/card/tap", data=json.dumps({"uid": uid}).encode(), method="POST",
                                 headers={"Content-Type": "application/json", "X-Device-Secret": SECRET})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return resp.status, json.load(resp)
    except urllib.error.HTTPError as e:
        return e.code, json.load(e)
    except (urllib.error.URLError, TimeoutError) as e:
        return 0, {"detail": {"reason": f"Cannot reach {SERVER}: {e}"}}


def describe(status, body):
    """One readable line for the terminal."""
    if status == 200:
        return f"OK: card {body['status']} (ends {body['last4']})"
    detail = body.get("detail", {})
    reason = detail.get("reason", detail) if isinstance(detail, dict) else detail
    return f"Refused ({status}): {reason}"


def main():
    if not SECRET:
        sys.exit("Set SMARTGULLAK_DEVICE_SECRET to the same value the server was started with.")
    port = sys.argv[1] if len(sys.argv) > 1 else find_port()
    print(f"Listening on {port} at {BAUD} baud; posting taps to {SERVER}. Ctrl+C to stop.")
    last_uid, last_time = None, 0.0
    with open_port(port) as device:
        while True:
            line = device.readline().decode(errors="ignore").strip()
            if line and not UID_LINE.search(line):
                print(f"ESP32 | {line}")  # everything else the sketch prints: this terminal replaces the Serial Monitor
            match = UID_LINE.search(line)
            if not match:
                continue
            uid = match.group(1).strip()
            if uid == last_uid and time.monotonic() - last_time < REPEAT_SECONDS:
                continue
            last_uid, last_time = uid, time.monotonic()
            print(f"Tap: card ending {uid.replace(' ', '')[-4:]} -> {describe(*post_tap(uid))}")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nStopped.")
    except serial.SerialException as e:
        sys.exit(f"Cannot open the serial port ({e}). Is the Arduino IDE Serial Monitor still open?")
