"""애니풍 머리카락 6종(사전 3D 인물, 마네킹 머리 assets/3d/head/mannequin.glb에 맞춤, 2026-11-28).
Usage: blender -b --factory-startup -P build_anime_hair.py -- <out.glb>
방식(scenario-blender-hair의 메시 머리카락: 가이드 곡선 → 가늘어지는 다발 메시, 가이드는 데이터로):
  다발 = 머리 표면(+두께)을 따라 정수리에서 아래로 흐르다(경도 az·위도 el로 이동) → 필요하면 귀 높이에서 수직으로 떨어짐.
  단면은 납작한 렌즈, 뿌리는 넓고 끝은 뾰족, 이웃 다발과 겹치게 폭을 잡아 살이 비치지 않게 + 밑에 두피 덮개.
좌표는 three 기준(+y 위, +z 앞, 머리 가운데 원점): 정수리 .132, 눈 .012, 턱 끝 -.148, 앞 .12, 뒤 -.126, 반폭 .112.
객체 Hair_short / Hair_spiky / Hair_bob / Hair_long / Hair_pony / Hair_side, 재질 이름 Hair(그림 없음 — 사전이 색·외곽선).
"""
import bpy, bmesh, sys, math, random
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
def tb(v): return Vector((v.x, -v.z, v.y))   # three → 블렌더

def head_r(d, pad):
    ax, ay, az = .114 + pad, (.134 if d.y > 0 else .14) + pad, (.126 if d.z < 0 else .122) + pad
    return 1 / math.sqrt((d.x / ax) ** 2 + (d.y / ay) ** 2 + (d.z / az) ** 2)
def sph(az, el):   # az 0=앞(+z), 90=왼쪽(+x) / el 0=귀 높이, 90=정수리
    a, e = math.radians(az), math.radians(el)
    return Vector((math.sin(a) * math.cos(e), math.sin(e), math.cos(a) * math.cos(e)))
def surf(az, el, pad): d = sph(az, el); return d * head_r(d, pad)
def ease(s): return s * s * (3 - 2 * s)

