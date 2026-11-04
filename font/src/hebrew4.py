"""Hebrew v4 - proportions measured from the Ping Hebrew specimen
(letter height H = 1.0) and redrawn with this family's own pen:

  width (outer)  א .87  ב .85  ג .52  ד .82  ה .80  ו/י/ן stem+head
                 ז .55  ח .84  ט .98  כ .72  ך .74  ל .65  מ 1.0
                 ם .86  נ .35  ס 1.0  ע .85  פ .77  ף .75  צ .78
                 ץ .75  ק .80  ר .65  ש .98  ת 1.03
  corners       כ פ מ ת  round (r ~ .27H);  ב ה ח ר ם  medium (~.18H);
                 נ ד ק ל  sharp
  details       נ narrow and square (never a small כ); ס nearly a circle;
                 ש middle stroke hangs from the top and joins the left arm;
                 ק and ל finish in one straight diagonal; ט turns into a roof;
                 א right arm is one round curve.
Differences from the reference are deliberate: heavier horizontals,
shorter spurs, a curved ץ, and our own corner radii.
"""
from engine2 import *

HEB_REF = 39.0


def _dir(p0, p1, sign=1):
    d = (p1[0] - p0[0], p1[1] - p0[1])
    l = math.hypot(*d)
    return (sign * d[0] / l, sign * d[1] / l)


