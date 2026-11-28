"""Build a low-poly manga-style classroom set matching the dictionary's 'class' d3Set layout.
Blender Z-up; glTF export maps Blender (x, y, z) -> three.js (x, z, -y).
Back (blackboard) wall at Blender y=+3.6  (three z=-3.6). Window wall at x=+4.2. Characters stand near origin.
Usage: blender -b --factory-startup -P build_classroom.py -- OUTDIR
"""
import bpy, bmesh, math, sys, os, json
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
OUT = argv[0] if argv else os.path.abspath("classroom_out")
os.makedirs(OUT, exist_ok=True)

# clean scene
for ob in list(bpy.data.objects):
    bpy.data.objects.remove(ob, do_unlink=True)
for m in list(bpy.data.meshes):
    bpy.data.meshes.remove(m)
scene = bpy.context.scene
scene.unit_settings.system = 'METRIC'
coll = bpy.data.collections.new("Classroom")
scene.collection.children.link(coll)


def srgb(h):
    c = [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (1.0,)


MATS = {}


def mat(name, hexcol, rough=0.9, metal=0.0):
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new("M_" + name)
    bsdf = next(n for n in m.node_tree.nodes if n.type == "BSDF_PRINCIPLED")
    bsdf.inputs["Base Color"].default_value = srgb(hexcol)
    bsdf.inputs["Roughness"].default_value = rough
    bsdf.inputs["Metallic"].default_value = metal
    m.diffuse_color = srgb(hexcol)
    MATS[name] = m
    return m


# palette close to dictionary D3.M (light, ink-friendly)
M_FLOOR = mat("Floor", 0xd9d2c3)
M_WALL = mat("Wall", 0xeeebe4)
M_WALL2 = mat("Trim", 0xcfcabf)
M_BOARD = mat("Board", 0x4f5f55)
M_WOOD = mat("Wood", 0xc8b89a)
M_METAL = mat("Metal", 0x8a8d8c, 0.5, 0.6)
M_DARK = mat("Dark", 0x4a4c48)
M_GLASS = mat("Glass", 0xdde6ea, 0.15)
M_CLOTH = mat("Curtain", 0xe6e2d6)
M_PAPER = mat("Paper", 0xf7f5ef)
M_CHALK = mat("Chalk", 0xfafafa)

MESH_CACHE = {}


def box_mesh(key, sx, sy, sz, bevel=0.0):
    k = (key, round(sx, 4), round(sy, 4), round(sz, 4), bevel)
    if k in MESH_CACHE:
        return MESH_CACHE[k]
    me = bpy.data.meshes.new("SM_" + key)
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * sx, v.co.y * sy, v.co.z * sz))
    if bevel > 0:
        bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=1, affect='EDGES')
    bm.to_mesh(me)
    bm.free()
    MESH_CACHE[k] = me
    return me


def place(name, me, material, loc, rot_z=0.0, parent=None):
    ob = bpy.data.objects.new(name, me)
    if material is not None and len(me.materials) == 0:
        me.materials.append(material)
    ob.location = loc
    ob.rotation_euler = (0, 0, rot_z)
    coll.objects.link(ob)
    if parent:
        ob.parent = parent
    return ob


def box(name, material, size, loc, rot_z=0.0, bevel=0.0, parent=None, key=None):
    me = box_mesh(key or name, *size, bevel=bevel)
    if len(me.materials) == 0:
        me.materials.append(material)
    return place(name, me, None, loc, rot_z, parent)


def empty(name, loc=(0, 0, 0), rot_z=0.0):
    e = bpy.data.objects.new(name, None)
    e.location = loc
    e.rotation_euler = (0, 0, rot_z)
    coll.objects.link(e)
    return e


W_X = 4.2      # window wall x
BACK_Y = 3.6   # blackboard wall y
FRONT_Y = -7.0  # room extends toward camera
H = 3.0

# ---- floor (single plane with board seams via thin strips is costly; keep plane)
fl = box("Floor", M_FLOOR, (W_X * 2 + 4, BACK_Y - FRONT_Y + 2, 0.04), (0, (BACK_Y + FRONT_Y) / 2, -0.02))

