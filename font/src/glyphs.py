"""Glyph drawings. Every function receives the pen (a, b) and returns a
Glyph whose skeleton is placed so the *outer* contour lands on the
vertical metrics, whatever the weight."""
from engine import *

REG_A = 42.0  # Latin regular half-stem, reference for width growth


def _diag_x(p0, p1, y):
    (x0, y0), (x1, y1) = p0, p1
    return x0 + (x1 - x0) * (y - y0) / (y1 - y0)


def _ext(p0, p1, e=80, e1=None):
    """extend a segment by e units at the start and e1 at the end"""
    if e1 is None:
        e1 = e
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    l = math.hypot(dx, dy)
    ux, uy = dx / l, dy / l
    return [(p0[0] - ux * e, p0[1] - uy * e), (p1[0] + ux * e1, p1[1] + uy * e1)]


# =============================================================== LATIN

def latin(pen):
    a, b = pen.a, pen.b
    E = a - REG_A
    G = {}
    ha = a * 1.12  # horizontal half-width of a diagonal stroke (approx.)

    def add(ch, name, sb_l, w0, sb_r, build, wgrow=1.3):
        W = w0 + wgrow * E
        L = sb_l - 0.15 * E
        R = L + W
        parts = build(L, R, W)
        G[ch] = Glyph(name, ord(ch), round(R + sb_r - 0.15 * E), parts)

    def vstem(x, y0, y1):
        return S(line((x, y0), (x, y1)))

    def hbar(y, x0, x1):
        return S(line((x0, y), (x1, y)))

    def dline(p0, p1, clip, e=90, w=1.0, e1=None):
        return S(_ext(p0, p1, e, e1), clip=clip, w=w)

    # ---------------------------------------------------------- caps
    def A(L, R, W):
        cx = (L + R) / 2
        top = (cx, CAP + 30)
        pl, pr = (L + ha, 0), (R - ha, 0)
        clip = (L - 20, 0, R + 20, CAP)
        yb = 200 + b
        return [dline(pl, top, clip), dline(pr, top, clip),
                hbar(yb, _diag_x(pl, top, yb), _diag_x(pr, top, yb))]
    add("A", "A", 14, 650, 14, A)

    def B(L, R, W):
        xl = L + a
        ym = 385
        xt, xb = R - 34 - a, R - a
        return [vstem(xl, 0, CAP),
                S(rounded([(xl, CAP - b), (xt, CAP - b), (xt, ym), (xl, ym)], (CAP - b - ym) * 0.52)),
                S(rounded([(xl, ym), (xb, ym), (xb, b), (xl, b)], (ym - b) * 0.52))]
    add("B", "B", 78, 520, 50, B)

    def C(L, R, W):
        cx, cy = (L + R) / 2, CAP / 2
        return [S(arc(cx, cy, W / 2 - a, CAP / 2 + OS - b, 44, 316))]
    add("C", "C", 46, 610, 36, C)

    def D(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, 0, CAP),
                S(rounded([(xl, CAP - b), (xr, CAP - b), (xr, b), (xl, b)], 290))]
    add("D", "D", 78, 600, 46, D)

    def Ee(L, R, W):
        xl = L + a
        return [vstem(xl, 0, CAP), hbar(CAP - b, L + a, R), hbar(362, L + a, R - 34), hbar(b, L + a, R + 6)]
    add("E", "E", 78, 470, 48, Ee)

    def F(L, R, W):
        xl = L + a
        return [vstem(xl, 0, CAP), hbar(CAP - b, L + a, R), hbar(345, L + a, R - 40)]
    add("F", "F", 78, 450, 40, F)

    def Gg(L, R, W):
        cx, cy = (L + R) / 2, CAP / 2
        rx, ry = W / 2 - a, CAP / 2 + OS - b
        bar = 322
        p = se_point(cx, cy, rx, ry, 338)
        return [S(chain(arc(cx, cy, rx, ry, 44, 338), [p, (cx + rx, bar), (cx + 34, bar)]))]
    add("G", "G", 46, 650, 62, Gg)

    def H(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, 0, CAP), vstem(xr, 0, CAP), hbar(368, xl, xr)]
    add("H", "H", 78, 570, 78, H)

    def I(L, R, W):
        return [vstem(L + a, 0, CAP)]
    add("I", "I", 78, 2 * REG_A, 78, I, wgrow=2)

    def J(L, R, W):
        xr = R - a
        cx = (L + R) / 2
        return [S(chain(line((xr, CAP), (xr, 250)),
                        hermite((xr, 250, 0, -1), (cx - 10, b - OS, -1, 0), (L + a * 0.9, 175, -0.18, 1))))]
    add("J", "J", 34, 420, 78, J)

    def Kk(L, R, W):
        xl = L + a
        p0, p1 = (xl, 225), (R - ha * 0.9, CAP)
        clip = (L, 0, R, CAP)
        j = (_diag_x(p0, p1, 405), 405)
        return [vstem(xl, 0, CAP), dline(p0, p1, clip), dline(j, (R - ha, 0), clip, e=0, e1=90)]
    add("K", "K", 78, 550, 18, Kk)

    def Ll(L, R, W):
        xl = L + a
        return [vstem(xl, 0, CAP), hbar(b, xl, R)]
    add("L", "L", 78, 445, 30, Ll)

    def M(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        clip = (L, 0, R, CAP)
        v = (cx, -20)
        return [vstem(xl, 0, CAP), vstem(xr, 0, CAP),
                dline((xl, CAP + 20), v, clip, w=0.88), dline((xr, CAP + 20), v, clip, w=0.88)]
    add("M", "M", 78, 710, 78, M)

    def N(L, R, W):
        xl, xr = L + a, R - a
        clip = (L, 0, R, CAP)
        return [vstem(xl, 0, CAP), vstem(xr, 0, CAP), dline((xl, CAP + 25), (xr, -25), clip)]
    add("N", "N", 78, 590, 78, N)

    def O(L, R, W):
        cx, cy = (L + R) / 2, CAP / 2
        return [S(arc(cx, cy, W / 2 - a, CAP / 2 + OS - b, 0, 360), closed=True)]
    add("O", "O", 46, 700, 46, O)

    def P(L, R, W):
        xl, xr = L + a, R - a
        ym = 318
        return [vstem(xl, 0, CAP), S(rounded([(xl, CAP - b), (xr, CAP - b), (xr, ym), (xl, ym)], (CAP - b - ym) * 0.52))]
    add("P", "P", 78, 520, 40, P)

    def Q(L, R, W):
        cx, cy = (L + R) / 2, CAP / 2
        return O(L, R, W) + [dline((cx + 70, 150), (R + 10, -70), (L, -95, R + 40, CAP), e=10)]
    add("Q", "Q", 46, 700, 46, Q)

    def Rr(L, R, W):
        xl, xr = L + a, R - 20 - a
        ym = 335
        j = ((xl + xr) / 2 + 10, ym)
        return [vstem(xl, 0, CAP),
                S(rounded([(xl, CAP - b), (xr, CAP - b), (xr, ym), (xl, ym)], (CAP - b - ym) * 0.52)),
                dline(j, (R - ha, 0), (L, 0, R, ym), e=60)]
    add("R", "R", 78, 545, 22, Rr)

    def Ss(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        return [S(hermite((xr - 6, 575 - (b - 37), -0.32, 1),
                          (cx + 4, CAP + OS - b, -1, 0),
                          (xl + 8, 527, 0, -1),
                          (cx, 368, 1, -0.32, 0.62, 0.62),
                          (xr, 185, 0, -1),
                          (cx - 6, b - OS, -1, 0),
                          (xl - 4, 128 + (b - 37), -0.32, 1)))]
    add("S", "S", 44, 510, 44, Ss)

    def T(L, R, W):
        cx = (L + R) / 2
        return [hbar(CAP - b, L, R), vstem(cx, 0, CAP - b)]
    add("T", "T", 22, 560, 22, T)

    def U(L, R, W):
        xl, xr = L + a, R - a
        return [S(rounded([(xl, CAP), (xl, b - OS), (xr, b - OS), (xr, CAP)], 255))]
    add("U", "U", 74, 580, 74, U)

    def V(L, R, W):
        cx = (L + R) / 2
        v = (cx, -30)
        clip = (L - 20, 0, R + 20, CAP)
        return [dline((L + ha, CAP), v, clip), dline((R - ha, CAP), v, clip)]
    add("V", "V", 12, 620, 12, V)

    def Ww(L, R, W):
        x1, x3 = L + W * 0.25, L + W * 0.75
        cx = (L + R) / 2
        clip = (L - 20, 0, R + 20, CAP)
        return [dline((L + ha, CAP), (x1, -25), clip, w=0.94), dline((x1, -25), (cx, CAP + 25), clip, w=0.94),
                dline((cx, CAP + 25), (x3, -25), clip, w=0.94), dline((x3, -25), (R - ha, CAP), clip, w=0.94)]
    add("W", "W", 12, 910, 12, Ww, wgrow=2)

    def X(L, R, W):
        clip = (L - 20, 0, R + 20, CAP)
        return [dline((L + ha, CAP), (R - ha, 0), clip), dline((R - ha, CAP), (L + ha, 0), clip)]
    add("X", "X", 18, 590, 18, X)

    def Y(L, R, W):
        cx = (L + R) / 2
        jy = 320
        clip = (L - 20, jy, R + 20, CAP)
        return [dline((L + ha, CAP), (cx, jy), clip), dline((R - ha, CAP), (cx, jy), clip), vstem(cx, 0, jy + 1)]
    add("Y", "Y", 14, 590, 14, Y)

    def Z(L, R, W):
        p0, p1 = (R - 20 - ha, CAP - b), (L + ha, b)
        return [hbar(CAP - b, L + 18, R - 12), hbar(b, L, R), dline(p0, p1, (L, b, R, CAP - b), e=40)]
    add("Z", "Z", 42, 540, 42, Z)

    # ------------------------------------------------------ lowercase
    def arch(xl, xr, top=XH, start=380):
        mid = (xl + xr) / 2 + 8
        return hermite((xl, start, 0.42, 1), (mid, top + OS - b, 1, 0), (xr, top - 205, 0, -1))

    def bowl_r(xl, xr, top=XH):  # bowl to the right of a stem (b, p)
        mid = (xl + xr) / 2 + 12
        return hermite((xl, top - 128, 0.42, 1), (mid, top + OS - b, 1, 0), (xr, top / 2, 0, -1),
                       (mid, b - OS, -1, 0), (xl, 150, -0.15, 1))

    def bowl_l(xl, xr, top=XH):  # bowl to the left of a stem (d, q, g)
        mid = (xl + xr) / 2 - 12
        return hermite((xr, top - 128, -0.42, 1), (mid, top + OS - b, -1, 0), (xl, top / 2, 0, -1),
                       (mid, b - OS, 1, 0), (xr, 150, 0.15, 1))

    def a_(L, R, W):
        xr = R - a
        xl = L + a
        bowl_top = 300 - (b - 37) * 0.3
        return [S(chain(hermite((xl + 6, 420 - 1.2 * (b - 37), 0.28, 1), ((L + R) / 2 - 6, XH + OS - b, 1, 0), (xr, 345, 0, -1)),
                        line((xr, 345), (xr, 0)))),
                S(chain(line((xr, bowl_top), ((L + R) / 2 + 20, bowl_top)),
                        hermite(((L + R) / 2 + 20, bowl_top, -1, 0), (xl, 158, 0, -1), ((L + R) / 2 - 12, b - OS, 1, 0), (xr, 165, 0.12, 1))))]
    add("a", "a", 40, 455, 66, a_)

    def b_(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, 0, ASC), S(bowl_r(xl, xr))]
    add("b", "b", 70, 500, 42, b_)

    def c_(L, R, W):
        cx = (L + R) / 2
        return [S(arc(cx, XH / 2, W / 2 - a, XH / 2 + OS - b, 46, 314))]
    add("c", "c", 42, 470, 30, c_)

    def d_(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xr, 0, ASC), S(bowl_l(xl, xr))]
    add("d", "d", 42, 500, 70, d_)

    def e_(L, R, W):
        cx, cy = (L + R) / 2, XH / 2
        rx, ry = W / 2 - a, XH / 2 + OS - b
        return [S(chain([(cx - rx, cy), (cx + rx, cy)], arc(cx, cy, rx, ry, 0, 318)))]
    add("e", "e", 42, 505, 36, e_)

    def f_(L, R, W):
        xs = L + 70 + a
        return [S(chain(line((xs, 0), (xs, 520 - 1.6 * (b - 37))),
                        hermite((xs, 520 - 1.6 * (b - 37), 0, 1), (xs + 120, ASC + OS - b, 1, 0), (R, ASC - b - 13 - 0.8 * (b - 37), 0.55, -0.45)))),
                hbar(XH - b, L, L + 255)]
    add("f", "f", 18, 285, 0, f_)

    def g_(L, R, W):
        xl, xr = L + a, R - a
        return [S(bowl_l(xl, xr)),
                S(chain(line((xr, XH), (xr, -45)),
                        hermite((xr, -45, 0, -1), ((L + R) / 2, DESC + b - OS, -1, 0), (xl + 4, -122 + 0.4 * (b - 37), -1, 0.5))))]
    add("g", "g", 42, 500, 70, g_)

    def h_(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, 0, ASC), S(chain(arch(xl, xr), line((xr, XH - 205), (xr, 0))))]
    add("h", "h", 70, 455, 70, h_)

    def i_(L, R, W):
        xl = L + a
        return [vstem(xl, 0, XH), Dot(xl, 655, a * 1.2, a * 1.2)]
    add("i", "i", 70, 2 * REG_A, 70, i_, wgrow=2)

    def j_(L, R, W):
        xs = R - a
        return [S(chain(line((xs, XH), (xs, -55)),
                        hermite((xs, -40, 0, -1), (xs - 105, DESC + b - OS, -1, 0), (L, DESC + b - 15 + 0.9 * (b - 37), -1, 0.12)))),
                Dot(xs, 655, a * 1.2, a * 1.2)]
    add("j", "j", -30, 205, 70, j_)

    def k_(L, R, W):
        xl = L + a
        p0, p1 = (xl, 140), (R - ha * 0.9, XH)
        clip = (L, 0, R, XH)
        j = (_diag_x(p0, p1, 285), 285)
        return [vstem(xl, 0, ASC), dline(p0, p1, clip), dline(j, (R - ha, 0), clip, e=0, e1=90)]
    add("k", "k", 70, 450, 14, k_)

    def l_(L, R, W):
        return [vstem(L + a, 0, ASC)]
    add("l", "l", 70, 2 * REG_A, 70, l_, wgrow=2)

    def m_(L, R, W):
        xl, xr = L + a, R - a
        xm = (xl + xr) / 2
        return [vstem(xl, 0, XH),
                S(chain(arch(xl, xm, start=385), line((xm, XH - 205), (xm, 0)))),
                S(chain(arch(xm, xr, start=385), line((xr, XH - 205), (xr, 0))))]
    add("m", "m", 70, 760, 70, m_, wgrow=2.4)

    def n_(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, 0, XH), S(chain(arch(xl, xr), line((xr, XH - 205), (xr, 0))))]
    add("n", "n", 70, 455, 70, n_)

    def o_(L, R, W):
        cx = (L + R) / 2
        return [S(arc(cx, XH / 2, W / 2 - a, XH / 2 + OS - b, 0, 360), closed=True)]
    add("o", "o", 42, 530, 42, o_)

    def p_(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, DESC, XH), S(bowl_r(xl, xr))]
    add("p", "p", 70, 500, 42, p_)

    def q_(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xr, DESC, XH), S(bowl_l(xl, xr))]
    add("q", "q", 42, 500, 70, q_)

    def r_(L, R, W):
        xl = L + a
        return [vstem(xl, 0, XH),
                S(hermite((xl, 375, 0.42, 1), (xl + 125, XH + OS - b, 1, 0), (R, XH - b - 5 - 0.9 * (b - 37), 1, -0.3)))]
    add("r", "r", 70, 300, 8, r_)

    def s_(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        return [S(hermite((xr - 4, 412 - (b - 37), -0.32, 1),
                          (cx + 4, XH + OS - b, -1, 0),
                          (xl + 6, 378, 0, -1),
                          (cx, 268, 1, -0.30, 0.62, 0.62),
                          (xr, 133, 0, -1),
                          (cx - 4, b - OS, -1, 0),
                          (xl - 4, 95 + (b - 37), -0.32, 1)))]
    add("s", "s", 38, 410, 38, s_)

    def t_(L, R, W):
        xs = L + 62 + a
        return [S(chain(line((xs, 645), (xs, 165)),
                        hermite((xs, 165, 0, -1), (xs + 112, b - OS, 1, 0), (R, b - 11 + 0.9 * (b - 37), 1, 0.22)))),
                hbar(XH - b, L, L + 270)]
    add("t", "t", 16, 300, 6, t_)

    def u_(L, R, W):
        xl, xr = L + a, R - a
        mid = (xl + xr) / 2 - 8
        return [vstem(xr, 0, XH),
                S(chain(line((xl, XH), (xl, 205)),
                        hermite((xl, 205, 0, -1), (mid, b - OS, 1, 0), (xr, 160, 0.15, 1))))]
    add("u", "u", 70, 455, 70, u_)

    def v_(L, R, W):
        cx = (L + R) / 2
        v = (cx, -25)
        clip = (L - 20, 0, R + 20, XH)
        return [dline((L + ha, XH), v, clip), dline((R - ha, XH), v, clip)]
    add("v", "v", 12, 490, 12, v_)

    def w_(L, R, W):
        x1, x3 = L + W * 0.25, L + W * 0.75
        cx = (L + R) / 2
        clip = (L - 20, 0, R + 20, XH)
        return [dline((L + ha, XH), (x1, -20), clip, w=0.92), dline((x1, -20), (cx, XH + 20), clip, w=0.92),
                dline((cx, XH + 20), (x3, -20), clip, w=0.92), dline((x3, -20), (R - ha, XH), clip, w=0.92)]
    add("w", "w", 12, 740, 12, w_, wgrow=2)

    def x_(L, R, W):
        clip = (L - 20, 0, R + 20, XH)
        return [dline((L + ha, XH), (R - ha, 0), clip), dline((R - ha, XH), (L + ha, 0), clip)]
    add("x", "x", 16, 470, 16, x_)

    def y_(L, R, W):
        cx = (L + R) / 2
        v = (cx - 8, -25)
        pr = (R - ha, XH)
        y_end = DESC
        xe = _diag_x(pr, v, y_end)
        return [dline((L + ha, XH), v, (L - 20, 0, R + 20, XH)),
                dline(pr, (xe, y_end), (L - 120, DESC, R + 20, XH))]
    add("y", "y", 12, 490, 12, y_)

    def z_(L, R, W):
        p0, p1 = (R - 16 - ha, XH - b), (L + ha, b)
        return [hbar(XH - b, L + 16, R - 10), hbar(b, L, R), dline(p0, p1, (L, b, R, XH - b), e=40)]
    add("z", "z", 38, 420, 38, z_)

    return G


# =============================================================== HEBREW

def hebrew(pen):
    a, b = pen.a, pen.b
    E = a - 36.0
    G = {}
    H = HEB
    yt, yb = H - b, b
    ha = a * 1.15

    def add(ch, name, sb_l, w0, sb_r, build, wgrow=1.3):
        W = w0 + wgrow * E
        L = sb_l - 0.15 * E
        R = L + W
        parts = build(L, R, W)
        G[ch] = Glyph(name, ord(ch), round(R + sb_r - 0.15 * E), parts, script="hebr")

    def vstem(x, y0, y1):
        return S(line((x, y0), (x, y1)))

    def hbar(y, x0, x1):
        return S(line((x0, y), (x1, y)))

    def R_(pts, r):
        return S(rounded(pts, r))

    def dline(p0, p1, clip, e=80, w=1.0, e1=None):
        return S(_ext(p0, p1, e, e1), clip=clip, w=w)

    # alef
    def alef(L, R, W):
        p0, p1 = (L + ha + 6, H), (R - ha - 6, 0)
        clip = (L, 0, R, H)
        xr, xl = R - a, L + a
        y_r = 205
        y_l = 335
        return [dline(p0, p1, clip),
                R_([(xr, H), (xr, 330), (_diag_x(p0, p1, y_r), y_r)], 95),
                R_([(_diag_x(p0, p1, y_l), y_l), (xl, 220), (xl, 0)], 85)]
    add("א", "alef", 44, 520, 44, alef)

    def bet(L, R, W):
        xs = R - 34 - a
        return [R_([(L + 4, yt), (xs, yt), (xs, yb)], 118), hbar(yb, L, R)]
    add("ב", "bet", 40, 500, 36, bet)

    def gimel(L, R, W):
        xs = R - a
        p0, p1 = (xs, 235), (L + ha * 0.6, -40)
        return [R_([(L + 50, yt), (xs, yt), (xs, 0)], 60),
                dline(p0, p1, (L, 0, R, H), e=10)]
    add("ג", "gimel", 30, 320, 46, gimel)

    def dalet(L, R, W):
        xs = R - 72 - a
        return [hbar(yt, L, R), vstem(xs, 0, yt)]
    add("ד", "dalet", 34, 500, 30, dalet)

    def he(L, R, W):
        xs = R - 30 - a
        return [hbar(yt, L, R), vstem(xs, 0, yt), vstem(L + a + 6, 0, 330)]
    add("ה", "he", 54, 500, 34, he)

    def vav(L, R, W):
        xs = R - a
        return [R_([(L, yt), (xs, yt), (xs, 0)], 36)]
    add("ו", "vav", 44, 150, 50, vav, wgrow=1.6)

    def zayin(L, R, W):
        xs = L + W * 0.56
        return [hbar(yt, L, R), vstem(xs, 0, yt)]
    add("ז", "zayin", 30, 250, 30, zayin, wgrow=1.6)

    def het(L, R, W):
        xl, xr = L + a, R - a
        return [R_([(xl, 0), (xl, yt), (xr, yt), (xr, 0)], 70)]
    add("ח", "het", 56, 490, 56, het)

    def tet(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2 + 18
        return [R_([(xl, H), (xl, yb), (xr, yb), (xr, yt), (cx, yt), (cx, 330)], [190, 190, 92, 50])]
    add("ט", "tet", 54, 500, 54, tet)

    def yod(L, R, W):
        xs = R - a
        return [R_([(L, yt), (xs, yt), (xs, 268)], 40)]
    add("י", "yod", 44, 150, 50, yod, wgrow=1.6)

    def kaf(L, R, W):
        xr = R - a
        return [R_([(L + 8, yt), (xr, yt), (xr, yb), (L, yb)], [150, 150])]
    add("כ", "kaf", 44, 450, 54, kaf)

    def kaf_f(L, R, W):
        xr = R - a
        return [R_([(L, yt), (xr, yt), (xr, DESC)], 150)]
    add("ך", "finalkaf", 40, 440, 56, kaf_f)

    def lamed(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        return [S(chain(rounded([(xl, HEB_ASC), (xl, yt), (xr, yt), (xr, 265)], [0, 110]),
                        hermite((xr, 265, 0, -1), (cx - 40, -30, -0.62, -1, 0.5))), clip=(L - 60, 0, R + 60, HEB_ASC + 10))]
    add("ל", "lamed", 52, 460, 36, lamed)

    def mem(L, R, W):
        xs = L + 46 + a
        xr = R - a
        return [R_([(L, yt), (xr, yt), (xr, yb), (xs + a + 54, yb)], [130, 130]),
                vstem(xs, 0, yt)]
    add("מ", "mem", 30, 540, 54, mem)

    def mem_f(L, R, W):
        xl, xr = L + a, R - a
        my = H / 2
        return [R_([(xl, my), (xl, yt), (xr, yt), (xr, yb), (xl, yb), (xl, my)], [0, 120, 120, 0])]
    add("ם", "finalmem", 56, 500, 56, mem_f)

    def nun(L, R, W):
        xr = R - a
        return [R_([(L + 8, yt), (xr, yt), (xr, yb), (L, yb)], [62, 62])]
    add("נ", "nun", 36, 290, 54, nun)

    def nun_f(L, R, W):
        xs = R - a
        return [R_([(L, yt), (xs, yt), (xs, DESC)], 36)]
    add("ן", "finalnun", 44, 150, 50, nun_f, wgrow=1.6)

    def samekh(L, R, W):
        xl, xr = L + 34 + a, R - a
        return [R_([(L, yt), (xr, yt), (xr, yb), (xl, yb), (xl, yt)], [70, 205, 205, 0])]
    add("ס", "samekh", 30, 530, 54, samekh)

    def ayin(L, R, W):
        xl, xr = L + 18 + a, R - a
        return [R_([(xr, H), (xr, yb), (L - 10, yb)], 170),
                S(chain(line((xl, H), (xl, 310)),
                        hermite((xl, 330, 0, -1), (xr, 175, 1, 0.12, 0.62))))]
    add("ע", "ayin", 50, 500, 54, ayin)

    def pe(L, R, W):
        xl, xr = L + 6 + a, R - a
        return [R_([(xl, 295), (xl, yt), (xr, yt), (xr, yb), (L, yb)], [0, 150, 150])]
    add("פ", "pe", 44, 480, 54, pe)

    def pe_f(L, R, W):
        xl, xr = L + a, R - a
        return [R_([(xl, 295), (xl, yt), (xr, yt), (xr, DESC)], [0, 150])]
    add("ף", "finalpe", 50, 450, 56, pe_f)

    def tsadi(L, R, W):
        xl, xr = L + a, R - a
        p0, p1 = (xl, H), (xr - 20, yb + 10)
        y_r = 225
        d0, d1 = (xl, H - 120), (xr - 34, yb)
        return [S(rounded([(xl, H), d0, d1, (L - 4, yb)], [70, 40])),
                R_([(xr, H), (xr, 345), (_diag_x(d0, d1, y_r), y_r)], 85)]
    add("צ", "tsadi", 44, 480, 50, tsadi)

    def tsadi_f(L, R, W):
        xl, xr = L + a, R - a
        return [vstem(xl, DESC, H),
                R_([(xr, H), (xr, 350), (xl, 215)], 95)]
    add("ץ", "finaltsadi", 56, 450, 50, tsadi_f)

    def qof(L, R, W):
        xr = R - a
        return [R_([(L, yt), (xr, yt), (xr, 0)], 125), vstem(L + 6 + a, DESC, min(345, yt - b - 80))]
    add("ק", "qof", 46, 480, 56, qof)

    def resh(L, R, W):
        xr = R - a
        return [R_([(L, yt), (xr, yt), (xr, 0)], 180)]
    add("ר", "resh", 40, 450, 56, resh)

    def shin(L, R, W):
        xl, xr = L + a, R - a
        cx = (L + R) / 2
        return [R_([(xl, H), (xl, yb), (xr, yb), (xr, H)], [125, 125]),
                dline((cx - 32, H), (cx + 22, yb), (L, yb, R, H), e=30)]
    add("ש", "shin", 56, 580, 56, shin)

    def tav(L, R, W):
        xr = R - a
        xg = L + 46 + a
        return [R_([(L + 24, yt), (xr, yt), (xr, 0)], 110),
                R_([(xg, yt), (xg, yb), (L, yb)], 0)]
    add("ת", "tav", 30, 540, 56, tav)

    return G


LATIN_ORDER = [chr(c) for c in range(ord("A"), ord("Z") + 1)] + [chr(c) for c in range(ord("a"), ord("z") + 1)]
HEBREW_ORDER = [chr(c) for c in range(0x05D0, 0x05EB)]
