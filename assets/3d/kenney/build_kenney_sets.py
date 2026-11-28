"""Kenney CC0 키트로 사전 3D 콘티 배경 세트 만들기(2026-11-28).
Usage: blender -b --factory-startup -P build_kenney_sets.py -- <kenney_dl 폴더> <출력 폴더>
- 세트: room(방·집 안) cafe(카페·식당·가게) park(공원·숲) field(들판·광장) street(거리·골목) stop(버스 정류장)
- 좌표는 three 기준(+x 오른쪽, +z 카메라 쪽, 인물은 원점 둘레 |x|<1.8, -1<z<1.5 를 비운다). 블렌더 = (x, -z, y).
- 색: 키트 재질 색(또는 colormap 그림의 그 면 색)을 사전 팔레트 이름(M_Floor·Wall·Trim·Wood·Dark·Glass·Metal·Curtain·Road·Grass·Leaf)으로 나눈다.
  사전 로더(d3GlbParse)는 첫 메시 하나만 읽으므로 세트마다 한 객체로 합쳐 내보낸다.
"""
import bpy, bmesh, sys, os, glob, math, colorsys
from mathutils import Vector, Matrix

argv = sys.argv[sys.argv.index("--") + 1:]
SRC, OUT = argv[0], argv[1]
os.makedirs(OUT, exist_ok=True)
KIT = {"f": ("kenney_furniture-kit", 1.9), "n": ("kenney_nature-kit", 3.0), "c": ("kenney_city-kit-commercial_2.1", 7.0),
       "s": ("kenney_city-kit-suburban_20", 7.0), "r": ("kenney_city-kit-roads", 7.0), "o": ("kenney_food-kit", .7)}
PAL = {"Floor": 0xe4e1d9, "Wall": 0xeeebe4, "Trim": 0xdcd8cf, "Wood": 0xcfc6b6, "Dark": 0x4a4c48, "Glass": 0xf4f2ee, "Metal": 0xa3a5a1,
       "Curtain": 0xe4e1da, "Road": 0xc9c6be, "Grass": 0xdfe0d4, "Leaf": 0xc4c7b9, "Board": 0x737d76}

def lin(h):
    c = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]
    return tuple(x / 12.92 if x <= .04045 else ((x + .055) / 1.055) ** 2.4 for x in c) + (1.0,)
PM = {}
def palmat(n):
    if n not in PM:
        m = bpy.data.materials.new("M_" + n); m.use_nodes = True
        m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = lin(PAL[n]); m.diffuse_color = lin(PAL[n]); PM[n] = m
    return PM[n]

def classify(rgb, name):
    r, g, b = rgb; L = .299 * r + .587 * g + .114 * b; h, s, v = colorsys.rgb_to_hsv(r, g, b); h *= 360
    ground = name.startswith(("ground_", "grass", "platform_", "path_", "crops_dirt"))
    if s > .22 and v > .15:
        if 70 <= h <= 175: return "Grass" if ground else "Leaf"
        if 180 <= h <= 255 and L > .4: return "Glass"
        if 15 <= h < 60: return "Wood" if L < .78 else "Floor"
        if h < 15 or h > 320: return "Curtain"
    if name.startswith(("road-", "tile-")) and L < .55: return "Road"
    if L < .2: return "Dark"
    if L < .42: return "Metal"
    if L < .6: return "Trim"
    if L < .8: return "Floor"
    return "Wall"

IMG = {}
def tex_of(mat):
    if not mat or not mat.node_tree: return None
    for nd in mat.node_tree.nodes:
        if nd.type == 'TEX_IMAGE' and nd.image:
            im = nd.image
            if im.name not in IMG:
                w, hh = im.size; IMG[im.name] = (w, hh, list(im.pixels[:]))
            return IMG[im.name]
    return None
def base_rgb(mat):
    try:
        c = mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value
    except Exception:
        c = mat.diffuse_color if mat else (.8, .8, .8, 1)
    to_s = lambda x: x * 12.92 if x <= .0031308 else 1.055 * x ** (1 / 2.4) - .055
    return (to_s(c[0]), to_s(c[1]), to_s(c[2]))

