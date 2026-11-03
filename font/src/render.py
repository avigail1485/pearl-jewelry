"""Render specimen frames (close-ups) and overview sheets as PNG."""
import os
import sys
from PIL import Image, ImageDraw, ImageFont
from engine import *
from glyphs import latin, hebrew, LATIN_ORDER, HEBREW_ORDER

INK = (24, 24, 28)
PAPER = (247, 245, 240)
GUIDE = (205, 200, 190)
ACCENT = (196, 92, 60)
LABEL = (120, 115, 108)

WEIGHTS = {  # name: (latin a, b), (hebrew a, b)
    "Thin": ((11, 10), (9.5, 11.5)),
    "Light": ((26, 23), (22, 27)),
    "Regular": ((42, 37), (36, 43)),
    "Medium": ((54, 47), (46, 55)),
    "Bold": ((70, 60), (60, 71)),
    "Black": ((88, 75), (75, 89)),
}


def label_font(size):
    for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
              "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def paint(draw, geom, ox, oy, s, fill=INK):
    """ox, oy: pixel position of glyph origin (baseline-left)."""
    for poly in polygons(geom):
        ext = [(ox + x * s, oy - y * s) for x, y in poly.exterior.coords]
        draw.polygon(ext, fill=fill)
        for hole in poly.interiors:
            draw.polygon([(ox + x * s, oy - y * s) for x, y in hole.coords], fill=PAPER)


def glyph_sets(weight="Regular"):
    (la, lb), (ha, hb) = WEIGHTS[weight]
    return latin(Pen(la, lb)), hebrew(Pen(ha, hb)), Pen(la, lb), Pen(ha, hb)


def frame(g, pen, path, W=900, Hh=1100):
    img = Image.new("RGB", (W, Hh), PAPER)
    d = ImageDraw.Draw(img)
    s = 0.86
    top_units = 820
    oy = 60 + top_units * s
    ox = (W - g.width * s) / 2
    lines = [(0, "baseline 0")]
    if g.script == "latn":
        lines += [(XH, f"x-height {XH}"), (CAP, f"cap {CAP}"), (ASC, f"ascender {ASC}"), (DESC, f"descender {DESC}")]
    else:
        lines += [(HEB, f"body {HEB}"), (HEB_ASC, f"ascender {HEB_ASC}"), (DESC, f"descender {DESC}")]
    f_small = label_font(17)
    for y, t in lines:
        py = oy - y * s
        d.line([(30, py), (W - 30, py)], fill=GUIDE, width=1)
        d.text((34, py - 21), t, fill=LABEL, font=f_small)
    # sidebearings
    for x in (0, g.width):
        px = ox + x * s
        d.line([(px, oy - (ASC + 50) * s), (px, oy - (DESC - 30) * s)], fill=(225, 160, 140), width=1)
    paint(d, g.outline(pen), ox, oy, s)
    f_big = label_font(30)
    cap = f"{g.name}   U+{g.uni:04X}   advance {g.width}"
    d.text((34, Hh - 62), cap, fill=INK, font=f_big)
    img.save(path)


def sheet(glyphs, order, pen, path, cols, s=0.24, cell_w=None, title="", rtl=False):
    pad = 50
    rows = (len(order) + cols - 1) // cols
    cell_h = int(1100 * s)
    cw = cell_w or int(980 * s)
    W = pad * 2 + cols * cw
    Hh = pad * 2 + rows * cell_h + 60
    img = Image.new("RGB", (W, Hh), PAPER)
    d = ImageDraw.Draw(img)
    f = label_font(22)
    d.text((pad, 24), title, fill=INK, font=f)
    for i, ch in enumerate(order):
        r, c = divmod(i, cols)
        if rtl:
            c = cols - 1 - c
        x0 = pad + c * cw
        y0 = pad + 40 + r * cell_h
        g = glyphs[ch]
        oy = y0 + 830 * s
        ox = x0 + (cw - g.width * s) / 2
        d.line([(x0 + 6, oy), (x0 + cw - 6, oy)], fill=GUIDE)
        paint(d, g.outline(pen), ox, oy, s)
    img.save(path)


def text_line(draw, glyphs_by_char, pens, text, ox, oy, s, rtl=False, tracking=0):
    x = ox
    seq = list(text)
    if rtl:
        # lay out right-to-left starting at ox as the right edge
        for ch in seq:
            if ch == " ":
                x -= 250 * s
                continue
            g, pen = glyphs_by_char[ch]
            x -= (g.width + tracking) * s
            paint(draw, g.outline(pen), x, oy, s)
        return x
    for ch in seq:
        if ch == " ":
            x += 250 * s
            continue
        g, pen = glyphs_by_char[ch]
        paint(draw, g.outline(pen), x, oy, s)
        x += (g.width + tracking) * s
    return x


if __name__ == "__main__":
    out = sys.argv[1]
    weight = sys.argv[2] if len(sys.argv) > 2 else "Regular"
    only = sys.argv[3] if len(sys.argv) > 3 else None
    os.makedirs(out, exist_ok=True)
    LG, HG, lp, hp = glyph_sets(weight)
    if only != "sheets":
        os.makedirs(os.path.join(out, "latin"), exist_ok=True)
        os.makedirs(os.path.join(out, "hebrew"), exist_ok=True)
        for ch in LATIN_ORDER:
            g = LG[ch]
            sub = "upper" if ch.isupper() else "lower"
            frame(g, lp, os.path.join(out, "latin", f"{sub}_{g.name}.png"))
        for i, ch in enumerate(HEBREW_ORDER):
            g = HG[ch]
            frame(g, hp, os.path.join(out, "hebrew", f"{i+1:02d}_{g.name}.png"))
    sheet(LG, LATIN_ORDER[:26], lp, os.path.join(out, "sheet_latin_upper.png"), 7, title=f"Latin uppercase - {weight}")
    sheet(LG, LATIN_ORDER[26:], lp, os.path.join(out, "sheet_latin_lower.png"), 7, title=f"Latin lowercase - {weight}")
    sheet(HG, HEBREW_ORDER, hp, os.path.join(out, "sheet_hebrew.png"), 7, title=f"Hebrew - {weight}", rtl=True)
