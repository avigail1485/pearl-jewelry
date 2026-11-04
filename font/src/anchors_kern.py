"""Mark anchors for niqqud and contour-measured kerning."""
from engine2 import *
from spacing import _rows
from niqqud import BELOW, CENTER, TOPLEFT, SHIN, SIN

KSTEP = 6


# ------------------------------------------------------------------ anchors
def _ink_intervals(path, y):
    from render2 import contours, flatten
    xs = []
    for ct in contours(path):
        pts = flatten(ct, 10)
        n = len(pts)
        for i in range(n):
            (xa, ya), (xb, yb_) = pts[i], pts[(i + 1) % n]
            if (ya <= y < yb_) or (yb_ <= y < ya):
                xs.append(xa + (y - ya) * (xb - xa) / (yb_ - ya))
    xs.sort()
    return [(xs[i], xs[i + 1]) for i in range(0, len(xs) - 1, 2)]


def hebrew_anchors(HG, hpen, dot_r):
    """returns {glyph name: {class: (x, y)}}"""
    A = {}
    H = HEB
    for ch, g in HG.items():
        out = g.outline(*hpen)
        x0, y0, x1, y1 = out.bounds
        body = _ink_intervals(out, 0.30 * H)
        bx0 = min(i[0] for i in body) if body else x0
        bx1 = max(i[1] for i in body) if body else x1
        cx = (bx0 + bx1) / 2
        an = {}
        # below
        if ch == "ך":
            an[BELOW] = (cx - 0.08 * (bx1 - bx0), 0.50 * H)
        elif ch in "ןףץ":
            an[BELOW] = (cx, HDESC - 20)
        elif ch == "ק":
            top = _ink_intervals(out, 0.85 * H)
            an[BELOW] = (((min(i[0] for i in top) + max(i[1] for i in top)) / 2) if top else cx, 0)
        else:
            top = _ink_intervals(out, 0.85 * H)
            tx0 = min(i[0] for i in top) if top else bx0
            tx1 = max(i[1] for i in top) if top else bx1
            an[BELOW] = ((min(tx0, bx0) + max(tx1, bx1)) / 2, 0)
        # dagesh: middle of the widest counter at mid height
        yy = 0.70 * H if ch == "י" else 0.44 * H
        iv = _ink_intervals(out, yy)
        best = None
        for (a0, a1), (b0, b1) in zip(iv, iv[1:]):
            gapw = b0 - a1
            if gapw > 2.6 * dot_r and (best is None or gapw > best[0]):
                best = (gapw, (a1 + b0) / 2)
        if best:
            an[CENTER] = (best[1], yy)
        else:
            left = min(i[0] for i in iv) if iv else x0
            an[CENTER] = (left - dot_r - 34, yy)
        # holam / rafe: above the top-left corner
        an[TOPLEFT] = (x0 + dot_r * 0.4, H)
        if ch == "ש":
            topi = _ink_intervals(out, 0.92 * H)
            an[SHIN] = ((topi[-1][0] + topi[-1][1]) / 2, H)
            an[SIN] = ((topi[0][0] + topi[0][1]) / 2, H)
        A[g.name] = {k: (round(v[0]), round(v[1])) for k, v in an.items()}
    return A


# ------------------------------------------------------------------ kerning
class Prof:
    def __init__(self, g, pen, y0=-260, y1=860):
        out = g.outline(*pen)
        self.adv = g.width
        b = out.bounds
        self.ok = bool(b)
        if not self.ok:
            return
        self.xmin, self.xmax = b[0], b[2]
        self.rows = _rows(out, y0, y1)


def _pair(pa, pb, rtl):
    """minimum gap over shared rows and the 'excess' over the side bearings"""
    best = None
    for ra, rb in zip(pa.rows, pb.rows):
        if ra is None or rb is None:
            continue
        if rtl:      # a sits on the right, b on the left
            gap = ra[0] + (pb.adv - rb[1])
        else:
            gap = (pa.adv - ra[1]) + rb[0]
        best = gap if best is None else min(best, gap)
    if best is None:
        return None, None
    if rtl:
        sb = pa.xmin + (pb.adv - pb.xmax)
    else:
        sb = (pa.adv - pa.xmax) + pb.xmin
    return best, best - sb


def kern_pairs(glyphs, pens, left_set, right_set, rtl, factor=0.46, kmin=-110, floor=40, punct=()):
    """glyphs: {ch: Glyph}; pens: {ch: pen}. returns [(nameA, nameB, value)]"""
    prof = {ch: Prof(glyphs[ch], pens[ch]) for ch in set(left_set) | set(right_set)}
    out = []
    for a in left_set:
        pa = prof[a]
        if not pa.ok:
            continue
        for b in right_set:
            pb = prof[b]
            if not pb.ok:
                continue
            mg, excess = _pair(pa, pb, rtl)
            if mg is None:
                continue
            k = -factor * excess
            lim = -80 if (a in punct or b in punct) else kmin
            k = max(k, lim, floor - mg)       # never closer than `floor`
            k = min(k, 0)
            k = int(round(k / 5.0) * 5)
            if k <= -20:
                out.append((glyphs[a].name, glyphs[b].name, k))
    return out