CACHE = {}
def load(kit, name):
    """키트 모델 하나를 불러 한 메시로(복사본) — 팔레트 재질로 다시 칠해 둔다."""
    key = kit + ":" + name
    if key not in CACHE:
        folder, sc = KIT[kit]
        fs = glob.glob(os.path.join(SRC, folder, "**", name + ".glb"), recursive=True)
        if not fs: raise SystemExit("missing model %s %s" % (kit, name))
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=fs[0])
        new = [o for o in bpy.data.objects if o not in before]
        meshes = [o for o in new if o.type == 'MESH']
        bm = bmesh.new(); mats_out = []
        for o in meshes:
            me = o.data; W = o.matrix_world.copy(); uv = me.uv_layers.active
            for p in me.polygons:
                mt = o.material_slots[p.material_index].material if o.material_slots else None
                T = tex_of(mt)
                if T and uv:
                    u = sum(uv.data[li].uv[0] for li in p.loop_indices) / len(p.loop_indices); vv = sum(uv.data[li].uv[1] for li in p.loop_indices) / len(p.loop_indices)
                    w, hh, px = T; xi = min(w - 1, max(0, int((u % 1) * w))); yi = min(hh - 1, max(0, int((vv % 1) * hh))); k = (yi * w + xi) * 4
                    rgb = tuple((x * 12.92 if x <= .0031308 else 1.055 * x ** (1 / 2.4) - .055) for x in px[k:k + 3])
                else:
                    rgb = base_rgb(mt)
                cls = classify(rgb, name)
                if cls not in mats_out: mats_out.append(cls)
                vs = [bm.verts.new(W @ me.vertices[i].co) for i in p.vertices]
                try:
                    f = bm.faces.new(vs); f.material_index = mats_out.index(cls)
                except ValueError: pass
        me2 = bpy.data.meshes.new(key); bm.to_mesh(me2); bm.free()
        for m in mats_out: me2.materials.append(palmat(m))
        for o in new: bpy.data.objects.remove(o, do_unlink=True)
        xs = [v.co.x for v in me2.vertices]; ys = [v.co.y for v in me2.vertices]; zs = [v.co.z for v in me2.vertices]
        # 바닥 가운데를 원점으로, 키트 배율
        me2.transform(Matrix.Translation((-(min(xs) + max(xs)) / 2, -(min(ys) + max(ys)) / 2, -min(zs))))
        me2.transform(Matrix.Scale(sc, 4))
        CACHE[key] = me2
    return CACHE[key]

PARTS = []
def put(kit, name, x, z, rot=0, s=1.0, y=0.0):
    """three 좌표(x, z)에 놓기. rot: three y축 도(+는 앞(+z)이 +x 쪽으로). s: 추가 배율, y: 높이."""
    me = load(kit, name).copy(); me.transform(Matrix.Scale(s, 4))
    me.transform(Matrix.Rotation(math.radians(rot), 4, 'Z')); me.transform(Matrix.Translation((x, -z, y)))
    o = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(o); PARTS.append(o); return o

def box(mn, w, h, d, x, y, z, rot=0):
    """사전 상자처럼: 가운데 (x, y, z), 크기 w(x)·h(y)·d(z) — three 좌표."""
    bm = bmesh.new(); bmesh.ops.create_cube(bm, size=1); me = bpy.data.meshes.new("box"); bm.to_mesh(me); bm.free()
    me.transform(Matrix.Diagonal((w, d, h, 1))); me.transform(Matrix.Rotation(math.radians(rot), 4, 'Z')); me.transform(Matrix.Translation((x, -z, y)))
    me.materials.append(palmat(mn)); o = bpy.data.objects.new("box", me); bpy.context.scene.collection.objects.link(o); PARTS.append(o); return o

def window(x, y, z, w, h, axis='x'):
    t = .06
    if axis == 'x':
        box("Glass", w, h, .02, x, y, z); [box("Trim", w + t, t, .08, x, y + s * h / 2, z) for s in (-1, 1)]; [box("Trim", t, h, .08, x + s * w / 2, y, z) for s in (-1, 1)]; box("Trim", t * .6, h, .06, x, y, z)
    else:
        box("Glass", .02, h, w, x, y, z); [box("Trim", .08, t, w + t, x, y + s * h / 2, z) for s in (-1, 1)]; [box("Trim", .08, h, t, x, y, z + s * w / 2) for s in (-1, 1)]; box("Trim", .06, h, t * .6, x, y, z)

