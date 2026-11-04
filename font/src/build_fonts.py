"""Build TTF + WOFF2 files for the six weights of Nirit Sans."""
import os
import sys
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.pens.cu2quPen import Cu2QuPen
from fontTools.ttLib import TTFont
from engine2 import *
from render2 import glyph_sets, ORDER_W, WEIGHTS

FAMILY = FAMILY_NAME
VERSION = "0.2"
WEIGHT_CLASS = {"ExtraLight": 200, "Light": 300, "Regular": 400, "Medium": 500, "SemiBold": 600, "Bold": 700}


def punctuation(la, lb):
    """a few basic marks so running text works (digits come later)"""
    G = {}
    r = la * 1.12 + 13

    def add(ch, name, width, parts):
        G[ch] = Glyph(name, ord(ch), round(width), parts, "latn")

    sb = 70
    add(".", "period", 2 * r + 2 * sb, [Dot(sb + r, r, r)])
    add(":", "colon", 2 * r + 2 * sb, [Dot(sb + r, r, r), Dot(sb + r, XH - r, r)])
    tail = Part(Sk((sb + r * 1.5, r)).L((sb + r * 0.4, -r * 2.6)), w=0.8)
    add(",", "comma", 2 * r + 2 * sb, [Dot(sb + r, r, r), tail])
    add(";", "semicolon", 2 * r + 2 * sb, [Dot(sb + r, r, r), tail, Dot(sb + r, XH - r, r)])
    add("-", "hyphen", 330 + la, [Part(line((60, 280), (270 + la, 280)))])
    add("!", "exclam", 2 * r + 2 * sb, [Part(line((sb + r, CAP), (sb + r, 2 * r + 120)), w=1.0), Dot(sb + r, r, r)])
    add("'", "quotesingle", 2 * la + 160, [Part(line((80 + la, CAP), (80 + la, CAP - 210)))])
    add('"', "quotedbl", 4 * la + 260, [Part(line((80 + la, CAP), (80 + la, CAP - 210))),
                                        Part(line((180 + 3 * la, CAP), (180 + 3 * la, CAP - 210)))])
    # Hebrew geresh / gershayim (slanted strokes)
    gs = lambda x: Part(line((x + 40, HEB), (x, HEB - 200)), w=0.95)
    add("׳", "geresh", 2 * la + 180, [gs(70 + la)])
    add("״", "gershayim", 4 * la + 280, [gs(70 + la), gs(170 + 3 * la)])
    add("־", "maqaf", 330 + la, [Part(line((60, HEB - lb), (270 + la, HEB - lb)))])
    return G


def draw_glyph(path):
    pen = TTGlyphPen(None)
    cu = Cu2QuPen(pen, max_err=0.8, reverse_direction=True)
    path.draw(cu)
    return pen.glyph()


def build(weight, out_dir):
    LG, HG, lp, hp = glyph_sets(weight)
    from extra import extras
    from spacing import space_glyph
    PG = extras(lp[0], lp[1], hp)
    for ch, g in PG.items():
        if getattr(g, 'optical', False):
            space_glyph(g, lp, (0, CAP), 86 - 0.15 * (lp[0] - 39), depth=0.15 * CAP, min_sb=30)
    entries = []  # (glyph, pen)
    for G, pen in ((LG, lp), (HG, hp), (PG, lp)):
        for ch, g in G.items():
            entries.append((g, pen))
    order = [".notdef", "space"] + [g.name for g, _ in entries]
    glyphs, metrics, cmap = {}, {}, {}
    # .notdef
    nd = Path()
    nd.moveTo(60, 0); nd.lineTo(440, 0); nd.lineTo(440, CAP); nd.lineTo(60, CAP); nd.close()
    nd2 = Path()
    nd2.moveTo(110, 50); nd2.lineTo(110, CAP - 50); nd2.lineTo(390, CAP - 50); nd2.lineTo(390, 50); nd2.close()
    nd.addPath(nd2)
    glyphs[".notdef"] = draw_glyph(nd)
    metrics[".notdef"] = (500, 60)
    glyphs["space"] = TTGlyphPen(None).glyph()
    metrics["space"] = (250 + round(0.6 * (lp[0] - 40)), 0)
    cmap[0x20] = "space"
    cmap[0xA0] = "space"
    for g, pen in entries:
        out = g.outline(*pen)
        gl = draw_glyph(out)
        glyphs[g.name] = gl
        b = out.bounds
        lsb = round(b[0]) if b else 0
        metrics[g.name] = (g.width, lsb)
        cmap[g.uni] = g.name

    fb = FontBuilder(1000, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(cmap)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    asc, desc = 940, -280
    fb.setupHorizontalHeader(ascent=asc, descent=desc, lineGap=0)
    style = weight
    ps = f"{FAMILY.replace(' ', '')}-{weight}"
    fb.setupNameTable({
        "familyName": FAMILY if weight in ("Regular", "Bold") else f"{FAMILY} {weight}",
        "styleName": weight if weight in ("Regular", "Bold") else "Regular",
        "uniqueFontIdentifier": f"{ps};{VERSION}",
        "fullName": f"{FAMILY} {weight}",
        "psName": ps,
        "version": f"Version {VERSION}",
        "typographicFamily": FAMILY,
        "typographicSubfamily": style,
    })
    fb.setupOS2(sTypoAscender=asc, sTypoDescender=desc, sTypoLineGap=0,
                usWinAscent=asc, usWinDescent=-desc, sxHeight=XH, sCapHeight=CAP,
                usWeightClass=WEIGHT_CLASS[weight], achVendID="NIRT",
                fsSelection=(0x20 if weight == "Bold" else 0x40) | 0x80,
                ulUnicodeRange1=(1 << 0) | (1 << 1) | (1 << 11),
                ulCodePageRange1=(1 << 0) | (1 << 5))
    fb.font["OS/2"].version = 4
    fb.setupPost()
    fb.setupHead(unitsPerEm=1000, macStyle=1 if weight == "Bold" else 0)
    os.makedirs(out_dir, exist_ok=True)
    ttf = os.path.join(out_dir, f"{ps}.ttf")
    fb.font.save(ttf)
    f = TTFont(ttf)
    f.flavor = "woff2"
    f.save(os.path.join(out_dir, f"{ps}.woff2"))
    return ttf


if __name__ == "__main__":
    out = sys.argv[1]
    for w in (sys.argv[2:] or ORDER_W):
        print(build(w, out))
