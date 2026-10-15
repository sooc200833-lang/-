# 만화 클리셰 · 연출 사전 — 작업 메모

새 대화에서 이 파일을 먼저 읽고 이어서 작업한다. **사이트 전체를 화면에 펼치지 않는다.** 필요한 부분만 검색해서 고친다.

## 기본
- 저장소 `sooc200833-lang/-` · 브랜치 `main` · 사이트는 루트의 **`index.html` 한 파일**(약 650KB)
- 주소 https://sooc200833-lang.github.io/-/ · 올리면 1~2분 뒤 반영
- 서버 없음. 전부 브라우저에서 돈다. 데이터는 `localStorage` + 구글 드라이브 동기화
- 클로드 아티팩트 미리보기에서는 외부 호출(OpenRouter, 구글)이 막힌다. **깃허브 주소에서만** AI·동기화가 된다
- 구글 OAuth 클라이언트 ID는 파일 안 `GD.cid`. 앱은 테스트 상태이며 테스트 사용자로 등록된 본인 구글 계정만 로그인된다

## 작업 방법
1. 저장소의 `index.html`을 받아 `/home/claude/work/manga.html`로 작업한다
2. **직접 덮어쓰지 말고** `manga.tmp`에 쓴 뒤 `<script>` 문법 검사(`node --check`)를 통과하면 `mv`로 교체한다 (파일이 통째로 비는 사고가 있었다)
3. jsdom(`npm install jsdom`)으로 기능별 시험. 가짜 `fetch`로 AI 호출을 흉내 낸다
4. 통과하면 GitHub Contents API(PUT, 기존 sha 필요)로 `index.html`을 올린다
5. 사용자는 코드를 읽지 않는다. 설명은 짧게, 결과 위주로
- 큰 파일이라 `<script>` 태그가 여러 개 잡히면 플랫폼이 주입한 스크립트다. 가장 긴 것이 본 코드다

## 페이지 (섹션 id)
oneshot, length, redflag, grammar, authors, pagemap, shuffle, ideacomp, arc, epidx, pino, pcre, pmemo, ai, index, motifidx, chars, favs, endidx, combo, refs, advice, final
- `m1`~`m10`은 본편 해설
- **피노 전용**(`pino`, `pcre`, `pmemo`)은 즐겨찾기 폴더 이름이 **피노설정집**일 때만 홈·목차에 나타난다 (`pinoInsert`, `PINOPAGES`)

## 데이터 규모 (코드 안 배열)
- ROWS(클리셰) 813(기본 611 + TVNEW 202: 트로프 대응 133 + 서사 구조 69) · MOTIFDATA(소재) 138 · CHARS(캐릭터) 221 · ENDINGS(엔딩) 334(기본 264 + ENDNEW 70)
- EPM(에피소드 소재, 갈래별) · CREA(피노 크리쳐 생물·사물) · ARCEX(아크 예시)
- ROWS 한 행: `[이름, 장르, 기능, 배치(|로 여러 값), 상태코드, 상태, 지면, 도구, 정의, 연출포인트, ...]`

## 주요 함수
aiBar, favAiBar, twistAsk, writePrompt, wfmtHTML, aiAsk, aiCall, aiResult, ideaBlock, ixSearch, fmAppend, gdSync, gdMerge, dataMigrate, trBlock, placeHint, pinoInsert, pinoContext, bkDump

## AI (OpenRouter) — 세 가지만 남겼다
1. **비틀기** `twistAsk` — 색인 행, 랜덤 구성기 칸, 즐겨찾기 클리셰 옆
2. **연관짓기** — 구성기(`ai-rel`, `AI로 잇기`), 즐겨찾기(`fav-ai-rel`)
3. **글쓰기** `writePrompt` — 줄거리 / 컷별 / 웹소설 라디오(`wfg`, `wff`)
- **작품 분석** 페이지(`probe`, `pbRun`): 줄거리에서 쓰인 클리셰·소재를 찾고, 새 장치는 사용자가 골라 `localStorage.userAdds`에 저장 → 시작할 때 ROWS/MOTIFDATA에 합쳐진다(ROWS 정의 바로 뒤 로더). 동기화·백업 대상
- **🔎 색인 채팅창**(`ix-box`) 복구됨. 사용자 요청
- 그 밖에 크리쳐 사연(`crstory`)만 피노 전용으로 유지. 아이디어 칸(`ideaBlock`)이 글쓰기에 반영된다
- 세계관·인물 자동 생성, 콘티 점검 등은 **사용자 요청으로 삭제**했다. 다시 넣지 않는다

