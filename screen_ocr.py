"""
Screen OCR Tool — Detect and print text from a screen region.

Usage:
  python screen_ocr.py                              # Interactive: click and drag to select a region
  python screen_ocr.py x y width height              # Direct: capture from specific coordinates
  python screen_ocr.py --preview                     # Interactive + show preprocessed image
  python screen_ocr.py --preview x y width height    # Direct + show preprocessed image
"""

import sys
import subprocess
import tempfile
import os
import ctypes
from PIL import Image, ImageOps, ImageFilter, ImageEnhance
import mss

TESSERACT_CMD = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# Make this process DPI-aware on Windows so Tkinter coordinates match real pixels
if sys.platform == "win32":
    try:
        ctypes.windll.shcore.SetProcessDpiAwareness(2)  # Per-monitor DPI aware
    except Exception:
        try:
            ctypes.windll.user32.SetProcessDPIAware()  # Fallback
        except Exception:
            pass


def preprocess_for_ocr(img):
    """Preprocess a screenshot to make it readable by Tesseract.

    Handles light-on-dark UIs by inverting, boosting contrast,
    converting to grayscale, upscaling, and sharpening.
    """
    # Convert to grayscale
    gray = img.convert("L")

    # Detect if this is light text on dark background by checking average brightness.
    # If the image is mostly dark (avg < 128), invert it so text becomes dark-on-light.
    avg_brightness = sum(gray.getdata()) / (gray.size[0] * gray.size[1])
    if avg_brightness < 128:
        gray = ImageOps.invert(gray)

    # Scale up 3x for small text — Tesseract works best on larger images
    w, h = gray.size
    gray = gray.resize((w * 3, h * 3), Image.LANCZOS)

    # Boost contrast
    gray = ImageEnhance.Contrast(gray).enhance(2.0)

    # Sharpen
    gray = gray.filter(ImageFilter.SHARPEN)

    return gray


def capture_region(x, y, width, height, preview=False):
    """Capture a screen region and return OCR text."""
    monitor = {"left": x, "top": y, "width": width, "height": height}
    with mss.mss() as sct:
        screenshot = sct.grab(monitor)
        img = Image.frombytes("RGB", screenshot.size, screenshot.bgra, "raw", "BGRX")

    # Preprocess: invert dark backgrounds, upscale, sharpen
    processed = preprocess_for_ocr(img)

    if preview:
        preview_path = os.path.join(os.path.dirname(__file__), "ocr_preview.png")
        processed.save(preview_path)
        print(f"[Preview] Preprocessed image saved to: {preview_path}")
        # Open it with the default image viewer
        if sys.platform == "win32":
            os.startfile(preview_path)
        elif sys.platform == "darwin":
            subprocess.run(["open", preview_path])
        else:
            subprocess.run(["xdg-open", preview_path])

    # Save to a temp file, run tesseract directly, read the output
    with tempfile.TemporaryDirectory() as tmpdir:
        img_path = os.path.join(tmpdir, "capture.png")
        out_base = os.path.join(tmpdir, "result")
        processed.save(img_path)
        subprocess.run(
            [TESSERACT_CMD, img_path, out_base, "--psm", "6"],
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
        )
        out_path = out_base + ".txt"
        if os.path.exists(out_path):
            with open(out_path, "r", encoding="utf-8") as f:
                return f.read().strip()
    return ""


def interactive_select():
    """Let the user click-drag a rectangle on a transparent overlay, return (x, y, w, h)."""
    import tkinter as tk

    coords = {}

    root = tk.Tk()
    root.attributes("-fullscreen", True)
    root.attributes("-alpha", 0.3)
    root.attributes("-topmost", True)
    root.configure(bg="black")
    root.config(cursor="crosshair")

    canvas = tk.Canvas(root, bg="black", highlightthickness=0)
    canvas.pack(fill="both", expand=True)
    rect_id = None

    def on_press(event):
        coords["x1"] = event.x_root
        coords["y1"] = event.y_root

    def on_drag(event):
        nonlocal rect_id
        if rect_id:
            canvas.delete(rect_id)
        cx1 = coords["x1"] - root.winfo_rootx()
        cy1 = coords["y1"] - root.winfo_rooty()
        cx2 = event.x_root - root.winfo_rootx()
        cy2 = event.y_root - root.winfo_rooty()
        rect_id = canvas.create_rectangle(cx1, cy1, cx2, cy2, outline="red", width=2)

    def on_release(event):
        coords["x2"] = event.x_root
        coords["y2"] = event.y_root
        root.destroy()

    root.bind("<ButtonPress-1>", on_press)
    root.bind("<B1-Motion>", on_drag)
    root.bind("<ButtonRelease-1>", on_release)
    root.bind("<Escape>", lambda e: root.destroy())

    root.mainloop()

    if "x2" not in coords:
        return None

    x = min(coords["x1"], coords["x2"])
    y = min(coords["y1"], coords["y2"])
    w = abs(coords["x2"] - coords["x1"])
    h = abs(coords["y2"] - coords["y1"])

    if w < 5 or h < 5:
        return None

    return x, y, w, h


def normalize(text):
    """Strip OCR jitter: lowercase, keep only alphanumeric chars and spaces, collapse whitespace."""
    import re
    text = text.lower()
    text = re.sub(r"[^a-z0-9 ]", "", text)  # drop punctuation/symbols
    text = re.sub(r"\s+", " ", text).strip()  # collapse whitespace
    return text


def parse_after_receivers(text):
    """Return only the content after the word "Receiver's" (case-insensitive)."""
    import re
    match = re.search(r"[Rr]eceiver'?s", text)
    if match:
        return text[match.end():].strip()
    return text.strip()


def main():
    import time

    preview = "--preview" in sys.argv

    print("Draw a box around the region to monitor (Esc to cancel)...")
    result = interactive_select()
    if result is None:
        print("No region selected.")
        return
    x, y, w, h = result
    print(f"Monitoring region: x={x}, y={y}, width={w}, height={h}")
    print("Scanning every 1 second. Press Ctrl+C to stop.\n")

    last_normalized = None
    last_printed = None

    try:
        while True:
            raw = capture_region(x, y, w, h, preview=preview)
            # Only show preview on the first scan
            if preview:
                preview = False

            current_normalized = normalize(raw) if raw else ""

            if current_normalized != last_normalized:
                last_normalized = current_normalized
                parsed = parse_after_receivers(raw) if raw else ""
                if parsed and "+" in parsed and parsed != last_printed:
                    last_printed = parsed
                    print(f"[{time.strftime('%H:%M:%S')}] {parsed}")

            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopped.")
        return


if __name__ == "__main__":
    main()
