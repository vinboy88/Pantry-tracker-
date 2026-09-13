#!/usr/bin/env python3
"""Generate PWA PNG icons (no third-party deps)."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "icons"

SAGE = (47, 107, 79, 255)
CREAM = (246, 241, 231, 255)
LABEL = (47, 107, 79, 255)


def write_png(path: Path, width: int, height: int, pixels: list[tuple[int, int, int, int]]) -> None:
    raw = bytearray()
    i = 0
    for _y in range(height):
        raw.append(0)
        for _x in range(width):
            raw.extend(pixels[i])
            i += 1

    def chunk(tag: bytes, data: bytes) -> bytes:
        crc = zlib.crc32(tag + data) & 0xFFFFFFFF
        return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", crc)

    ihdr = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def mix(c1: tuple[int, int, int, int], c2: tuple[int, int, int, int], t: float) -> tuple[int, int, int, int]:
    t = max(0.0, min(1.0, t))
    return (
        int(lerp(c1[0], c2[0], t)),
        int(lerp(c1[1], c2[1], t)),
        int(lerp(c1[2], c2[2], t)),
        int(lerp(c1[3], c2[3], t)),
    )


def rounded_rect_sdf(x: float, y: float, left: float, top: float, right: float, bottom: float, radius: float) -> float:
    cx = min(max(x, left + radius), right - radius)
    cy = min(max(y, top + radius), bottom - radius)
    if left + radius <= x <= right - radius and top + radius <= y <= bottom - radius:
        return -min(x - left, right - x, y - top, bottom - y)
    return math.hypot(x - cx, y - cy) - radius


def coverage(sdf: float, width: float = 1.15) -> float:
    return max(0.0, min(1.0, 0.5 - sdf / width))


def paint_icon(size: int, *, maskable: bool) -> list[tuple[int, int, int, int]]:
    pixels: list[tuple[int, int, int, int]] = []
    inset = size * (0.18 if maskable else 0.0)
    canvas_r = size * (0.22 if not maskable else 0.0)
    jar_left = size * 0.28
    jar_right = size * 0.72
    jar_top = size * 0.34
    jar_bottom = size * 0.78
    lid_left = size * 0.36
    lid_right = size * 0.64
    lid_top = size * 0.18
    lid_bottom = size * 0.30
    neck_left = size * 0.41
    neck_right = size * 0.59
    neck_top = size * 0.28
    neck_bottom = size * 0.38
    label_left = size * 0.34
    label_right = size * 0.66
    label_top = size * 0.46
    label_bottom = size * 0.64

    for y in range(size):
        for x in range(size):
            px, py = x + 0.5, y + 0.5
            color = (0, 0, 0, 0) if maskable else SAGE

            bg = rounded_rect_sdf(px, py, inset, inset, size - inset, size - inset, max(size * 0.18, canvas_r))
            color = mix(color, SAGE, coverage(bg))

            body = rounded_rect_sdf(px, py, jar_left, jar_top, jar_right, jar_bottom, size * 0.10)
            color = mix(color, CREAM, coverage(body))

            neck = rounded_rect_sdf(px, py, neck_left, neck_top, neck_right, neck_bottom, size * 0.02)
            color = mix(color, CREAM, coverage(neck))

            lid = rounded_rect_sdf(px, py, lid_left, lid_top, lid_right, lid_bottom, size * 0.035)
            color = mix(color, CREAM, coverage(lid))

            label = rounded_rect_sdf(px, py, label_left, label_top, label_right, label_bottom, size * 0.04)
            color = mix(color, LABEL, coverage(label) * 0.95)

            stripe = rounded_rect_sdf(
                px,
                py,
                label_left + size * 0.04,
                (label_top + label_bottom) / 2 - size * 0.012,
                label_right - size * 0.04,
                (label_top + label_bottom) / 2 + size * 0.012,
                size * 0.01,
            )
            color = mix(color, CREAM, coverage(stripe))

            pixels.append(color)
    return pixels


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    write_png(OUT / "icon-192.png", 192, 192, paint_icon(192, maskable=False))
    write_png(OUT / "icon-512.png", 512, 512, paint_icon(512, maskable=False))
    write_png(OUT / "apple-touch-icon.png", 180, 180, paint_icon(180, maskable=False))
    write_png(OUT / "icon-maskable-512.png", 512, 512, paint_icon(512, maskable=True))
    print(f"Wrote icons to {OUT}")


if __name__ == "__main__":
    main()
