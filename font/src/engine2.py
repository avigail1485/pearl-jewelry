"""Engine v2 - exact Bezier construction.

Every glyph is drawn as centre-line skeletons made of real lines and
cubic Beziers. Skeletons are stroked by Skia (pathops) with an
elliptical pen (y is pre-scaled so a round pen becomes elliptical),
combined with boolean union, clipped and cut with exact geometry. The
result is a clean outline made of curves - the same data that goes
into the final font file.
"""
import math
import os
import pathops
from pathops import Path, LineCap, LineJoin, PathOp

# ------------------------------------------------------------- metrics
UPM = 1000
CAP = 700
XH = 520
ASC = 745
DESC = -215
HEB = 600
HEB_ASC = 720
HDESC = -200
OS = 12            # overshoot of round forms
VARIANT = os.environ.get("NIRIT_VARIANT", "sans")   # "sans" or "round"
ROUND = VARIANT == "round"
FAMILY_NAME = "Nirit Round" if ROUND else "Nirit Sans"
ROUND_CAPS = False   # the Round family keeps straight cut terminals, like the reference
KAPPA = 0.585      # handle length of the "squircle" quadrant (circle 0.552)


def _norm(v):
    l = math.hypot(*v)
    return (v[0] / l, v[1] / l) if l else (0.0, 0.0)


def _add(p, v, k=1.0):
    return (p[0] + v[0] * k, p[1] + v[1] * k)


# ------------------------------------------------------------- skeleton
class Sk:
    """A centre-line path made from lines and cubic Beziers."""

    def __init__(self, p0):
        self.segs = []  # ('L', p) or ('C', c1, c2, p)
        self.start = tuple(p0)
        self.cur = tuple(p0)
        self.closed = False

    def L(self, *pts):
        for p in pts:
            self.segs.append(("L", tuple(p)))
            self.cur = tuple(p)
        return self

    def C(self, c1, c2, p):
        self.segs.append(("C", tuple(c1), tuple(c2), tuple(p)))
        self.cur = tuple(p)
        return self

    def H(self, p, t0, t1, k0=0.56, k1=None):
        """smooth cubic to p, leaving along t0 and arriving along t1;
        handle lengths are k * projected distance (exact quarter-ellipse
        when the tangents are axis aligned)."""
        if k1 is None:
            k1 = k0
        p0 = self.cur
        t0, t1 = _norm(t0), _norm(t1)
        d = (p[0] - p0[0], p[1] - p0[1])
        h0 = abs(d[0] * t0[0] + d[1] * t0[1]) or math.hypot(*d)
        h1 = abs(d[0] * t1[0] + d[1] * t1[1]) or math.hypot(*d)
        return self.C(_add(p0, t0, k0 * h0), _add(p, t1, -k1 * h1), p)

    def R(self, corner, nxt, r, k=0.6):
        """line towards `corner`, rounding it with radius r, ending at the
        tangent point on the way to `nxt` (the next call continues)."""
        p0 = self.cur
        v0 = _norm((p0[0] - corner[0], p0[1] - corner[1]))
        v1 = _norm((nxt[0] - corner[0], nxt[1] - corner[1]))
        if r <= 0:
            return self.L(corner)
        a = _add(corner, v0, r)
        b = _add(corner, v1, r)
        if math.hypot(a[0] - p0[0], a[1] - p0[1]) > 0.01:
            self.L(a)
        return self.C(_add(a, v0, -r * k), _add(b, v1, -r * k), b)

    def close(self):
        self.closed = True
        return self

    # sampling for drawing the dotted skeleton
    def sample(self, n=24):
        pts = [self.start]
        p = self.start
        for s in self.segs:
            if s[0] == "L":
                pts.append(s[1])
            else:
                for i in range(1, n + 1):
                    pts.append(bez(p, s[1], s[2], s[3], i / n))
            p = s[-1]
        if self.closed:
            pts.append(self.start)
        return pts

    def path(self):
        p = Path()
        p.moveTo(*self.start)
        for s in self.segs:
            if s[0] == "L":
                p.lineTo(*s[1])
            else:
                p.cubicTo(*s[1], *s[2], *s[3])
        if self.closed:
            p.close()
        return p


def bez(p0, c1, c2, p3, t):
    mt = 1 - t
    return (mt**3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t**3 * p3[0],
            mt**3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t**3 * p3[1])


def ellipse(cx, cy, rx, ry, k=KAPPA):
    """closed squircle starting at the right extreme, counter-clockwise"""
    s = Sk((cx + rx, cy))
    s.C((cx + rx, cy + ry * k), (cx + rx * k, cy + ry), (cx, cy + ry))
    s.C((cx - rx * k, cy + ry), (cx - rx, cy + ry * k), (cx - rx, cy))
    s.C((cx - rx, cy - ry * k), (cx - rx * k, cy - ry), (cx, cy - ry))
    s.C((cx + rx * k, cy - ry), (cx + rx, cy - ry * k), (cx + rx, cy))
    return s.close()


def line(p0, p1):
    return Sk(p0).L(p1)


def ext(p0, p1, e0=80, e1=None):
    """straight skeleton p0->p1 extended at both ends (to be clipped)"""
    if e1 is None:
        e1 = e0
    u = _norm((p1[0] - p0[0], p1[1] - p0[1]))
    return Sk(_add(p0, u, -e0)).L(_add(p1, u, e1))