def lock(az0, el0, el1, az1=None, pad=.013, hang=None, n=14, lift=0.0, tip_in=0.0, flare=.025):
    """표면을 따라 (az0,el0)→(az1,el1), hang이 있으면 그 y까지 수직으로. lift: 끝이 머리에서 들림, tip_in: 끝이 안쪽으로."""
    az1 = az0 if az1 is None else az1; pts = []
    m = n if hang is None else max(4, n // 2)
    for i in range(m + 1):
        s = i / m; e = ease(s) if az1 != az0 else s
        pts.append(surf(az0 + (az1 - az0) * e, el0 + (el1 - el0) * s, pad + lift * s * s))
    if hang is not None:
        P = pts[-1]; h = Vector((P.x, 0, P.z)); hn = h.normalized() if h.length > 1e-6 else Vector((0, 0, -1))
        k = n - m; y0 = P.y
        for i in range(1, k + 1):
            s = i / k; q = Vector((P.x, y0 + (hang - y0) * s, P.z)) + hn * flare * s - hn * tip_in * max(0, s - .7) / .3 * .03
            pts.append(q)
    elif tip_in:
        for i in range(len(pts) - 3, len(pts)):
            pts[i] = pts[i] - pts[i].normalized() * tip_in * .01 * (i - len(pts) + 4)
    return pts

def tube(bm, pts, w0, flat=.34, sides=6, root_w=.8, tipk=.9):
    n = len(pts); rings = []
    for i, p in enumerate(pts):
        t = (pts[min(i + 1, n - 1)] - pts[max(i - 1, 0)]).normalized()
        o = Vector((p.x, p.y * .35, p.z)).normalized(); nrm = (o - t * o.dot(t)).normalized(); bi = t.cross(nrm).normalized()
        s = i / (n - 1); w = w0 * (root_w + (1 - root_w) * min(1, s * 3)) * (1 - s) ** tipk
        if i == n - 1: rings.append([bm.verts.new(tb(p))]); break
        rings.append([bm.verts.new(tb(p + bi * math.cos(2 * math.pi * k / sides) * w / 2 + nrm * math.sin(2 * math.pi * k / sides) * w * flat / 2)) for k in range(sides)])
    for i in range(len(rings) - 1):
        A, Bq = rings[i], rings[i + 1]
        for k in range(sides):
            k2 = (k + 1) % sides
            bm.faces.new((A[k], A[k2], Bq[0]) if len(Bq) == 1 else (A[k], A[k2], Bq[k2], Bq[k]))
    bm.faces.new(list(reversed(rings[0])))

def cap(bm, pad=.009, el_back=-16, el_side=8, hairline=46):   # 덮개 가장자리는 다발 끝보다 위(가장자리 직선이 안 보이게)
    """두피 덮개(머리숱 바탕). 이마는 hairline° 위만, 옆은 귀 위, 뒤는 목덜미까지. 경계는 다발이 덮는다."""
    R, S = 30, 64; g = {}
    def lo(az):
        f = math.cos(math.radians(az))   # 이마 → 관자놀이 → 귀 위 → 목덜미로 끊김 없이
        if f > 0: return el_side + (hairline - el_side) * f ** .7
        return el_side + (el_back - el_side) * (-f)
    for j in range(S):
        az = 360 * j / S; e0 = lo(az)
        for i in range(R + 1):
            el = e0 + (89.5 - e0) * i / R; g[(i, j)] = bm.verts.new(tb(surf(az, el, pad)))
    for i in range(R):
        for j in range(S):
            j2 = (j + 1) % S; bm.faces.new((g[(i, j)], g[(i, j2)], g[(i + 1, j2)], g[(i + 1, j)]))
    top = bm.verts.new(tb(surf(0, 90, pad)))
    for j in range(S): bm.faces.new((g[(R, j)], g[(R, (j + 1) % S)], top))

random.seed(11)
def J(x, a): return x + random.uniform(-a, a)
def fdist(az): return abs(((az + 180) % 360) - 180)   # 앞에서 몇 도

def bangs(bm, n=9, spread=52, stop_el=8, w=.052, lift=.006, drift=0.0, pad=.016):
    for i in range(n):
        az = -spread + 2 * spread * i / (n - 1)
        el1 = stop_el + abs(az) / spread * 14 + random.uniform(-4, 4)
        tube(bm, lock(az * .5, 84, el1, az1=az + drift, pad=pad, lift=lift, n=12), w * random.uniform(.9, 1.1), flat=.3)

def crown(bm, el1=40, ring=11, w=.07, pad=.019, lift=0.0, skip=0):
    for j in range(ring):
        az = 360 * j / ring + 9
        if skip and fdist(az) < skip: continue
        tube(bm, lock(az, 88, J(el1, 5), az1=az, pad=pad, lift=lift), w * random.uniform(.9, 1.1))

def ring_layer(bm, el0, el1, ring, w, pad, skip=55, hang=None, lift=0.0, tip_in=0.0, flare=.025, only=None):
    for j in range(ring):
        az = 360 * j / ring + random.uniform(-4, 4)
        if fdist(az) < skip: continue
        if only and not only(az): continue
        tube(bm, lock(az, el0, J(el1, 4) if hang is None else el1, pad=pad, hang=None if hang is None else J(hang, .015), lift=lift, tip_in=tip_in, flare=flare, n=16 if hang else 12), w * random.uniform(.9, 1.12))

def sidelocks(bm, hang, az=(58, 74), w=.05, pad=.017, tip_in=0.0):
    for s in (-1, 1):
        for a in az: tube(bm, lock(s * a, 55, 2, pad=pad, hang=hang, tip_in=tip_in, flare=.006), w)

def make(name, build):
    bm = bmesh.new(); build(bm); bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(o)
    for p in me.polygons: p.use_smooth = True
    me.materials.append(MAT); return o
MAT = bpy.data.materials.new("Hair")

def b_short(bm):
    cap(bm); crown(bm, el1=48); bangs(bm, stop_el=22, lift=.01)
    ring_layer(bm, 70, 18, 16, .062, .018); ring_layer(bm, 52, -8, 18, .056, .015, skip=70)
    ring_layer(bm, 40, -26, 12, .06, .014, skip=100); ring_layer(bm, 30, -8, 8, .05, .013, skip=75, only=lambda a: 75 <= fdist(a) <= 110)   # 뒷머리 목덜미 + 귀 뒤
def b_spiky(bm):
    cap(bm); crown(bm, el1=58, lift=.05, w=.075); bangs(bm, n=7, stop_el=26, lift=.03, w=.06)
    ring_layer(bm, 74, 30, 14, .07, .02, lift=.05); ring_layer(bm, 55, 2, 16, .066, .016, skip=70, lift=.045)
    ring_layer(bm, 40, -22, 9, .066, .014, skip=115, lift=.03)
def b_bob(bm):
    cap(bm); crown(bm, el1=50); bangs(bm, stop_el=10)
    ring_layer(bm, 72, 4, 18, .066, .02, skip=58, hang=-.115, tip_in=.6, flare=.012)
    ring_layer(bm, 55, 0, 20, .06, .016, skip=62, hang=-.105, tip_in=.6, flare=.008)
    sidelocks(bm, -.1, tip_in=.5)
def b_long(bm):
    cap(bm); crown(bm, el1=50); bangs(bm, stop_el=8)
    ring_layer(bm, 72, 4, 18, .07, .02, skip=58, hang=-.38, flare=.05)
    ring_layer(bm, 55, 0, 20, .064, .016, skip=62, hang=-.34, flare=.04)
    sidelocks(bm, -.3, az=(58, 72))
def b_pony(bm):
    cap(bm, el_back=-8); bangs(bm, n=8, stop_el=14)
    for j in range(22):   # 위·옆 머리를 뒤통수 묶은 자리(az 180, el 22)로 빗어 넘김
        az = 360 * j / 22 + 8
        if fdist(az) < 40: continue
        for el0 in (86, 60):
            tube(bm, lock(az, el0, 22, az1=180 + (az - 180) * .15 if az > 0 else -180 + (az + 180) * .15, pad=.017 if el0 > 70 else .014), .06)
    tie = surf(180, 22, .016)
    for i in range(9):   # 꼬리: 묶은 자리에서 뒤통수·목을 따라 내려간다(살짝 뒤로 부풀었다가)
        a = 2 * math.pi * i / 9; pts = []
        for k in range(15):
            s = k / 14; y = tie.y - .36 * s; bulge = .03 * math.sin(min(1, s * 1.6) * math.pi * .5)
            pts.append(Vector((tie.x + math.cos(a) * (.012 + .02 * s), y, tie.z - .006 - bulge - .01 * math.sin(a) * s)))
        tube(bm, pts, .05 * random.uniform(.9, 1.1), root_w=.7)
    band = [tie + Vector((math.cos(2 * math.pi * k / 12) * .014, math.sin(2 * math.pi * k / 12) * .012, -.004)) for k in range(13)]
    tube(bm, band, .01, flat=1, root_w=1, tipk=0)   # 머리끈
def b_side(bm):
    cap(bm); crown(bm, el1=48)
    bangs(bm, n=9, stop_el=6, drift=28)   # 한쪽으로 쓸어 넘긴 앞머리
    ring_layer(bm, 70, 16, 16, .062, .018); ring_layer(bm, 52, -10, 16, .058, .015, skip=70)
    ring_layer(bm, 40, -26, 10, .06, .014, skip=115)
    ring_layer(bm, 70, 2, 10, .068, .02, skip=40, hang=-.3, flare=.04, only=lambda a: 0 <= a <= 140)   # 왼쪽만 길게

objs = [make("Hair_short", b_short), make("Hair_spiky", b_spiky), make("Hair_bob", b_bob), make("Hair_long", b_long), make("Hair_pony", b_pony), make("Hair_side", b_side)]
for o in objs: print("@@", o.name, "tris", sum(len(p.vertices) - 2 for p in o.data.polygons))
bpy.ops.object.select_all(action='DESELECT')
for o in objs: o.select_set(True)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, use_selection=True, export_normals=True, export_materials='EXPORT')
bpy.ops.wm.save_as_mainfile(filepath=out[:-4] + ".blend")
print("@@ saved")