# ---- back wall with blackboard
BW = W_X + 6.2
box("Wall_Back", M_WALL, (BW, 0.12, H), ((W_X - 6.2) / 2, BACK_Y + 0.06, H / 2))
box("Wall_Back_Base", M_WALL2, (BW, 0.03, 0.12), ((W_X - 6.2) / 2, BACK_Y - 0.015, 0.06))
bb = empty("Blackboard", (-0.4, BACK_Y - 0.03, 1.6))
box("Board_Face", M_BOARD, (3.8, 0.03, 1.25), (0, 0, 0), parent=bb)
for i, (sx, sz, x, z) in enumerate([(3.95, 0.07, 0, 0.66), (3.95, 0.07, 0, -0.66), (0.07, 1.39, 1.94, 0), (0.07, 1.39, -1.94, 0)]):
    box(f"Board_Frame{i}", M_WOOD, (sx, 0.06 if i < 2 else 0.056, sz), (x, -0.02, z), parent=bb, key="BoardFrame")
box("Board_Tray", M_WOOD, (3.8, 0.12, 0.04), (0, -0.07, -0.68), parent=bb)
for i, x in enumerate([-1.2, -1.05, 0.9]):
    box(f"Chalk{i}", M_CHALK, (0.08, 0.012, 0.012), (x, -0.09, -0.65), parent=bb, key="Chalk")
box("Eraser", M_DARK, (0.13, 0.05, 0.035), (1.3, -0.09, -0.64), parent=bb)
# clock above board
clk = empty("Clock", (-0.4, BACK_Y - 0.03, 2.62))
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=0.17, depth=0.04)
c = bpy.context.active_object
c.name = "Clock_Face"; c.data.name = "SM_ClockFace"
c.rotation_euler = (math.pi / 2, 0, 0)
for col in c.users_collection:
    col.objects.unlink(c)
coll.objects.link(c)
c.data.materials.append(M_PAPER)
c.parent = clk
c.location = (0, 0, 0)
box("Clock_Hand_H", M_DARK, (0.012, 0.01, 0.09), (0.02, -0.03, 0.03), rot_z=0, parent=clk).rotation_euler = (0, 0.6, 0)
box("Clock_Hand_M", M_DARK, (0.01, 0.01, 0.13), (0, -0.032, 0.05), parent=clk)
# notice board right of blackboard + papers
nb = empty("NoticeBoard", (2.85, BACK_Y - 0.03, 1.55))
box("Notice_Cork", M_WOOD, (1.3, 0.03, 0.9), (0, 0, 0), parent=nb)
for i, (x, z, w, h) in enumerate([(-0.35, 0.18, 0.32, 0.42), (0.1, 0.22, 0.3, 0.3), (0.42, 0.05, 0.28, 0.4), (-0.15, -0.22, 0.4, 0.28)]):
    box(f"Notice_Paper{i}", M_PAPER, (w, 0.01, h), (x, -0.022, z), parent=nb)
# speaker box upper left
box("Speaker", M_WALL2, (0.4, 0.14, 0.3), (-3.3, BACK_Y - 0.07, 2.55), bevel=0.01)
# door at left end of back wall area? (left side open) -> sliding door on back wall far left
dr = empty("Door", (-3.4, BACK_Y - 0.02, 0))
box("Door_Panel", M_WOOD, (0.95, 0.04, 2.0), (0, 0, 1.0), parent=dr)
box("Door_Window", M_GLASS, (0.6, 0.045, 0.45), (0, 0, 1.55), parent=dr)
box("Door_Frame", M_WALL2, (1.05, 0.05, 0.06), (0, 0, 2.03), parent=dr)

# ---- teacher platform & lectern
box("Platform", M_WOOD, (5.0, 1.0, 0.18), (-0.4, BACK_Y - 0.55, 0.09), bevel=0.01)
lt = empty("Lectern", (-0.4, BACK_Y - 1.0, 0.18))
box("Lectern_Body", M_WOOD, (0.9, 0.5, 0.95), (0, 0, 0.475), bevel=0.01, parent=lt)
box("Lectern_Top", M_WALL2, (1.0, 0.6, 0.04), (0, 0, 0.97), parent=lt)
box("Lectern_Book", M_PAPER, (0.28, 0.2, 0.03), (0.2, 0.05, 1.005), parent=lt)
# teacher's desk by window
td = empty("TeacherDesk", (2.9, BACK_Y - 1.1, 0))
box("TDesk_Top", M_WOOD, (1.2, 0.65, 0.04), (0, 0, 0.74), parent=td)
box("TDesk_Body", M_WALL2, (0.45, 0.6, 0.7), (0.35, 0, 0.36), parent=td)
box("TDesk_Leg", M_METAL, (0.04, 0.6, 0.72), (-0.56, 0, 0.36), parent=td)

