"""Optical spacing for the whole family (area method, after the
HT Letterspacer idea). For every side of a glyph the white area between
the contour and the glyph's extreme is measured inside the glyph's zone
(Hebrew height, x-height or cap height), with each row's depth limited.
The side bearing is then chosen so that every side carries the same
amount of white: straight sides get more room, round and open sides
less, and the whole alphabet gets one even rhythm."""
from engine2 import *

STEP = 6


def _rows(path, y0, y1):
    """for each sampled y: (min x, max x) of ink, or None"""
    from render2 import contours, flatten
    polys = [flatten(ct, 10) for ct in contours(path)]
    rows = []
    y = y0 + STEP / 2
    while y < y1:
        xs = []
        for pts in polys:
            n = len(pts)
            for i in range(n):
                (xa, ya), (xb, yb_) = pts[i], pts[(i + 1) % n]
                if (ya <= y < yb_) or (yb_ <= y < ya):
                    xs.append(xa + (y - ya) * (xb - xa) / (yb_ - ya))
        rows.append((min(xs), max(xs)) if xs else None)
        y += STEP
    return rows


def _white(rows, side, depth):
    ext = [r[0] if side == "L" else r[1] for r in rows if r]
    if not ext:
        return 0.0
    edge = min(ext) if side == "L" else max(ext)
    tot = 0.0
    for r in rows:
        if r is None:
            tot += depth
        else:
            d = (r[0] - edge) if side == "L" else (edge - r[1])
            tot += min(d, depth)
    return tot / len(rows)          # mean white per row, in units


def space_glyph(g, pen, zone, c, depth, min_sb):
    g.dx = 0
    out = g.outline(*pen)
    bb = out.bounds
    if not bb:
        return
    rows = _rows(out, zone[0], zone[1])
    wl = _white(rows, "L", depth)
    wr = _white(rows, "R", depth)
    lsb = max(min_sb, c - wl)
    rsb = max(min_sb, c - wr)
    g.dx = round(lsb - bb[0])
    g.width = round(lsb + (bb[2] - bb[0]) + rsb)


def space_all(LG, HG, lpen, hpen):
    # weight-aware target: heavier weights sit a little tighter
    la = lpen[0]
    hb = hpen[1]
    for ch, g in HG.items():
        c = 64 - 0.20 * (hb - 39)
        space_glyph(g, hpen, (0, HEB), c, depth=0.15 * HEB, min_sb=14)
    for ch, g in LG.items():
        if ch.isupper():
            c = 74 - 0.20 * (la - 39)
            space_glyph(g, lpen, (0, CAP), c, depth=0.15 * CAP, min_sb=12)
        else:
            c = 64 - 0.20 * (la - 39)
            space_glyph(g, lpen, (0, XH), c, depth=0.15 * XH, min_sb=10)
