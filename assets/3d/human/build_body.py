"""Build a smooth skinned human body (no head) for the dictionary's 3D storyboard.
Joint pivots match d3Fig groups exactly (three.js y-up; Blender z-up, character faces -Y = three +Z):
  hips (0,.95)  sp = hips+.08  hd = sp+.66 (head centre, not built: the dictionary keeps its own head/face/hair)
  sh = sp+(+-.2,.45)  el = sh+.29 down  hn = el+.27 down   hp = hips+(+-.09,-.03)  kn = hp+.44 down  foot at kn-.43
Bind pose: arms out 22 deg (sh z = s*22), legs out 4 deg (hp z = s*4) so heat weights do not leak arm<->hip, leg<->leg.
Bones are named after the dictionary groups: hips sp hd sh.L el.L hn.L hp.L kn.L (+ .R). L = +x (character's left).
Usage: blender -b --factory-startup -P build_human.py -- OUTDIR
"""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector, Matrix

OUT = sys.argv[sys.argv.index("--") + 1]
os.makedirs(OUT, exist_ok=True)
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
sc = bpy.context.scene

ARM_A, LEG_A = math.radians(22), math.radians(4)
HIPS = Vector((0, 0, .95)); SP = HIPS + Vector((0, 0, .08))
def limb_pts(start, ang, side, lens):
    d = Vector((math.sin(ang) * side, 0, -math.cos(ang))); pts = [start.copy()]
    for L in lens: pts.append(pts[-1] + d * L)
    return pts

J = {}
for s, tag in ((1, 'L'), (-1, 'R')):
    sh = SP + Vector((.2 * s, 0, .45)); a = limb_pts(sh, ARM_A, s, [.29, .27, .17])
    J['sh.' + tag], J['el.' + tag], J['hn.' + tag], J['tip.' + tag] = a
    hp = HIPS + Vector((.09 * s, 0, -.03)); l = limb_pts(hp, LEG_A, s, [.44, .43])
    J['hp.' + tag], J['kn.' + tag], J['ank.' + tag] = l

# ---------- body via Skin modifier: vertices = skeleton points, per-vertex radii (x = side, y = front/back) ----------
me = bpy.data.meshes.new("Body"); body = bpy.data.objects.new("Body", me); sc.collection.objects.link(body)
bm = bmesh.new(); R = {}
def V(p, rx, ry=None):
    v = bm.verts.new(p); R[v] = (rx, ry if ry is not None else rx); return v
def E(a, b): bm.edges.new((a, b))
# spine
pb = V((0, 0, .86), .13, .1); hc = V((0, 0, .95), .162, .112); ws = V((0, 0, 1.06), .12, .085)
ab = V((0, 0, 1.17), .13, .095); ch = V((0, 0, 1.30), .155, .115); uc = V((0, 0, 1.41), .17, .1)
nb = V((0, 0, 1.47), .058, .055); nt = V((0, 0, 1.585), .05, .05)
for a, b in ((pb, hc), (hc, ws), (ws, ab), (ab, ch), (ch, uc), (uc, nb), (nb, nt)): E(a, b)
for s, tag in ((1, 'L'), (-1, 'R')):
    # shoulder cap -> arm (A-pose)
    cap = V(J['sh.' + tag] + Vector((-.03 * s, 0, -.01)), .066, .062); E(uc, cap)
    up_mid = V(J['sh.' + tag].lerp(J['el.' + tag], .45), .053, .053); el = V(J['el.' + tag], .04, .04)
    fa_mid = V(J['el.' + tag].lerp(J['hn.' + tag], .35), .042, .038); wr = V(J['hn.' + tag], .029, .024)
    palm = V(J['hn.' + tag].lerp(J['tip.' + tag], .45), .042, .02); tip = V(J['tip.' + tag], .032, .016)
    for a, b in ((cap, up_mid), (up_mid, el), (el, fa_mid), (fa_mid, wr), (wr, palm), (palm, tip)): E(a, b)
    th = V(J['hn.' + tag].lerp(J['tip.' + tag], .3) + Vector((0, -.035, 0)), .016, .016); E(wr, th)   # thumb forward
    th2 = V(J['hn.' + tag].lerp(J['tip.' + tag], .62) + Vector((0, -.05, 0)), .013, .013); E(th, th2)
    # leg
    hj = V(J['hp.' + tag], .095, .1); E(hc, hj)
    tm = V(J['hp.' + tag].lerp(J['kn.' + tag], .4), .08, .085); kn = V(J['kn.' + tag], .052, .055)
    cf = V(J['kn.' + tag].lerp(J['ank.' + tag], .3), .058, .066); an = V(J['ank.' + tag], .036, .038)
    ball = V(J['ank.' + tag] + Vector((0, -.12, -.04)), .042, .025); toe = V(J['ank.' + tag] + Vector((0, -.17, -.045)), .035, .02)
    heel = V(J['ank.' + tag] + Vector((0, .035, -.045)), .03, .025)
    for a, b in ((hj, tm), (tm, kn), (kn, cf), (cf, an), (an, ball), (ball, toe), (an, heel)): E(a, b)