## AI 모델
- **모델 이름을 코드에 박지 않는다.** `ormLoad`가 `https://openrouter.ai/api/v1/models`에서 지금 쓸 수 있는 목록을 받아(12시간 캐시 `orModels`) 「추천」을 계열별 최신으로 고른다(`ormPickRec`)
- 저장된 모델이 목록에 없으면 추천 첫 번째로 바꾼다. 호출 중 404·유효하지 않은 모델이면 `ormFallback`으로 한 번 자동 재시도
- 2026-06-01 gemini-2.0-flash-001 종료로 AI가 전부 실패했던 적이 있다

- 모든 호출에 `reasoning:{effort:'low',exclude:true}`를 보낸다. 빼면 모델의 속생각이 답에 섞이고, 속생각이 분량 한도를 먹어 답이 잘린다. `max_tokens`는 요청값+1500
- `aiClean`이 `<think>` 블록과 앞쪽 영어 속생각 줄을 걷어낸다
- 🔎 채팅창에서 작품 이야기(영화·만화 등 + 25자 이상)를 하면 `pbAnalyze`로 분석하고 새 장치는 **자동 추가**(`pbCommit`), 줄마다 「빼기」(`pbUndo`). 작품 분석 페이지는 체크 후 추가 방식 유지

- 웹 검색: `webPlot`이 `tools:[{type:'openrouter:web_search'}]`로 줄거리를 찾는다. 400이면 옛 방식 `plugins:[{id:'web'}]`로 한 번 재시도. 채팅창 🌐 체크(`webOn`, localStorage `webOn`)와 작품 분석의 「🌐 웹에서 줄거리 찾기」. 호출마다 검색비가 추가된다

- 제공처는 **OpenRouter 하나**. 구글 제미나이 직접 연결(`gmCall` 등)은 사용자 요청으로 삭제했다(무료 등급 한도 문제). 다시 넣지 않는다. 시작할 때 `gmKey/gmModel/gmModels`를 지우고 `aiProv`를 `or`로 돌린다
- 오류 문구는 `aiIsErr`로 판별한다(오류를 결과로 착각하지 않게)

- 🔎 채팅창은 자유 대화. 최근 12개 메시지를 `opts.history`로 보내고, 대화는 **여러 개**를 localStorage `ixChats`(`{cur, list:[{id,title,at,hist}]}`, 대화마다 최근 40개, 최대 20개, 동기화 안 함)에 남긴다. 옛 `ixChat`은 첫 대화로 옮기고 지운다. 위쪽 줄에서 고르기·＋ 새 대화·이름·삭제. 답이 오는 중에 다른 대화로 옮겨도 보낸 대화(`TT`/`H`)에 저장된다. 사전 검색 결과·피노 설정·지금 뽑힌 구성·아이디어를 말에 따라 붙인다(`ctxFor`). 작품 분석은 《제목》+분석 의도가 있을 때만(`isWork`)

- 503·500·502·504·「high demand」는 1.5초·3초 간격으로 두 번 재시도, 429는 `retryDelay`가 12초 이하면 기다렸다 한 번. 그래도 안 되면 `aiAlt`로 가벼운 모델을 골라 **이번 호출만** 대신 부른다(저장된 모델은 바꾸지 않음)

