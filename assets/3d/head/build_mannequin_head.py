"""마네킹 머리(사전 3D 인물용, 2026-11-28): 높이별 단면(가로 반폭·앞·뒤)을 이어 한 번에 만든 매끈한 두상 + 귀.
Usage: blender -b --factory-startup -P build_mannequin_head.py -- <out.glb>
크기·자리는 사전의 머리 그룹(hd) 기준, three 좌표(+y 위, +z 앞): 정수리 y .132, 눈 y .012, 입 y -.062, 턱 모서리 y -.09, 턱 끝 y -.148.
블렌더에서는 앞이 -Y, 위가 +Z(glTF로 내보내면 three 좌표).
uv = 정면 평면 투영(x/.24, (y-.003)/.28 → 0~1): 나중에 캐릭터 시트 얼굴 그림을 그대로 씌우는 용도.
"""
import bpy, bmesh, sys, math
from mathutils import Vector

out = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
def tb(x, y, z): return Vector((x, -z, y))   # three → 블렌더

# ---- 단면표: y, 가로 반폭 W, 앞 zf, 뒤 zb (three) ----
TAB = [
    (.132, 0, -.008, -.008),   # 정수리(둥근 지붕)
    (.129, .032, .018, -.04),
    (.122, .056, .048, -.07),
    (.105, .08, .08, -.1),
    (.08, .095, .099, -.116),
    (.05, .104, .111, -.125),  # 이마
    (.02, .106, .118, -.125),  # 눈썹
    (-.01, .105, .12, -.115),  # 눈 — 광대 없이 관자놀이에서 턱까지 곧게
    (-.04, .101, .117, -.09),
    (-.065, .096, .113, -.06),  # 입
    (-.09, .088, .109, -.035),  # 턱 모서리 높이(부드럽게)
    (-.112, .07, .105, -.008),
    (-.13, .047, .1, .022),
    (-.143, .025, .092, .048),
    (-.148, 0, .078, .078),    # 턱 끝 아래
]
def interp(y):   # 캣멀롬으로 매끈하게
    ys = [r[0] for r in TAB]
    i = 0
    while i < len(TAB) - 2 and y < TAB[i + 1][0]: i += 1
    p0 = TAB[max(0, i - 1)]; p1 = TAB[i]; p2 = TAB[i + 1]; p3 = TAB[min(len(TAB) - 1, i + 2)]
    t = (p1[0] - y) / (p1[0] - p2[0])
    out = []
    for k in (1, 2, 3):
        a, b, c, d = p0[k], p1[k], p2[k], p3[k]
        out.append(.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3))
    return out

def nfront(y):   # 얼굴 앞쪽 단면을 조금 각지게(면이 서게): 이마~턱 2.4, 정수리·턱 아래로 갈수록 2
    if y > .06: return 2 + .4 * max(0, (.12 - y) / .06)
    if y < -.13: return 2 + .4 * max(0, (y + .148) / .018)
    return 2.4

RINGS, SEG = 90, 96
bm = bmesh.new(); rows = []
ytop, ybot = TAB[0][0], TAB[-1][0]
for r in range(1, RINGS):
    s = r / RINGS; y = ytop + (ybot - ytop) * (.5 - .5 * math.cos(math.pi * s))   # 끝으로 갈수록 촘촘
    W, zf, zb = interp(y); W = max(W, 0.0005); zc = (zf + zb) / 2; dd = max((zf - zb) / 2, .0005); row = []
    for j in range(SEG):
        a = 2 * math.pi * j / SEG; sx, cz = math.sin(a), math.cos(a)
        n = nfront(y) if cz > 0 else 2.0
        x = math.copysign(abs(sx) ** (2 / n), sx) * W; z = zc + math.copysign(abs(cz) ** (2 / n), cz) * dd
        row.append(bm.verts.new(tb(x, y, z)))
    rows.append(row)
