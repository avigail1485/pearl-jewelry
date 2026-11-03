"""Skeleton-and-pen engine for the "Nirit" sans family.

Every glyph is drawn as centre-line skeletons that are expanded with an
elliptical pen (half-width `a` horizontally, half-height `b` vertically).
Hebrew uses a pen whose horizontal strokes are heavier than its vertical
ones; Latin uses the opposite. The weight of the family is controlled
only through the pen, so all six weights share one set of drawings.
"""
import math
from shapely.geometry import LineString, Polygon, MultiPolygon, Point, box
from shapely.ops import unary_union
from shapely import affinity

UPM = 1000
CAP = 700
XH = 510
ASC = 735
DESC = -210
HEB = 540          # Hebrew body height
HEB_ASC = 760      # lamed
OS = 11            # overshoot for round forms
SE_N = 2.25        # superellipse exponent (slightly squarer than a circle)
K = 0.58           # handle factor for hermite curves (0.552 = circle)


class Pen:
    def __init__(self, a, b):
        self.a = a  # half thickness of vertical strokes
        self.b = b  # half thickness of horizontal strokes


# ---------------------------------------------------------------- paths

def lerp(p, q, t):
    return (p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)


def line(p0, p1, n=2):
    return [lerp(p0, p1, i / (n - 1)) for i in range(n)]


def cubic(p0, c1, c2, p3, n=40):
    pts = []
    for i in range(n + 1):
        t = i / n
        mt = 1 - t
        x = mt**3 * p0[0] + 3 * mt * mt * t * c1[0] + 3 * mt * t * t * c2[0] + t**3 * p3[0]
        y = mt**3 * p0[1] + 3 * mt * mt * t * c1[1] + 3 * mt * t * t * c2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def _norm(v):
    l = math.hypot(*v)
    return (v[0] / l, v[1] / l) if l else (0, 0)


def hermite(*nodes, k=K, n=40):
    """nodes: (x, y, tx, ty[, k_out[, k_in]]) – a smooth curve through
    points with the given tangent directions."""
    pts = []
    for i in range(len(nodes) - 1):
        p0 = nodes[i]
        p1 = nodes[i + 1]
        t0 = _norm((p0[2], p0[3]))
        t1 = _norm((p1[2], p1[3]))
        d = (p1[0] - p0[0], p1[1] - p0[1])
        ko = p0[4] if len(p0) > 4 else k
        ki = p1[5] if len(p1) > 5 else (p1[4] if len(p1) > 4 else k)
        h0 = ko * abs(d[0] * t0[0] + d[1] * t0[1])
        h1 = ki * abs(d[0] * t1[0] + d[1] * t1[1])
        if h0 < 1e-6:
            h0 = ko * math.hypot(*d)
        if h1 < 1e-6:
            h1 = ki * math.hypot(*d)
        c1 = (p0[0] + t0[0] * h0, p0[1] + t0[1] * h0)
        c2 = (p1[0] - t1[0] * h1, p1[1] - t1[1] * h1)
        seg = cubic(p0[:2], c1, c2, p1[:2], n)
        pts.extend(seg if not pts else seg[1:])
    return pts


def se_point(cx, cy, rx, ry, deg, n=SE_N):
    t = math.radians(deg)
    c, s = math.cos(t), math.sin(t)
    x = cx + rx * math.copysign(abs(c) ** (2 / n), c)
    y = cy + ry * math.copysign(abs(s) ** (2 / n), s)
    return (x, y)


def arc(cx, cy, rx, ry, d0, d1, n=SE_N, steps=None):
    """superellipse arc from angle d0 to d1 (degrees, CCW positive)."""
    if steps is None:
        steps = max(8, int(abs(d1 - d0) / 2))
    return [se_point(cx, cy, rx, ry, d0 + (d1 - d0) * i / steps, n) for i in range(steps + 1)]


def chain(*parts):
    out = []
    for p in parts:
        if not p:
            continue
        if out and math.hypot(out[-1][0] - p[0][0], out[-1][1] - p[0][1]) < 1e-6:
            out.extend(p[1:])
        else:
            out.extend(p)
    return out


def rounded(points, radius, steps=24):
    """Polyline through `points` with circular-ish fillets at the inner
    vertices. `radius` may be a number or a list per inner vertex."""
    if not isinstance(radius, (list, tuple)):
        radius = [radius] * (len(points) - 2)
    out = [points[0]]
    for i in range(1, len(points) - 1):
        p_prev, p, p_next = points[i - 1], points[i], points[i + 1]
        r = radius[i - 1]
        if r <= 0:
            out.append(p)
            continue
        v0 = _norm((p_prev[0] - p[0], p_prev[1] - p[1]))
        v1 = _norm((p_next[0] - p[0], p_next[1] - p[1]))
        l0 = math.hypot(p_prev[0] - p[0], p_prev[1] - p[1])
        l1 = math.hypot(p_next[0] - p[0], p_next[1] - p[1])
        r = min(r, l0 * 0.98, l1 * 0.98)
        a = (p[0] + v0[0] * r, p[1] + v0[1] * r)
        b = (p[0] + v1[0] * r, p[1] + v1[1] * r)
        # superellipse-like fillet via cubic with K handles
        kk = 0.60
        c1 = (a[0] - v0[0] * r * kk, a[1] - v0[1] * r * kk)
        c2 = (b[0] - v1[0] * r * kk, b[1] - v1[1] * r * kk)
        out.extend(cubic(a, c1, c2, b, steps))
    out.append(points[-1])
    return out


# ---------------------------------------------------------------- strokes

class Stroke:
    def __init__(self, pts, clip=None, cap="flat", closed=False, w=1.0):
        self.w = w
        self.pts = pts
        self.clip = clip
        self.cap = cap
        self.closed = closed


class Dot:
    def __init__(self, cx, cy, r, ry=None):
        self.cx, self.cy, self.r = cx, cy, r
        self.ry = ry if ry is not None else r


def expand(stroke, pen):
    sy = pen.a / pen.b  # scale y so the elliptical pen becomes a circle
    if isinstance(stroke, Dot):
        g = Point(stroke.cx, stroke.cy).buffer(1, 64)
        return affinity.scale(g, stroke.r, stroke.ry, origin=(stroke.cx, stroke.cy))
    pts = [(x, y * sy) for x, y in stroke.pts]
    if stroke.closed:
        ring = Polygon(pts)
        g = ring.exterior.buffer(pen.a * stroke.w, quad_segs=24, join_style="round")
    else:
        r = pen.a * stroke.w
        if True:
            cap = {"flat": "flat", "round": "round", "square": "square"}[stroke.cap]
            g = LineString(pts).buffer(r, quad_segs=24, cap_style=cap, join_style="round")
    g = affinity.scale(g, 1, 1 / sy, origin=(0, 0))
    if stroke.clip is not None:
        g = g.intersection(box(*stroke.clip))
    return g


def S(pts, **kw):
    return Stroke(pts, **kw)


class Glyph:
    def __init__(self, name, uni, width, parts, script="latn"):
        self.name = name
        self.uni = uni
        self.width = width
        self.parts = parts
        self.script = script

    def outline(self, pen, clip=None):
        geoms = [expand(p, pen) for p in self.parts]
        g = unary_union(geoms)
        if clip is not None:
            g = g.intersection(box(*clip))
        g = g.buffer(0)
        return g


def polygons(geom):
    if geom.is_empty:
        return []
    if isinstance(geom, Polygon):
        return [geom]
    if isinstance(geom, MultiPolygon):
        return list(geom.geoms)
    return [g for g in getattr(geom, "geoms", []) if isinstance(g, Polygon)]
