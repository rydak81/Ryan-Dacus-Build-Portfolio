#!/usr/bin/env python3
"""
Prepare a portrait for the profile card.

The card renders its portrait at a 4:5 aspect, full-bleed, with a scrim
fading the bottom into the card. That means the source has to be trimmed of
any surrounding whitespace and cropped so the subject's face sits in the
UPPER portion of the frame — anything in the bottom third will be under the
scrim and the name plate.

Usage:
    python3 scripts/prepare-portrait.py <source-image> [options]

    --focus    Vertical centre of the crop as a fraction of the source
               (0 = top, 1 = bottom). Lower values keep more headroom and
               push the face higher in the frame. Default 0.40.
    --zoom     >1 crops tighter around the focus point. Default 1.0.
    --no-trim  Skip matte removal. Use this for a studio photograph: its
               backdrop reaches every edge, so trimming would crop to the
               subject's bounding box and eat all the headroom. Trimming is
               for a matted export (an illustration on white, say).
    --no-vignette
               Skip the edge falloff. On by default because a photograph
               with a light studio backdrop otherwise glares against the
               dark card; the falloff is what lets the image sit in the UI
               rather than on top of it.

Writes public/portrait.jpg at 800x1000. Then set `portrait: '/portrait.jpg'`
on `profile` in lib/career.ts.

Requires Pillow:  pip install Pillow
"""

import argparse
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

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


def vignette(
    im: Image.Image,
    strength: float = 0.72,
    tint: tuple[int, int, int] = (24, 32, 70),
) -> Image.Image:
    """
    Darken the edges so the picture falls off into the card instead of
    ending at a hard rectangle.

    Two masks multiplied together. The radial one is an ellipse offset
    upward, so the falloff is gentlest across the face and strongest at the
    corners. The vertical one drives the bottom third down hard, which is
    what lets the photograph hand off to the card's scrim without a visible
    change of slope — the two fades read as one.

    The dark end is pulled toward `tint`, the card's navy ground
    (--profile-ground, oklch(0.2 0.07 268)), rather than toward neutral
    black. A neutral falloff was right when the card sat on near-black; on
    navy it reads as a grey halo around the subject. Compositing against a
    darkened, tinted copy of the image rather than against a flat colour
    keeps skin tone intact while the studio backdrop loses its glare — a
    light-grey seamless is the whole problem this solves, since untreated
    it reads as a lit rectangle pasted onto a coloured UI.
    """
    w, h = im.size

    radial = Image.new("L", (w, h), 0)
    ImageDraw.Draw(radial).ellipse(
        [-w * 0.08, -h * 0.24, w * 1.08, h * 0.86], fill=255
    )
    radial = radial.filter(ImageFilter.GaussianBlur(radius=min(w, h) * 0.26))

    # Brightest across the face, falling off both ways: a gentle ramp above
    # 14% so the top of the card does not glare against the ground, and a
    # hard one below 45% that hands off to the scrim.
    vertical = Image.new("L", (w, h), 255)
    vd = ImageDraw.Draw(vertical)
    top_end, top_floor = int(h * 0.14), 150
    for y in range(0, top_end):
        t = y / max(1, top_end)
        vd.line([(0, y), (w, y)], fill=int(top_floor + (255 - top_floor) * t))

    start, floor = int(h * 0.45), 40
    for y in range(start, h):
        t = (y - start) / max(1, h - start)
        vd.line([(0, y), (w, y)], fill=int(255 - (255 - floor) * t * t))

    mask = ImageChops.multiply(radial, vertical)
    dark = Image.eval(im, lambda v: int(v * (1.0 - strength)))
    dark = Image.blend(dark, Image.new("RGB", (w, h), tint), 0.55)
    return Image.composite(im, dark, mask)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("source")
    ap.add_argument("--focus", type=float, default=0.40)
    ap.add_argument("--zoom", type=float, default=1.0)
    ap.add_argument("--no-trim", dest="trim", action="store_false")
    ap.add_argument("--no-vignette", dest="vignette", action="store_false")
    args = ap.parse_args()

    src = Path(args.source)
    if not src.exists():
        print(f"not found: {src}", file=sys.stderr)
        return 1

    im = Image.open(src)
    print(f"source      {im.size[0]}x{im.size[1]}")

    if args.trim:
        im = trim_border(im)
        print(f"trimmed     {im.size[0]}x{im.size[1]}")

    im = crop_to_aspect(im, args.focus, args.zoom)
    print(f"cropped     {im.size[0]}x{im.size[1]}")

    im = im.convert("RGB").resize((TARGET_W, TARGET_H), Image.LANCZOS)

    if args.vignette:
        im = vignette(im)
        print("vignette    applied")
    OUT.parent.mkdir(parents=True, exist_ok=True)
    im.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"wrote       {OUT}  ({OUT.stat().st_size // 1024} kB)")
    print("\nNext: set  portrait: '/portrait.jpg'  on `profile` in lib/career.ts")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