# ---- window wall (x=+4.2): wall segments around 3 windows, sills, curtains
WIN_Y = [-2.6, -0.4, 1.8]
WIN_W, WIN_H, SILL = 1.5, 1.35, 0.95
win_root = empty("Windows", (0, 0, 0))
box("Wall_Win_Low", M_WALL, (0.12, BACK_Y - FRONT_Y, SILL), (W_X + 0.06, (BACK_Y + FRONT_Y) / 2, SILL / 2), parent=win_root)
top_z = SILL + WIN_H
box("Wall_Win_High", M_WALL, (0.12, BACK_Y - FRONT_Y, H - top_z), (W_X + 0.06, (BACK_Y + FRONT_Y) / 2, top_z + (H - top_z) / 2), parent=win_root)
edges = [FRONT_Y] + sum([[y - WIN_W / 2, y + WIN_W / 2] for y in WIN_Y], []) + [BACK_Y]
for i in range(0, len(edges), 2):
    a, b = edges[i], edges[i + 1]
    if b - a > 0.01:
        box(f"Wall_Pier{i//2}", M_WALL, (0.12, b - a, WIN_H), (W_X + 0.06, (a + b) / 2, SILL + WIN_H / 2), parent=win_root)
for j, y in enumerate(WIN_Y):
    wr = empty(f"Window{j}", (W_X, y, SILL), )
    wr.parent = win_root
    box(f"Win{j}_Glass", M_GLASS, (0.01, WIN_W - 0.03, WIN_H - 0.03), (0.031, 0, WIN_H / 2), parent=wr, key="WinGlass")
    for k, (sy, sz, yy, zz) in enumerate([(WIN_W, 0.05, 0, 0.025), (WIN_W, 0.05, 0, WIN_H - 0.025), (0.05, WIN_H, -WIN_W / 2 + 0.025, WIN_H / 2), (0.05, WIN_H, WIN_W / 2 - 0.025, WIN_H / 2), (0.04, WIN_H, 0, WIN_H / 2), (WIN_W, 0.03, 0, WIN_H * 0.62)]):
        box(f"Win{j}_Frame{k}", M_METAL, (0.06, sy, sz), (0.03, yy, zz), parent=wr, key=f"WinFrame{k}")
    box(f"Win{j}_Sill", M_WALL2, (0.22, WIN_W + 0.1, 0.04), (-0.08, 0, -0.02), parent=wr, key="WinSill")
    # curtains bunched at both sides
    for s in (-1, 1):
        box(f"Win{j}_Curtain{s}", M_CLOTH, (0.08, 0.28, WIN_H + 0.25), (-0.1, s * (WIN_W / 2 + 0.05), WIN_H / 2 + 0.05), parent=wr, key="Curtain", bevel=0.02)
box("Curtain_Rail", M_METAL, (0.03, BACK_Y - FRONT_Y, 0.03), (W_X - 0.12, (BACK_Y + FRONT_Y) / 2, top_z + 0.22), parent=win_root)
box("Wall_Win_Base", M_WALL2, (0.03, BACK_Y - FRONT_Y, 0.12), (W_X - 0.015, (BACK_Y + FRONT_Y) / 2, 0.06), parent=win_root)
# radiator under middle window
box("Radiator", M_WALL2, (0.12, 1.2, 0.5), (W_X - 0.12, WIN_Y[1], 0.4), bevel=0.01)

