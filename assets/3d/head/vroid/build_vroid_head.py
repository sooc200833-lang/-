"""VRoid CC0 sample (HairSample_Female/Male) → dictionary head: face + anime hair + expression keys from the VRM blendshape groups.
Usage: blender -b --factory-startup -P build_vroid_head.py -- <model.vrm> <out.glb>
Origin = head centre (dictionary hd group), chin→crown .27, face toward three +Z. Keys: joy angry sorrow fun surprised blink a i u e o (whatever the model has)
"""
import bpy, sys, os, json, shutil, struct
from mathutils import Vector, Matrix

src, out = sys.argv[sys.argv.index("--") + 1:][:2]
raw = open(src, "rb").read(); jl = struct.unpack("<I", raw[12:16])[0]; js = json.loads(raw[20:20 + jl])
vrm = js["extensions"]["VRM"]; groups = vrm["blendShapeMaster"]["blendShapeGroups"]
mesh_names = [m.get("name", "") for m in js["meshes"]]
glb = src[:-4] + "_in.glb"; shutil.copy(src, glb)
for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.import_scene.gltf(filepath=glb)
face = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith("Face"))
hair = next(o for o in bpy.data.objects if o.type == 'MESH' and o.name.startswith("Hair"))
face_idx = next(i for i, n in enumerate(mesh_names) if n.startswith("Face"))

# ---- 표정 그룹 → 합친 키 (VRM 0.x: binds[{mesh, index, weight 0-100}]) ----
WANT = {"joy": "joy", "angry": "angry", "sorrow": "sorrow", "fun": "fun", "blink": "blink", "a": "a", "i": "i", "u": "u", "e": "e", "o": "o"}
kb = face.data.shape_keys.key_blocks
made = []
for g in groups:
    nm = (g.get("presetName") or "").lower()
    key = WANT.get(nm)
    if not key and (g.get("name") or "").lower().startswith("surprised"): key = "surprised"
    if not key or key in made: continue
    binds = [b for b in g.get("binds", []) if b.get("mesh") == face_idx]
    if not binds: continue
    for k in kb[1:]: k.value = 0
    for b in binds:
        t = "target_%d" % b["index"]
        if t in kb: kb[t].value = b.get("weight", 100) / 100
    face.shape_key_add(name=key, from_mix=True); made.append(key)
for k in kb[1:]: k.value = 0
for k in [k for k in kb if k.name.startswith("target_")]: face.shape_key_remove(k)

# ---- 뼈·변형 떼고 쉬는 자세 그대로 굳히기 ----
for o in (face, hair):
    for m in list(o.modifiers): o.modifiers.remove(m)
    mw = o.matrix_world.copy(); o.parent = None; o.matrix_world = mw
    o.data.transform(o.matrix_world, shape_keys=True); o.matrix_world = Matrix.Identity(4)
    if o.data.shape_keys:   # data.transform은 모양 키에도 적용된다
        pass
for o in list(bpy.data.objects):
    if o not in (face, hair): bpy.data.objects.remove(o, do_unlink=True)

# ---- 크기·자리: 얼굴 메시 기준 턱~정수리 .27, 가운데를 원점 ----
fz = [v.co.z for v in face.data.vertices]; fy = [v.co.y for v in face.data.vertices]; fx = [v.co.x for v in face.data.vertices]
chin, crown = min(fz), max(fz); k = .27 / (crown - chin)
ctr = Vector(((min(fx) + max(fx)) / 2, (min(fy) + max(fy)) / 2, (chin + crown) / 2))
T = Matrix.Scale(k, 4) @ Matrix.Translation(-ctr)
for o in (face, hair): o.data.transform(T, shape_keys=True)
# 정면 맞추기: 눈동자(EyeIris) 점이 +Y 쪽이면 뒤를 보고 있는 것 → 세로축으로 180° (VRM 0.x는 -Z가 앞)
iris = [i for i, s in enumerate(face.material_slots) if s.material and "EyeIris" in s.material.name]
iy = [face.data.vertices[v].co.y for p in face.data.polygons if p.material_index in iris for v in p.vertices]
flipped = bool(iy) and sum(iy) / len(iy) > 0   # 블렌더 +Y = glTF -Z = three에서 뒤쪽 → 돌린다
if flipped:
    R = Matrix.Rotation(3.14159265, 4, 'Z')
    for o in (face, hair): o.data.transform(R, shape_keys=True)