def at_y(p0, p1, y):
    return p0[0] + (p1[0] - p0[0]) * (y - p0[1]) / (p1[1] - p0[1])


# ------------------------------------------------------------- shapes
def rect(x0, y0, x1, y1):
    p = Path()
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y1); p.lineTo(x0, y1); p.close()
    return p


def poly(pts):
    p = Path()
    p.moveTo(*pts[0])
    for q in pts[1:]:
        p.lineTo(*q)
    p.close()
    return p


def halfplane(p, ang, keep_pt, R=400):
    """polygon covering the side of the line through p (direction ang,
    degrees) that does NOT contain keep_pt, limited to radius R."""
    d = (math.cos(math.radians(ang)), math.sin(math.radians(ang)))
    n = (-d[1], d[0])
    side = (keep_pt[0] - p[0]) * n[0] + (keep_pt[1] - p[1]) * n[1]
    if side > 0:
        n = (-n[0], -n[1])
    a = _add(p, d, R)
    b = _add(p, d, -R)
    return poly([a, _add(a, n, R), _add(b, n, R), b])


class Part:
    """a skeleton plus how to render it"""

    def __init__(self, sk, w=1.0, clip=None, cap="butt", join="round"):
        self.sk = sk
        self.w = w
        self.clip = clip
        self.cap = cap
        self.join = join


class Dot:
    def __init__(self, cx, cy, r):
        self.cx, self.cy, self.r = cx, cy, r


def P(sk, **kw):
    return Part(sk, **kw)


def _trim(sk, a, b, w):
    """shorten both open ends by the pen's reach so a round cap ends
    exactly where a butt cap would."""
    import copy
    t = copy.deepcopy(sk)
    segs = t.segs
    if not segs or t.closed:
        return t

    def reach(v):
        v = _norm(v)
        return math.hypot(a * v[0], b * v[1]) * w

    # start
    s0 = segs[0]
    nxt = s0[1] if s0[0] == "L" else s0[1]
    v = (nxt[0] - t.start[0], nxt[1] - t.start[1])
    if math.hypot(*v) > 1e-6:
        d = reach(v)
        u = _norm(v)
        if s0[0] == "L" and math.hypot(*v) < d * 1.3:
            pass
        else:
            t.start = _add(t.start, u, d)
            if s0[0] == "C":
                segs[0] = ("C", _add(s0[1], u, d), s0[2], s0[3])
    # end
    s1 = segs[-1]
    prev_pt = (t.start if len(segs) == 1 else segs[-2][-1]) if s1[0] == "L" else s1[2]
    end = s1[-1]
    v = (end[0] - prev_pt[0], end[1] - prev_pt[1])
    if math.hypot(*v) > 1e-6:
        d = reach(v)
        u = _norm(v)
        if not (s1[0] == "L" and math.hypot(*v) < d * 1.3):
            if s1[0] == "L":
                segs[-1] = ("L", _add(end, u, -d))
            else:
                segs[-1] = ("C", s1[1], _add(s1[2], u, -d), _add(end, u, -d))
    return t


def _stroke(part, a, b):
    s = a / b
    sk = part.sk
    capname = part.cap
    if ROUND_CAPS and capname == "butt" and part.clip is None and not sk.closed:
        sk = _trim(sk, a, b, part.w)
        capname = "round"
    p = sk.path().transform(1, 0, 0, s, 0, 0)
    cap = {"butt": LineCap.BUTT_CAP, "round": LineCap.ROUND_CAP, "square": LineCap.SQUARE_CAP}[capname]
    join = {"round": LineJoin.ROUND_JOIN, "miter": LineJoin.MITER_JOIN}[part.join]
    p.stroke(2 * a * part.w, cap, join, 10)
    p.convertConicsToQuads()
    p = p.transform(1, 0, 0, 1 / s, 0, 0)
    p = pathops.simplify(p, fix_winding=True)
    if part.clip is not None:
        p = pathops.op(p, rect(*part.clip), PathOp.INTERSECTION, fix_winding=True)
    return p


class Glyph:
    def __init__(self, name, uni, width, parts, script, cuts=(), holes=()):
        self.name = name
        self.uni = uni
        self.width = width
        self.parts = parts
        self.script = script
        self.cuts = list(cuts)    # polygons removed after union
        self.holes = list(holes)

    def outline(self, a, b):
        key = (round(a, 3), round(b, 3), getattr(self, "dx", 0))
        if getattr(self, "_ck", None) == key:
            return self._cv
        res = self._outline(a, b)
        dx = getattr(self, "dx", 0)
        if dx:
            res = res.transform(1, 0, 0, 1, dx, 0)
        self._ck, self._cv = key, res
        return res

    def _outline(self, a, b):
        paths = []
        for pt in self.parts:
            if isinstance(pt, Dot):
                paths.append(ellipse(pt.cx, pt.cy, pt.r, pt.r, 0.5523).path())
            elif isinstance(pt, Path):
                paths.append(pt)
            else:
                paths.append(_stroke(pt, a, b))
        res = paths[0]
        for q in paths[1:]:
            res = pathops.op(res, q, PathOp.UNION, fix_winding=True, keep_starting_points=False)
        for c in self.cuts:
            res = pathops.op(res, c, PathOp.DIFFERENCE, fix_winding=True)
        res = pathops.simplify(res, fix_winding=True, keep_starting_points=False)
        return res

    def skeletons(self):
        return [pt.sk for pt in self.parts if isinstance(pt, Part)]
