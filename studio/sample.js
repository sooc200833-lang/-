window.SAMPLE_INK = `// ─────────────────────────────────────────
//  샘플: 비 오는 날의 우산  (웹툰 명령 전부 사용)
// ─────────────────────────────────────────
@title 비 오는 날의 우산 :: 단편 선택지 웹툰 샘플
@cast 점장 tae #8a5a2b

VAR mood = 0
VAR lent = false

-> start

=== start ===
@txt 금요일 밤, 편의점.<br>하필 오늘 비가 온다.
@panel class 1.0 sparkle
@char jun calm 28 1
@char seo smile 72 1 flip
(야간 교대 5분 전)
서윤: 아… 비 오는데 우산을 두고 왔네요.
이준*: 저 손님, 매일 이 시간에 오는데.
@gap
@panel white 0.75
@char seo blank+blush 50 1.6
서윤%: 말걸었다말걸었다!! 표정관리표정관리!!
서윤: …우산, 있어요?
@note 갭모에: 겉은 무표정, 속마음은 분홍 손글씨 박스(%).
@panel hall 1.0
@char jun calm 50 1.2
이준*: 마지막 남은 우산이다. 어떡하지.
* [이준: 하나 남았어요. 쓰세요. @smile ::우산을 건넨다]
    ~ lent = true
    ~ mood += 2
    -> umbrella
* [이준: …3,000원입니다. @blank ::평소처럼 계산한다]
    -> counter
* [이준*: 나도 우산이 없는데… @sad ::말문이 막힌다]
    ~ mood += 1
    -> awkward

=== umbrella ===
@panel pink 1.0 flowers sparkle
@char seo shy 50 1.45
서윤: 고, 고마워요…! 내일 꼭 돌려드릴게요.
서윤%: 웃었다웃었다웃었다 심장이 터진다
@panel class 1.0
@char jun smile 30 1
@char doh2 grin 72 1 flip
도하: 오~ 이준~ 우산 양보? 요즘 꽤 한다?
이준: 시끄러.
-> late

=== counter ===
@panel class 0.9
@char seo blank 50 1.4
서윤: 네. …감사합니다.
서윤%: 3,000원 3,000원 3,000원 3,000원
@txt 그녀는 우산을 사 갔다. 그뿐이었다.
-> late

=== awkward ===
@panel hall 1.0 gloom
@char jun sad 50 1.3
(우산이 없는 건 나도 마찬가지였다.)
@panel white 0.85
@char seo smile 50 1.4
서윤: 그럼… 같이 쓸래요? 하나 남았잖아요.
~ mood += 1
-> late

=== late ===
@gap l
@chat 알바 단톡방
@msg 점장: 내일 우산 재고 확인 부탁
@msg 도하: 저 오늘 마지막 우산 팔렸다던데요ㅋㅋ
@msg 점장: 그래? 누가 사 갔어
@panel dusk 1.0 lines
@char jun think 50 1.3
@char 점장 calm 82 .7 flip
점장: 이준 군, 요즘 표정이 좋아 보이는데?
이준*: …기분 탓입니다.
@sfx 두근 red
@panel white 0.7
@char jun shock 50 1.5
이준!: 아, 아니라고요!!
점장: 아직 아무 말도 안 했는데.
@panel class 1.0
@char jun calm 50 1.2
(다음 날 아침, 서윤이 다시 찾아왔다.)
이준*: 이번엔 내가 먼저 말해야 한다.
* [이준: 같이 밥 먹을래요? @shy ::용기를 낸다]
    ~ mood += 2
    -> finale
* [이준: 우산은 천천히 돌려줘도 돼요. @smile ::여유 있는 척한다]
    ~ mood += 1
    -> finale
* [이준: …안녕히 가세요. @dead ::도망친다]
    -> finale

=== finale ===
{ mood >= 4:
    -> good
- else:
    { mood >= 2:
        -> soso
    - else:
        -> bad
    }
}

=== good ===
@panel pink 1.1 flowers sparkle
@char jun shy 30 1.05
@char seo smile 70 1.05 flip
서윤: 좋아요. 오늘은 제가 살게요.
서윤%: 오늘부터 무표정 졸업!!
@stamp happy HAPPY END ♥ :: 우산은 아직 돌려받지 못했다
@ending good 우산 아래서 :: 해피엔딩
-> END

=== soso ===
@panel hall 1.0
@char jun smile 30 1
@char seo smile 70 1 flip
서윤: 우산, 다음 주에 꼭 돌려드릴게요.
이준: 네. 다음 주에 봐요.
@stamp true TRUE END :: 한 걸음씩, 천천히
@ending soso 다음 주에 :: 노멀 엔딩
-> END

=== bad ===
@panel grey 1.0 gloom
@char jun gloom 50 1.3
(그날 이후, 그녀는 오지 않았다.)
@stamp bad BAD END :: 비는 그쳤지만
@ending bad 마지막 우산 :: 배드 엔딩
-> END
`;