# glTF(+Y 위, +Z 앞)로 내보낼 때 블렌더 -Y가 앞이 되는지 확인: VRoid는 블렌더로 불러오면 앞이 -Y
# ---- 그림은 작게(얼굴 512, 눈·머리카락 256) ----
for im in bpy.data.images:
    if im.size[0] == 0: continue
    lim = 512 if ("Face_00" in im.name or "Hair" in im.name) else 256
    if im.size[0] > lim: im.scale(lim, int(lim * im.size[1] / im.size[0]))
for m in bpy.data.materials:
    pass
face.name = "Face"; hair.name = "Hair"
# 머리카락 재질별 정점 수·높이(고양이 귀 같은 장식이 따로 있는지 보려고)
hm = {}
for p in hair.data.polygons:
    nm = hair.material_slots[p.material_index].material.name if hair.material_slots[p.material_index].material else "?"
    z = sum(hair.data.vertices[v].co.z for v in p.vertices) / len(p.vertices); e = hm.setdefault(nm, [0, 9, -9]); e[0] += 1; e[1] = min(e[1], z); e[2] = max(e[2], z)
print("@@HAIRMATS", json.dumps(hm))
# 고양이 귀 떼기(여자 샘플): 귀 안쪽 재질(HAIR_02)이 든 조각 + 그 자리와 겹치는 조각(귀 바깥)을 지운다
import bmesh
slots = [i for i, s in enumerate(hair.material_slots) if s.material and s.material.name.endswith("HAIR_02")]
if slots:
    bm = bmesh.new(); bm.from_mesh(hair.data); bm.faces.ensure_lookup_table(); seen = set(); islands = []
    for f in bm.faces:
        if f.index in seen: continue
        st = [f]; isl = []; seen.add(f.index)
        while st:
            g = st.pop(); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: seen.add(h.index); st.append(h)
        islands.append(isl)
    def box(isl):
        vs = [v.co for f in isl for v in f.verts]; return [min(v.x for v in vs), max(v.x for v in vs), min(v.y for v in vs), max(v.y for v in vs), min(v.z for v in vs), max(v.z for v in vs)]
    ears = [box(i) for i in islands if any(f.material_index in slots for f in i)]
    def near(b): return any(b[0] < e[1] + .012 and b[1] > e[0] - .012 and b[2] < e[3] + .012 and b[3] > e[2] - .012 and b[4] < e[5] + .012 and b[5] > e[4] - .012 and b[4] > e[4] - .03 for e in ears)
    kill = [f for i in islands if (any(f.material_index in slots for f in i) or (len(i) < 600 and near(box(i)))) for f in i]
    bmesh.ops.delete(bm, geom=list(set(kill)), context='FACES'); bm.to_mesh(hair.data); bm.free()
    print("@@EARS removed faces", len(set(kill)), "islands", len(islands))
# 트윈테일 떼기(여자 샘플, 2026-11-28 사용자 요청): 한쪽으로만 있고 머리 폭보다 훨씬(±.18 넘게) 멀리 뻗은 머리카락 조각 = 묶은 꼬리
if "Female" in os.path.basename(src):
    bm = bmesh.new(); bm.from_mesh(hair.data); bm.faces.ensure_lookup_table(); seen = set(); kill = []
    for f in bm.faces:
        if f.index in seen: continue
        st = [f]; isl = []; seen.add(f.index)
        while st:
            g = st.pop(); isl.append(g)
            for e in g.edges:
                for h in e.link_faces:
                    if h.index not in seen: seen.add(h.index); st.append(h)
        xs = [v.co.x for q in isl for v in q.verts]
        side = min(xs) > .05 or max(xs) < -.05
        if side and max(abs(x) for x in xs) > .18: kill += isl   # 꼬리 자체(.15면 뒤통수 옆 머리까지 지워 구멍이 났다)
        elif side and max(abs(x) for x in xs) > .15:   # 꼬리 뿌리: 머리를 덮는 윗부분은 두고, 머리 밖으로 뻗거나 목 아래로 늘어진 면만 지운다
            for q in isl:
                c = q.calc_center_median()
                if abs(c.x) > .14 or c.y > .135 or c.z < -.09: kill.append(q)
    bmesh.ops.delete(bm, geom=list(set(kill)), context='FACES'); bm.to_mesh(hair.data); bm.free()
    print("@@TAILS removed faces", len(set(kill)))
bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', export_yup=True, export_morph=True, export_morph_normal=False, export_image_format='WEBP', export_skins=False, export_animations=False)
ys = [v.co.y for v in face.data.vertices]
print("@@JSON@@" + json.dumps({"flipped": flipped, "made": made, "groups": [(g.get("presetName"), g.get("name")) for g in groups], "scale": k, "face_y": [min(ys), max(ys)], "glb": os.path.getsize(out),
      "verts": {"Face": len(face.data.vertices), "Hair": len(hair.data.vertices)}}))