def finish(key):
    global PARTS
    bpy.ops.object.select_all(action='DESELECT')
    for o in PARTS: o.select_set(True)
    bpy.context.view_layer.objects.active = PARTS[0]; bpy.ops.object.join(); ob = bpy.context.view_layer.objects.active; ob.name = "Set_" + key
    # 같은 재질 칸 합치기
    names = [s.material.name for s in ob.material_slots]; uniq = []
    for n in names:
        if n not in uniq: uniq.append(n)
    remap = [uniq.index(n) for n in names]
    for p in ob.data.polygons: p.material_index = remap[p.material_index]
    ob.data.materials.clear()
    for n in uniq: ob.data.materials.append(bpy.data.materials[n])
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=.0005); bm.to_mesh(ob.data); bm.free()
    path = os.path.join(OUT, key + ".glb")
    bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True)
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_yup=True, export_normals=True, export_materials='EXPORT', export_texcoords=False)
    print("@@", key, "tris", sum(len(p.vertices) - 2 for p in ob.data.polygons), "KB", os.path.getsize(path) // 1024, "mats", uniq)
    bpy.data.objects.remove(ob, do_unlink=True); PARTS = []

def clear():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)

clear()
# ---------- 방·집 안 ----------
box("Wood", 9, .02, 7, 0, .01, -.3)                                      # 마루
box("Wall", 9, 2.7, .12, 0, 1.35, -2.75); box("Wall", .12, 2.7, 7, -3.7, 1.35, .7)
box("Trim", 9, .1, .04, 0, .05, -2.68); box("Trim", .04, .1, 7, -3.62, .05, .7)
window(1.4, 1.55, -2.68, 1.5, 1.1)
put("f", "bedSingle", 2.9, -1.55, 180); put("f", "pillow", 2.9, -2.3, 0, 1, .7)
put("f", "desk", -2.4, -2.35, 180); put("f", "chairDesk", -2.4, -1.75, 0); put("f", "laptop", -2.5, -2.3, 180, 1, .72); put("f", "lampSquareTable", -1.9, -2.45, 0, 1, .72)
put("f", "bookcaseOpen", -3.45, .3, 90); put("f", "books", -3.45, .3, 90, 1, .9)
put("f", "sideTable", 3.9, -2.4, 180); put("f", "lampRoundTable", 3.9, -2.4, 0, 1, .55)
put("f", "rugRectangle", .5, -.4, 0); put("f", "pottedPlant", -1.1, -2.45, 0); put("f", "cabinetTelevision", .1, -2.45, 180); put("f", "televisionModern", .1, -2.45, 180, 1, .52)
finish("room")

# ---------- 카페·식당 ----------
box("Floor", 10, .02, 8, 0, .01, 0)
box("Wall", 10, 2.9, .12, 0, 1.45, -3.2); box("Trim", 10, .1, .04, 0, .05, -3.13)
for i in range(3): window(4.2, 1.45, -2.2 + i * 1.6, 1.4, 1.9, axis='z')
box("Wall", .12, .5, 8, 4.25, .25, .3); box("Wall", .12, .5, 8, 4.25, 2.65, .3)
for i in range(4): put("f", "kitchenBar", -3.6 + i * .82, -2.75, 180)
put("f", "kitchenBarEnd", -0.3, -2.75, 180); put("f", "kitchenCoffeeMachine", -3.3, -2.85, 180, 1, .8); put("o", "cup-coffee", -2.4, -2.7, 0, 1, .8); put("o", "cake", -1.6, -2.75, 0, 1, .8)
for x in (-3.2, -2.3, -1.4): put("f", "stoolBar", x, -2.05, 0)
for (tx, tz, kind) in ((2.6, -1.5, "tableRound"), (-2.8, 1.0, "tableRound"), (3.0, 1.4, "tableRound")):
    put("f", kind, tx, tz); put("f", "chairRounded", tx - .7, tz, 90); put("f", "chairRounded", tx + .7, tz, -90)
    put("o", "cup-coffee", tx - .15, tz, 0, 1, .66); put("o", "plate", tx + .15, tz + .05, 0, .45, .66)
put("f", "pottedPlant", 3.8, -2.8); put("f", "pottedPlant", -4.4, .5)   # 천장이 없어 천장 등은 뺐다
finish("cafe")

