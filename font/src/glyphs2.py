"""Letter drawings (v2). Coordinates are centre lines; the pen half
sizes (a = vertical-stroke half width, b = horizontal-stroke half
height) are subtracted so the outer contour sits exactly on metrics."""
from engine2 import *

LAT_REF = 40.0
HEB_REF = 36.0


def latin(a, b):
    E = a - LAT_REF
    G = {}
    ha = a * 1.1          # half horizontal width of a ~65deg diagonal
    cuts_store = {}

    def add(ch, name, sb_l, w0, sb_r, build, grow=1.25):
        W = w0 + grow * E
        L = sb_l - 0.2 * E
        R = L + W
        res = build(L, R, W)
        parts, cuts = (res if isinstance(res, tuple) else (res, []))
        G[ch] = Glyph(name, ord(ch), round(R + sb_r - 0.2 * E), parts, "latn", cuts)

    def V(x, y0, y1):
        return P(line((x, y0), (x, y1)))

    def Hb(y, x0, x1):
        return P(line((x0, y), (x1, y)))

    def D(p0, p1, clip, e0=90, e1=None, w=1.0):
        return P(ext(p0, p1, e0, e1), clip=clip, w=w)

    def ring(cx, cy, rx, ry):
        return P(ellipse(cx, cy, rx, ry))

    def wedge(apex, a0, a1, R=900):
        """triangle from apex between angles a0..a1 (deg)"""
        pts = [apex]
        n = 6
        for i in range(n + 1):
            t = math.radians(a0 + (a1 - a0) * i / n)
            pts.append((apex[0] + R * math.cos(t), apex[1] + R * math.sin(t)))
        return poly(pts)

    capR = CAP / 2 + OS - b
    xR = XH / 2 + OS - b

    # ------------------------------------------------------------ CAPS
    def A(L, R, W):
        cx = (L + R) / 2
        top = (cx, CAP + 34)
        pl, pr = (L + ha, 0), (R - ha, 0)
        clip = (L - 30, 0, R + 30, CAP)
        y = 205 + b
        return [D(pl, top, clip), D(pr, top, clip), Hb(y, at_y(pl, top, y), at_y(pr, top, y))]
    add("A", "A", 10, 664, 10, A)

    def B(L, R, W):
        xs = L + a
        ym = 382
        xt, xb = R - 40 - a, R - a
        r1 = (CAP - b - ym) / 2
        r2 = (ym - b) / 2
        top = Sk((xs, CAP - b)).R((xt, CAP - b), (xt, ym), r1).R((xt, ym), (xs, ym), r1).L((xs, ym))
        bot = Sk((xs, ym)).R((xb, ym), (xb, b), r2).R((xb, b), (xs, b), r2).L((xs, b))
        return [V(xs, 0, CAP), P(top), P(bot)]
    add("B", "B", 82, 520, 52, B)

    def C(L, R, W):
        cx, cy = (L + R) / 2, CAP / 2
        rx = W / 2 - a
        return [ring(cx, cy, rx, capR)], [wedge((cx - rx * 0.22, cy), -33, 33)]
    add("C", "C", 48, 640, 30, C)

    def Dd(L, R, W):
        xs = L + a
        xr = R - a
        r = (CAP - 2 * b) / 2 * 0.92
        s = Sk((xs, CAP - b)).R((xr, CAP - b), (xr, b), r).R((xr, b), (xs, b), r).L((xs, b))
        return [V(xs, 0, CAP), P(s)]
    add("D", "D", 82, 612, 48, Dd)

    def Ee(L, R, W):
        xs = L + a
        return [V(xs, 0, CAP), Hb(CAP - b, xs, R), Hb(360, xs, R - 38), Hb(b, xs, R + 4)]
    add("E", "E", 82, 470, 46, Ee)

    def F(L, R, W):
        xs = L + a
        return [V(xs, 0, CAP), Hb(CAP - b, xs, R), Hb(342, xs, R - 44)]
    add("F", "F", 82, 450, 38, F)

    def Gg(L, R, W):
        cx, cy = (L + R) / 2, CAP / 2
        rx = W / 2 - a
        bar = 318
        ax = cx - rx * 0.22
        t = math.tan(math.radians(36))
        X = R + 200
        cut = poly([(cx + 40, bar + b), (X, bar + b), (X, cy + (X - ax) * t), (cx + 40, cy + (cx + 40 - ax) * t)])
        return [ring(cx, cy, rx, capR), Hb(bar, cx + 36, cx + rx + a * 0.2)], [cut]
    add("G", "G", 48, 680, 60, Gg)

    def H(L, R, W):
        xs, xr = L + a, R - a
        return [V(xs, 0, CAP), V(xr, 0, CAP), Hb(366, xs, xr)]
    add("H", "H", 82, 584, 82, H)

    def I(L, R, W):
        return [V(L + a, 0, CAP)]
    add("I", "I", 82, 2 * LAT_REF, 82, I, grow=2)

    def J(L, R, W):
        xs = R - a
        cx = (L + R) / 2
        r = xs - cx
        s = Sk((xs, CAP)).L((xs, b + r * 1.1)).H((cx, b - OS), (0, -1), (-1, 0), 0.58).H((L + a, 150 + 0.6 * E), (-1, 0), (0, 1), 0.5, 0.35)
        return [P(s)]
    add("J", "J", 36, 440, 82, J)

    def K(L, R, W):
        xs = L + a
        p0, p1 = (xs, 228), (R - ha * 0.95, CAP)
        clip = (L, 0, R + 80, CAP)
        j = (at_y(p0, p1, 402), 402)
        return [V(xs, 0, CAP), D(p0, p1, clip), D(j, (R - ha, 0), clip, e0=0)]
    add("K", "K", 82, 560, 16, K)

    def Ll(L, R, W):
        xs = L + a
        return [V(xs, 0, CAP), Hb(b, xs, R)]
    add("L", "L", 82, 450, 28, Ll)

    def M(L, R, W):
        xs, xr = L + a, R - a
        cx = (L + R) / 2
        clip = (L, 0, R, CAP)
        v = (cx, -16)
        return [V(xs, 0, CAP), V(xr, 0, CAP),
                D((xs, CAP + 26), v, clip, w=0.9), D((xr, CAP + 26), v, clip, w=0.9)]
    add("M", "M", 82, 730, 82, M, grow=1.6)

    def N(L, R, W):
        xs, xr = L + a, R - a
        clip = (L, 0, R, CAP)
        return [V(xs, 0, CAP), V(xr, 0, CAP), D((xs, CAP + 30), (xr, -30), clip, w=0.96)]
    add("N", "N", 82, 600, 82, N)

    def O(L, R, W):
        return [ring((L + R) / 2, CAP / 2, W / 2 - a, capR)]
    add("O", "O", 48, 730, 48, O)

    def Pp(L, R, W):
        xs, xr = L + a, R - a
        ym = 316
        r = (CAP - b - ym) / 2
        s = Sk((xs, CAP - b)).R((xr, CAP - b), (xr, ym), r).R((xr, ym), (xs, ym), r).L((xs, ym))
        return [V(xs, 0, CAP), P(s)]
    add("P", "P", 82, 520, 38, Pp)

    def Q(L, R, W):
        cx = (L + R) / 2
        return [ring(cx, CAP / 2, W / 2 - a, capR),
                D((cx + 80, 150), (R + 20, -78), (L, -78, R + 60, CAP), e0=0, e1=0)]
    add("Q", "Q", 48, 730, 48, Q)

    def Rr(L, R, W):
        xs, xr = L + a, R - 26 - a
        ym = 330
        r = (CAP - b - ym) / 2
        s = Sk((xs, CAP - b)).R((xr, CAP - b), (xr, ym), r).R((xr, ym), (xs, ym), r).L((xs, ym))
        j = (xs + (xr - xs) * 0.52, ym)
        return [V(xs, 0, CAP), P(s), D(j, (R - ha, 0), (L, 0, R + 80, ym), e0=0)]
    add("R", "R", 82, 548, 18, Rr)

    def Ss(L, R, W):
        xs, xr = L + a, R - a
        cx = (L + R) / 2
        k = 0.56
        s = (Sk((xr - 4, 568 - 0.9 * E))
             .H((cx + 4, CAP + OS - b), (-0.42, 1), (-1, 0), k)
             .H((xs + 10, 520 - 0.3 * E), (-1, 0), (0, -1), k)
             .H((cx, 362), (0, -1), (1, -0.30), 0.62, 0.5)
             .H((xr, 186 + 0.3 * E), (1, -0.30), (0, -1), 0.5, 0.62)
             .H((cx - 4, b - OS), (0, -1), (-1, 0), k)
             .H((xs - 4, 140 + 0.9 * E), (-1, 0), (-0.42, 1), k))
        return [P(s)]
    add("S", "S", 44, 520, 44, Ss)

    def T(L, R, W):
        cx = (L + R) / 2
        return [Hb(CAP - b, L, R), V(cx, 0, CAP - b)]
    add("T", "T", 20, 566, 20, T)

    def U(L, R, W):
        xs, xr = L + a, R - a
        cx = (L + R) / 2
        r = (xr - xs) / 2
        yc = b - OS + r
        s = Sk((xs, CAP)).L((xs, yc)).H((cx, b - OS), (0, -1), (1, 0), KAPPA).H((xr, yc), (1, 0), (0, 1), KAPPA).L((xr, CAP))
        return [P(s)]
    add("U", "U", 78, 590, 78, U)

    def Vv(L, R, W):
        cx = (L + R) / 2
        v = (cx, -34)
        clip = (L - 30, 0, R + 30, CAP)
        return [D((L + ha, CAP), v, clip), D((R - ha, CAP), v, clip)]
    add("V", "V", 10, 630, 10, Vv)

    def Ww(L, R, W):
        x1, x3 = L + W * 0.255, L + W * 0.745
        cx = (L + R) / 2
        clip = (L - 30, 0, R + 30, CAP)
        w = 0.94
        return [D((L + ha, CAP), (x1, -28), clip, w=w), D((x1, -28), (cx, CAP + 28), clip, w=w),
                D((cx, CAP + 28), (x3, -28), clip, w=w), D((x3, -28), (R - ha, CAP), clip, w=w)]
    add("W", "W", 10, 930, 10, Ww, grow=2.2)

    def X(L, R, W):
        clip = (L - 30, 0, R + 30, CAP)
        return [D((L + ha, CAP), (R - ha, 0), clip), D((R - ha, CAP), (L + ha, 0), clip)]
    add("X", "X", 16, 600, 16, X)

    def Y(L, R, W):
        cx = (L + R) / 2
        jy = 318
        clip = (L - 30, jy, R + 30, CAP)
        return [D((L + ha, CAP), (cx, jy), clip, e1=60), D((R - ha, CAP), (cx, jy), clip, e1=60), V(cx, 0, jy + 2)]
    add("Y", "Y", 12, 600, 12, Y)

    def Z(L, R, W):
        p0, p1 = (R - 18 - ha, CAP - b), (L + ha, b)
        return [Hb(CAP - b, L + 18, R - 10), Hb(b, L, R), D(p0, p1, (L, b, R, CAP - b), e0=60)]
    add("Z", "Z", 40, 550, 40, Z)

    # --------------------------------------------------------- lowercase
    def bowl(xstem, xfar):
        d = 0.42 * a if xfar > xstem else -0.42 * a
        xstem = xstem + d
        cx = (xstem + xfar) / 2
        return ring(cx, XH / 2, abs(xfar - xstem) / 2, xR)

    def arch(xs, xr, top=XH):
        cx = (xs + xr) / 2
        rx = (xr - xs) / 2
        ry = min(rx * 1.04, top - 140)
        yc = top + OS - b - ry
        s = (Sk((xs, yc)).H((cx, top + OS - b), (0, 1), (1, 0), KAPPA)
             .H((xr, yc), (1, 0), (0, -1), KAPPA).L((xr, 0)))
        return P(s)

    def a_(L, R, W):
        xs = R - a
        return [V(xs, 0, XH), bowl(xs, L + a)]
    add("a", "a", 40, 540, 76, a_)

    def b_(L, R, W):
        xs = L + a
        return [V(xs, 0, ASC), bowl(xs, R - a)]
    add("b", "b", 76, 540, 40, b_)

    def c_(L, R, W):
        cx = (L + R) / 2
        rx = W / 2 - a
        return [ring(cx, XH / 2, rx, xR)], [wedge((cx - rx * 0.2, XH / 2), -36, 36)]
    add("c", "c", 40, 496, 26, c_)

    def d_(L, R, W):
        xs = R - a
        return [V(xs, 0, ASC), bowl(xs, L + a)]
    add("d", "d", 40, 540, 76, d_)

    def e_(L, R, W):
        cx, cy = (L + R) / 2, XH / 2
        rx = W / 2 - a
        ax = cx - rx * 0.15
        t = math.tan(math.radians(31))
        X = R + 200
        y0 = cy - b
        x0 = ax + (cy - y0) / t
        cut = poly([(x0, y0), (X, y0), (X, cy - (X - ax) * t)])
        return [ring(cx, cy, rx, xR), Hb(cy, cx - rx, cx + rx)], [cut]
    add("e", "e", 40, 524, 34, e_)

    def f_(L, R, W):
        xs = L + 62 + a
        r = 118 + 0.9 * E
        top = ASC - b
        s = (Sk((xs, 0)).L((xs, top - r)).H((xs + r, top), (0, 1), (1, 0), KAPPA)
             .L((R, top)))
        return [P(s), Hb(XH - b, L, xs + 168 + 0.5 * E)]
    add("f", "f", 18, 300, 0, f_)

    def g_(L, R, W):
        xs = R - a
        cx = (L + R) / 2
        bot = DESC + b - OS
        r = (xs - cx)
        s = (Sk((xs, XH)).L((xs, bot + r * 0.95)).H((cx, bot), (0, -1), (-1, 0), 0.6)
             .L((L + a * 0.6, bot)))
        return [P(s), bowl(xs, L + a)]
    add("g", "g", 40, 540, 76, g_)

    def h_(L, R, W):
        xs, xr = L + a, R - a
        return [V(xs, 0, ASC), arch(xs, xr)]
    add("h", "h", 76, 484, 76, h_)

    def dot(x):
        r = a * 1.12 + 13
        return Dot(x, XH + 150 + 0.6 * E, r)

    def i_(L, R, W):
        xs = L + a
        return [V(xs, 0, XH), dot(xs)]
    add("i", "i", 76, 2 * LAT_REF, 76, i_, grow=2)

    def j_(L, R, W):
        xs = R - a
        r = max(xs - L - 70, a * 1.6)
        bot = DESC + b - OS
        s = (Sk((xs, XH)).L((xs, bot + r)).H((xs - r, bot), (0, -1), (-1, 0), KAPPA)
             .L((L, bot)))
        return [P(s), dot(xs)]
    add("j", "j", -24, 236, 76, j_)

    def k_(L, R, W):
        xs = L + a
        p0, p1 = (xs, 150), (R - ha * 0.95, XH)
        clip = (L, 0, R + 80, XH)
        j = (at_y(p0, p1, 290), 290)
        return [V(xs, 0, ASC), D(p0, p1, clip), D(j, (R - ha, 0), clip, e0=0)]
    add("k", "k", 76, 460, 12, k_)

    def l_(L, R, W):
        return [V(L + a, 0, ASC)]
    add("l", "l", 76, 2 * LAT_REF, 76, l_, grow=2)

    def m_(L, R, W):
        xs, xr = L + a, R - a
        xm = (xs + xr) / 2
        return [V(xs, 0, XH), arch(xs, xm), arch(xm, xr)]
    add("m", "m", 76, 780, 76, m_, grow=2.6)

    def n_(L, R, W):
        xs, xr = L + a, R - a
        return [V(xs, 0, XH), arch(xs, xr)]
    add("n", "n", 76, 484, 76, n_)

    def o_(L, R, W):
        return [ring((L + R) / 2, XH / 2, W / 2 - a, xR)]
    add("o", "o", 40, 560, 40, o_)

    def p_(L, R, W):
        xs = L + a
        return [V(xs, DESC, XH), bowl(xs, R - a)]
    add("p", "p", 76, 540, 40, p_)

    def q_(L, R, W):
        xs = R - a
        return [V(xs, DESC, XH), bowl(xs, L + a)]
    add("q", "q", 40, 540, 76, q_)

    def r_(L, R, W):
        xs = L + a
        rx = 140 + 0.7 * E
        ry = rx * 1.05
        top = XH + OS - b
        s = (Sk((xs, top - ry)).H((xs + rx, top), (0, 1), (1, 0), KAPPA)
             .L((R, top)))
        return [V(xs, 0, XH), P(s)]
    add("r", "r", 76, 300, 6, r_)

    def s_(L, R, W):
        xs, xr = L + a, R - a
        cx = (L + R) / 2
        k = 0.56
        s = (Sk((xr - 2, 420 - 0.9 * E))
             .H((cx + 3, XH + OS - b), (-0.45, 1), (-1, 0), k)
             .H((xs + 6, 384 - 0.2 * E), (-1, 0), (0, -1), k)
             .H((cx, 268), (0, -1), (1, -0.32), 0.62, 0.5)
             .H((xr, 140 + 0.2 * E), (1, -0.32), (0, -1), 0.5, 0.62)
             .H((cx - 3, b - OS), (0, -1), (-1, 0), k)
             .H((xs - 2, 104 + 0.9 * E), (-1, 0), (-0.45, 1), k))
        return [P(s)]
    add("s", "s", 36, 420, 36, s_)

    def t_(L, R, W):
        xs = L + 58 + a
        r = 118 + 0.9 * E
        bot = b - OS * 0.6
        s = (Sk((xs, XH + 150)).L((xs, bot + r)).H((xs + r, bot), (0, -1), (1, 0), KAPPA)
             .L((R, bot)))
        return [P(s), Hb(XH - b, L, xs + 170 + 0.5 * E)]
    add("t", "t", 16, 310, 4, t_)

    def u_(L, R, W):
        xs, xr = L + a, R - a
        cx = (xs + xr) / 2
        rx = (xr - xs) / 2
        ry = rx * 1.04
        yc = b - OS + ry
        s = (Sk((xs, XH)).L((xs, yc)).H((cx, b - OS), (0, -1), (1, 0), KAPPA)
             .H((xr, yc), (1, 0), (0, 1), KAPPA))
        return [V(xr, 0, XH), P(s)]
    add("u", "u", 76, 484, 76, u_)

    def v_(L, R, W):
        cx = (L + R) / 2
        v = (cx, -28)
        clip = (L - 30, 0, R + 30, XH)
        return [D((L + ha, XH), v, clip), D((R - ha, XH), v, clip)]
    add("v", "v", 10, 504, 10, v_)

    def w_(L, R, W):
        x1, x3 = L + W * 0.255, L + W * 0.745
        cx = (L + R) / 2
        clip = (L - 30, 0, R + 30, XH)
        w = 0.93
        return [D((L + ha, XH), (x1, -24), clip, w=w), D((x1, -24), (cx, XH + 24), clip, w=w),
                D((cx, XH + 24), (x3, -24), clip, w=w), D((x3, -24), (R - ha, XH), clip, w=w)]
    add("w", "w", 10, 770, 10, w_, grow=2.2)

    def x_(L, R, W):
        clip = (L - 30, 0, R + 30, XH)
        return [D((L + ha, XH), (R - ha, 0), clip), D((R - ha, XH), (L + ha, 0), clip)]
    add("x", "x", 14, 484, 14, x_)

    def y_(L, R, W):
        cx = (L + R) / 2
        v = (cx - 6, -28)
        pr = (R - ha, XH)
        xe = at_y(pr, v, DESC)
        return [D((L + ha, XH), v, (L - 30, 0, R + 30, XH)),
                D(pr, (xe, DESC), (L - 200, DESC, R + 30, XH))]
    add("y", "y", 10, 504, 10, y_)

    def z_(L, R, W):
        p0, p1 = (R - 16 - ha, XH - b), (L + ha, b)
        return [Hb(XH - b, L + 16, R - 8), Hb(b, L, R), D(p0, p1, (L, b, R, XH - b), e0=60)]
    add("z", "z", 36, 436, 36, z_)

    return G


# ===================================================================== HEBREW

from hebrew4 import hebrew  # noqa: E402


LATIN_ORDER = [chr(c) for c in range(ord("A"), ord("Z") + 1)] + [chr(c) for c in range(ord("a"), ord("z") + 1)]
HEBREW_ORDER = [chr(c) for c in range(0x05D0, 0x05EB)]
