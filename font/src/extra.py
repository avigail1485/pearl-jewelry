"""Figures, punctuation and symbols for both families (drawn with the
Latin pen, so they share stroke and curve logic with the letters).
Lining figures sit on the cap height."""
from engine2 import *


def _n(v):
    l = math.hypot(*v)
    return (v[0] / l, v[1] / l)

LAT_REF = 40.0


def extras(a, b, hpen):
    E = a - LAT_REF
    G = {}
    ha = a * 1.1
    k = 0.56

    def add(ch, name, sb_l, w0, sb_r, build, grow=1.0, optical=False):
        W = w0 + grow * E
        L = sb_l
        R = L + W
        parts = build(L, R, W)
        g = Glyph(name, ord(ch), round(R + sb_r), parts, "latn")
        g.optical = optical
        G[ch] = g

    def V(x, y0, y1, w=1.0):
        return P(line((x, y0), (x, y1)), w=w)

    def Hb(y, x0, x1, w=1.0):
        return P(line((x0, y), (x1, y)), w=w)

    def D(p0, p1, clip, e0=60, e1=None, w=1.0):
        return P(ext(p0, p1, e0, e1), clip=clip, w=w)

    def ring(cx, cy, rx, ry):
        return P(ellipse(cx, cy, rx, ry))

    dot_r = a * 1.12 + 13

    # ------------------------------------------------------------ figures
    T = CAP
    def zero(L, R, W):
        return [ring((L + R) / 2, T / 2, W / 2 - a, T / 2 + OS - b)]
    add("0", "zero", 0, 560, 0, zero, optical=True)

    def one(L, R, W):
        xs = R - a
        return [V(xs, 0, T), D((xs, T), (L + ha, T - 190), (L - 20, 0, xs, T), e0=40, e1=0)]
    add("1", "one", 0, 300, 0, one, optical=True)

    def two(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        s = (Sk((xl + 6, 540)).H((cx, T + OS - b), (0.12, 1), (1, 0), k)
             .H((xr, 500), (1, 0), (0, -1), k)
             .H((L + a * 1.1, b), (0, -1), (-0.62, -0.78), 0.45, 0.5))
        return [P(s), Hb(b, L, R)]
    add("2", "two", 0, 520, 0, two, optical=True)

    def three(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        m = 388
        top = (Sk((xl + 4, 560)).H((cx, T + OS - b), (0.15, 1), (1, 0), k)
               .H((xr - 26, 545), (1, 0), (0, -1), k).H((cx - 30, m), (0, -1), (-1, 0), k).L((cx - 70, m)))
        bot = (Sk((cx - 70, m)).L((cx - 30, m)).H((xr, 196), (1, 0), (0, -1), k)
               .H((cx, b - OS), (0, -1), (-1, 0), k).H((xl - 4, 132), (-1, 0), (-0.42, 1), k))
        return [P(top), P(bot)]
    add("3", "three", 0, 520, 0, three, optical=True)

    def four(L, R, W):
        xs = R - 110 - a
        yb_ = 220
        return [V(xs, 0, T), Hb(yb_, L, R),
                D((xs + 30, T + 50), (L + ha * 0.9, yb_ - 40), (L, yb_ - b, xs + a, T))]
    add("4", "four", 0, 580, 0, four, optical=True)

    def five(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2 + 10
        top = Sk((R - 10, T - b)).L((xl + 12, T - b)).L((xl, 380))
        s = (Sk((xl, 380)).H((cx, 462), (0.25, 1), (1, 0), 0.5, k)
             .H((xr, 228), (1, 0), (0, -1), k)
             .H((cx - 10, b - OS), (0, -1), (-1, 0), k)
             .H((xl - 4, 130), (-1, 0), (-0.42, 1), k))
        return [P(top, join="miter"), P(s)]
    add("5", "five", 0, 530, 0, five, optical=True)

    def six(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        cy = 232
        ry = 232 + OS - b
        tail = (Sk((xl, cy)).L((xl, 330)).H((cx + 20, T + OS - b), (0, 1), (1, 0), 0.62, k)
                .H((xr - 14, 600), (1, 0), (0.45, -0.9), 0.5))
        return [ring(cx, cy, W / 2 - a, ry), P(tail)]
    add("6", "six", 0, 550, 0, six, optical=True)

    def seven(L, R, W):
        return [Hb(T - b, L, R), D((R - a * 0.9, T - b), (L + 0.30 * W, 0), (L, 0, R, T - b), e0=20, e1=60)]
    add("7", "seven", 0, 500, 0, seven, optical=True)

    def eight(L, R, W):
        cx = (L + R) / 2
        return [ring(cx, 532, W / 2 - a - 26, 168 + OS - b), ring(cx, 192, W / 2 - a, 192 + OS - b)]
    add("8", "eight", 0, 550, 0, eight, optical=True)

    def nine(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        cy = T - 232
        ry = 232 + OS - b
        tail = (Sk((xr, cy)).L((xr, T - 330)).H((cx - 20, b - OS), (0, -1), (-1, 0), 0.62, k)
                .H((xl + 14, 100), (-1, 0), (-0.45, 0.9), 0.5))
        return [ring(cx, cy, W / 2 - a, ry), P(tail)]
    add("9", "nine", 0, 550, 0, nine, optical=True)

    # --------------------------------------------------------- punctuation
    sb = 70
    w2 = 2 * dot_r
    add(".", "period", sb, w2, sb, lambda L, R, W: [Dot(L + dot_r, dot_r, dot_r)])
    add(":", "colon", sb, w2, sb, lambda L, R, W: [Dot(L + dot_r, dot_r, dot_r), Dot(L + dot_r, XH - dot_r, dot_r)])

    def comma_tail(L):
        return P(Sk((L + dot_r * 1.55, dot_r)).L((L + dot_r * 0.35, -dot_r * 2.7)), w=0.85)
    add(",", "comma", sb, w2, sb, lambda L, R, W: [Dot(L + dot_r, dot_r, dot_r), comma_tail(L)])
    add(";", "semicolon", sb, w2, sb, lambda L, R, W: [Dot(L + dot_r, dot_r, dot_r), comma_tail(L), Dot(L + dot_r, XH - dot_r, dot_r)])
    add("!", "exclam", sb, w2, sb, lambda L, R, W: [V(L + dot_r, 2 * dot_r + 120, T), Dot(L + dot_r, dot_r, dot_r)])

    def question(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        s = (Sk((xl, 520)).H((cx, T + OS - b), (0.15, 1), (1, 0), k)
             .H((xr, 505), (1, 0), (0, -1), k)
             .H((cx, 300), (0, -1), (-0.5, -0.86), 0.5, 0.5).L((cx, 2 * dot_r + 110)))
        return [P(s), Dot(cx, dot_r, dot_r)]
    add("?", "question", 40, 420, 40, question)

    q = lambda x: P(line((x, T), (x, T - 210)))
    add("'", "quotesingle", 70, 2 * a, 70, lambda L, R, W: [q(L + a)])
    add('"', "quotedbl", 70, 4 * a + 70, 70, lambda L, R, W: [q(L + a), q(R - a)])
    sl = lambda x, y: P(line((x + 34, y), (x, y - 200)), w=0.95)
    add("‘", "quoteleft", 60, 2 * a + 40, 60, lambda L, R, W: [sl(L + a, T)])
    add("’", "quoteright", 60, 2 * a + 40, 60, lambda L, R, W: [sl(L + a, T)])
    add("“", "quotedblleft", 60, 4 * a + 110, 60, lambda L, R, W: [sl(L + a, T), sl(L + 3 * a + 70, T)])
    add("”", "quotedblright", 60, 4 * a + 110, 60, lambda L, R, W: [sl(L + a, T), sl(L + 3 * a + 70, T)])
    add("׳", "geresh", 60, 2 * a + 40, 60, lambda L, R, W: [sl(L + a, HEB)])
    add("״", "gershayim", 60, 4 * a + 110, 60, lambda L, R, W: [sl(L + a, HEB), sl(L + 3 * a + 70, HEB)])

    add("-", "hyphen", 50, 250, 50, lambda L, R, W: [Hb(290, L, R)])
    add("־", "maqaf", 40, 260, 40, lambda L, R, W: [Hb(HEB - b, L, R)])
    add("–", "endash", 40, 420, 40, lambda L, R, W: [Hb(290, L, R)])
    add("—", "emdash", 40, 840, 40, lambda L, R, W: [Hb(290, L, R)])
    add("−", "minus", 60, 420, 60, lambda L, R, W: [Hb(300, L, R)])
    add("_", "underscore", 0, 520, 0, lambda L, R, W: [Hb(-110, L, R)])
    add("+", "plus", 60, 420, 60, lambda L, R, W: [Hb(300, L, R), V((L + R) / 2, 300 - W / 2 + a, 300 + W / 2 - a)])
    add("=", "equal", 60, 420, 60, lambda L, R, W: [Hb(220, L, R), Hb(380, L, R)])
    add("×", "multiply", 70, 360, 70, lambda L, R, W: [P(line((L, 120), (R, 480))), P(line((L, 480), (R, 120)))])
    add("|", "bar", 80, 2 * a, 80, lambda L, R, W: [V(L + a, -160, 800)])
    add("/", "slash", 10, 360, 10, lambda L, R, W: [D((L + ha, -120), (R - ha, T + 60), (L - 30, -120, R + 30, T + 60), e0=0, e1=0)])
    add("\\", "backslash", 10, 360, 10, lambda L, R, W: [D((R - ha, -120), (L + ha, T + 60), (L - 30, -120, R + 30, T + 60), e0=0, e1=0)])
    add("<", "less", 60, 400, 60, lambda L, R, W: [P(Sk((R, 500)).L((L + a, 300)).L((R, 100)), join="miter")])
    add(">", "greater", 60, 400, 60, lambda L, R, W: [P(Sk((L, 500)).L((R - a, 300)).L((L, 100)), join="miter")])
    add("«", "guillemetleft", 50, 400, 50, lambda L, R, W: [
        P(Sk((L + 190, 470)).L((L + a, 290)).L((L + 190, 110)), join="miter"),
        P(Sk((R, 470)).L((R - 190 + a, 290)).L((R, 110)), join="miter")])
    add("»", "guillemetright", 50, 400, 50, lambda L, R, W: [
        P(Sk((L, 470)).L((L + 190 - a, 290)).L((L, 110)), join="miter"),
        P(Sk((R - 190, 470)).L((R - a, 290)).L((R - 190, 110)), join="miter")])
    add("…", "ellipsis", 60, 6 * dot_r + 160, 60, lambda L, R, W: [
        Dot(L + dot_r, dot_r, dot_r), Dot((L + R) / 2, dot_r, dot_r), Dot(R - dot_r, dot_r, dot_r)])
    add("·", "periodcentered", 70, w2, 70, lambda L, R, W: [Dot(L + dot_r, 300, dot_r)])

    def paren(L, R, W, left=True):
        xo, xi = (R - a * 0.5, L + a) if left else (L + a * 0.5, R - a)
        s = (Sk((xo, T + 90)).H((xi, 270), ((xi - xo) * 0.6, -600), (0, -1), 0.55, 0.55)
             .H((xo, -160), (0, -1), ((xo - xi) * 0.6, -600), 0.55, 0.55))
        return [P(s)]
    add("(", "parenleft", 70, 230, 40, lambda L, R, W: paren(L, R, W, True))
    add(")", "parenright", 40, 230, 70, lambda L, R, W: paren(L, R, W, False))

    def brack(L, R, W, left=True):
        top, bot = T + 90 - b, -160 + b
        if left:
            s = Sk((R, top)).L((L + a, top)).L((L + a, bot)).L((R, bot))
        else:
            s = Sk((L, top)).L((R - a, top)).L((R - a, bot)).L((L, bot))
        return [P(s, join="miter")]
    add("[", "bracketleft", 80, 200, 40, lambda L, R, W: brack(L, R, W, True))
    add("]", "bracketright", 40, 200, 80, lambda L, R, W: brack(L, R, W, False))

    def percent(L, R, W):
        r1 = 100 + 0.9 * a
        return [ring(L + r1, T - r1 - 10, r1 - a * 0.85, r1 - b * 0.85 + 4),
                ring(R - r1, r1 + 10 - OS, r1 - a * 0.85, r1 - b * 0.85 + 4),
                D((R - 60, T), (L + 60, 0), (L, 0, R, T), e0=0, e1=0, w=0.9)]
    add("%", "percent", 50, 640, 50, percent)

    def numbersign(L, R, W):
        c = (L, -10, R, T)
        return [D((L + 0.38 * W, T), (L + 0.25 * W, 0), c, e0=0, e1=0, w=0.9),
                D((L + 0.75 * W, T), (L + 0.62 * W, 0), c, e0=0, e1=0, w=0.9),
                Hb(470, L, R, w=0.9), Hb(230, L, R, w=0.9)]
    add("#", "numbersign", 40, 560, 40, numbersign)

    def asterisk(L, R, W):
        cx, cy, r = (L + R) / 2, 540, 150
        parts = []
        for ang in (90, 18, -54, -126, 162):
            t = math.radians(ang)
            parts.append(P(line((cx, cy), (cx + r * math.cos(t), cy + r * math.sin(t))), w=0.85))
        return parts
    add("*", "asterisk", 50, 320, 50, asterisk)

    def dollar(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        s = (Sk((xr - 6, 560 - 0.9 * E)).H((cx + 4, T - 20 + OS - b), (-0.42, 1), (-1, 0), k)
             .H((xl + 10, 520), (-1, 0), (0, -1), k)
             .H((cx, 355), (0, -1), (1, -0.3), 0.62, 0.5)
             .H((xr, 185), (1, -0.3), (0, -1), 0.5, 0.62)
             .H((cx - 4, b + 20 - OS), (0, -1), (-1, 0), k)
             .H((xl - 4, 140 + 0.9 * E), (-1, 0), (-0.42, 1), k))
        return [P(s), V(cx, -90, T + 90)]
    add("$", "dollar", 44, 500, 44, dollar)

    def euro(L, R, W):
        cx = L + W * 0.56
        rx = W * 0.44 - a
        cut = poly([(cx - rx * 0.1, T / 2), (R + 300, T / 2 + 420), (R + 300, T / 2 - 420)])
        bars = [Hb(415, L, cx + 40, w=0.9), Hb(285, L, cx + 20, w=0.9)]
        return ([ring(cx, T / 2, rx, T / 2 + OS - b)] + bars, [cut])

    def euro_build(L, R, W):
        parts, cuts = euro(L, R, W)
        return parts
    add("€", "euro", 30, 620, 40, euro_build)
    G["€"].cuts = euro(30, 30 + 620 + E, 620 + E)[1]

    def shekel(L, R, W):
        top = 560
        xl, xr = L + a, R - a
        gap = (xr - xl) / 3
        x2, x3 = xl + gap, xl + 2 * gap      # inner legs: x2 belongs to the cup, x3 to the arch
        r = min(0.9 * gap / 2, 110)
        arch = (Sk((xl, 0)).L((xl, top - b - r)).H((xl + r, top - b), (0, 1), (1, 0), KAPPA)
                .L((x3 - r, top - b)).H((x3, top - b - r), (1, 0), (0, -1), KAPPA).L((x3, 0.30 * top)))
        cup = (Sk((xr, top)).L((xr, b + r)).H((xr - r, b), (0, -1), (-1, 0), KAPPA)
               .L((x2 + r, b)).H((x2, b + r), (-1, 0), (0, 1), KAPPA).L((x2, 0.70 * top)))
        return [P(arch), P(cup)]
    add("₪", "sheqel", 50, 640, 50, shekel, grow=4.0)

    def at(L, R, W):
        cx, cy = (L + R) / 2, 260
        R1 = W / 2 - a * 0.9
        outer = P(ellipse(cx, cy, R1, R1 * 0.98))
        rx = R1 * 0.42
        bx = cx - 10
        inner = P(ellipse(bx, cy, rx, rx * 1.1))
        stem = V(bx + rx + 2, cy - rx * 1.1 - 10, cy + rx * 1.1 + 10, w=0.9)
        cut = poly([(bx + rx + a * 0.9 + 4, cy - 20), (R + 50, cy - 20), (R + 50, cy - R1 * 0.75), (bx + rx + a, cy - R1 * 0.6)])
        return [outer, inner, stem], [cut]

    def at_build(L, R, W):
        return at(L, R, W)[0]
    add("@", "at", 40, 820, 40, at_build)
    g = G["@"]
    g.cuts = at(40, 40 + 820 + E, 820 + E)[1]

    def ampersand(L, R, W):
        # after the classic modern construction (as in Ping): small round
        # top loop, a straight diagonal to a flat foot at the bottom right,
        # the loop's right side flowing into a large bowl that rises into a
        # tail at the right edge, about half way up.
        xl, xr = L + a, R - a
        top = T + OS - b
        lw = 0.215 * W + 0.85 * E                    # half width of the loop
        lc = L + 0.43 * W                            # loop centre
        foot = (R - ha * 0.9, 0)
        lj = (lc - lw * 0.62, 0.62 * T - 0.6 * E)     # where the diagonal enters the loop
        d = _n((lj[0] - foot[0], lj[1] - foot[1]))
        s = (Sk((foot[0] + d[0] * -60, foot[1] + d[1] * -60)).L(foot).L(lj)
             .H((lc - lw, 0.80 * T - 0.3 * E), d, (0, 1), 0.45, 0.55)
             .H((lc, top), (0, 1), (1, 0), 0.56, 0.56)
             .H((lc + lw, 0.80 * T - 0.3 * E), (1, 0), (0, -1), 0.56, 0.56)
             .H((L + 0.27 * W, 0.46 * T - 0.4 * E), (0, -1), (-0.8, -0.6), 0.5, 0.42)
             .H((xl, 0.22 * T - 0.4 * E), (-0.8, -0.6), (0, -1), 0.42, 0.6)
             .H((L + 0.40 * W, b - OS), (0, -1), (1, 0), 0.56, 0.56)
             .H((xr, 0.50 * T), (1, 0), (0.26, 1), 0.62, 0.45))
        return [P(s, clip=(L - 80, 0, R + 80, T + 80))]
    add("&", "ampersand", 36, 640, 24, ampersand, grow=2.4)

    return G
