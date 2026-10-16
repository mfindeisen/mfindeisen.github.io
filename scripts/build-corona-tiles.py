#!/usr/bin/env python3
"""Build WebP tiles for the August 1968 Corona view of Erbil.

The two frames in the repo root are adjacent KH-4B exposures (mission 1104,
7 August 1968). Each one covers only part of the city, so this mosaics them
and writes an XYZ tile pyramid for just Erbil and its immediate surroundings.

Output: public/static/textures/corona/{z}/{x}/{y}.webp

The geographic bounds below are duplicated in public/src/map/MapManager.ts.
"""

from __future__ import annotations

import argparse
import math
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT_DIR = ROOT / "public" / "static" / "textures" / "corona"

# City plus the fields and roads just outside the ring. About 14 km across.
WEST, SOUTH, EAST, NORTH = 43.935, 36.125, 44.085, 36.260
Z_MIN, Z_MAX = 12, 16
WEBP_QUALITY = 72

# Valid pixels at or below this are the black film margin (GDAL nodata is 0).
NODATA_MAX = 4

FRAMES = (
    {
        "path": ROOT / "ds1104-2138da010.tif",
        "scale": 2.1578405217326235e-05,
        "lon0": 42.56879923301208,
        "lat0": 36.41894775409684,
    },
    {
        "path": ROOT / "ds1104-2138da011.tif",
        "scale": 2.157106926858887e-05,
        "lon0": 42.588829534948,
        "lat0": 36.299944802269465,
    },
)

# Mosaic grid uses the first frame's pixel size, which matches the scan.
SCALE = FRAMES[0]["scale"]


def read_frame(frame: dict) -> tuple[np.ndarray, int, int]:
    """Read the Erbil window. Tiepoint is the upper-left corner of pixel 0,0."""
    scale, lon0, lat0 = frame["scale"], frame["lon0"], frame["lat0"]
    pad = 3
    c0 = math.floor((WEST - lon0) / scale - 0.5) - pad
    c1 = math.ceil((EAST - lon0) / scale - 0.5) + pad
    r0 = math.floor((lat0 - NORTH) / scale - 0.5) - pad
    r1 = math.ceil((lat0 - SOUTH) / scale - 0.5) + pad

    with Image.open(frame["path"]) as im:
        c0 = max(0, c0)
        r0 = max(0, r0)
        c1 = min(im.width, c1)
        r1 = min(im.height, r1)
        crop = np.asarray(im.crop((c0, r0, c1, r1)), dtype=np.uint8)
    print(f"  {frame['path'].name}: {crop.shape[1]}x{crop.shape[0]} from col {c0}, row {r0}")
    return crop, c0, r0


def sample(
    img: np.ndarray,
    origin_col: float,
    origin_row: float,
    cols: np.ndarray,
    rows: np.ndarray,
    valid_mask: np.ndarray | None = None,
):
    """Bilinear sample. Invalid neighbors are left out so the black film margin does not bleed in."""
    height, width = img.shape
    src_c = cols - origin_col
    src_r = rows - origin_row
    c0 = np.floor(src_c).astype(np.int32)
    r0 = np.floor(src_r).astype(np.int32)
    wc = (src_c - c0).astype(np.float32)
    wr = (src_r - r0).astype(np.float32)
    c1 = c0 + 1
    r1 = r0 + 1

    def at(rr, cc):
        ok = (rr >= 0) & (rr < height) & (cc >= 0) & (cc < width)
        rr_c = np.clip(rr, 0, height - 1)
        cc_c = np.clip(cc, 0, width - 1)
        val = img[rr_c, cc_c]
        if valid_mask is None:
            valid = ok & (val > NODATA_MAX)
        else:
            valid = ok & valid_mask[rr_c, cc_c]
        return val.astype(np.float32), valid

    v00, m00 = at(r0, c0)
    v10, m10 = at(r0, c1)
    v01, m01 = at(r1, c0)
    v11, m11 = at(r1, c1)
    w00 = m00 * (1 - wc) * (1 - wr)
    w10 = m10 * wc * (1 - wr)
    w01 = m01 * (1 - wc) * wr
    w11 = m11 * wc * wr
    weight = w00 + w10 + w01 + w11
    value = (v00 * w00 + v10 * w10 + v01 * w01 + v11 * w11) / np.maximum(weight, 1e-6)
    return value, weight


