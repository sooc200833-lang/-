"""Convert classroom renders to pack files: line art -> 8-bit grayscale PNG, tone -> JPEG, and write index.json.
Usage: blender -b --factory-startup -P pack_classroom.py -- RENDERS_DIR PACK_DIR
"""
import bpy, sys, os, json

argv = sys.argv[sys.argv.index("--") + 1:]
SRC, PACK = argv
os.makedirs(os.path.join(PACK, "bg"), exist_ok=True)
sc = bpy.context.scene
sc.view_settings.view_transform = "Standard"
ims = sc.render.image_settings
VIEWS = [("front", "교실 (정면)", "front"), ("45", "교실 (45도)", "45 angle"), ("window", "교실 (창가 쪽)", "window side"),
         ("reverse", "교실 (교탁에서 본 뒤쪽)", "reverse back lockers"), ("top", "교실 (위에서 본 배치)", "top down layout")]
items = []
for key, name, tag in VIEWS:
    base = f"3d-classroom-{key}"
    la = bpy.data.images.load(os.path.join(SRC, f"classroom_{key}_lineart.png"))
    ims.file_format = "PNG"; ims.color_mode = "BW"; ims.color_depth = "8"; ims.compression = 100
    la.save_render(os.path.join(PACK, "bg", base + "_l.png"), scene=sc)
    tn = bpy.data.images.load(os.path.join(SRC, f"classroom_{key}_tone.png"))
    ims.file_format = "JPEG"; ims.color_mode = "RGB"; ims.quality = 86
    tn.save_render(os.path.join(PACK, "bg", base + "_o.jpg"), scene=sc)
    items.append({"id": "bg-" + base, "name": name, "kind": "배경", "orig": f"bg/{base}_o.jpg", "line": f"bg/{base}_l.png",
                  "license": "직접 제작", "credit": "이 사전에서 블렌더로 만든 3D 교실 (원본 모델: assets/3d/classroom/classroom.glb)",
                  "page": "assets/3d/classroom/classroom.glb", "tags": "classroom school 3d blender " + tag, "cat": "학교"})
with open(os.path.join(PACK, "index.json"), "w", encoding="utf-8") as f:
    f.write("[\n" + ",\n".join(json.dumps(x, ensure_ascii=False, indent=0) for x in items) + "\n]\n")
print("@@JSON@@" + json.dumps([[x["line"], os.path.getsize(os.path.join(PACK, x["line"])), os.path.getsize(os.path.join(PACK, x["orig"]))] for x in items]))