- **동기화 빈 기기 규칙은 `!base`(한 번도 동기화 안 한 기기)일 때만.** 예전엔 일부러 비운 것도 빈 기기로 보고 드라이브 것을 되살렸다
- 정리 버튼(비우기·삭제·✕·빼기)은 `gdIntent()`를 찍어 10분간 급감 경고를 건너뛴다
- 즐겨찾기 `fold-list`(폴더별 담는 곳/보기/비우기/메모 비우기/삭제, 두 번 눌러 실행). `renderFavs`가 시작 직후에도 불리므로 `FMEMO`가 아직 없을 수 있다 — `fmGet`은 `(FMEMO||{})`로 읽는다
- 채팅 「○○ 색인에 넣어줘」 → `addFromChat`이 최근 대화에서 골라 `userAdds`에 바로 추가(빼기 가능)
- 하루 한도(429의 QuotaFailure `PerDay`) 모델은 `qMark`로 다음 08:00 UTC까지 기억(`aiOut`)하고 건너뛴다. OpenRouter `free-models-per-day`도 같은 방식


## 폴더 삭제 (2026-10 수정)
- 지운 폴더는 `mangaFolders.gone[이름]=시각`(묘비), 만든 폴더는 `made[이름]=시각`. `foldDead`가 `gone>made`이면 죽은 폴더로 본다. `foldKill`/`foldMake`로만 지우고 만든다(`FOLDERS.push` 직접 쓰지 않는다)
- `gdMerge`는 묘비를 양쪽 최댓값으로 합치고, 죽은 폴더와 그 안 항목·메모를 뺀다. 「합치기」(기준 없음)로 다시 연결해도 되살아나지 않는다
- 되살아나던 세 경우: ① 옛 화면(다른 탭·기기)이 저장 ② 동기화 도중 삭제 ③ 다시 연결 후 합치기. ①은 `window.__stale`(이면 `keepSave` 안 함)과 `storage` 이벤트 새로고침, ②는 `gdSync`가 내려받은 뒤 `local`을 다시 읽고 올린 뒤 바뀌었으면 기준을 저장하지 않고 한 번 더(`GD.pending`)
- 폴더 정리 동작은 `foldAct(a,f)`. 즐겨찾기 「전체」 보기는 폴더별로 묶이고 머리줄에 「폴더 삭제」
- 피노설정집을 지우면 `pinoDrop`이 전용 페이지를 내린다. `PINOPAGES`는 `if(pinoOn()) pinoInsert()`보다 **앞에** 정의돼야 한다(뒤에 있어서 그 폴더가 있으면 사이트가 시작하다 멈추는 버그가 있었다)

## 채팅창의 사전 쓰기
- 시스템 글에 [사전 쓰기 권한]. AI가 답 끝에 `<<등록>>[JSON 배열]<<끝>>`, `<<삭제>>["이름"]<<끝>>`을 붙이면 `regParse`→`regApply`가 실행하고 블록은 화면·기록에서 뗀다. 삭제는 `userAdds` 항목만
- 답마다 「사전에 등록」 버튼(`regButton`) → `pickAndAdd`가 그 답에서 장치를 골라 넣는다. 「사전에 넣어줘」(`isAddReq`)도 같은 함수
- 행 만들기는 `mkNews`, 결과 표시는 `addedHTML`·`bindUndo`

## 저장 키
arcForm, deviceId, folderMemo, gdBase, gdLast, gdLinked, ideaText, mangaDataVer, mangaFav, mangaFolders, mangaPreMigrate, mangaPreRestore, orKey, orModel, pinoMemo, pinoTodo, writeFmt
- 동기화 대상: mangaFav, mangaFolders, folderMemo, pinoMemo, pinoTodo, arcForm, ideaText, userAdds (`GD_KEYS`)
- AI 키는 **백업 파일에서는 제외**. 드라이브 동기화에는 `gdKeys`(기본 켬)일 때 `GD_AIKEYS`(orKey, orModel, webOn)를 함께 올린다. 목록은 `gdKeyList()`로 얻는다. 병합 시 키는 섞지 않고 한쪽 값을 고른다

