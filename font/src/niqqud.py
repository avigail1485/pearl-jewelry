"""Hebrew niqqud (vowel points and marks). Every mark is drawn around
its own anchor at x = 0 and has zero advance; the 'mark' feature places
it on the letter's anchor (see anchors.py)."""
from engine2 import *

# mark class of each point
BELOW, CENTER, TOPLEFT, SHIN, SIN = "below", "center", "topleft", "shin", "sin"


def niqqud(ha, hb):
    """ha, hb: Hebrew pen (vertical half width, horizontal half height)"""
    G = {}
    r = ha * 0.95 + 16            # dot radius
    gap = 92 + 0.3 * (hb - 39)    # distance from anchor to the mark
    yc = -(gap + r)               # centre line of below-dots
    s = 112                       # dot spacing
    bar = 0.85                    # bar weight relative to the pen
    by = -(gap + hb * bar)        # centre of below-bars
    bw = 125                      # half width of a bar

    def add(cp, name, cls, parts):
        g = Glyph(name, cp, 0, parts, "hebr")
        g.mark_class = cls
        G[chr(cp)] = g

    dot = lambda x, y, rr=r: Dot(x, y, rr)
    hbar = lambda x0, x1, y: P(line((x0, y), (x1, y)), w=bar)

    def patah(dx=0):
        return [hbar(dx - bw, dx + bw, by)]

    def qamats(dx=0):
        return [hbar(dx - bw, dx + bw, by), P(line((dx, by), (dx, by - 105)), w=bar)]

    def segol(dx=0):
        return [dot(dx - s / 2 - 4, yc), dot(dx + s / 2 + 4, yc), dot(dx, yc - s * 0.95)]

    def shva(dx=0):
        return [dot(dx, yc), dot(dx, yc - s * 0.95)]

    add(0x05B0, "sheva", BELOW, shva())
    add(0x05B1, "hatafsegol", BELOW, segol(55) + shva(-150))
    add(0x05B2, "hatafpatah", BELOW, patah(55) + shva(-150))
    add(0x05B3, "hatafqamats", BELOW, qamats(55) + shva(-150))
    add(0x05B4, "hiriq", BELOW, [dot(0, yc)])
    add(0x05B5, "tsere", BELOW, [dot(-s / 2 - 4, yc), dot(s / 2 + 4, yc)])
    add(0x05B6, "segol", BELOW, segol())
    add(0x05B7, "patah", BELOW, patah())
    add(0x05B8, "qamats", BELOW, qamats())
    add(0x05BB, "qubuts", BELOW, [dot(s, yc), dot(0, yc - s * 0.55), dot(-s, yc - s * 1.1)])
    add(0x05C7, "qamatsqatan", BELOW, qamats())
    add(0x05BD, "meteg", BELOW, [P(line((0, -gap), (0, -gap - 120)), w=bar)])
    # inside / above
    add(0x05BC, "dagesh", CENTER, [dot(0, 0, r * 0.92)])
    add(0x05B9, "holam", TOPLEFT, [dot(0, HEB + 55 + r)])
    add(0x05BA, "holamhaserforvav", TOPLEFT, [dot(0, HEB + 55 + r)])
    add(0x05C1, "shindot", SHIN, [dot(0, HEB + 55 + r)])
    add(0x05C2, "sindot", SIN, [dot(0, HEB + 55 + r)])
    add(0x05BF, "rafe", TOPLEFT, [hbar(-bw * 0.8, bw * 0.8, HEB + 80)])
    return G
