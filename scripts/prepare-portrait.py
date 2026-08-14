#!/usr/bin/env python3
"""
Prepare a portrait for the profile card.

The card renders its portrait at a 4:5 aspect, full-bleed, with a scrim
fading the bottom into the card. That means the source has to be trimmed of
any surrounding whitespace and cropped so the subject's face sits in the
UPPER portion of the frame — anything in the bottom third will be under the
scrim and the name plate.

Usage:
    python3 scripts/prepare-portrait.py <source-image> [--focus 0.34] [--zoom 1.0]

    --focus  Vertical centre of the crop as a fraction of the trimmed image
             (0 = top, 1 = bottom). Lower values keep more headroom and push
             the face higher in the frame. Default 0.34.
    --zoom   >1 crops tighter around the focus point. Default 1.0 (use the
             full available width).

Writes public/portrait.jpg at 800x1000. Then set `portrait: '/portrait.jpg'`
on `profile` in lib/career.ts.

Requires Pillow:  pip install Pillow
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops

TARGET_W, TARGET_H = 800, 1000  # 4:5, matches the card
OUT = Path(__file__).resolve().parent.parent / "public" / "portrait.jpg"


def trim_border(im: Image.Image, tolerance: int = 12) -> Image.Image:
    """
    Remove a uniform border by comparing against the top-left pixel. Written
    against a white-matted export, but works for any flat surround.
    """
    rgb = im.convert("RGB")
    bg = Image.new("RGB", rgb.size, rgb.getpixel((0, 0)))
    diff = ImageChops.difference(rgb, bg)
    # Amplify so near-matches still fall below the threshold.
    diff = ImageChops.add(diff, diff, 2.0, -tolerance)
    box = diff.getbbox()
    return im.crop(box) if box else im


def crop_to_aspect(im: Image.Image, focus: float, zoom: float) -> Image.Image:
    """Crop to 4:5 around a vertical focus point, clamped to the image."""
    w, h = im.size
    crop_w = min(w, int(w / max(zoom, 1.0)))
    crop_h = int(crop_w * TARGET_H / TARGET_W)

    # If the source is too short for a 4:5 crop at full width, drive the
    # crop from the height instead so nothing is invented.
    if crop_h > h:
        crop_h = h
        crop_w = int(crop_h * TARGET_W / TARGET_H)

    left = (w - crop_w) // 2
    top = int(h * focus - crop_h / 2)
    top = max(0, min(top, h - crop_h))
    return im.crop((left, top, left + crop_w, top + crop_h))


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--focus", type=float, default=0.34)
    ap.add_argument("--zoom", type=float, default=1.0)
    args = ap.parse_args()

    src = Path(args.source)
    if not src.exists():
        print(f"not found: {src}", file=sys.stderr)
        return 1

    im = Image.open(src)
    print(f"source      {im.size[0]}x{im.size[1]}")

    im = trim_border(im)
    print(f"trimmed     {im.size[0]}x{im.size[1]}")

    im = crop_to_aspect(im, args.focus, args.zoom)
    print(f"cropped     {im.size[0]}x{im.size[1]}")

    im = im.convert("RGB").resize((TARGET_W, TARGET_H), Image.LANCZOS)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"wrote       {OUT}  ({OUT.stat().st_size // 1024} kB)")
    print("\nNext: set  portrait: '/portrait.jpg'  on `profile` in lib/career.ts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