## 지켜야 할 것
- **항목 이름을 바꾸면 `ALIAS`에 「옛 키 → 새 키」를 남긴다.** 별표가 이름으로 저장돼 있다
- 저장 형식을 바꾸면 `DATA_VER`를 올리고 `dataMigrate`에서 변환한다
- 저장할 때 모르는 칸을 지우지 않는다 (`keepSave`)
- 초기화 코드를 `hashchange` 핸들러 안에 넣지 않는다 (페이지 이동마다 중복 실행되는 버그가 있었다)
- 피노 크리쳐에 목질·약점·서식지·대칭 같은 **지어낸 설정을 넣지 않는다.** 확정 설정은 설정집 페이지가 기준이다
- 사용자가 준 설정에 없는 내용을 채워 넣지 않는다. 미정은 미정으로 둔다

- 색인의 「✎ 내가 추가 (n)」 칩: 클리셰 색인 `mineonly`(행 11번 칸이 `추가|`로 시작), 소재 색인 `mmine`(`motifMine`). 개수는 `mineCount`가 갱신한다
- 채팅 AI의 폴더 담기: `<<담기>>{"folder":"이름","items":[{"type":"클리셰","name":"사전 이름"}]}<<끝>>` → `putApply`(없는 폴더는 `foldMake`, 이미 별표면 폴더만 옮김, 사전에 없는 이름은 missing). 「되돌리기」는 `putUndo`(새로 만든 빈 폴더는 지움). 폴더 이야기가 나오면 `ctxFor`가 [즐겨찾기 폴더] 목록을 붙인다
- 채팅 「참고」 선택(`ix-src`, localStorage `ixSrc`): 자동 / 내 말만(`only`) / 랜덤 구성기만(`draw`) / 폴더만(`f:이름`). 말로 「○○만」이라고 해도 `srcMode`가 잡는다. 모든 질문 앞에 `[참고 범위]` 한 줄을 붙여 싼 모델이 범위를 넘지 않게 한다. 자동에서 랜덤 구성기는 「구성기·뽑힌」을 말할 때만 붙는다(예전엔 「지금·이거」에도 붙어 문제였다). 등록·담기용 정보(`opsCtx`)는 범위와 상관없이 붙는다
- 잔액 없음(402) → 무료 모델 자동 전환(`orAutoFree`, 기본 켬, 동기화됨). `orNoCredit`에 6시간 기억하고 그동안은 처음부터 `aiFreeList` 첫 모델로 부른다(웹 검색은 뺌). 무료끼리 최대 4개까지 갈아탐. 402가 「can only afford N」이면 같은 모델로 `max_tokens`를 N-50으로 줄여 한 번 더(`_cap`). 「연결 확인」·직접 모델 고르기·「충전했다」 버튼이 기억을 지운다
- 상단 「🔄 AI」(`aiRefresh`): 저장소에서 키·모델 다시 읽기, `aiOut`·`orNoCredit` 지우기, 모델 목록 새로 받기, 짧은 연결 확인. 결과는 버튼 글자(✓/무료/안 됨/키 없음)와 툴팁
- 한글 검색(`hsHit`): 초성(ㅎㄱ→회귀, 자체 코드로도 됨) · 영타(ghlrnl→회귀) · 이름 오타(3글자 이상, 자모 단위 Fuse threshold 0.3) · 띄어쓰기·문장부호 무시. es-hangul 2.4.0(MIT)·Fuse.js 7.5.0(Apache-2.0)을 jsDelivr에서 `hsLoad`가 동적 import, 실패하면 초성·글자 검색만. 목록마다 `list.__hs`에 Fuse 색인을 캐시(길이가 바뀌면 다시 만듦). 클리셰 색인 `match`와 `makeIndex`(소재·엔딩·에피소드·캐릭터)에 적용. AI 채팅 사전 검색 `ixSearch`에는 아직 안 넣음
- **TV Tropes 연결 (2026-10)**: `TVT`(한국어 이름 → 트로프 제목, 404개)와 `TVNEW`(트로프 이름 목록과 비교해 빠진 장치를 **한국어로 새로 쓴** 133개, ROWS 뒤에 붙음). TV Tropes 본문은 옮기지 않는다(CC BY-NC-SA라 상업 이용 불가). `?`로 시작하는 대응은 느슨해서 구글 `site:tvtropes.org` 검색 링크, 나머지는 `Main/WikiWord` 직접 링크(`tvtInfo`). 색인 이름 옆 링크(`tvtLink`), 「새 항목」 칩(`newOnly`), 영어 제목으로도 검색(`match`·`ixBuild`, `ixTerms`는 소문자화). 원본 데이터는 작업 폴더 `tvt/`의 파이썬 파일에서 만들었다
- **장르 「서사 구조 (장르 공통)」** (15번째 장르): 이야기 짜임 클리셰 69개(TVNEW 뒤쪽). 랜덤 구성기에서는 「연출 문법」처럼 어느 장르로 잠가도 섞여 나온다(`NARRG`). 엔딩 70개는 `ENDNEW`로 ENDINGS 뒤에 붙는다(대표작 칸은 비움)
- **AI 검토 뽑기(기본)**: 구성기 「AI가 후보 4개 중 고름」(`sf-ai`, localStorage `sfAi`)이 켜져 있고 키가 있으면, 「전체 다시 뽑기」 때 열린 칸마다 `candsFor`로 무작위 후보 4개, 엔딩 후보 4개(`endCands`), 소재가 「AI 추천」(`cz-lv` 7, `czLv`)이면 소재 칸마다 후보 4개(`__czCands`)를 뽑아 **한 번의 호출**(`aiReview`)로 고르게 한다. 아이디어 칸·장르·고정된 칸을 함께 보낸다. 결과 칸에 「AI: 이유 · 후보였던 것」(`aiNote`, `eNote`). ↻은 그 칸만 같은 방식. 응답을 못 읽으면 첫 후보 그대로. 페이지를 열 때는 부르지 않는다(`gBooted`, `booted`). 「소재만 뽑기」는 `aiFill`(소재만 후보 검토)
- **아이디어로 추천받기(`ideaRec`, 버튼 `id-rec`)**: 한 번에 다 받으면 답 길이 한도에 걸려서, 소재 → 초반 → 중반 → 후반 → 엔딩 → 캐릭터 순으로 **하나씩 차례로** 부른다(갈래마다 그 자리에 맞는 목록만, 앞에서 고른 것을 함께 보냄). 첫 호출에서 핵심 한 줄·사전 밖 제안. 갈래마다 ↻·실패 시 「다시」. 「구성기에 채우기」는 `window.__sfApply`·`window.__czSet`, 「전부 ☆ 담기」는 지금 폴더에
- AI 검토 보강: 결과 위 상태 줄(`sf-aistat`, `aiStat`)에 무엇을 몇 개 검토했는지·흐름(flow)·어색한 곳(check)·실패 이유를 보인다. 프롬프트는 묶음마다 따로가 아니라 **이어 붙였을 때 하나의 이야기가 되는 조합**을 고르게 한다. 「궁합 점검」(`sf-fit`, `fitCheck`)은 칸을 바꾸지 않고 1~5점·흐름·약한 칸 최대 2개를 알려 주고, 약한 칸은 버튼으로 그 칸만 후보 4개 재검토. `candsFor`는 장르를 정했으면 후보 4개 중 2개 이상을 그 장르 고유 클리셰로 채운다. 「무작위 추천」 장르에서 서사 구조는 뺐다(선택칸에는 「서사 구조만」으로 남김). pick 번호가 0으로 와도 첫 후보로 받는다
- **버그 수정**: `#ix-box{display:flex}`가 `hidden`을 덮어써서 채팅창이 페이지를 열 때마다 떠 있었다 → `#ix-box[hidden]{display:none!important}`
- 실제 브라우저 시험: 작업 폴더 `pw2.js`(Playwright, `executablePath:/opt/pw-browsers/chromium`, OpenRouter를 route로 흉내)
- **소재 먼저 뽑기 (2026-10, 기본)**: 구성기 「뽑는 방식」(`sf-mode`, localStorage `sfMode`): `ai` 소재 먼저 → AI가 고름 / `fast` 소재 먼저 → 바로(AI 없음) / `rand` 무작위. 흐름 `seedFlow`: ① 소재 정하기(소재가 「AI 추천」이면 후보 4개 중 AI가 고르면서 장르·연관어 10개도 한 번에 받음, 아니면 지금 방식으로 뽑고 `askWords`로 연관어만) ② 장르: 고정 장르 > AI 답 > `MTAG`(소재 138개에 붙인 장르·연관어) > `relGenreGuess` ③ `buildCands`가 연관어로 칸별 후보 4개(그 장르 고유 2개 보장)와 엔딩 후보 4개를 `relRank`로 찾음 ④ `ai`면 `aiReview(…, pre)`로 고르고, `fast`면 `fastPick`이 점수 1등. ↻는 `lastSeed`로 그 칸만. 소재가 꺼져 있으면 아이디어 칸 글을 출발점으로
- 연관어 검색 도구: `relWordsLocal`(서술어 꼴·`REL_STOP` 제외), `relScore`(이름 3·본문 1.5·앞 두 글자 0.8/0.4), `relRank`, `motifSeedInfo`. 소재 글은 `czText`로 띄어 쓴 형태(`text`)를 넘긴다. 별표 키는 예전 `plain` 그대로
- **아이디어로 추천받기**도 같은 길: AI 1번(핵심·장르·연관어 12개·사전 밖 제안) → 연관어로 갈래별 후보 8개 → AI 1번(전부 한꺼번에 고름). 고르는 응답을 못 읽으면 점수 순. 갈래 ↻는 검색 결과 다음 후보(AI 안 부름)
- **아이디어 구성기 페이지(`ideacomp`, 2026-10)**: 아이디어 칸(`id-text`, `id-use`)과 「구성안 만들기」(`id-rec` → `ideaRec`)를 랜덤 구성기에서 떼어 냈다. 맨 위 「구성안」(갈래별 첫 추천을 이은 것, `renderPlan`), 항목마다 「구성안에」(`data-pick`)로 바꾸기, 「랜덤 구성기로 보내기」(칸에 넣고 고정 후 `#shuffle`로 이동), 「구성안 복사」. 초반·중반·후반은 같은 클리셰가 겹치지 않게(`usedC`)
- **랜덤 구성기는 아이디어를 쓰지 않는다**: AI 검토·소재 먼저·궁합 점검·AI로 잇기·소재 AI 추천에서 아이디어 글을 뺐다. 줄거리 쓰기(`aiDrawn` 기본값)만 아이디어를 읽는다(「다른 AI 글쓰기에도 반영」 체크 시). 소재가 꺼져 있으면 무작위
- 아이디어 구성기 **글쓰기**(`ideaWriteBar`, `idw-bar`): 줄거리/컷별/웹소설(`wfi`)·분량. 구성안이 있으면 `ideaRec.plan()` + 아이디어, 없으면 아이디어만. 랜덤 구성기의 글쓰기·연관짓기(`aiDrawn`)는 이제 아이디어 메모를 넣지 않는다. 주의: `ideaWriteBar`는 `WFMT`보다 먼저 부르면 시작이 멈춘다 → 스크립트 끝의 초기화 줄에서만 부른다
- **써진 글 고치기·바꾸기**(`wsStart`/`wsConv`/`wsRender`, `convPrompt`, `cutsRule`/`novelRule`): 글쓰기 결과는 편집 가능한 textarea(`.wstage`). 「바꾸기」로 줄거리→웹소설→컷별(아무 방향 가능), 고친 글을 원본으로 쓰고 처음 재료(`ref`)는 참고만. 앞 단계에서 다시 바꾸면 뒤 단계는 지워진다. 「차례로 쓰기」= 줄거리 쓰고 자동으로 웹소설→컷별. 랜덤 구성기·즐겨찾기·아이디어 구성기 세 곳. 마지막 결과는 localStorage `sfChain`/`favChain`/`idwChain`에 저장, 빈 칸일 때 복원(동기화 안 함)

