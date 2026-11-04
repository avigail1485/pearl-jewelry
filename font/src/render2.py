"""Specimen / process frames for the v2 drawings."""
import os
import sys
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageChops
from engine2 import *
from glyphs2 import latin, hebrew, LATIN_ORDER, HEBREW_ORDER

WEIGHTS = {  # Latin stem width; Hebrew horizontals use the same value
    "ExtraLight": 34,
    "Light": 54,
    "Regular": 78,
    "Medium": 98,
    "SemiBold": 118,
    "Bold": 140,
}
ORDER_W = list(WEIGHTS)

PAPER = (250, 249, 246)
INK = (20, 20, 22)
GUIDE = (214, 210, 202)
GUIDE_TXT = (140, 134, 126)
TINT = (243, 222, 212)
RED = (214, 62, 44)
NODE = (20, 20, 22)
HANDLE = (120, 120, 126)
SB = (236, 170, 150)

FONT_DIR = "/usr/share/fonts/truetype/dejavu/"


def font(size, bold=False):
    p = FONT_DIR + ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    try:
        return ImageFont.truetype(p, size)
    except Exception:
        return ImageFont.load_default()


def pens(weight):
    s = WEIGHTS[weight]
    la = s / 2
    lb = la * 0.9
    hb = s / 2
    ha = hb * 0.9
    return (la, lb), (ha, hb)


def glyph_sets(weight):
    (la, lb), (ha, hb) = pens(weight)
    return latin(la, lb), hebrew(ha, hb), (la, lb), (ha, hb)


# --------------------------------------------------------- flattening
def contours(path):
    """returns list of contours; each contour is a list of segments
    ('L', p) / ('Q', [offs], p) / ('C', c1, c2, p) with start point."""
    out = []
    cur = None
    for verb, pts in path.segments:
        if verb == "moveTo":
            cur = {"start": pts[0], "segs": []}
            out.append(cur)
        elif verb == "lineTo":
            cur["segs"].append(("L", pts[0]))
        elif verb == "qCurveTo":
            cur["segs"].append(("Q", list(pts[:-1]), pts[-1]))
        elif verb == "curveTo":
            cur["segs"].append(("C", pts[0], pts[1], pts[2]))
    return out


def flatten(ct, n=16):
    pts = [ct["start"]]
    p = ct["start"]
    for s in ct["segs"]:
        if s[0] == "L":
            pts.append(s[1])
            p = s[1]
        elif s[0] == "C":
            for i in range(1, n + 1):
                pts.append(bez(p, s[1], s[2], s[3], i / n))
            p = s[3]
        else:
            offs, end = s[1], s[2]
            on = [p]
            ctrl = []
            for i, o in enumerate(offs):
                ctrl.append(o)
                if i < len(offs) - 1:
                    nxt = offs[i + 1]
                    on.append(((o[0] + nxt[0]) / 2, (o[1] + nxt[1]) / 2))
            on.append(end)
            for i, c in enumerate(ctrl):
                a0, a1 = on[i], on[i + 1]
                for k in range(1, n + 1):
                    t = k / n
                    mt = 1 - t
                    pts.append((mt * mt * a0[0] + 2 * mt * t * c[0] + t * t * a1[0],
                                mt * mt * a0[1] + 2 * mt * t * c[1] + t * t * a1[1]))
            p = end
    return pts


def fill_path(img, path, ox, oy, s, color, ss=3):
    """even-odd fill with supersampling"""
    W, H = img.size
    mask = Image.new("1", (W * ss, H * ss), 0)
    for ct in contours(path):
        m = Image.new("1", mask.size, 0)
        pts = [((ox + x * s) * ss, (oy - y * s) * ss) for x, y in flatten(ct)]
        if len(pts) > 2:
            ImageDraw.Draw(m).polygon(pts, fill=1)
        mask = ImageChops.logical_xor(mask, m)
    mask = mask.convert("L").resize((W, H), Image.LANCZOS)
    layer = Image.new("RGB", (W, H), color)
    img.paste(layer, (0, 0), mask)