def build_mosaic(frames: list[tuple[np.ndarray, int, int]]) -> tuple[np.ndarray, np.ndarray]:
    width = math.ceil((EAST - WEST) / SCALE)
    height = math.ceil((NORTH - SOUTH) / SCALE)
    mosaic = np.zeros((height, width), np.float32)
    covered = np.zeros((height, width), np.bool_)
    print(f"mosaic {width}x{height}")

    # Frame 010 is preferred where both overlap: the citadel sits nearer its centre.
    for index, (img, c0, r0) in enumerate(frames):
        scale = FRAMES[index]["scale"]
        lon0 = FRAMES[index]["lon0"]
        lat0 = FRAMES[index]["lat0"]
        for row0 in range(0, height, 512):
            row1 = min(height, row0 + 512)
            rows = np.arange(row0, row1)
            lats = NORTH - (rows + 0.5) * SCALE
            lons = WEST + (np.arange(width) + 0.5) * SCALE
            lon, lat = np.meshgrid(lons, lats)
            src_col = (lon - lon0) / scale - 0.5
            src_row = (lat0 - lat) / scale - 0.5
            value, weight = sample(img, c0, r0, src_col, src_row)
            take = (weight >= 0.5) & ~covered[row0:row1]
            mosaic[row0:row1][take] = value[take]
            covered[row0:row1][take] = True
            print(f"  frame {index} rows {row0}-{row1}")

    valid = mosaic[covered]
    lo, hi = np.percentile(valid, (1, 99.5))
    print(f"stretch {lo:.1f} .. {hi:.1f}  covered {covered.mean():.1%}")
    stretched = np.clip((mosaic - lo) * (255 / (hi - lo)), 0, 255).astype(np.uint8)
    stretched[~covered] = 0
    return stretched, covered


def tile_range(z: int) -> tuple[int, int, int, int]:
    n = 2**z

    def x_of(lon: float) -> int:
        return math.floor((lon + 180) / 360 * n)

    def y_of(lat: float) -> int:
        merc = math.log(math.tan(math.pi / 4 + math.radians(lat) / 2))
        return math.floor((1 - merc / math.pi) / 2 * n)

    return x_of(WEST), x_of(EAST), y_of(NORTH), y_of(SOUTH)


def render_tile(mosaic: np.ndarray, covered: np.ndarray, z: int, x: int, y: int) -> Image.Image | None:
    n = 2**z
    px = (np.arange(256) + 0.5) / 256
    lons = (x + px) / n * 360 - 180
    merc = math.pi * (1 - 2 * (y + px) / n)
    lats = np.degrees(np.arctan(np.sinh(merc)))
    lon, lat = np.meshgrid(lons, lats)
    cols = (lon - WEST) / SCALE - 0.5
    rows = (NORTH - lat) / SCALE - 0.5
    value, weight = sample(mosaic, 0, 0, cols, rows, covered)
    alpha_f = np.clip(weight, 0, 1) * 255
    alpha = np.clip(alpha_f, 0, 255).astype(np.uint8)
    if alpha.max() < 8:
        return None
    gray = np.clip(value, 0, 255).astype(np.uint8)
    gray[alpha < 8] = 0
    alpha[alpha < 8] = 0
    return Image.fromarray(np.dstack([gray, gray, gray, alpha]), "RGBA")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--preview", action="store_true", help="Write a JPEG preview and stop")
    args = parser.parse_args()

    Image.MAX_IMAGE_PIXELS = None
    print("reading frames")
    loaded = [read_frame(frame) for frame in FRAMES]
    mosaic, covered = build_mosaic(loaded)

    preview = Path("/tmp/corona-erbil-mosaic.jpg")
    small = Image.fromarray(mosaic, "L")
    small.thumbnail((1600, 1600), Image.Resampling.LANCZOS)
    # Paint the transparent margin black in the preview so the crop is easy to judge.
    small.save(preview, quality=80)
    print(f"preview {preview}")
    if args.preview:
        return

    total_bytes = 0
    total_tiles = 0
    for z in range(Z_MIN, Z_MAX + 1):
        x0, x1, y0, y1 = tile_range(z)
        print(f"z{z}: x {x0}-{x1}, y {y0}-{y1}")
        for x in range(x0, x1 + 1):
            for y in range(y0, y1 + 1):
                image = render_tile(mosaic, covered, z, x, y)
                if image is None:
                    continue
                path = OUT_DIR / str(z) / str(x) / f"{y}.webp"
                path.parent.mkdir(parents=True, exist_ok=True)
                image.save(path, "WEBP", quality=WEBP_QUALITY, method=4)
                total_bytes += path.stat().st_size
                total_tiles += 1
        print(f"  {total_tiles} tiles, {total_bytes / 1024 / 1024:.1f} MB")

    print(f"done: {total_tiles} tiles, {total_bytes / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