## 콘티 구성기 (2026-10, 섹션 `conti`)
- 「구성기에서 가져오기」(`pull`): `window.__sfState()`(랜덤 구성기 IIFE 안, `placeHint` 바로 뒤)가 컷 배분 다섯 구간(`band`, 인스타 모드면 INSTA 행)과 칸별 클리셰 행·배정 컷 범위(a–b)를 준다. 분량을 바꾸면 `rescale`로 비율 조정. 아이디어로 추천받기는 `__sfApply`로 구성기에 들어오므로 같은 길로 온다
- 대강 이야기: `aiResult`가 제목이 줄거리·컷별 콘티·웹소설이면 localStorage `contiSrc`에 남기고, 콘티 페이지가 가져온다. 「AI로 줄거리 짜기」는 `writePrompt(...,'plot')`
- 뼈대(`skeleton`): 클리셰 칸은 도구(r[7])로 구도 순서를 만든다(`toolSeq`: 원경·생략→ELS, 반응 컷→OTS·BS, 클로즈업→CU·ECU, 무음·여백→LS 무음, 넘김·전환→마지막 컷 넘김 훅). 나머지 컷은 구간별 기본 패턴(`SECPAT`)
- AI 콘티 쓰기(`writeAll`): 구간을 14컷 안쪽 묶음(`chunks`)으로 나눠 **차례로** 부른다. 형식 「번호|구도|화면|대사」, 구도는 샷 코드(ELS LS FS MS BS CU ECU TWO OTS STAND FRAME BIRD)+앵글(부감·앙각·더치). `parseComp`가 한글 이름도 읽는다. 실패하면 그 묶음에서 멈추고 「이어서 쓰기」(`ct-resume`). 새 AI 기능이 아니라 글쓰기의 연장으로 본다
- 그림: Rough.js 4.6.6(MIT)을 jsDelivr에서 페이지를 열 때 불러온다(`needRough`). 그리기 코드는 컷 구도 스케치 시안에서 옮김(`figure`, `K`). 화면 글에 놀람·충격 → 놀란 얼굴, 실루엣·역광 → 검은 실루엣
- 컷 누르면 편집(구도·앵글·화면·대사, 뒤에 추가, 두 번 눌러 삭제). 저장 키 `contiBoard`(로컬만, 동기화 안 함), `contiSrc`
- **등장인물 (콘티 구성기 2번)**: `B.chars=[{name, role, look:{hair(짧은·긴·묶은·삐죽·민머리·''=미정), dark, glasses, hat, scar, build(작음·보통·큼·'')}, note}]`. 「이야기에서 인물 찾기」(`findChars`)는 이야기 칸에 **적힌 것만** 뽑게 한다(성격으로 외모를 짐작하지 않음, 없으면 미정). 아이디어 구성기 캐릭터 모티브(`window.__idPlan().ch`)는 참고로만 붙인다. 구성기에서 다시 가져와도 인물은 유지
- 콘티 줄 형식은 「번호|구도|인물|화면|대사」(인물은 왼쪽부터 쉼표). 4칸 옛 형식도 읽는다. 인물 칸이 비면 화면 글에서 등록된 이름을 찾는다(`whoOf`). 그림은 `figure`가 `D.cast`에서 차례로 인물을 받아 생김새(`figBody`의 `lk`, `hairDraw`, `hatDraw`)와 이름표(`nameTag`)를 붙인다. 어깨 너머 숏은 두 번째 인물이 등 쪽
- **작업 전에 꼭 `git fetch` 후 최신 main의 index.html로 시작한다.** 다른 대화에서 올린 변경을 옛 파일로 덮어쓴 적이 있다(2026-10-16, 바로 되살림)
