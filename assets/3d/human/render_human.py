import bpy, sys, os, math
from mathutils import Vector
OUT = sys.argv[sys.argv.index("--") + 1]
sc = bpy.context.scene
try: sc.render.engine = "BLENDER_EEVEE"
except TypeError: pass
sc.render.resolution_x, sc.render.resolution_y = 900, 700
sc.view_settings.view_transform = "Standard"
w = bpy.data.worlds.new("W"); sc.world = w; bg = next(n for n in w.node_tree.nodes if n.type == "BACKGROUND"); bg.inputs[0].default_value = (1, 1, 1, 1); bg.inputs[1].default_value = .9
sun = bpy.data.objects.new("Sun", bpy.data.lights.new("Sun", "SUN")); sun.data.energy = 3; sun.rotation_euler = (math.radians(40), 0, math.radians(30)); sc.collection.objects.link(sun)
cd = bpy.data.cameras.new("C"); cam = bpy.data.objects.new("C", cd); sc.collection.objects.link(cam); sc.camera = cam; cd.type = 'ORTHO'; cd.ortho_scale = 2.1
rig = bpy.data.objects["Rig"]
def aim(loc, tgt): cam.location = Vector(loc); cam.rotation_euler = (Vector(tgt) - Vector(loc)).to_track_quat("-Z", "Y").to_euler()
# a test pose: bend left elbow and right knee to check deformation
pb = rig.pose.bones
views = [("front", (0, -5, 1.0)), ("side", (5, 0, 1.0)), ("q", (3.5, -3.5, 1.2))]
for tag, posed in (("rest", False), ("pose", True)):
    for b in pb: b.rotation_mode = 'XYZ'; b.rotation_euler = (0, 0, 0)
    if posed:
        pb["el.L"].rotation_euler = (math.radians(-80), 0, 0); pb["sh.R"].rotation_euler = (math.radians(-60), 0, 0)
        pb["hp.R"].rotation_euler = (math.radians(-50), 0, 0); pb["kn.R"].rotation_euler = (math.radians(70), 0, 0); pb["sp"].rotation_euler = (math.radians(15), 0, 0)
    bpy.context.view_layer.update()
    for name, loc in views:
        aim(loc, (0, 0, .95)); sc.render.filepath = os.path.join(OUT, f"human_{tag}_{name}.png"); bpy.ops.render.render(write_still=True)
print("@@JSON@@ok")
