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
VERSION = "0.6"
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


def features(LG, HG, PG, NG, lp, hp):
    from anchors_kern import hebrew_anchors, kern_pairs
    from niqqud import BELOW, CENTER, TOPLEFT, SHIN, SIN
    dot_r = hp[0] * 0.95 + 16
    A = hebrew_anchors(HG, hp, dot_r)
    mark_anchor = {BELOW: (0, 0), CENTER: (0, 0), TOPLEFT: (0, HEB), SHIN: (0, HEB), SIN: (0, HEB)}
    L = ["languagesystem DFLT dflt;", "languagesystem latn dflt;", "languagesystem hebr dflt;", ""]
    for cls in (BELOW, CENTER, TOPLEFT, SHIN, SIN):
        names = [g.name for g in NG.values() if g.mark_class == cls]
        ax, ay = mark_anchor[cls]
        L.append("markClass [%s] <anchor %d %d> @M_%s;" % (" ".join(names), ax, ay, cls))
    L.append("")
    L.append("feature mark {")
    L.append("  script hebr;")
    L.append("  lookup hebrew_marks {")
    for gname, an in A.items():
        for cls, (x, y) in an.items():
            L.append("    pos base %s <anchor %d %d> mark @M_%s;" % (gname, x, y, cls))
    L.append("  } hebrew_marks;")
    L.append("} mark;")
    L.append("")
    # kerning
    lat_letters = [chr(c) for c in range(65, 91)] + [chr(c) for c in range(97, 123)]
    lat_punct = [c for c in ".,:;!?-'\"\u2018\u2019\u201C\u201D()&" if c in PG]
    heb_letters = list(HG.keys())
    heb_punct = [c for c in ".,:;!?-\u05F3\u05F4\u05BE\"'()" if c in PG]
    allg = dict(LG); allg.update(PG); allg.update(HG)
    pens = {c: (hp if c in HG else lp) for c in allg}
    lat = kern_pairs(allg, pens, lat_letters + lat_punct, lat_letters + lat_punct, rtl=False, punct=lat_punct)
    heb = kern_pairs(allg, pens, heb_letters + heb_punct, heb_letters + heb_punct, rtl=True, kmin=-70, punct=heb_punct)
    L.append("feature kern {")
    L.append("  lookup kern_latin {")
    L.append("    lookupflag IgnoreMarks;")
    for a, b, v in lat:
        L.append("    pos %s %s %d;" % (a, b, v))
    L.append("  } kern_latin;")
    L.append("  lookup kern_hebrew {")
    L.append("    lookupflag IgnoreMarks;")
    for a, b, v in heb:
        L.append("    pos %s %s %d;" % (a, b, v))
    L.append("  } kern_hebrew;")
    L.append("} kern;")
    L.append("")
    base = [g.name for G in (LG, HG, PG) for g in G.values()]
    L.append("table GDEF {")
    L.append("  GlyphClassDef [%s], , [%s], ;" % (" ".join(base), " ".join(g.name for g in NG.values())))
    L.append("} GDEF;")
    print("  kern pairs: latin %d, hebrew %d" % (len(lat), len(heb)))
    return "\n".join(L)


def build(weight, out_dir):
    LG, HG, lp, hp = glyph_sets(weight)
    from extra import extras
    from spacing import space_glyph
    PG = extras(lp[0], lp[1], hp)
    for ch, g in PG.items():
        if getattr(g, 'optical', False):
            space_glyph(g, lp, (0, CAP), 86 - 0.15 * (lp[0] - 39), depth=0.15 * CAP, min_sb=30)
    from niqqud import niqqud, BELOW, CENTER, TOPLEFT, SHIN, SIN
    NG = niqqud(*hp)
    entries = []  # (glyph, pen)
    for G, pen in ((LG, lp), (HG, hp), (PG, lp), (NG, hp)):
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
    fb.font["head"].fontRevision = float(VERSION)
    fea = features(LG, HG, PG, NG, lp, hp)
    from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
    addOpenTypeFeaturesFromString(fb.font, fea)
    os.makedirs("../features", exist_ok=True)
    with open(os.path.join("../features", f"{ps}.fea"), "w") as fh:
        fh.write(fea)
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
