window.SAMPLE_SEOYUN = `@title 모두에게 잘해주는 서윤양 :: 단편 선택지 웹툰 · 1화 큰일이다
VAR seo = 0
VAR doh = 0
VAR cha = 0
VAR fight = 0
VAR h = "seo"
VAR hn = "서윤"

-> s1

=== s1 ===
@txt 우리 학교에는<br>전설이 하나 있다.
@panel class 1.05 sparkle
@char mob shy 16 .82
@char seo smile 50 1
@char mobg smile 85 .8 flip
(2학년 3반, 한서윤.)
서윤: 다들 오늘도 수고했어~♪
@note 모두에게 눈웃음. 반짝이 = 미화 필터.
@panel pink 0.85 flowers
@char mob panic 50 1.9 52
반애들~: 서, 서윤아…! 나, 너를…!
@panel white 0.8 sparkle
@char seo smile 50 1.7 52
서윤: 응? 미안♪
@sfx 털썩
@txt 이번 학기에만 셋.
@panel class 1.0
@char doh calm 28 .98
@char jun dead 74 .98 flip
이준*: 축구부는 왜 자꾸 가는 건데.
도하: 걔 일부러 그러는 거래.<br>착각하게 해놓고 차는 게 취미라나?
@panel class 0.62
@char jun calm 50 1.25 76
이준*: 무섭다.<br>절대 엮이지 말자.
@txt 그리고 3월 2일, 자리 배정.
@panel shock 0.95
@char jun shock 50 1.75 56
!!큰일이다
@panel class 1.0
@char jun deadsweat 28 .95
@char seo blank 72 .95 flip
(창가 맨 뒤, 옆자리.)
서윤^: …안녕.
@panel class 0.8
@char seo blank+blush 50 1.9 50
@note 바깥에서 보면 완벽한 무표정. 홍조만 보인다.
@panel pink 1.05 flowers sparkle
@char seo panic 50 1.35 62
(같은 시각, 한서윤의 머릿속)
서윤%: 옆자리옆자리옆자리<br>미쳤다 어떡해!!
서윤%: 웃으면 들켜!!<br>무표정 무표정 무표정
@panel class 1.0
@char jun calm 50 1.15
* [이준*: 역시 날 싫어하는구나.<br>…오히려 다행이다. @dead]
    -> s2
* [이준*: …혹시?<br>아니, 정신 차려. 축구부 4호 될래? @shy]
    ~ seo += 1
    -> s2
* [이준~: 어, 어어. 안녕… @panic]
    ~ seo += 1
    -> s2

=== s2 ===
@txt 일주일 후.
@panel class 1.0 sparkle
@char mob shy 18 .82
@char seo grin 52 1
@char mobg smile 85 .8 flip
서윤: 쿠키 구워 왔어~<br>하나씩!
반애들: 천사다…
@panel class 0.95
@char seo blank 32 1
@char jun calm 76 .95 flip
!!툭
서윤: …남았어.
@txt 다른 애들 건 비닐 포장.<br>내 것만 손으로 접은 종이에, 하트 스티커.
@panel class 0.62
@char jun think 50 1.25 76
이준*: …재활용인가.
@panel pink 0.9 flowers
@char seo panic 50 1.4 64
서윤%: 하트 스티커 봤나 봤겠지<br>아니 못 봤을 거야 제발
@gap
@panel hall 1.0 lines
@char doh2 panic 50 1.45 60
도하!: 뭐, 뭘 봐!!<br>머리끈 끊어진 거거든?!
@note 10년 동안 포니테일+체육복이던 소꿉친구가 머리를 풀고 립밤까지.
@panel hall 0.62
@char jun calm 50 1.25 76
이준*: 머리끈이 끊어질 만큼<br>힘든 일이 있었구나…
@panel white 0.75
@char doh2 dead 50 1.5 62
도하%: 10년 만에 머리 푼 건데<br>반응이 그거냐…
@gap
@panel hall 1.0
@char mobg calm 18 .8
@char cha shy 54 1
@char mobg smile 86 .78 flip
채린: 이준? 걔 완전 음침하던데.<br>누가 좋아하겠어?
채린%: 됐다… 이러면<br>아무도 안 넘보겠지…
@note 옆 반 윤채린. 입으로는 험담, 얼굴은 홍조. 서투른 견제.
@panel class 1.0
@char jun calm 50 1.15
* [이준*: 재활용이라도 감사히 먹자. @smile]
    ~ seo += 1
    -> s3
* [이준: 도하야, 이거 먹을래?<br>머리끈 위로금. @n]
    ~ doh += 1
    -> s3
* [이준*: …다른 애들 거랑<br>포장이 다르네. @think]
    -> s3

=== s3 ===
@txt 채린의 험담은<br>2주 만에 농담이 아니게 됐다.
@chat 2-3 단톡방
@msg 태성: 음침이 오늘도 혼잣말함ㅋㅋ
@msg 반애들: ㅋㅋㅋㅋㅋ
@msg 태성: 실내화 쓰레기통 인증ㅋ
@panel class 1.0
@char mob grin 14 .8
@char tae smirk 46 1.05
@char jun gloom 84 .9 flip
태성: 채린이가 너 기분 나쁘대~
태성: 그럼 우리도<br>기분 나쁘지.
@panel hall 0.9 gloom
@char cha sad+sweat 50 1.4 62
채린~: 이러려던 게 아닌데…
채린%: 내가 멈추게 하면…<br>내가 지켜주면…
@gap
@panel roof 1.1
@char cha shy 32 1
@char jun calm 76 .95 flip
(옥상.)
채린: 너 요즘 힘들지.
채린: 내가 걔네한테<br>말해줄 수 있어.
@panel roof 0.9
@char cha menace+blush 50 1.95 50
채린$: …그러니까, 나랑 사귀면.<br>아무도 너 못 건드려.
@note 홍조와 그림자눈을 동시에. 설레는 고백 연출인데 무섭게.
@txt 세 사람 중에서<br>가장 먼저 마음을 말한 건, 그녀였다.
@panel roof 1.0
@char cha shy 28 .95
@char jun calm 74 1 flip
* [이준: …그래. 사귀자. @calm ::괴롭힘만 끝난다면]
    ~ cha += 3
    -> c1
* [이준^: …생각해볼게. @sad]
    ~ cha += 1
    -> s4
* [이준!: 장난이면 그만해! @angry]
    ~ cha -= 2
    ~ fight += 1
    -> s4

=== s4 ===
@panel grey 1.0 gloom
@char tae smirk 36 1.05
@char jun hurt 78 .9 flip
(괴롭힘은 더 심해졌다.)
태성: 슬슬 질리는데.
@panel grey 0.9
@char tae menace 50 1.95 50
태성$: 재밌는 거 하나 주면 봐줄게.<br>너 최우진이랑 친하잖아?
@panel sepia 1.0 flowers
@char woo smile 32 1
@char jun smile 76 .95 flip
((회상) 중학교 때부터 친구, 최우진.)
우진: 너한테만<br>보여주는 거다.
@txt 그 공책엔<br>한서윤 그림이 잔뜩 있었다.
@panel grey 1.0 gloom
@char jun gloom 50 1.2
* [이준^: …우진이한테,<br>그림 공책이 있어. @sad+shadow ::나만 살면 되잖아]
    -> s5
* [이준!: 그만해, 차태성!! @angry ::서윤이가 보고 있다]
    ~ fight += 1
    -> f1
* [이준: …… @dead ::아무 말도 하지 않는다]
    -> L1

=== f1 ===
@sfx 퍽! red
@panel shock 1.0
@char jun hurt 30 1
@char tae grin 72 1 flip
태성: 여자 앞이라고<br>폼 잡냐? ㅋ
@panel class 0.62
@char seo shock 50 1.3 72
@note 서윤이 일어서려다 친구들에게 붙잡힌다. 이준은 보지 못한다.
@chat 2-3 단톡방
@msg 방 이름이 "찐따 영웅"으로 변경되었습니다.
@msg 태성: 영웅님 출근하셨나요ㅋㅋㅋ
@panel class 0.7 gloom
@char jun gloom 50 1.3 70
이준*: 서윤이 표정…<br>경멸이었겠지.
@txt 아무것도 달라지지 않았다.
{ fight >= 2:
    -> E5
- else:
    -> s4
}

=== s5 ===
@txt 다음 날부터,<br>아무도 나를 건드리지 않았다.
@chat 2-3 단톡방
@msg 태성: 최우진 공책 봤냐ㅋㅋㅋ
@msg 반애들: 한서윤만 30장ㅋㅋ 스토커냐
@panel class 1.0
@char woo blank 50 1.95 50
@note 우진이 이준을 본다. 원망도 아닌 "알아"라는 눈. 작품 전체의 무게중심.
@txt 우진이는 아무 말도 하지 않았다.
@gap
@panel pink 1.0 sparkle
@char seo smile+blush 50 1.45 60
서윤: …다행이다.<br>요즘 표정 좋아져서.
@panel white 0.65
@char seo panic 50 1.3 72
서윤%: 웃었다 방금 웃어버렸다<br>들켰나 들켰나
@panel hall 1.0 lines
@char doh2 shy 50 1.45 60
도하~: 주말에 시간 되냐?<br>아니 그냥. 영화. 그냥.
@panel class 0.62
@char jun think 50 1.25 76
이준*: 다들 왜 이러지. 착각이겠지.<br>…그래도.
@panel dusk 1.0
@char jun calm 50 1.15
* [이준: 서윤아.<br>나… 너 좋아해. @shy ::축구부 4호가 되어도 좋다]
    ~ h = "seo"
    ~ hn = "서윤"
    -> s6
* [이준: 도하야,<br>영화 보러 가자. @smile]
    ~ h = "doh2"
    ~ hn = "도하"
    -> s6
* [이준: 우진아…<br>옆에 앉아도 돼? @sad ::봄 같은 건 나중에]
    -> L2

=== s6 ===
@panel pink 1.1 flowers sparkle
@char {h} smile+blush+tear 50 1.5 58
{hn}: {h == "seo": …착각 아니야.<br>처음부터, 너였어.|바보야.<br>10년 걸렸다고.}
@stamp happy HAPPY END ♥ :: — 인 줄 알았다.
@gap l
@panel hall 1.0 gloom
@char cha menace 50 1.8 54
채린$: …저 애,<br>좀 이상하지 않아?
@panel dark 0.8
@char woo blank+shadow 50 1.2 66
!!찌익
@note 불 꺼진 교실. 우진이 공책을 찢는다. 이준은 이 장면을 모른다.
@panel hall 1.0
@char woo smile 30 1
@char jun calm 74 .95 flip
우진: 오랜만에<br>같이 마시자.
우진^: 내일… 아니다. 그냥.
@note 편의점 음료수 두 개.
@panel hall 1.0
@char jun calm 50 1.15
* [이준: 고마워. 잘 마실게. @smile]
    -> E4
* [이준: 미안, 약속 있어!<br>다음에! @n+sweat ::요즘 그녀가 이상하다]
    -> s7
* [이준: 그 공책… 나였어.<br>미안해. @cry]
    -> L2

=== s7 ===
@chat 2-3 단톡방
@msg 태성: {hn} 실내화 어딨게ㅋㅋ
@msg 반애들: 쓰레기통ㅋㅋㅋ
@panel hall 0.9 gloom
@char cha cry 50 1.5 60
채린~: 멈추는 법을…<br>모르겠어.
@panel class 1.0
@char {h} smile+tear 32 1
@char jun sad 76 .95 flip
{hn}: 괜찮아.<br>너만 있으면 돼.
이준*: 괜찮다는 말,<br>나도 했었다.
@panel class 1.0
@char {h} smile+tear 26 .92
@char jun sad 74 1 flip
* [이준: 우리…<br>착각이었던 걸로 하자. @sad ::내가 옆에 있으면 그녀가 표적이다]
    -> E2
* [이준: 끝까지 옆에 있을게. @smile ::둘이면 버틸 수 있다고 믿었다]
    -> E3

=== c1 ===
@panel pink 1.0 flowers
@char cha grin+blush 34 1
@char jun deadsweat 76 .95 flip
(다음 날, 거짓말처럼 괴롭힘이 멈췄다.)
채린: 내가 지켜준다고 했잖아.<br>이제 너, 내 거야♡
@panel class 0.8
@char seo blank+tear 50 1.9 50
@note 1화와 같은 구도. 이번엔 귀가 아니라 눈가가 붉다.
@stamp happy HAPPY END ♥ :: — 인 줄 알았다.
@gap l
@panel grey 1.0 gloom
@char tae smirk 32 1
@char woo gloom 76 .9 flip
태성: 채린이 남친은<br>건들지 말래서.
태성: 심심한데~
@panel hall 0.9
@char cha menace 50 1.8 54
채린$: 가자.
@note 문틈으로 보던 이준의 팔을 채린이 당긴다.
-> E1

=== E1 ===
@panel dark 1.0
@char woo blank+shadow 50 1.25 62
(그 후로 우진이는 학교에서 말을 하지 않았다.)
@txt 대신 주말마다,<br>아주 무거운 택배를 받았다.
@sfx 4월 1일 quiet
@ending E1 만우절이 아닌 날 :: 채린 루트
-> END

=== E2 ===
@panel class 0.9
@char {h} blank 50 1.8 52
(그녀는 다시 무표정이 되었다.)
@txt 이제 나는,<br>그게 긴장이었다는 걸 안다.
@panel class 1.0 sparkle
@char mob shy 20 .82
@char {h} smile 58 1
(괴롭힘은 멈췄다. 그녀는 다시 모두에게 잘해준다.)
@txt 나에게만,<br>아무 표정도 없이.
@panel dark 0.6
@char woo blank+shadow 50 1.1 72
@txt 아직 끝나지 않은 것이 있다.
@ending E2 착각이었던 걸로 하자 :: 히로인 루트 · 이별
-> END

=== E3 ===
@txt 그녀가 혼자 있는 시간이 얼마나 되는지는,<br>세어보지 않았다.
@gap l
@panel class 1.1
(창가 맨 뒤, 옆자리. 흰 국화 한 송이.)
!!옆자리
@note 1화의 그 자리. 인물 없음. 빛만.
@chat {hn}
@msg {hn}: 미안. 착각하게 해서.
@txt 마지막 메시지였다.<br>착각이 아니었는데.
@dark 혼자 버티기 힘든 마음이 들면 109(자살예방상담전화, 24시간)에 이야기해 주세요.
@ending E3 옆자리 :: 히로인 루트 · 상실
-> END

=== E4 ===
@panel toilet 1.0
@char jun hurt 50 1.25
(5교시. 배가 뒤틀렸다.)
!!꾸르륵
@sfx 탕 red
@panel toilet 0.62
@char jun think 50 1.25 76
이준*: …과학실에서<br>뭐 터졌나?
@sfx 탕 red
@sfx 탕 red
@gap l
@panel hall 1.1 gloom vignette
!!. . .
@note 아무도 없는 복도. 교실 안은 절대 보여주지 않는다. 멀리서 사이렌.
@dark 우진이는 나를 살려준 거였다.<br><br>나만.
@ending E4 음료수 :: 방치 루트
-> END

=== E5 ===
@panel grey 1.0 gloom
@char jun hurt 50 1.25
(멋있어지려 할수록, 나는 더 우스워졌다.)
@txt 그 덕분에 우진이는<br>아무 일 없이 졸업했다.
@panel white 0.62
@char jun think 50 1.25 76
이준*: …이게 맞는 건가?
@ending E5 찐따 영웅 :: 반복 루트
-> END

=== L1 ===
@panel grey 1.0 gloom
@char jun gloom 50 1.25
(나는 아무것도 말하지 않았다.)
@txt 봄, 여름, 가을.<br>계절만 바뀌었다.
@panel class 1.0
@char seo blank 18 .75
@char doh calm 50 .8
@char cha sad 82 .75 flip
(서윤은 무표정, 도하는 다시 머리를 묶었고, 채린은 옥상에 오지 않았다.)
@stamp bad BAD END :: 아무와도 이어지지 않았다.
@gap l
@panel sepia 0.9 flowers
@char jun smile 10 .55
@char woo smile 29 .62
@char seo smile 50 .65
@char doh grin 71 .62
@char cha calm 90 .58 flip
(졸업식 날.)
@txt 그해, 우리 학교에서는<br>아무도 죽지 않았다.
@stamp true TRUE END :: 유일하게, 아무도 잃지 않은 결말.
@ending E6 자발적 왕따 :: ???
-> END

=== L2 ===
@panel class 1.0
@char jun smile 30 1
@char woo shock 72 1 flip
우진: …바보냐.<br>너 이제 다시 당해.
이준: 알아.
@txt 표적은 둘이 되었고,<br>하나일 때보다 조금 덜 아팠다.
@stamp bad BAD END :: 모든 히로인과의 관계가 끊어졌습니다.
@gap l
@panel class 1.0
@char seo blank+blush 50 1.5 60
!!툭
서윤^: …남았어.
@txt 쿠키 포장은,<br>여전히 나만 달랐다.
@stamp true TRUE END :: 잃은 것은 봄 하나. 지킨 것은 전부.
@ending E7 우진이 옆자리 :: ???
-> END
`;
