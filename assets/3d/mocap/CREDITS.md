# 모션 캡처 자세 출처

사전 3D 인형의 「모션 캡처」 자세(\POSE_MC\, 129개)는 아래 데이터에서 만들었습니다.

- **CMU Graphics Lab Motion Capture Database** — http://mocap.cs.cmu.edu
  - 공식 FAQ: "The motion capture data may be copied, modified, or redistributed without permission."
  - "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with funding from NSF EIA-0196217."
- BVH 변환본: Bruce Hahne(cgspeed) 변환을 담은 GitHub 미러 \una-dinosauria/cmu-mocap\에서 33개 동작만 받았습니다(BVH 원본은 저장소에 올리지 않음).

## 쓴 동작 (CMU 번호 → 이름)
02_01 걷기 · 02_03 달리기 · 02_04 점프 · 02_05 주먹질 · 02_06 줍기 · 02_07 검술 · 10_01 공 차기 · 13_01 의자에 앉기 · 13_04 턱 괴고 앉기 · 13_10 손 뻗어 잡기 · 13_11 앞으로 뛰기 · 13_14 웃음 · 13_17 복싱 · 13_27 손짓·가리키기 · 22_03 얼굴 감싸고 앉기 · 90_16 엎어지기 · 79_06 악수 · 79_25 무거운 상자 · 79_31 칠판에 쓰기 · 79_36 전화 받기 · 79_41 커피 마시기 · 79_69 크게 기뻐함 · 79_70 크게 웃음 · 79_71 슬퍼함 · 79_72 울음 · 79_73 겁먹음 · 79_74 화냄 · 79_85 노트북 타자 · 79_86 활 쏘기 · 79_88 파리 쫓기 · 79_89 아기 안기 · 79_94 힘자랑 · 79_96 총 쏘기

## 다시 만들기
\
ode mocap_convert.js <BVH 폴더> pose_mc.json\ → 결과 JSON을 사전 본문의 \ar POSE_MC=\ 자리에 넣는다. 동작을 더하려면 변환기의 \NAMES\에 CMU 번호와 이름을 더한다.