bm.to_mesh(me); bm.free()
skin = body.modifiers.new("Skin", "SKIN"); skin.use_smooth_shade = True; skin.branch_smoothing = .6
sv = me.skin_vertices[0].data
for i, v in enumerate(me.vertices):
    key = min(R.keys(), key=lambda k: (Vector(k.co) - v.co).length) if False else None
# set radii by matching order (bmesh verts were created in order)
for i, (k, r) in enumerate(R.items()):
    sv[i].radius = r
sv[0].use_root = True
sub = body.modifiers.new("Sub", "SUBSURF"); sub.levels = 2; sub.render_levels = 2
bpy.context.view_layer.objects.active = body; body.select_set(True)
for m in [m.name for m in body.modifiers]:
    with bpy.context.temp_override(object=body, active_object=body, selected_objects=[body], selected_editable_objects=[body]):
        bpy.ops.object.modifier_apply(modifier=m)
# decimate to a web budget
dec = body.modifiers.new("Dec", "DECIMATE"); dec.ratio = .45
with bpy.context.temp_override(object=body, active_object=body, selected_objects=[body], selected_editable_objects=[body]):
    bpy.ops.object.modifier_apply(modifier="Dec")
for p in me.polygons: p.use_smooth = True

# ---------- materials by region ----------
def mat(name, rgb):
    m = bpy.data.materials.new(name); b = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    b.inputs["Base Color"].default_value = (*rgb, 1); b.inputs["Roughness"].default_value = .8; return m
MS = {"Top": mat("Top", (.85, .85, .83)), "Bottom": mat("Bottom", (.6, .6, .62)), "Skin": mat("Skin", (.95, .86, .78)), "Shoes": mat("Shoes", (.1, .1, .1))}
for k in ("Top", "Bottom", "Skin", "Shoes"): me.materials.append(MS[k])
idx = {k: i for i, k in enumerate(("Top", "Bottom", "Skin", "Shoes"))}
wrist = {s: J['hn.L' if s > 0 else 'hn.R'] for s in (1, -1)}
for p in me.polygons:
    c = p.center; s = 1 if c.x >= 0 else -1; armdir = (J['tip.L' if s > 0 else 'tip.R'] - J['sh.L' if s > 0 else 'sh.R']).normalized()
    along_wrist = (c - wrist[s]).dot(armdir)
    if c.z < .085: p.material_index = idx["Shoes"]
    elif c.z > 1.465 and abs(c.x) < .085: p.material_index = idx["Skin"]
    elif abs(c.x) > .17 and c.z > .8 and along_wrist > -.01: p.material_index = idx["Skin"]   # hands
    elif c.z < 1.0 and abs(c.x) < .22: p.material_index = idx["Bottom"]
    else: p.material_index = idx["Top"]

# ---------- UVs for future character-sheet textures ----------
with bpy.context.temp_override(object=body, active_object=body, selected_objects=[body], selected_editable_objects=[body]):
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=.02)
    bpy.ops.object.mode_set(mode='OBJECT')

# ---------- armature (bone names = dictionary groups) ----------
ad = bpy.data.armatures.new("Rig"); arm = bpy.data.objects.new("Rig", ad); sc.collection.objects.link(arm)
bpy.context.view_layer.objects.active = arm
with bpy.context.temp_override(object=arm, active_object=arm, selected_objects=[arm], selected_editable_objects=[arm]):
    bpy.ops.object.mode_set(mode='EDIT')
    eb = ad.edit_bones
    def bone(name, h, t, parent=None):
        b = eb.new(name); b.head = h; b.tail = t
        if parent: b.parent = eb[parent]; b.use_connect = False
        return b
    bone("hips", (0, 0, .86), SP)
    bone("sp", SP, (0, 0, 1.47), "hips")
    bone("hd", (0, 0, 1.47), (0, 0, 1.8), "sp")
    for s, t in ((1, 'L'), (-1, 'R')):
        bone("sh." + t, J['sh.' + t], J['el.' + t], "sp"); bone("el." + t, J['el.' + t], J['hn.' + t], "sh." + t); bone("hn." + t, J['hn.' + t], J['tip.' + t], "el." + t)
        bone("hp." + t, J['hp.' + t], J['kn.' + t], "hips"); bone("kn." + t, J['kn.' + t], J['ank.' + t] + Vector((0, -.08, -.04)), "hp." + t)
    bpy.ops.object.mode_set(mode='OBJECT')
body.select_set(True); arm.select_set(True)
with bpy.context.temp_override(object=arm, active_object=arm, selected_objects=[body, arm], selected_editable_objects=[body, arm]):
    r = bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print("parent", r)
nvg = {vg.name: 0 for vg in body.vertex_groups}
for v in me.vertices:
    for g in v.groups:
        if g.weight > .01: nvg[body.vertex_groups[g.group].name] += 1
tris = sum(len(p.vertices) - 2 for p in me.polygons)
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT, "human.blend"))
glb = os.path.join(OUT, "human.glb")
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', export_skins=True, export_animations=False, export_yup=True, export_apply=False)
print("@@JSON@@" + json.dumps({"tris": tris, "verts": len(me.vertices), "groups": nvg, "glb": os.path.getsize(glb), "joints": {k: [round(x, 3) for x in v] for k, v in J.items() if k.startswith(('sh', 'el', 'hn', 'hp', 'kn'))}}))