def outline_draw(d, path, ox, oy, s, color, width=2):
    for ct in contours(path):
        pts = [(ox + x * s, oy - y * s) for x, y in flatten(ct)]
        d.line(pts + [pts[0]], fill=color, width=width, joint="curve")


def nodes_draw(d, path, ox, oy, s):
    T = lambda p: (ox + p[0] * s, oy - p[1] * s)
    for ct in contours(path):
        p = ct["start"]
        for sgm in ct["segs"]:
            if sgm[0] == "C":
                for c, anchor in ((sgm[1], p), (sgm[2], sgm[3])):
                    d.line([T(anchor), T(c)], fill=HANDLE, width=1)
                    x, y = T(c)
                    d.ellipse([x - 3, y - 3, x + 3, y + 3], outline=HANDLE, fill=PAPER, width=1)
                end = sgm[3]
            elif sgm[0] == "Q":
                offs, end = sgm[1], sgm[2]
                chain = [p] + offs + [end]
                d.line([T(q) for q in chain], fill=HANDLE, width=1)
                for c in offs:
                    x, y = T(c)
                    d.ellipse([x - 3, y - 3, x + 3, y + 3], outline=HANDLE, fill=PAPER, width=1)
            else:
                end = sgm[1]
            x, y = T(end)
            d.rectangle([x - 3.5, y - 3.5, x + 3.5, y + 3.5], fill=NODE)
            p = end


def skeleton_draw(d, g, ox, oy, s):
    for sk in g.skeletons():
        pts = sk.sample(40)
        # dotted line
        acc = 0.0
        step = 9
        for i in range(1, len(pts)):
            x0, y0 = ox + pts[i - 1][0] * s, oy - pts[i - 1][1] * s
            x1, y1 = ox + pts[i][0] * s, oy - pts[i][1] * s
            seg = math.hypot(x1 - x0, y1 - y0)
            t = (step - acc) if acc else 0
            while t <= seg and seg > 0:
                x, y = x0 + (x1 - x0) * t / seg, y0 + (y1 - y0) * t / seg
                d.ellipse([x - 1.6, y - 1.6, x + 1.6, y + 1.6], fill=RED)
                t += step
            acc = (acc + seg) % step
        if not sk.closed:
            for q in (pts[0], pts[-1]):
                x, y = ox + q[0] * s, oy - q[1] * s
                d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=RED)
    for pt in g.parts:
        if isinstance(pt, Dot):
            x, y = ox + pt.cx * s, oy - pt.cy * s
            d.ellipse([x - 5, y - 5, x + 5, y + 5], fill=RED)


def metric_lines(g):
    if g.script == "latn":
        return [(ASC, "ascender"), (CAP, "cap height"), (XH, "x-height"), (0, "baseline"), (DESC, "descender")]
    return [(HEB_ASC, "ascender"), (HEB, "Hebrew height"), (0, "baseline"), (DESC, "descender")]


def frame(g, pen, path_out, weight, W=1200, Hh=1400):
    img = Image.new("RGB", (W, Hh), PAPER)
    d = ImageDraw.Draw(img)
    s = 1.0
    oy = 120 + 800 * s
    ox = (W - g.width * s) / 2
    f_s = font(17)
    for y, t in metric_lines(g):
        py = oy - y * s
        d.line([(40, py), (W - 40, py)], fill=GUIDE, width=1)
        d.text((44, py - 22), f"{t}  {y}", fill=GUIDE_TXT, font=f_s)
    for x in (0, g.width):
        px = ox + x * s
        d.line([(px, oy - 860 * s), (px, oy + 250 * s)], fill=SB, width=1)
    out = g.outline(*pen)
    fill_path(img, out, ox, oy, s, TINT)
    d = ImageDraw.Draw(img)
    outline_draw(d, out, ox, oy, s, INK, 2)
    skeleton_draw(d, g, ox, oy, s)
    nodes_draw(d, out, ox, oy, s)
    # header / footer
    d.text((44, 34), FAMILY_NAME, fill=INK, font=font(26, True))
    d.text((44, 68), f"{weight}  ·  construction view", fill=GUIDE_TXT, font=font(18))
    lsb = round(out.bounds[0]) if out.bounds else 0
    rsb = round(g.width - out.bounds[2]) if out.bounds else 0
    d.text((44, Hh - 70), f"{g.name}   U+{g.uni:04X}   advance {g.width}   LSB {lsb}   RSB {rsb}", fill=INK, font=font(24))
    # small clean preview of the glyph at right bottom
    pv = 0.12
    fill_path(img, out, W - 60 - g.width * pv, Hh - 40, pv, INK)
    img.save(path_out)