def hebrew(a, b):
    E = b - HEB_REF
    G = {}
    H = HEB
    yt, yb = H - b, b
    ha = a * 1.1
    RR = 150 + 0.4 * E      # round corner (centre line)
    RM = 92 + 0.4 * E       # medium corner
    RT = 22 + 0.3 * E       # tight corner

    def add(ch, name, sb_l, wH, sb_r, build, fixed=None):
        W = (fixed if fixed is not None else wH * H) + 1.2 * E
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

    def roof(x0, xs, ybot, r):
        return Sk((x0, yt)).R((xs, yt), (xs, ybot), r).L((xs, ybot))

    # ---------------------------------------------------------------- א
    def alef(L, R, W):
        xr, xl = R - a, L + a
        p0, p1 = (L + ha + 4, H), (R - ha - 2, 0)
        clip = (L - 10, 0, R + 10, H)
        yr = 0.47 * H
        arm = Sk((xr, H)).H((at_y(p0, p1, yr), yr), (0, -1), _dir(p0, p1), 0.78, 0.42)
        yl = 0.60 * H
        leg = (Sk((at_y(p0, p1, yl), yl))
               .H((xl, 0.30 * H), _dir(p0, p1, -1), (0, -1), 0.35, 0.6).L((xl, 0)))
        return [D(p0, p1, clip), P(arm), P(leg)]
    add("א", "alef", 38, 0.86, 38, alef)

    # ---------------------------------------------------------------- ב
    def bet(L, R, W):
        xs = R - 0.19 * H - a
        return [P(roof(L + 6, xs, yb, RM)), Hb(yb, L, R)]
    add("ב", "bet", 36, 0.84, 26, bet)

    # ---------------------------------------------------------------- ג
    def gimel(L, R, W):
        x_top, x_bot = R - a - 12, R - a
        head = Sk((L + 8, yt)).R((x_top, yt), (x_bot, 0), RT).L((x_bot, 0))
        p0 = (x_bot - 4, 0.33 * H)
        p1 = (L + ha * 0.5, -4)
        return [P(head), D(p0, p1, (L - 90, 0, R, H), e0=0, e1=30)]
    add("ג", "gimel", 24, 0.52, 40, gimel)

    # ---------------------------------------------------------------- ד
    def dalet(L, R, W):
        xs = R - 0.19 * H - a
        return [Hb(yt, L, R), V(xs, 0, yt)]
    add("ד", "dalet", 28, 0.82, 20, dalet)

    # ---------------------------------------------------------------- ה
    def he(L, R, W):
        return [P(roof(L, R - a, 0, RM)), V(L + a + 4, 0, 0.50 * H)]
    add("ה", "he", 46, 0.79, 46, he)

    # ---------------------------------------------------------------- ו י ן
    def vav(L, R, W):
        xs = R - a
        return [P(Sk((L, yt)).R((xs, yt), (xs, 0), RT).L((xs, 0)))]
    add("ו", "vav", 38, 0, 42, vav, fixed=2 * a + 66)

    def yod(L, R, W):
        xs = R - a
        return [P(Sk((L, yt)).R((xs, yt), (xs, 0.48 * H), RT).L((xs, 0.48 * H)))]
    add("י", "yod", 38, 0, 42, yod, fixed=2 * a + 92)

    def nun_f(L, R, W):
        xs = R - a
        return [P(Sk((L, yt)).R((xs, yt), (xs, HDESC), RT).L((xs, HDESC)))]
    add("ן", "finalnun", 38, 0, 42, nun_f, fixed=2 * a + 92)

    # ---------------------------------------------------------------- ז
    def zayin(L, R, W):
        p0, p1 = (L + 0.40 * W, yt), (L + 0.62 * W, 0)
        return [Hb(yt, L, R), D(p0, p1, (L - 20, 0, R + 20, H), e0=0, e1=40)]
    add("ז", "zayin", 26, 0.54, 26, zayin)

    # ---------------------------------------------------------------- ח
    def het(L, R, W):
        xl, xr = L + 64 + a, R - a
        return [P(roof(L, xr, 0, RM)), V(xl, 0, yt)]
    add("ח", "het", 22, 0.84, 46, het)

    # ---------------------------------------------------------------- ט
    def tet(L, R, W):
        xl, xr = L + a, R - a
        cx = (xl + xr) / 2
        r = (xr - xl) / 2
        bot = yb - OS
        s = (Sk((xl, H)).L((xl, bot + r * 0.92)).H((cx, bot), (0, -1), (1, 0), KAPPA)
             .H((xr, bot + r * 0.92), (1, 0), (0, 1), KAPPA)
             .L((xr, 0.56 * H)).H((xr - 0.22 * W, yt), (0, 1), (-1, 0), 0.62, 0.62)
             .L((L + 0.44 * W, yt)))
        return [P(s)]
    add("ט", "tet", 44, 0.97, 44, tet)

    # ---------------------------------------------------------------- כ ך
    def kaf(L, R, W):
        xr = R - a
        s = Sk((L + 6, yt)).R((xr, yt), (xr, yb), RR).R((xr, yb), (L, yb), RR).L((L, yb))
        return [P(s)]
    add("כ", "kaf", 34, 0.72, 44, kaf)

    def kaf_f(L, R, W):
        return [P(roof(L, R - a, HDESC, RR * 0.9))]
    add("ך", "finalkaf", 34, 0.73, 44, kaf_f)

    # ---------------------------------------------------------------- ל
    def lamed(L, R, W):
        xl, xr = L + a, R - a
        end = (L + 0.30 * W, 0)
        endx = (end[0] - (xr - end[0]) * 0.15, -0.15 * yt)
        s = Sk((xl, HEB_ASC)).L((xl, yt)).R((xr, yt), endx, RT).L(endx)
        return [P(s, clip=(L - 100, 0, R + 50, HEB_ASC + 5), join="miter")]
    add("ל", "lamed", 44, 0.66, 30, lamed)

    # ---------------------------------------------------------------- מ ם
    def mem(L, R, W):
        xr = R - a
        top = (L + 0.25 * W, H)
        bot = (L + 0.09 * W + ha, 0)
        end = L + 0.46 * W
        s = Sk((L, yt)).R((xr, yt), (xr, yb), RR).R((xr, yb), (end, yb), RR).L((end, yb))
        return [P(s), D(top, bot, (L - 20, 0, R, H), e0=0, e1=40)]
    add("מ", "mem", 26, 0.98, 44, mem)

    def mem_f(L, R, W):
        xl, xr = L + 40 + a, R - a
        s = (Sk((xl, H / 2)).L((xl, yt)).R((xr, yt), (xr, yb), RM)
             .R((xr, yb), (xl, yb), RM).L((xl, yb)).L((xl, H / 2)))
        return [P(s.close(), join="miter"), Hb(yt, L, xl)]
    add("ם", "finalmem", 24, 0.85, 46, mem_f)

    # ---------------------------------------------------------------- נ
    def nun(L, R, W):
        xr = R - a
        s = Sk((L + 0.42 * W, yt)).R((xr, yt), (xr, yb), RT).R((xr, yb), (L, yb), RT).L((L - 4, yb))
        return [P(s)]
    add("נ", "nun", 28, 0.42, 42, nun)

    # ---------------------------------------------------------------- ס
    def samekh(L, R, W):
        x0 = L + 40           # where the circle starts (spur sits before it)
        xl, xr = x0 + a, R - a
        cx = (xl + xr) / 2
        cy = (yt + yb - OS) / 2
        bot = yb - OS
        k = 0.56
        s = (Sk((L, yt)).L((cx, yt)).H((xr, cy), (1, 0), (0, -1), 0.6)
             .H((cx, bot), (0, -1), (-1, 0), k).H((xl, cy), (-1, 0), (0, 1), k)
             .L((xl, yt)))
        return [P(s)]
    add("ס", "samekh", 20, 1.0, 40, samekh)

    # ---------------------------------------------------------------- ע
    def ayin(L, R, W):
        xr = R - a
        right = Sk((xr, H)).R((xr, yb), (L, yb), RR * 1.05).L((L - 6, yb))
        p0 = (L + ha + 8, H)
        p1 = (L + 0.44 * W, yb + 2)
        return [P(right), D(p0, p1, (L - 20, yb, R, H), e0=0, e1=30)]
    add("ע", "ayin", 40, 0.85, 44, ayin)

    # ---------------------------------------------------------------- פ ף
    def tongue_path(xl, W, then):
        return Sk((xl + 0.22 * W, 0.50 * H)).L((xl, 0.50 * H)).L((xl, yt))

    def pe(L, R, W):
        xl, xr = L + a, R - a
        s = (tongue_path(xl, W, None).R((xr, yt), (xr, yb), RR)
             .R((xr, yb), (L, yb), RR).L((L, yb)))
        return [P(s, join="miter")]
    add("פ", "pe", 34, 0.77, 44, pe)

    def pe_f(L, R, W):
        xl, xr = L + a, R - a
        s = tongue_path(xl, W, None).R((xr, yt), (xr, HDESC), RR * 0.9).L((xr, HDESC))
        return [P(s, join="miter")]
    add("ף", "finalpe", 40, 0.75, 44, pe_f)

    # ---------------------------------------------------------------- צ ץ
    def tsadi(L, R, W):
        xl, xr = L + a, R - a
        d0, d1 = (xl, H - 0.16 * H), (xr - 4, yb)
        main = Sk((xl, H)).R(d0, d1, 70).R(d1, (L, yb), 60).L((L - 4, yb))
        yr = 0.46 * H
        arm = Sk((xr, H)).H((at_y(d0, d1, yr), yr), (0, -1), _dir(d0, d1), 0.72, 0.4)
        return [P(main), P(arm)]
    add("צ", "tsadi", 36, 0.78, 40, tsadi)

    def tsadi_f(L, R, W):
        xr = R - a
        p0 = (L + ha + 4, H)
        p1 = (R - 0.20 * W, HDESC)
        yj = 0.50 * H
        xj = at_y(p0, p1, yj) + 4
        arm = Sk((xr, H)).H((xj, yj), (0, -1), _dir(p0, p1), 0.72, 0.4)
        diag = Sk((p0[0] - 18, H + 50)).L(p0).H(p1, (0.40, -1), (0.28, -1), 0.4, 0.4)
        return [P(diag, clip=(L - 50, HDESC, R + 50, H)), P(arm)]
    add("ץ", "finaltsadi", 34, 0.75, 38, tsadi_f)

    # ---------------------------------------------------------------- ק
    def qof(L, R, W):
        xr = R - a
        end = (R - 0.40 * W, 0)
        endx = (end[0] - (xr - end[0]) * 0.15, -0.15 * yt)
        s = Sk((L, yt)).R((xr, yt), endx, RT).L(endx)
        return [P(s, clip=(L - 50, 0, R + 50, H + 5), join="miter"), V(L + a + 4, HDESC, 0.50 * H)]
    add("ק", "qof", 40, 0.80, 34, qof)

    # ---------------------------------------------------------------- ר
    def resh(L, R, W):
        return [P(roof(L, R - a, 0, RM * 1.25))]
    add("ר", "resh", 34, 0.65, 44, resh)

    # ---------------------------------------------------------------- ש
    def shin(L, R, W):
        xl, xr = L + a, R - a
        cx = (xl + xr) / 2
        r = (xr - xl) / 2
        bot = yb - OS
        s = (Sk((xl, H)).L((xl, bot + r * 0.92)).H((cx, bot), (0, -1), (1, 0), KAPPA)
             .H((xr, bot + r * 0.92), (1, 0), (0, 1), KAPPA).L((xr, H)))
        xm = cx + 0.04 * W
        mid = Sk((xm, H)).L((xm, 0.66 * H)).H((xl, 0.40 * H), (0, -1), (-1, -0.35), 0.62, 0.5)
        return [P(s), P(mid)]
    add("ש", "shin", 44, 0.97, 44, shin)

    # ---------------------------------------------------------------- ת
    def tav(L, R, W):
        xr = R - a
        xg = L + 0.17 * W + a
        r = 0.15 * H
        leg = (Sk((xg, yt)).L((xg, yb + r)).H((xg - r, yb), (0, -1), (-1, 0), KAPPA, KAPPA)
               .L((L, yb)))
        return [P(roof(L + 0.08 * W, xr, 0, RR)), P(leg)]
    add("ת", "tav", 22, 1.0, 44, tav)

    return G
