"""Hebrew niqqud (vowel points and marks). Every mark is drawn around
its own anchor at x = 0 and has zero advance; the 'mark' feature places
it on the letter's anchor (see anchors.py)."""
from engine2 import *

# mark class of each point
BELOW, CENTER, TOPLEFT, SHIN, SIN = "below", "center", "topleft", "shin", "sin"


def niqqud(ha, hb):
    """ha, hb: Hebrew pen (vertical half width, horizontal half height)"""
    G = {}
    # proportions measured from professional Hebrew sans niqqud (Polin):
    # dot slightly heavier than the stroke, close to the letter,
    # generous spacing between dots, short bars.
    r = 1.18 * ha + 4               # dot radius
    gap = 46 + 0.35 * r             # baseline to the top of a below-mark
    yc = -(gap + r)                 # centre line of below-dots
    s = 2 * r + 108                 # dot to dot (tsere, segol)
    v = 2 * r + 50                  # vertical step (shva, segol)
    bar = 0.95                      # bar weight relative to the pen
    by = -(gap + hb * bar)          # centre of below-bars
    bw = 92 + 0.5 * r               # half width of patah / qamats
    def add(cp, name, cls, parts):
        g = Glyph(name, cp, 0, parts, "hebr")
        g.mark_class = cls
        G[chr(cp)] = g

    dot = lambda x, y, rr=r: Dot(x, y, rr)
    hbar = lambda x0, x1, y: P(line((x0, y), (x1, y)), w=bar)

    def patah(dx=0):
        return [hbar(dx - bw, dx + bw, by)]

    def qamats(dx=0):
        return [hbar(dx - bw, dx + bw, by), P(line((dx, by), (dx, by - 70 - 0.4 * r)), w=bar)]

    def segol(dx=0):
        return [dot(dx - s / 2, yc), dot(dx + s / 2, yc), dot(dx, yc - v)]

    def shva(dx=0):
        return [dot(dx, yc), dot(dx, yc - v)]

    hx = bw + r + 34                # shva to the left of a hataf vowel
    add(0x05B0, "sheva", BELOW, shva())
    add(0x05B1, "hatafsegol", BELOW, segol(hx * 0.42) + shva(-hx * 0.58 - 20))
    add(0x05B2, "hatafpatah", BELOW, patah(hx * 0.32) + shva(-hx * 0.68))
    add(0x05B3, "hatafqamats", BELOW, qamats(hx * 0.32) + shva(-hx * 0.68))
    add(0x05B4, "hiriq", BELOW, [dot(0, yc)])
    add(0x05B5, "tsere", BELOW, [dot(-s / 2, yc), dot(s / 2, yc)])
    add(0x05B6, "segol", BELOW, segol())
    add(0x05B7, "patah", BELOW, patah())
    add(0x05B8, "qamats", BELOW, qamats())
    st = s * 0.48
    add(0x05BB, "qubuts", BELOW, [dot(-st, yc), dot(0, yc - v * 0.62), dot(st, yc - v * 1.24)])
    add(0x05C7, "qamatsqatan", BELOW, qamats())
    add(0x05BD, "meteg", BELOW, [P(line((0, -gap), (0, -gap - 110)), w=bar)])
    # inside / above
    add(0x05BC, "dagesh", CENTER, [dot(0, 0, r * 0.95)])
    yt = HEB + gap + r
    add(0x05B9, "holam", TOPLEFT, [dot(0, yt)])
    add(0x05BA, "holamhaserforvav", TOPLEFT, [dot(0, yt)])
    add(0x05C1, "shindot", SHIN, [dot(0, yt)])
    add(0x05C2, "sindot", SIN, [dot(0, yt)])
    add(0x05BF, "rafe", TOPLEFT, [hbar(-bw * 0.8, bw * 0.8, HEB + gap + hb)])
    return G