def clean_frame(g, pen, path_out, W=1200, Hh=1400, dark=False):
    bg, fg = ((16, 16, 18), (246, 244, 240)) if dark else (PAPER, INK)
    img = Image.new("RGB", (W, Hh), bg)
    s = 1.0
    oy = 120 + 800 * s
    ox = (W - g.width * s) / 2
    fill_path(img, g.outline(*pen), ox, oy, s, fg)
    img.save(path_out)


def sheet(G, order, pen, path_out, cols, title, rtl=False, s=0.26, dark=False):
    bg, fg = ((16, 16, 18), (246, 244, 240)) if dark else (PAPER, INK)
    pad = 60
    cw, ch = int(1000 * s), int(1150 * s)
    rows = (len(order) + cols - 1) // cols
    W, H = pad * 2 + cols * cw, pad * 2 + 70 + rows * ch
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    d.text((pad, 34), title, fill=fg, font=font(26, True))
    for i, chr_ in enumerate(order):
        r, c = divmod(i, cols)
        if rtl:
            c = cols - 1 - c
        g = G[chr_]
        x0, y0 = pad + c * cw, pad + 70 + r * ch
        oy = y0 + 800 * s
        d.line([(x0 + 8, oy), (x0 + cw - 8, oy)], fill=(60, 60, 64) if dark else GUIDE)
        fill_path(img, g.outline(*pen), x0 + (cw - g.width * s) / 2, oy, s, fg)
        d = ImageDraw.Draw(img)
        d.text((x0 + 10, y0 + ch - 34), g.name, fill=GUIDE_TXT, font=font(14))
    img.save(path_out)


def setline(img, items, x, oy, s, color, rtl=False):
    """items: list of (glyph, pen) - simple advance-width setting"""
    if rtl:
        for g, pen in items:
            if g is None:
                x -= 260 * s
                continue
            x -= g.width * s
            fill_path(img, g.outline(*pen), x, oy, s, color)
        return x
    for g, pen in items:
        if g is None:
            x += 260 * s
            continue
        fill_path(img, g.outline(*pen), x, oy, s, color)
        x += g.width * s
    return x


def items_for(text, LG, HG, lp, hp):
    out = []
    for ch in text:
        if ch == " ":
            out.append((None, None))
        elif ch in HG:
            out.append((HG[ch], hp))
        elif ch in LG:
            out.append((LG[ch], lp))
    return out


def waterfall(path_out, lines, title, s=0.075, rtl=False, dark=False):
    bg, fg = ((16, 16, 18), (246, 244, 240)) if dark else (PAPER, INK)
    pad = 70
    lh = int(1250 * s)
    W = 2400
    H = pad * 2 + 80 + lh * len(ORDER_W)
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    d.text((pad, 36), title, fill=fg, font=font(28, True))
    for i, w in enumerate(ORDER_W):
        LG, HG, lp, hp = glyph_sets(w)
        oy = pad + 80 + i * lh + 820 * s
        text = lines[i % len(lines)]
        items = items_for(text, LG, HG, lp, hp)
        if rtl:
            setline(img, items, W - pad, oy, s, fg, rtl=True)
        else:
            setline(img, items, pad + 170, oy, s, fg)
        d = ImageDraw.Draw(img)
        d.text((pad if not rtl else pad, oy - 30), w, fill=RED, font=font(17))
    img.save(path_out)