# ---- student desks + chairs (shared meshes)
DESK_TOP = box_mesh("DeskTop", 0.65, 0.45, 0.03)
DESK_TOP.materials.append(M_WOOD)
DESK_BOX = box_mesh("DeskBox", 0.58, 0.38, 0.1)
DESK_BOX.materials.append(M_METAL)
LEG = box_mesh("DeskLeg", 0.03, 0.03, 0.68)
LEG.materials.append(M_METAL)
SEAT = box_mesh("ChairSeat", 0.4, 0.38, 0.03)
SEAT.materials.append(M_WOOD)
BACKR = box_mesh("ChairBack", 0.38, 0.025, 0.22)
BACKR.materials.append(M_WOOD)
CLEG = box_mesh("ChairLeg", 0.025, 0.025, 0.42)
CLEG.materials.append(M_METAL)
CPOST = box_mesh("ChairPost", 0.025, 0.032, 0.36)
CPOST.materials.append(M_METAL)
BAG = box_mesh("Bag", 0.3, 0.12, 0.28, bevel=0.03)
BAG.materials.append(M_DARK)


def desk_set(name, x, y, seed):
    root = empty(name, (x, y, 0), rot_z=0.0)
    place(name + "_Top", DESK_TOP, None, (0, 0, 0.72), parent=root)
    place(name + "_Box", DESK_BOX, None, (0, 0.02, 0.645), parent=root)
    for i, (lx, ly) in enumerate([(-0.29, -0.19), (0.29, -0.19), (-0.29, 0.19), (0.29, 0.19)]):
        place(f"{name}_Leg{i}", LEG, None, (lx, ly, 0.34), parent=root)
    # chair on the -y side (student faces +y toward board)
    cy = -0.48 - (seed % 3) * 0.04
    ch = empty(name + "_Chair", (0, cy, 0))
    ch.parent = root
    ch.rotation_euler = (0, 0, ((seed * 7) % 5 - 2) * 0.05)
    place(name + "_Seat", SEAT, None, (0, 0, 0.43), parent=ch)
    place(name + "_Back", BACKR, None, (0, -0.18, 0.66), parent=ch)
    for i, (lx, ly) in enumerate([(-0.18, -0.17), (0.18, -0.17), (-0.18, 0.17), (0.18, 0.17)]):
        place(f"{name}_CLeg{i}", CLEG, None, (lx, ly, 0.21), parent=ch)
    for i, lx in enumerate([-0.17, 0.17]):
        place(f"{name}_CPost{i}", CPOST, None, (lx, -0.2, 0.6), parent=ch)
    if seed % 4 == 1:
        b = place(name + "_Bag", BAG, None, (0.36, 0.0, 0.5), parent=root)
        b.rotation_euler = (0, 0.15, math.pi / 2)
    return root


cols = [-3.35, -2.1, -0.75, 0.75, 2.1, 3.35]
rows = [2.0, 0.85, -0.3, -1.45, -2.6, -3.75]
desks = empty("Desks")
n = 0
for ri, y in enumerate(rows):
    for ci, x in enumerate(cols):
        # keep a clear stage around the origin where characters stand
        if abs(x) < 1.5 and -1.9 < y < 1.0:
            continue
        d = desk_set(f"Desk_r{ri}c{ci}", x, y, ri * 6 + ci)
        d.parent = desks
        n += 1

# ---- back of room: lockers along FRONT side? (room open toward camera) -> small cleaning cabinet by window corner
cab = empty("Cabinet", (W_X - 0.35, FRONT_Y + 0.6, 0))
box("Cabinet_Body", M_METAL, (0.5, 0.9, 1.8), (0, 0, 0.9), bevel=0.01, parent=cab)
box("Cabinet_Line", M_DARK, (0.01, 0.02, 1.6), (-0.255, 0, 0.9), parent=cab)

# ---- RENDER-ONLY enclosure (rear wall + lockers, corridor wall, ceiling). Kept out of the GLB so
# the dictionary's orbiting 3D cameras are never blocked.
ro = bpy.data.collections.new("RenderOnly")
scene.collection.children.link(ro)
_main = coll
coll = ro
LX = -4.2
box("RO_Wall_Rear", M_WALL, (W_X - LX + 0.2, 0.12, H), ((W_X + LX) / 2, FRONT_Y - 0.06, H / 2))
box("RO_Rear_Board", M_WOOD, (2.4, 0.03, 0.9), (-1.0, FRONT_Y + 0.02, 1.75))
for i in range(10):
    x = LX + 0.5 + i * 0.42
    box(f"RO_Locker{i}", M_WALL2, (0.4, 0.45, 1.1), (x, FRONT_Y + 0.25, 0.55), key="Locker")
    box(f"RO_LockerDoor{i}", M_DARK, (0.3, 0.01, 0.06), (x, FRONT_Y + 0.48, 0.85), key="LockerHandle")
