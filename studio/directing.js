/* 연출 클리셰: 한 번 누르면 컷이 통째로 들어가는 템플릿
   {A} {An} = 주인공(아이디/이름), {B} {Bn} = 상대  */
window.DIRECTING = [
 // ── 로맨스 ──
 {cat:'로맨스', n:'벽쿵', d:'벽에 몰아붙이며 가까워지는 순간', t:
`@panel hall 1.0 lines
@char {A} shock+blush 34 1
@char {B} calm 70 1.1 flip
@mark 놀람 선 30 18 22
!!쿵
{Bn}: 도망가지 마.`},
 {cat:'로맨스', n:'같은 물건 잡기', d:'손끝이 닿고 동시에 굳는다', t:
`@panel class 0.9 sparkle
@char {A} shock+blush 30 1
@char {B} shock+blush 70 1 flip
!!찌릿
{An}: 아, 미안…!
{Bn}: 아, 아니 내가…!`},
 {cat:'로맨스', n:'눈 마주치고 고개 돌리기', d:'두 컷: 마주침 → 동시에 외면', t:
`@panel class 0.8
@char {A} think 30 1
@char {B} think 70 1 flip
(눈이 마주쳤다.)
@panel class 0.8
@char {A} shy 30 1 flip
@char {B} shy 70 1
@mark 홍조 50 30 18
!!휙`},
 {cat:'로맨스', n:'귀까지 빨개짐', d:'홍조 클로즈업 단독 컷', t:
`@panel pink 0.8 flowers
@char {B} blank+blush 50 1.9
@note 겉은 무표정, 홍조만으로 감정을 들킨다`},
 {cat:'로맨스', n:'겉 무표정 · 속 폭주', d:'갭모에: 무표정 컷 + 속마음 컷', t:
`@panel class 0.8
@char {B} blank 50 1.6
{Bn}^: …응.
@panel pink 1.0 flowers sparkle
@char {B} panic 50 1.35
{Bn}%: 말 걸었다 말 걸었다!!
{Bn}%: 표정 관리 표정 관리!!`},
 {cat:'로맨스', n:'착각하지 말자', d:'호의를 받고도 스스로 부정하는 주인공', t:
`@panel class 0.9 sparkle
@char {A} calm 30 1
@char {B} smile+blush 70 1 flip
{Bn}: 이거… 너 주려고.
@panel white 0.62
@char {A} dead 50 1.25 76
{An}*: 남은 거겠지.<br>착각하지 말자.`},
 {cat:'로맨스', n:'고백 직전 방해', d:'결정적 순간에 끼어드는 제3자', t:
`@panel roof 1.0 sparkle
@char {A} shy 30 1
@char {B} shy 70 1 flip
{An}: 저기, 나…
@panel shock 0.8
@char {A} shock 50 1.5
!!벌컥
(…하필 그때 문이 열렸다.)`},
 {cat:'로맨스', n:'우산 같이 쓰기', d:'비 오는 날 하나의 우산', t:
`@panel grey 1.0
@char {A} calm 34 1
@char {B} shy 66 1 flip
(비가 그칠 기미가 없었다.)
{Bn}: …같이 쓸래?`},
 {cat:'로맨스', n:'꽃배경 등장', d:'첫 등장을 미화 필터로', t:
`@panel pink 1.1 flowers sparkle
@char {B} smile 50 1.5
@mark 반짝반짝 82 20 18
({Bn}. 그 애가 웃었다.)`},
 {cat:'로맨스', n:'간접 키스', d:'같은 음료를 마신 걸 깨닫는 컷', t:
`@panel class 0.9
@char {A} shock+blush 30 1
@char {B} calm 70 1 flip
{Bn}: 아, 그거 내가 마시던 건데.
@mark 느낌표 22 14 16`},

 // ── 개그 ──
 {cat:'개그', n:'점눈 정적', d:'할 말을 잃은 침묵 컷', t:
`@panel white 0.7
@char {A} dead 50 1.4
@mark 침묵 말풍선 76 22 18
{An}: ……`},
 {cat:'개그', n:'식은땀 한 방울', d:'곤란한 상황의 정석', t:
`@panel class 0.8
@char {A} deadsweat 50 1.4
@mark 식은땀 70 16 10`},
 {cat:'개그', n:'핏대 츳코미', d:'버럭 지적하는 외침', t:
`@panel class 0.9 lines
@char {A} angry 30 1.1
@char {B} n 72 1 flip
@mark 핏대 22 10 14
{An}!: 그게 아니잖아!!`},
 {cat:'개그', n:'소용돌이 눈 당황', d:'머리가 하얘진 패닉', t:
`@panel pink 0.9 flowers
@char {B} panic 50 1.4
@mark 혼란 회오리 78 16 16
{Bn}~: 아, 아니 그러니까 그게…!`},
 {cat:'개그', n:'충격 집중선', d:'"큰일이다" 류 충격 컷', t:
`@panel shock 0.95
@char {A} shock 50 1.75 56
!!큰일이다`},
 {cat:'개그', n:'영혼 이탈', d:'너무 놀라 혼이 나감', t:
`@panel white 0.8
@char {A} dead 50 1.4
@mark 영혼 이탈 52 4 22
(…{An}의 영혼이 잠시 외출했다.)`},
 {cat:'개그', n:'좌절 orz', d:'무너지는 주인공', t:
`@panel grey 0.8 gloom
@char {A} hurt 50 1.3
@mark 좌절 orz 76 18 18`},

 // ── 긴장 ──
 {cat:'긴장', n:'그림자 눈', d:'웃는데 눈이 안 보이는 위압감', t:
`@panel hall 0.9 gloom
@char {B} menace 50 1.9 50
{Bn}$: 지금… 뭐라고 했어?`},
 {cat:'긴장', n:'세로 그늘선 우울', d:'우울이 내려앉는 연출', t:
`@panel grey 0.8 gloom
@char {A} gloom 50 1.3
{An}*: 다 내 탓이야.`},
 {cat:'긴장', n:'단톡방 폭로', d:'단체방 화면으로 상황 전달', t:
`@chat 반 단톡방
@msg 반애들: 이거 봤냐ㅋㅋ
@msg 반애들: 와 진짜야?
@msg {Bn}: 그만해.`},
 {cat:'긴장', n:'뒷모습 실루엣', d:'누군가 지켜보고 있다', t:
`@panel dark 0.9 vignette
@char {B} blank+shadow 50 1.2
(그 장면을, 누군가 보고 있었다.)`},
 {cat:'긴장', n:'떨리는 목소리', d:'흔들리는 말풍선', t:
`@panel hall 0.9 gloom
@char {B} cry 50 1.45
{Bn}~: 나… 괜찮아. 진짜야.`},

 // ── 구성 ──
 {cat:'구성', n:'회상', d:'세피아 톤 과거 컷', t:
`@panel sepia 1.0 flowers
@char {A} smile 32 1
@char {B} smile 72 1 flip
((회상) 그때 우리는…)`},
 {cat:'구성', n:'같은 시각, 다른 곳', d:'장면 전환 나레이션', t:
`@txt 같은 시각.
@panel dark 0.8
@char {B} blank+shadow 50 1.2`},
 {cat:'구성', n:'해피엔딩인 줄 알았다', d:'도장 → 긴 여백 → 반전 컷', t:
`@stamp happy HAPPY END ♥ :: — 인 줄 알았다.
@gap l
@panel hall 0.9 gloom
@char {B} menace 50 1.8 54
{Bn}$: …이제 시작이야.`},
 {cat:'구성', n:'다음 화 예고', d:'클리프행어로 끊기', t:
`@panel shock 0.8
@char {A} shock 50 1.6
!!?!
@txt 다음 화에 계속`},
 {cat:'구성', n:'표지 컷', d:'제목 + 큰 인물', t:
`@title 제목 :: 부제
@panel pink 1.1 flowers sparkle fb
@char {B} smile 50 1.6`},
 {cat:'구성', n:'선택지 장면', d:'주인공 대사를 고르는 컷', t:
`@panel class 1.0
@char {A} calm 50 1.15
* [{An}: 첫 번째 대사 @smile ::설명]
    -> END
* [{An}*: 두 번째 속마음 @think ::설명]
    -> END`},
];