# ---------- 공원·숲 ----------
box("Grass", 60, .02, 60, 0, .01, -10)
for i in range(-5, 6): put("n", "ground_pathStraight", i * 3, .2, 90)
trees = [("tree_default", -6, -6), ("tree_oak", 4, -8), ("tree_detailed", 9, -4.5), ("tree_fat", -10, -3), ("tree_default", 0, -13), ("tree_oak", -5, -15),
         ("tree_tall", 12, -11), ("tree_detailed", 8, 5), ("tree_default", -9, 6), ("tree_oak", 15, -2), ("tree_simple", -15, -9), ("tree_fat", 2, -20)]
for (t, x, z) in trees: put("n", t, x, z, (x * 37 + z * 11) % 360)
for (x, z) in ((-2.8, -2.3), (3.6, -2.4), (-5, -2.6), (6, -2.2), (-3.5, 2.8), (4.5, 3)): put("n", "plant_bushLarge" if x > 0 else "plant_bush", x, z)
for (x, z, f) in ((-1.6, -2.6, "flower_redA"), (1.9, -2.7, "flower_yellowA"), (-4.2, -2.5, "flower_purpleA"), (5.2, -2.6, "flower_redB")): put("n", f, x, z)
put("f", "bench", 2.4, -2.1, 0, 1.15); put("r", "light-curved", -3.2, -2.3, 180); put("r", "light-curved", 7.5, -2.3, 180)
for (x, z) in ((-7, -1.5), (10, 1.8), (-12, 2)): put("n", "rock_largeA", x, z, x * 13)
finish("park")

# ---------- 들판·광장 ----------
box("Grass", 90, .02, 90, 0, .01, -20)
for i in range(-6, 7): put("n", "fence_simple", i * 3, -7)
for (t, x, z) in (("tree_default", -14, -22), ("tree_oak", -6, -28), ("tree_tall", 5, -25), ("tree_detailed", 13, -21), ("tree_fat", 22, -30), ("tree_default", -24, -26), ("tree_oak", 30, -18)):
    put("n", t, x, z, x * 7 % 360)
for (x, z) in ((-5, -4), (6, -3.5), (-11, 3), (12, 4)): put("n", "rock_largeB", x, z, x * 17)
for (x, z) in ((-3, -3), (3.5, -4.5), (-8, -5), (9, -5.5), (-2, 4), (4, 5)): put("n", "grass_large", x, z, x * 31)
for (x, z) in ((-6.5, -2.5), (7.5, -1.5)): put("n", "flower_yellowB", x, z)
finish("field")

# ---------- 거리·골목 / 버스 정류장 ----------
def street(stop=False):
    box("Floor", 60, .02, 6, 0, .03, .8)                                   # 인물이 서는 보도
    box("Trim", 60, .14, .2, 0, .07, -2.2)                                 # 연석
    for i in range(-5, 6): put("r", "road-straight", i * 7, -5.8, 90)     # 차도(보도 뒤)
    box("Floor", 60, .02, 4, 0, .03, -11.3)                                # 건너편 보도
    bl = ["building-a", "building-c", "building-e", "building-g", "building-b", "building-h", "building-d", "building-f", "building-k"]
    for i, b in enumerate(bl): put("c", b, -28 + i * 7, -16.5, 180)
    put("c", "building-skyscraper-a", -14, -26, 180); put("c", "building-skyscraper-c", 9, -28, 180)
    for x in (-10, 0, 10, 20): put("r", "light-curved", x + 3, -2.6, 180)
    put("r", "traffic-light", 6.2, -2.5, 180); put("r", "road-sign-street", -6, -2.5, 180)
    for x in (-17, -3, 11): put("r", "electricity-pole", x, -12, 0)
    put("s", "tree-large", -8.5, -2.6); put("s", "planter", 8.5, -2.5)
    if stop:   # 버스 정류장: 지붕·뒤 유리·기둥·벤치·표지판
        sx, sz = -.2, -1.3
        box("Trim", 3.2, .08, 1.3, sx, 2.35, sz); box("Glass", 3.0, 1.9, .03, sx, 1.25, sz - .6)
        for s in (-1, 1): box("Metal", .07, 2.35, .07, sx + s * 1.5, 1.17, sz - .6); box("Metal", .07, 2.35, .07, sx + s * 1.5, 1.17, sz + .55)
        put("f", "bench", sx - .6, sz - .3, 0, 1.15); put("f", "bench", sx + .5, sz - .3, 0, 1.15); put("r", "road-sign-empty", sx + 2.2, sz + .4, 180)
street(False); finish("street")
street(True); finish("stop")
print("@@ done")
