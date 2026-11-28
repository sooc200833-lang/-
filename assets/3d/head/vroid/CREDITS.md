# VRoid 머리 출처

- `female.glb` ← VRoid Studio 샘플 모델 **HairSample_Female**, `male.glb` ← **HairSample_Male** (pixiv Inc. / VRoid Project)
- 라이선스: **CC0** — VRoid 공식 FAQ에 HairSample_Male·HairSample_Female이 CC0로 적혀 있고, VRM 파일 안의 라이선스 정보도 CC0다.
  (같이 받은 AvatarSample D~G는 파일 안 라이선스가 "Other"라 쓰지 않았다)
- 바꾼 것: 얼굴·머리카락만 남김, 크기·자리 맞춤, VRM 표정 묶음을 표정 키로 합침, 그림 크기 줄임(webp), 여자 샘플의 고양이 귀 장식 삭제.
- 다시 만들기: `blender -b --factory-startup -P build_vroid_head.py -- <HairSample_*.vrm> <out.glb>`
