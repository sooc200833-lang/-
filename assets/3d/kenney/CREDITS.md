# Kenney 3D 키트 (3D 콘티 배경 세트)

- 출처: Kenney (www.kenney.nl) — Furniture Kit 2.0, Nature Kit, City Kit Commercial 2.1, City Kit Suburban 2.0, City Kit Roads, Food Kit
- 라이선스: **CC0 1.0** (http://creativecommons.org/publicdomain/zero/1.0/) — 개인·교육·상업 이용 자유, 출처 표시는 선택("Support us by crediting Kenney or www.kenney.nl (this is not mandatory)")
- 원본 zip은 저장소에 넣지 않았다. `build_kenney_sets.py`가 필요한 모델만 골라 배치하고, 색을 사전 팔레트(M_Floor·Wall·Trim·Wood·Dark·Glass·Metal·Curtain·Road·Grass·Leaf)로 나눠 세트마다 한 메시로 합쳐 `sets/*.glb`로 내보낸다.
- 다시 만들기: kenney.nl에서 위 키트 zip을 받아 한 폴더에 풀고 `blender -b --factory-startup -P build_kenney_sets.py -- <그 폴더> sets`
