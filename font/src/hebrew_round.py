"""Nirit Round - Hebrew. Rounder, flowing companion to Nirit Sans,
after the Polin reference (thin weight):

* big radii everywhere: כ פ are almost a half circle on the right,
  ב ה ר ת ך ח have large soft corners, ס is a full circle;
* flowing joins: the arms of א curve into horizontals, the foot of ג
  is a curve, the tongue of פ ף curls inward, מ is a round D with a
  broken left leg;
* straight cut terminals (no rounded ends);
* ו י almost without a head, נ narrow with soft corners.
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
    HALF = (yt - yb) / 2            # half-circle radius between roof and base
    RR = 196 + 0.3 * E              # large soft corner
    RM = 120 + 0.3 * E              # medium corner
    RT = 40 + 0.3 * E               # small corner

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

    def half_round(x0, xr, x_end):
        """roof from x0, a right side that is almost a half circle, base to x_end"""
        r = HALF * 0.98
        return Sk((x0, yt)).R((xr, yt), (xr, yb), r).R((xr, yb), (x_end, yb), r).L((x_end, yb))

    # ---------------------------------------------------------------- א
    def alef(L, R, W):
        xr, xl = R - a, L + a
        p0, p1 = (L + ha + 4, H), (R - ha - 2, 0)
        clip = (L - 10, 0, R + 10, H)
        yr = 0.49 * H
        xj = at_y(p0, p1, yr) + 6
        arm = Sk((xr, H)).L((xr, 0.79 * H)).H((xj, yr), (0, -1), (-1, -0.08), 0.62, 0.58)
        yl = 0.585 * H
        xk = at_y(p0, p1, yl) - 6
        leg = Sk((xk, yl)).H((xl, 0.27 * H), (-1, -0.06), (0, -1), 0.58, 0.62).L((xl, 0))
        return [D(p0, p1, clip), P(arm), P(leg)]
    add("א", "alef", 38, 0.86, 38, alef)

    # ---------------------------------------------------------------- ב
    def bet(L, R, W):
        xs = R - 0.17 * H - a
        return [P(roof(L, xs, yb, RR)), Hb(yb, L, R)]
    add("ב", "bet", 36, 0.88, 26, bet)

    # ---------------------------------------------------------------- ג
    def gimel(L, R, W):
        x_top, x_bot = R - a - 10, R - a
        head = Sk((L + 10, yt)).R((x_top, yt), (x_bot, 0), RT * 1.6).L((x_bot, 0))
        foot = Sk((x_bot - 2, 0.42 * H)).H((L, yb), (-0.18, -1), (-1, 0), 0.55, 0.55)
        return [P(head), P(foot)]
    add("ג", "gimel", 24, 0.46, 40, gimel)

    # ---------------------------------------------------------------- ד
    def dalet(L, R, W):
        xs = R - 0.20 * H - a
        return [Hb(yt, L, R), V(xs, 0, yt)]
    add("ד", "dalet", 28, 0.82, 20, dalet)

    # ---------------------------------------------------------------- ה
    def he(L, R, W):
        return [P(roof(L, R - a, 0, 0.36 * H)), V(L + a + 8, 0, 0.59 * H)]
    add("ה", "he", 46, 0.80, 46, he)

    # ---------------------------------------------------------------- ו י ן
    def vav(L, R, W):
        return [V(L + a, 0, H)]
    add("ו", "vav", 46, 0, 46, vav, fixed=2 * a)

    def yod(L, R, W):
        return [V(L + a, 0.42 * H, H)]
    add("י", "yod", 46, 0, 46, yod, fixed=2 * a)

    def nun_f(L, R, W):
        xs = R - a
        return [P(Sk((L, yt)).R((xs, yt), (xs, HDESC), RT).L((xs, HDESC)))]
    add("ן", "finalnun", 40, 0, 44, nun_f, fixed=2 * a + 40)

    # ---------------------------------------------------------------- ז
    def zayin(L, R, W):
        xs = L + a + 0.10 * W
        stem = Sk((xs + 0.24 * H, yt)).H((xs, yt - 0.36 * H), (-1, 0), (0, -1), 0.58, 0.62).L((xs, 0))
        return [Hb(yt, L, R), P(stem)]
    add("ז", "zayin", 26, 0.46, 26, zayin)

    # ---------------------------------------------------------------- ח
    def het(L, R, W):
        xl, xr = L + a, R - a
        s = Sk((xl, 0)).L((xl, yt)).R((xr, yt), (xr, 0), 0.36 * H).L((xr, 0))
        return [P(s, join="miter")]
    add("ח", "het", 46, 0.82, 46, het)

    # ---------------------------------------------------------------- ט
    def tet(L, R, W):
        xl, xr = L + a, R - a
        cx = (xl + xr) / 2
        r = (xr - xl) / 2
        bot = yb - OS
        s = (Sk((xl, H)).L((xl, bot + r * 0.92)).H((cx, bot), (0, -1), (1, 0), KAPPA)
             .H((xr, bot + r * 0.92), (1, 0), (0, 1), KAPPA)
             .L((xr, 0.52 * H)).H((xr - 0.40 * W, yt + OS * 0.5), (0, 1), (-1, 0), 0.6, 0.62)
             .L((L + 0.42 * W, yt)))
        return [P(s)]
    add("ט", "tet", 44, 0.98, 44, tet)

    # ---------------------------------------------------------------- כ ך
    def kaf(L, R, W):
        return [P(half_round(L, R - a, L))]
    add("כ", "kaf", 34, 0.80, 44, kaf)

    def kaf_f(L, R, W):
        return [P(roof(L, R - a, HDESC, RR * 1.1))]
    add("ך", "finalkaf", 34, 0.76, 44, kaf_f)

    # ---------------------------------------------------------------- ל
    def lamed(L, R, W):
        xl, xr = L + a, R - a
        end = (L + 0.32 * W, 0)
        endx = (end[0] - (xr - end[0]) * 0.15, -0.15 * yt)
        s = Sk((xl, HEB_ASC)).L((xl, yt)).R((xr, yt), endx, RT).L(endx)
        return [P(s, clip=(L - 100, 0, R + 50, HEB_ASC + 5), join="miter")]
    add("ל", "lamed", 44, 0.72, 30, lamed)

    # ---------------------------------------------------------------- מ ם
    def mem(L, R, W):
        xr = R - a
        kink = (L + 0.20 * W, 0.68 * H)
        top_l = (L + ha + 2, H)
        bot_l = (L + 0.05 * W + ha, 0)
        clip = (L - 30, 0, R, H)
        leg = [D(top_l, kink, clip, e0=40, e1=0), D(kink, bot_l, clip, e0=0, e1=40)]
        cx = L + 0.60 * W
        k = 0.56
        bowl = (Sk(kink).H((cx, yt + OS), (0.42, 1), (1, 0), 0.62, k)
                .H((xr, 0.47 * H), (1, 0), (0, -1), k)
                .H((cx - 0.04 * W, yb), (0, -1), (-1, 0), 0.6)
                .L((L + 0.36 * W, yb)))
        return leg + [P(bowl)]
    add("מ", "mem", 26, 1.06, 40, mem)

    def mem_f(L, R, W):
        xl, xr = L + a, R - a
        r = RM * 1.2
        s = (Sk((xl, H / 2)).R((xl, yt), (xr, yt), r)
             .R((xr, yt), (xr, yb), r).R((xr, yb), (xl, yb), r).R((xl, yb), (xl, H / 2), r).L((xl, H / 2)))
        return [P(s.close())]
    add("ם", "finalmem", 46, 0.86, 46, mem_f)

    # ---------------------------------------------------------------- נ
    def nun(L, R, W):
        xr = R - a
        s = Sk((L + 0.42 * W, yt)).R((xr, yt), (xr, yb), RT * 1.4).R((xr, yb), (L, yb), RM * 0.9).L((L - 4, yb))
        return [P(s)]
    add("נ", "nun", 28, 0.40, 42, nun)

    # ---------------------------------------------------------------- ס
    def samekh(L, R, W):
        cx = (L + R) / 2
        rx = W / 2 - a
        ry = H / 2 + OS - b
        return [P(ellipse(cx, H / 2, rx, ry, 0.555))]
    add("ס", "samekh", 36, 1.02, 36, samekh)

    # ---------------------------------------------------------------- ע
    def ayin(L, R, W):
        xr = R - a
        right = Sk((xr, H)).R((xr, yb), (L, yb), RR * 1.15).L((L - 6, yb))
        p0 = (L + ha + 8, H)
        p1 = (L + 0.42 * W, yb + 2)
        return [P(right), D(p0, p1, (L - 20, yb, R, H), e0=0, e1=30)]
    add("ע", "ayin", 36, 0.82, 44, ayin)

    # ---------------------------------------------------------------- פ ף
    def curl(L, W):
        rt = 0.16 * H
        xl = L + a
        return (Sk((xl + rt * 1.15, yt - 2 * rt)).H((xl, yt - rt), (-1, 0), (0, 1), KAPPA, KAPPA)
                .H((xl + rt, yt), (0, 1), (1, 0), KAPPA, KAPPA))

    def pe(L, R, W):
        xl, xr = L + a, R - a
        k = 0.56
        s = (Sk((L, yb)).L((L + 0.44 * W, yb))
             .H((xr, 0.50 * H), (1, 0), (0, 1), 0.6)
             .H((L + 0.53 * W, yt + OS), (0, 1), (-1, 0), k)
             .H((xl, 0.68 * H + 0.3 * E), (-1, 0), (0, -1), k)
             .H((L + 0.33 * W + 0.9 * E, 0.405 * H + 1.25 * E), (0, -1), (1, 0), k))
        return [P(s)]
    add("פ", "pe", 30, 0.88, 40, pe)

    def pe_f(L, R, W):
        xl, xr = L + a, R - a
        k = 0.56
        s = (Sk((L + 0.35 * W + 0.9 * E, 0.405 * H + 1.25 * E)).H((xl, 0.68 * H + 0.3 * E), (-1, 0), (0, 1), k)
             .H((L + 0.50 * W, yt + OS), (0, 1), (1, 0), k)
             .H((xr, 0.40 * H), (1, 0), (0, -1), k).L((xr, HDESC)))
        return [P(s)]
    add("ף", "finalpe", 30, 0.82, 40, pe_f)

    # ---------------------------------------------------------------- צ ץ
    def tsadi(L, R, W):
        xl, xr = L + a, R - a
        d0, d1 = (L + ha + 6, H), (xr - 4, yb)
        main = Sk(d0).R(d1, (L, yb), 70).L((L - 4, yb))
        yr = 0.50 * H
        arm = Sk((xr, H)).L((xr, 0.80 * H)).H((at_y(d0, d1, yr), yr), (0, -1), (-1, -0.15), 0.6, 0.5)
        return [P(Sk((d0[0] - 30, H + 50)).L(d0).R(d1, (L, yb), 70).L((L - 4, yb)),
                  clip=(L - 50, -100, R + 50, H)), P(arm)]
    add("צ", "tsadi", 30, 0.80, 40, tsadi)

    def tsadi_f(L, R, W):
        xr = R - a
        p0 = (L + ha + 4, H)
        p1 = (R - 0.20 * W, HDESC)
        yj = 0.52 * H
        xj = at_y(p0, p1, yj) + 4
        arm = Sk((xr, H)).L((xr, 0.80 * H)).H((xj, yj), (0, -1), (-1, -0.2), 0.6, 0.5)
        diag = Sk((p0[0] - 18, H + 50)).L(p0).H(p1, (0.40, -1), (0.28, -1), 0.4, 0.4)
        return [P(diag, clip=(L - 50, HDESC, R + 50, H)), P(arm)]
    add("ץ", "finaltsadi", 30, 0.76, 38, tsadi_f)

    # ---------------------------------------------------------------- ק
    def qof(L, R, W):
        xr = R - a
        end = (R - 0.40 * W, 0)
        endx = (end[0] - (xr - end[0]) * 0.15, -0.15 * yt)
        s = Sk((L, yt)).R((xr, yt), endx, RT * 0.6).L(endx)
        return [P(s, clip=(L - 50, 0, R + 50, H + 5), join="miter"), V(L + a + 4, HDESC, 0.48 * H)]
    add("ק", "qof", 40, 0.88, 34, qof)

    # ---------------------------------------------------------------- ר
    def resh(L, R, W):
        return [P(roof(L, R - a, 0, RR * 1.05))]
    add("ר", "resh", 34, 0.68, 44, resh)

    # ---------------------------------------------------------------- ש
    def shin(L, R, W):
        xl, xr = L + a, R - a
        cx = (xl + xr) / 2
        r = (xr - xl) / 2
        bot = yb - OS
        s = (Sk((xl, H)).L((xl, bot + r * 0.92)).H((cx, bot), (0, -1), (1, 0), KAPPA)
             .H((xr, bot + r * 0.92), (1, 0), (0, 1), KAPPA).L((xr, H)))
        xm = cx + 0.02 * W
        mid = Sk((xm, H)).L((xm, 0.70 * H)).H((xl, 0.44 * H), (0, -1), (-1, 0), 0.6, 0.55)
        return [P(s), P(mid)]
    add("ש", "shin", 44, 0.98, 44, shin)

    # ---------------------------------------------------------------- ת
    def tav(L, R, W):
        xr = R - a
        xg = L + 0.20 * W + a
        r = 0.10 * H
        leg = (Sk((xg, yt)).L((xg, yb + r)).H((xg - r, yb), (0, -1), (-1, 0), KAPPA, KAPPA)
               .L((L, yb)))
        return [P(roof(L + 0.20 * W - 10, xr, 0, RR)), P(leg)]
    add("ת", "tav", 22, 1.02, 44, tav)

    return G