top = bm.verts.new(tb(0, ytop, TAB[0][2])); bot = bm.verts.new(tb(0, ybot, TAB[-1][2]))
for j in range(SEG):
    k = (j + 1) % SEG
    bm.faces.new((top, rows[0][k], rows[0][j]))
    for r in range(len(rows) - 1): bm.faces.new((rows[r][j], rows[r][k], rows[r + 1][k], rows[r + 1][j]))
    bm.faces.new((bot, rows[-1][j], rows[-1][k]))
bm.normal_update(); me = bpy.data.meshes.new("Head"); bm.to_mesh(me); bm.free()
head = bpy.data.objects.new("Head", me); bpy.context.collection.objects.link(head)
bpy.context.view_layer.objects.active = head; head.select_set(True)
bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT'); bpy.ops.mesh.normals_make_consistent(inside=False); bpy.ops.object.mode_set(mode='OBJECT')

# ---- 귀: 납작한 타원 + 안쪽 오목, 눈~입 높이, 살짝 앞을 보게 ----
def sphere(name, seg, rings, f):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=rings, radius=1); o = bpy.context.object; o.name = name
    for v in o.data.vertices:
        X, Y, Z = f(v.co.x, v.co.z, -v.co.y); v.co = tb(X, Y, Z)
    return o
for s in (-1, 1):
    ea = sphere("Ear", 40, 24, lambda x, y, z: (x * .012, y * .036, z * .027))
    cut = sphere("EarCut", 32, 20, lambda x, y, z: (.009 + x * .008, .002 + y * .026, .002 + z * .018))
    m = ea.modifiers.new("hollow", 'BOOLEAN'); m.operation = 'DIFFERENCE'; m.object = cut; m.solver = 'EXACT'
    bpy.context.view_layer.objects.active = ea; bpy.ops.object.modifier_apply(modifier=m.name); bpy.data.objects.remove(cut, do_unlink=True)
    if s < 0:
        for v in ea.data.vertices: v.co.x = -v.co.x
        ea.data.flip_normals()
    ea.rotation_euler = (0, 0, s * .6); ea.location = tb(s * .115, -.012, -.004)
    bpy.ops.object.select_all(action='DESELECT'); ea.select_set(True); bpy.context.view_layer.objects.active = ea
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)

# ---- 합치기 → 복셀로 하나의 면 → 이음매만 살짝 부드럽게 → 가볍게 ----
bpy.ops.object.select_all(action='SELECT'); bpy.context.view_layer.objects.active = head; bpy.ops.object.join()
r = head.modifiers.new("remesh", 'REMESH'); r.mode = 'VOXEL'; r.voxel_size = .0016; r.adaptivity = 0; bpy.ops.object.modifier_apply(modifier=r.name)
sm = head.modifiers.new("smooth", 'CORRECTIVE_SMOOTH'); sm.factor = .5; sm.iterations = 5; sm.smooth_type = 'LENGTH_WEIGHTED'; sm.use_only_smooth = True; bpy.ops.object.modifier_apply(modifier=sm.name)
n0 = len(head.data.polygons)
dc = head.modifiers.new("dec", 'DECIMATE'); dc.ratio = min(1.0, 8000 / max(1, n0 * 2)); bpy.ops.object.modifier_apply(modifier=dc.name)
bpy.ops.object.shade_smooth()

me = head.data; uvl = me.uv_layers.new(name="UVMap")
for p in me.polygons:
    for li in p.loop_indices:
        co = me.vertices[me.loops[li].vertex_index].co; uvl.data[li].uv = (.5 + co.x / .24, .5 + (co.z - .003) / .28)
mat = bpy.data.materials.new("Skin"); mat.use_nodes = True
mat.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (.93, .91, .87, 1); me.materials.append(mat)
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, export_morph=False, export_skins=False, export_animations=False, export_normals=True)
zs = [v.co.z for v in me.vertices]; ys = [v.co.y for v in me.vertices]; xs = [v.co.x for v in me.vertices]
print("@@HEAD tris", sum(len(p.vertices) - 2 for p in me.polygons), "three y", round(min(zs), 3), round(max(zs), 3), "front z", round(-min(ys), 3), "back z", round(-max(ys), 3), "x", round(max(xs), 3))
bpy.ops.wm.save_as_mainfile(filepath=out[:-4] + ".blend")
