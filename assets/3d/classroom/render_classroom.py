"""Render manga line-art (white fill + ink lines) and toned previews of classroom.blend from several cameras.
Usage: blender -b classroom.blend --factory-startup -P render_classroom.py -- OUTDIR [res_x res_y]
"""
import bpy, sys, os, math, json
from mathutils import Vector

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]
RX = int(argv[1]) if len(argv) > 1 else 1600
RY = int(argv[2]) if len(argv) > 2 else 1000
os.makedirs(OUT, exist_ok=True)
sc = bpy.context.scene
try:
    sc.render.engine = "BLENDER_EEVEE"
except TypeError as e:
    print(e)
sc.render.resolution_x, sc.render.resolution_y = RX, RY
sc.render.resolution_percentage = 100
sc.render.film_transparent = False
sc.view_settings.view_transform = "Standard"
sc.render.use_freestyle = True
sc.render.line_thickness_mode = "ABSOLUTE"
sc.render.line_thickness = 1.6
vl = sc.view_layers[0]
fs = vl.freestyle_settings
fs.crease_angle = math.radians(140)
ls = fs.linesets[0] if len(fs.linesets) else fs.linesets.new("Ink")
ls.select_by_visibility = True
ls.select_silhouette = ls.select_border = ls.select_crease = True
ls.select_external_contour = True
ls.linestyle.color = (0.08, 0.08, 0.09)
ls.linestyle.thickness = 1.6

cam_d = bpy.data.cameras.new("Cam"); cam_d.lens = 26; cam_d.clip_end = 100
cam = bpy.data.objects.new("Cam", cam_d); sc.collection.objects.link(cam); sc.camera = cam


def aim(loc, target):
    cam.location = Vector(loc)
    d = Vector(target) - Vector(loc)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


VIEWS = {
    "front": ((0, -5.6, 1.55), (0, 2.0, 1.25)),
    "45": ((-3.9, -4.6, 1.6), (0.8, 1.2, 1.1)),
    "window": ((-3.6, 0.6, 1.5), (4.2, -0.8, 1.35)),
    "reverse": ((-0.6, 3.0, 1.75), (0.4, -4.0, 0.7)),
    "top": ((0, -1.7, 13.0), (0, -1.6, 0)),
}

# white-fill override for pure line art
white = bpy.data.materials.new("LA_White")
nt = white.node_tree
for n in list(nt.nodes):
    nt.nodes.remove(n)
em = nt.nodes.new("ShaderNodeEmission"); em.inputs["Color"].default_value = (1, 1, 1, 1); em.inputs["Strength"].default_value = 1
out = nt.nodes.new("ShaderNodeOutputMaterial"); nt.links.new(em.outputs[0], out.inputs[0])
bg = next(n for n in sc.world.node_tree.nodes if n.type == "BACKGROUND")
files = []
for variant in ("lineart", "tone"):
    if variant == "lineart":
        vl.material_override = white
        bg.inputs["Color"].default_value = (1, 1, 1, 1); bg.inputs["Strength"].default_value = 1
    else:
        vl.material_override = None
        bg.inputs["Color"].default_value = (0.92, 0.92, 0.92, 1); bg.inputs["Strength"].default_value = 0.9
    for name, (loc, tgt) in VIEWS.items():
        aim(loc, tgt)
        cam_d.lens = 24 if name == "top" else 26
        for o in bpy.data.objects:
            if o.name.startswith(("RO_Ceiling", "RO_Light")):
                o.hide_render = (name == "top")
        p = os.path.join(OUT, f"classroom_{name}_{variant}.png")
        sc.render.filepath = p
        bpy.ops.render.render(write_still=True)
        files.append((os.path.basename(p), os.path.getsize(p)))
print("@@JSON@@" + json.dumps(files))
