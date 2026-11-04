"""Hebrew v3 - redrawn from the references (Ping Hebrew, Rag Sans HB,
Polin) following Hebrew sans-serif practice:

* narrow-ish proportions: a standard letter (ב ד ה כ ר ק ת) is about
  0.72 of the Hebrew height wide; wide letters (א מ ש ט ס ע) about 0.85;
  narrow letters (ג נ ז) about 0.42; ו י ן are a stem with a head.
* Hebrew height sits just under the Latin cap height.
* monolinear, horizontals slightly heavier than verticals.
* one family radius for the soft top-right corners; the inner corner is
  tighter than the outer one because the radius is on the centre line.
* letter families share construction:
    ב כ פ ף ך       top bar + soft corner
    ד ר ה ח ק ת      roof + stem (ד sharp with overhang)
    ו ז י ן נ ג       stem with a short head
    ט ס ם מ          closed / bowl letters
    א צ ץ ע ש        diagonal letters
"""
from engine2 import *

HEB_REF = 39.0


def hebrew(a, b):
    """a: half width of vertical strokes, b: half height of horizontals"""
    E = b - HEB_REF
    G = {}
    H = HEB
    yt, yb = H - b, b
    ha = a * 1.1
    RC = 150 + 0.4 * E          # family corner radius (centre line)
    RS = 62 + 0.3 * E           # small radius (heads, nun, het left)
    HEAD = 38 + 0.6 * E         # length of the head of ו י ן ז

    def add(ch, name, sb_l, w0, sb_r, build, grow=1.3):
        W = w0 + grow * E
        L = sb_l - 0.15 * E
        R = L + W
        res = build(L, R, W)
        parts, cuts = (res if isinstance(res, tuple) else (res, []))
        G[ch] = Glyph(name, ord(ch), round(R + sb_r - 0.15 * E), parts, "hebr", cuts)

    def V(x, y0, y1):
        return P(line((x, y0), (x, y1)))

    def Hb(y, x0, x1):
        return P(line((x0, y), (x1, y)))

    def D(p0, p1, clip, e0=80, e1=None, w=1.0):
        return P(ext(p0, p1, e0, e1), clip=clip, w=w)

    def roof(x0, xs, ybot, r=RC):
        """top bar from x0 into a soft corner and a stem down to ybot"""
        return Sk((x0, yt)).R((xs, yt), (xs, ybot), r).L((xs, ybot))

    def head_stem(L, xs, ybot, r=None):
        r = RS * 0.55 if r is None else r
        return Sk((L, yt)).R((xs, yt), (xs, ybot), r).L((xs, ybot))

    # ------------------------------------------------------------ א
    def alef(L, R, W):
        xr, xl = R - a, L + a
        p0, p1 = (L + ha + 6, H), (R - ha - 4, 0)
        clip = (L - 10, 0, R + 10, H)
        yr = 0.40 * H
        arm = (Sk((xr, H)).L((xr, 0.70 * H))
               .H((at_y(p0, p1, yr), yr), (0, -1), _dir(p0, p1, True), 0.62, 0.28))
        yl = 0.50 * H
        leg = (Sk((at_y(p0, p1, yl), yl))
               .H((xl, 0.24 * H), _dir(p0, p1, True, -1), (0, -1), 0.28, 0.62).L((xl, 0)))
        return [D(p0, p1, clip), P(arm), P(leg)]
    add("א", "alef", 40, 500, 40, alef)

    # ------------------------------------------------------- ב כ פ ך ף
    def bet(L, R, W):
        xs = R - 46 - a
        return [P(roof(L + 4, xs, yb, RS)), Hb(yb, L, R)]
    add("ב", "bet", 40, 452, 30, bet)

    def kaf(L, R, W):
        xr = R - a
        s = Sk((L + 6, yt)).R((xr, yt), (xr, yb), RC).R((xr, yb), (L, yb), RC).L((L, yb))
        return [P(s)]
    add("כ", "kaf", 36, 404, 48, kaf)

    def pe(L, R, W):
        xl, xr = L + a, R - a
        s = (Sk((xl + 0.16 * W, 0.6 * H)).L((xl, 0.6 * H)).L((xl, yt)).R((xr, yt), (xr, yb), RC)
             .R((xr, yb), (L, yb), RC).L((L, yb)))
        return [P(s, join="miter")]
    add("פ", "pe", 36, 432, 48, pe)

    def kaf_f(L, R, W):
        return [P(roof(L, R - a, HDESC))]
    add("ך", "finalkaf", 36, 396, 50, kaf_f)

    def pe_f(L, R, W):
        xl, xr = L + a, R - a
        s = Sk((xl + 0.16 * W, 0.6 * H)).L((xl, 0.6 * H)).L((xl, yt)).R((xr, yt), (xr, HDESC), RC).L((xr, HDESC))
        return [P(s, join="miter")]
    add("ף", "finalpe", 46, 410, 50, pe_f)

    # ------------------------------------------------------ ד ר ה ח ק ת
    def dalet(L, R, W):
        xs = R - 64 - a
        return [Hb(yt, L, R), V(xs, 0, yt)]
    add("ד", "dalet", 30, 452, 22, dalet)

    def resh(L, R, W):
        return [P(roof(L, R - a, 0, RC * 1.18))]
    add("ר", "resh", 34, 404, 50, resh)

    def he(L, R, W):
        return [P(roof(L, R - a, 0, RS)), V(L + a + 2, 0, 0.56 * H)]
    add("ה", "he", 50, 448, 50, he)

    def het(L, R, W):
        xl, xr = L + a, R - a
        s = Sk((xl, 0)).R((xl, yt), (xr, yt), RS * 0.6).R((xr, yt), (xr, 0), RS).L((xr, 0))
        return [P(s)]
    add("ח", "het", 50, 448, 50, het)

    def qof(L, R, W):
        xr = R - a
        return [P(roof(L, xr, 0)), V(L + a + 2, HDESC, 0.62 * H)]
    add("ק", "qof", 44, 448, 50, qof)

    def tav(L, R, W):
        xr = R - a
        xg = L + 54 + a
        leg = Sk((xg, yt)).L((xg, yb + 92)).H((L, yb), (0, -1), (-1, 0), 0.6, 0.5)
        return [P(roof(L + 18, xr, 0)), P(leg)]
    add("ת", "tav", 26, 492, 50, tav)

    # ------------------------------------------------------ ו ז י ן נ ג
    def vav(L, R, W):
        return [P(head_stem(L, R - a, 0))]
    add("ו", "vav", 40, HEAD + 2 * a, 46, vav, grow=0.6)

    def yod(L, R, W):
        xs = R - a
        s = Sk((L, yt)).R((xs, yt), (xs - 6, 0.5 * H), RS * 0.5).L((xs - 10, 0.5 * H))
        return [P(s)]
    add("י", "yod", 40, HEAD + 2 * a, 46, yod, grow=0.6)

    def nun_f(L, R, W):
        return [P(head_stem(L, R - a, HDESC))]
    add("ן", "finalnun", 40, HEAD + 2 * a, 46, nun_f, grow=0.6)

    def zayin(L, R, W):
        x0, x1 = L + W * 0.50, L + W * 0.60
        return [Hb(yt, L, R), D((x0, yt), (x1, 0), (L - 20, 0, R + 20, H), e0=0, e1=40)]
    add("ז", "zayin", 28, 214, 28, zayin, grow=1.4)

    def nun(L, R, W):
        xr = R - a
        s = Sk((L + 4, yt)).R((xr, yt), (xr, yb), RS * 1.3).R((xr, yb), (L, yb), RS * 1.3).L((L - 4, yb))
        return [P(s)]
    add("נ", "nun", 30, 262, 46, nun)

    def gimel(L, R, W):
        xs = R - a
        p0 = (xs, 0.42 * H)
        p1 = (L + ha * 0.6, -6)
        return [P(Sk((L + 40, yt)).R((xs, yt), (xs, 0), RS).L((xs, 0))),
                D(p0, p1, (L - 90, 0, R, H), e0=0, e1=30)]
    add("ג", "gimel", 26, 290, 46, gimel)

    # ------------------------------------------------------- ט ס ם מ
    def tet(L, R, W):
        xl, xr = L + a, R - a
        r = (xr - xl) / 2
        cx = (xl + xr) / 2
        hook = cx + 0.06 * W
        s = (Sk((xl, H)).L((xl, yb - OS * 0.5 + r)).H((cx, yb - OS * 0.5), (0, -1), (1, 0), KAPPA)
             .H((xr, yb - OS * 0.5 + r), (1, 0), (0, 1), KAPPA)
             .L((xr, 0.62 * H)).H(((xr + hook) / 2, yt), (0, 1), (-1, 0), KAPPA)
             .H((hook, 0.62 * H), (-1, 0), (0, -1), KAPPA).L((hook, 0.48 * H)))
        return [P(s)]
    add("ט", "tet", 50, 476, 50, tet)

    def samekh(L, R, W):
        xl, xr = L + 34 + a, R - a
        cx = (xl + xr) / 2
        cy = H / 2
        bot = yb - OS
        s = (Sk((L, yt)).L((cx, yt)).H((xr, cy), (1, 0), (0, -1), 0.6)
             .H((cx, bot), (0, -1), (-1, 0), KAPPA).H((xl, cy), (-1, 0), (0, 1), KAPPA)
             .L((xl, yt)))
        return [P(s)]
    add("ס", "samekh", 22, 520, 46, samekh)

    def mem_f(L, R, W):
        xl, xr = L + a, R - a
        s = (Sk((xl, H / 2)).L((xl, yt)).R((xr, yt), (xr, yb), RS)
             .R((xr, yb), (xl, yb), RS).R((xl, yb), (xl, H / 2), RS * 0.4).L((xl, H / 2)))
        return [P(s.close(), join="miter")]
    add("ם", "finalmem", 50, 452, 50, mem_f)

    def mem(L, R, W):
        xr = R - a
        top = (L + 66 + a, yt)
        bot = (L + ha, 0)
        s = Sk((L + 24, yt)).R((xr, yt), (xr, yb), RC).R((xr, yb), (L + 0.42 * W, yb), RC).L((L + 0.42 * W, yb))
        leg = D((top[0], H), bot, (L - 20, 0, R, H), e0=0, e1=40)
        return [P(s), leg]
    add("מ", "mem", 26, 500, 48, mem)

    # ------------------------------------------------------ א צ ץ ע ש
    def ayin(L, R, W):
        xl, xr = L + a, R - a
        right = Sk((xr, H)).R((xr, yb), (L, yb), RC).L((L - 8, yb))
        p0 = (L + ha + 10, H)
        p1 = (xr - 0.42 * W, yb + 4)
        return [P(right), D(p0, p1, (L - 20, yb, R, H), e0=0, e1=30)]
    add("ע", "ayin", 44, 452, 48, ayin)

    def tsadi(L, R, W):
        xl, xr = L + a, R - a
        d0, d1 = (xl, H - 0.2 * H), (xr - 30, 0)
        d2 = (d1[0] + (d1[0] - d0[0]) * 0.3, d1[1] + (d1[1] - d0[1]) * 0.3)
        main = Sk((xl, H)).R(d0, d1, 70).L(d2)
        yr = 0.40 * H
        arm = (Sk((xr, H)).L((xr, 0.68 * H))
               .H((at_y(d0, d1, yr), yr), (0, -1), _dir(d0, d1, True), 0.6, 0.3))
        xb = at_y(d0, d1, 0) + ha * 1.05
        return [P(main, clip=(L - 50, 0, R + 50, H + 5)), P(arm), Hb(yb, L - 4, xb)]
    add("צ", "tsadi", 40, 446, 44, tsadi)

    def tsadi_f(L, R, W):
        xl, xr = L + a, R - a
        p0 = (L + ha + 6, H)
        p1 = (R - 0.22 * W, HDESC)
        yj = 0.36 * H
        xj = at_y(p0, p1, yj) + 6
        arm = Sk((xr, H)).L((xr, 0.70 * H)).H((xj, yj), (0, -1), (-0.62, -0.78), 0.6, 0.3)
        diag = Sk((p0[0] - 20, H + 50)).L(p0).H(p1, (0.42, -1), (0.26, -1), 0.4, 0.4)
        return [P(diag, clip=(L - 50, HDESC, R + 50, H)), P(arm)]
    add("ץ", "finaltsadi", 36, 440, 40, tsadi_f)

    def shin(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        r = (xr - xl) / 2
        bot = yb - OS
        s = (Sk((xl, H)).L((xl, bot + r * 0.95)).H((cx, bot), (0, -1), (1, 0), KAPPA)
             .H((xr, bot + r * 0.95), (1, 0), (0, 1), KAPPA).L((xr, H)))
        mid = D((cx - 46, H), (cx + 22, yb + 20), (L, yb, R, H), e0=30, e1=0)
        return [P(s), mid]
    add("ש", "shin", 50, 540, 50, shin)

    def lamed(L, R, W):
        xl, xr = L + a, R - a
        end = (L + 0.34 * W, 0)
        endx = (end[0] - (xr - end[0]) * 0.15, -0.15 * yt)
        s = (Sk((xl, HEB_ASC)).L((xl, yt)).R((xr, yt), endx, RS).L(endx))
        return [P(s, clip=(L - 100, 0, R + 50, HEB_ASC + 5), join="miter")]
    add("ל", "lamed", 46, 420, 34, lamed)

    return G


def _dir(p0, p1, unit=True, sign=1):
    d = (p1[0] - p0[0], p1[1] - p0[1])
    l = math.hypot(*d)
    return (sign * d[0] / l, sign * d[1] / l)