if __name__ == "__main__":
    out = sys.argv[1]
    what = sys.argv[2] if len(sys.argv) > 2 else "all"
    os.makedirs(out, exist_ok=True)
    if what in ("all", "sheets"):
        for w in ORDER_W:
            LG, HG, lp, hp = glyph_sets(w)
            dd = os.path.join(out, "weights", w)
            os.makedirs(dd, exist_ok=True)
            sheet(LG, LATIN_ORDER[:26], lp, os.path.join(dd, "latin_upper.png"), 7, f"Latin uppercase  -  {w}")
            sheet(LG, LATIN_ORDER[26:], lp, os.path.join(dd, "latin_lower.png"), 7, f"Latin lowercase  -  {w}")
            sheet(HG, HEBREW_ORDER, hp, os.path.join(dd, "hebrew.png"), 7, f"Hebrew  -  {w}", rtl=True)
    if what in ("all", "frames"):
        w = "Regular"
        LG, HG, lp, hp = glyph_sets(w)
        for sub in ("latin_upper", "latin_lower", "hebrew"):
            os.makedirs(os.path.join(out, "closeups", sub), exist_ok=True)
        for ch in LATIN_ORDER:
            g = LG[ch]
            sub = "latin_upper" if ch.isupper() else "latin_lower"
            frame(g, lp, os.path.join(out, "closeups", sub, f"{g.name}.png"), w)
        for i, ch in enumerate(HEBREW_ORDER):
            g = HG[ch]
            frame(g, hp, os.path.join(out, "closeups", "hebrew", f"{i+1:02d}_{g.name}.png"), w)


def concept(path_out, chars, title, sub):
    """large letters with the single pen-path skeleton drawn over them"""
    LG, HG, lp, hp = glyph_sets("Regular")
    s = 0.62
    W, H = 2400, 1100
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    d.text((70, 50), title, fill=INK, font=font(40, True))
    d.text((70, 104), sub, fill=GUIDE_TXT, font=font(22))
    items = [((HG.get(c) or LG.get(c)), hp if c in HG else lp) for c in chars]
    total = sum(g.width for g, _ in items) * s
    x = (W - total) / 2
    oy = 300 + 800 * s
    for y in (0, XH, HEB, ASC, DESC):
        d.line([(60, oy - y * s), (W - 60, oy - y * s)], fill=GUIDE)
    for g, pen in items:
        out = g.outline(*pen)
        fill_path(img, out, x, oy, s, TINT)
        d = ImageDraw.Draw(img)
        skeleton_draw(d, g, x, oy, s)
        x += g.width * s
    img.save(path_out)


def charset(path_out, weight, dark=True):
    LG, HG, lp, hp = glyph_sets(weight)
    bg, fg = ((10, 10, 12), (246, 244, 240)) if dark else (PAPER, INK)
    s = 0.105
    lines = [("".join(LATIN_ORDER[26:]) + "".join(LATIN_ORDER[:26]), False),
             ("".join(HEBREW_ORDER), True)]
    W = 2600
    H = 420
    img = Image.new("RGB", (W, H), bg)
    d = ImageDraw.Draw(img)
    d.text((40, 24), f"{FAMILY_NAME} {weight}", fill=(150, 146, 140), font=font(20))
    s = min(s, (W - 120) / sum(LG[c].width for c in lines[0][0]))
    for i, (txt, rtl) in enumerate(lines):
        items = items_for(txt, LG, HG, lp, hp)
        tot = sum(g.width for g, _ in items) * s
        oy = 150 + i * 170
        if rtl:
            setline(img, items, (W + tot) / 2, oy, s, fg, rtl=True)
        else:
            setline(img, items, (W - tot) / 2, oy, s, fg)
    img.save(path_out)