box("RO_Wall_Corr_Low", M_WALL, (0.12, BACK_Y - FRONT_Y, 1.9), (LX - 0.06, (BACK_Y + FRONT_Y) / 2, 0.95))
box("RO_Wall_Corr_High", M_WALL, (0.12, BACK_Y - FRONT_Y, 0.45), (LX - 0.06, (BACK_Y + FRONT_Y) / 2, H - 0.225))
for i, y in enumerate([-5.0, -2.6, -0.2, 2.2]):
    box(f"RO_CorrWin{i}", M_GLASS, (0.04, 2.0, 0.65), (LX - 0.06, y, 2.225), key="CorrWin")
    box(f"RO_CorrWinBar{i}", M_METAL, (0.06, 0.04, 0.65), (LX - 0.04, y, 2.225), key="CorrBar")
box("RO_Ceiling", M_WALL, (W_X - LX + 0.2, BACK_Y - FRONT_Y, 0.08), ((W_X + LX) / 2, (BACK_Y + FRONT_Y) / 2, H + 0.04))
for i, x in enumerate([-2.2, 0.0, 2.2]):
    for j, y in enumerate([2.0, -0.6, -3.2, -5.6]):
        box(f"RO_Light{i}_{j}", M_PAPER, (0.25, 1.3, 0.06), (x, y, H - 0.03), key="Fluor")
coll = _main
ro_objs = [o for o in ro.objects]

# ---- lights: one sun + ceiling-ish fill (for preview renders only; GLB carries no lights)
sun_d = bpy.data.lights.new("Sun", "SUN"); sun_d.energy = 3.0; sun_d.angle = 0.2
sun = bpy.data.objects.new("Sun", sun_d); sun.rotation_euler = (math.radians(50), 0, math.radians(110))
scene.collection.objects.link(sun)
world = bpy.data.worlds.new("World"); scene.world = world
bg = next(n_ for n_ in world.node_tree.nodes if n_.type == "BACKGROUND")
bg.inputs["Color"].default_value = (0.9, 0.9, 0.9, 1); bg.inputs["Strength"].default_value = 0.8

# stats
tris = 0
objs = [o for o in coll.all_objects if o.type == "MESH"]
for o in objs:
    me = o.data
    me.calc_loop_triangles()
    tris += len(me.loop_triangles)
bpy.context.view_layer.update()
minv = Vector((1e9,) * 3); maxv = Vector((-1e9,) * 3)
for o in objs:
    for c_ in o.bound_box:
        w = o.matrix_world @ Vector(c_)
        minv = Vector(map(min, minv, w)); maxv = Vector(map(max, maxv, w))

blend = os.path.join(OUT, "classroom.blend")
bpy.ops.wm.save_as_mainfile(filepath=blend)
glb = os.path.join(OUT, "classroom.glb")
# web: merge everything into one mesh (one draw call per material) for export only
for o in objs:
    o.data = o.data.copy()
ctx_objs = objs
with bpy.context.temp_override(active_object=ctx_objs[0], object=ctx_objs[0], selected_objects=ctx_objs,
                               selected_editable_objects=ctx_objs):
    r = bpy.ops.object.join()
joined = bpy.data.objects[ctx_objs[0].name]
joined.name = "SM_Classroom"
mw = joined.matrix_world.copy()
joined.parent = None
joined.matrix_world = mw
for e in [o for o in coll.objects if o.type == "EMPTY"]:
    bpy.data.objects.remove(e, do_unlink=True)
for o in ro_objs:
    bpy.data.objects.remove(o, do_unlink=True)
bpy.ops.export_scene.gltf(filepath=glb, export_format='GLB', use_selection=False, export_lights=False,
                          export_cameras=False, export_apply=True, export_yup=True)
print("@@JSON@@" + json.dumps({"mesh_objects": len(objs), "tris": tris, "desks": n,
                               "materials": len(MATS), "bbox_min": list(minv), "bbox_max": list(maxv),
                               "glb_bytes": os.path.getsize(glb), "blend": blend}))
