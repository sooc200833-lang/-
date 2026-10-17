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

## AI 제공처 — 2026-10-16부터 구글 제미나이 직접 연결
- 사용자 요청으로 **OpenRouter → 구글 제미나이 API**(`generativelanguage.googleapis.com/v1beta`)로 바꿨다. 아래 OpenRouter 관련 줄(잔액 402·무료 모델 자동 전환·openrouter:web_search·free-models-per-day)은 **옛 내용**이다
- 키·모델: localStorage `gmKey`(AIza…), `gmModel`, 모델 목록 캐시 `gmModels`(12시간). `PROV='gm'`. 키 헤더는 `x-goog-api-key`. 동기화 `GD_AIKEYS=['gmKey','gmModel','webOn']`
- `ormLoad`가 `models` 목록을 받아(generateContent 되는 gemini-* 텍스트 모델만) 계열별 최신 Flash·Flash-Lite·Pro를 「추천」으로(`ormPickRec`, `gmVer`). 키를 넣으면 0.7초 뒤 목록을 받는다
- `aiCall`: systemInstruction + contents(history는 user/model로 바꿔 같은 역할끼리 합침). 생각: 2.5 Flash 계열 `thinkingBudget:0`, 2.5 Pro 128, 3.x 이후는 보내지 않음(`gmThink`). 400에 thinking이 나오면 빼고 다시. 답의 `thought` 조각은 버린다. 웹 검색은 `tools:[{google_search:{}}]`, 출처는 `groundingMetadata.groundingChunks`
- 429: `limit: 0` → `qMarkZero`(무료 등급 불가), PerDay → `qMark`(다음 08:00 UTC까지 건너뜀), 분당 한도 → `retryDelay`만큼(5초·10초·15초 이상, 최대 65초) 세 번까지 기다렸다 다시. 그래도 안 되면 `aiAlt`(한도면 Flash-Lite 우선)로 이번만 대신. 원문은 `aiLastRaw`
- 「AI로 줄거리 짜기」(`ct-plot`)는 **사용자 요청으로 삭제**(이야기 칸을 덮어썼다). 다시 넣지 않는다
- **대강 이야기 칸(`ct-story`)은 말없이 덮어쓰지 않는다.** 비어 있을 때만 글쓰기 결과를 채우고, 아니면 `storyOffer`가 「새 글쓰기 결과로 바꾸기」(두 번 눌러야 함)와 「바꾸기 전 글로 되돌리기」(`contiStoryPrev`)를 보인다

## AI (옛 OpenRouter 시절 기록) — 세 가지만 남겼다
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

- (옛 내용, 2026-10-16에 뒤집힘) 제공처는 OpenRouter 하나였다. 제미나이 직접 연결은 무료 등급 한도 문제로 한때 뺐었다. 시작할 때 `gmKey/gmModel/gmModels`를 지우고 `aiProv`를 `or`로 돌린다
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
- **기능 나눠 붙이기 자리 (2026-10)**: 기록 묶음 `recLoad/recSave/recPut/recDel/recList`(`{items:{id:{…,at}},gone:{id:시각}}`, `REC_KEYS`=mangaCast·mangaTexts, `recMerge`로 항목별 최신·묘비 병합). `deskLayout`·`favPick`은 단순 세 갈래. 글쓰기 훅 `WS_CTX`(프롬프트에 붙일 글)·`WS_TOOLS`(결과 머리 버튼)·`WS_DONE`(글 완성 시). `PAGE_ON[id]`(페이지 열 때). 모듈은 초기화 줄 앞 `// [[MOD:이름]]`, CSS는 `/* [[CSS:이름]] */` 안에
- **등장인물(`cast`, 2026-10)**: 기록 `mangaCast`(동기화). 인물 `{name,alias[],folder,role,desc,look,persona,lack,memo(특징),speech,rel,motifs,src:chars|auto|manual}`, 작품 폴더도 같은 키에 `{id:'cf_'+이름, kind:'folder'}`로 둔다(읽을 때 `kind` 있는 항목은 뺀다). 폴더 삭제는 안의 인물까지 지우며 인물이 있으면 두 번 눌러야 한다. 보기·넣을 폴더·자동은 동기화 안 하는 `castView`/`castDef`/`castAuto`
- 캐릭터 모티브 색인 「캐릭터 뽑기」 아래 `ch-cast` 칸: 뽑힌 모티브가 외모·성격·결핍에 들어가고(직접 고친 칸은 다시 뽑아도 유지, `__charRendered` 훅), 색인 행의 ＋(`chadd`)로 더한다. 「등장인물에 넣기」
- 글쓰기 재료·원본에 이름이나 별명(2글자 이상)이 나오면 `castCtx`가 `WS_CTX`로 [등장인물] 설정을 붙인다(1500자 이내, 아이디어 구성기 추천에도 `__castIdea`)
- 글쓰기 결과 「인물 뽑아 넣기」(`castExtract`: 글에 적힌 사실만, 고유 이름만, 이미 있는 인물 제외): 체크해서 넣기·되돌리기. 「글이 완성되면 새 인물을 자동으로 넣기」는 첫 글(바꾸기 제외)마다 한 번 불러 바로 넣고 이름마다 「빼기」. 결과 칸은 결과 상자 바로 뒤 `.cast-ws`
- **글 보관함(`texts`, 2026-10)**: 구성기에서 쓴 글을 `mangaTexts`(`{id,fmt,title,text,from,cut,ref,parent,created,at}`, 동기화)에 모은다. 결과 머리 「보관함에 저장」(`TXTOOL`)과 「쓴 글 자동 저장」(`textsAuto`, 기본 켬, `WS_DONE`). 저장한 칸은 `stage.tid`, 자동 저장이 켜져 있으면 결과 칸을 고친 것도 0.8초 뒤 따라 저장. 버튼 글자는 `txDeco`(MutationObserver). 페이지: 전체·줄거리·웹소설·컷별 콘티 탭(`textsTab`), 검색, 바로 고치기, 복사·메모·삭제(두 번), 「○○로」 바꾸기(`txConv`, 새 기록에 `parent`), 「원본 보기」·「바꾼 글」 링크(`txGo`)
- 시험에서 `WS_TOOLS` 버튼은 순서가 모듈 순서(등장인물 → 글 보관함)라 글자로 찾는다

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
- **추가 구도 (2026-10)**: INSERT(인서트 — 화면 글에 폰·문자면 휴대폰, 아니면 쪽지 + 손 `hand`), POV(시점 — 가운데 인물 + 앞쪽 두 손), BACK(뒷모습), EMPTY(빈 배경 — 화면 글로 교실·창 / 하늘·노을 / 거리 중 고름), CROWD(군중 — 뒤 두 줄은 이름 없는 사람, 앞줄 가운데·왼쪽이 등장인물). 효과: `+집중선`(`focusLines`, 컷 `focus`), `+회상`(옅은 톤 + 검은 테두리, 컷 `flash`). 편집기 체크박스로도 켠다
- 뼈대 규칙 추가: 무음·여백 → EMPTY 무음, 클리셰 이름에 관전·군중·환호 등 → 두 번째 컷 CROWD, 기능이 감정 폭발·정점 → 마지막 CU/ECU에 집중선, 이름에 회상·과거·기억 → 첫 컷 뒤로 회상 테두리. 구간 기본 패턴에 INSERT·POV·EMPTY·BACK 섞음
- **즐겨찾기 우선 뽑기 (favpick, 2026-10)**: 랜덤 구성기·아이디어 구성기 위 「즐겨찾기에서 먼저 뽑기」(localStorage `favPick` `{on, folder}`, 동기화됨, 기본 켬·전체 폴더. folder `*` 전체 · `.` 지금 폴더 · 폴더 이름). 켜면 `draw`·`candsFor`·`buildCands`·`drawEnd`·`endCands`·`czCands`가 그 칸에 맞는 즐겨찾기(배치·상태·분량·고정 장르는 원래 `pool`로 거름, 「무작위 추천」 장르는 거르지 않음 `pool(…,true)`)를 먼저 쓰고, 모자라면 원래 방식으로 채운다. 후보 4개도 즐겨찾기가 먼저(연관어 점수 순). 엔딩은 단일·난해한·연재 방식만, 소재는 `m|`와 `cz|` 둘 다. 표시는 「★ 즐겨찾기」(`fpTag`)
- 칸마다 ★ 선택(`fpSel`) → 그 칸에 넣고 📌 고정(`__sfFav.put`/`endPut`, `__czFav.put`). 아이디어 구성기는 `shortlist` 앞에 맞는 즐겨찾기 최대 6개(`fpShort`, AI에 ★로 알림), 갈래 제목 옆 ★ 선택은 `ideaRec.put`으로 구성안에. 페이지를 열 때 즐겨찾기가 바뀌었을 때만 다시 그린다(`fpSig`). 랜덤 구성기에는 캐릭터 칸이 없어 캐릭터 즐겨찾기는 아이디어 구성기에서만 쓰인다
- 즐겨찾기 페이지의 글쓰기(형식·분량·차례로 쓰기·`favChain` 복원)는 사용자 요청으로 삭제. 연관짓기만 남았다. 다시 넣지 않는다
- **홈 바탕화면 (2026-10)**: 홈 맨 위 `#desk-root`에 즐겨찾기·등장인물·글 보관함·콘티 구성기(`#conti`가 있을 때만)·폴더·휴지통 아이콘. 자리는 localStorage `deskLayout` `{v,at,pos:{"f:이름"|"s:favs"…:[열,줄]}}`(동기화, 마지막 쓴 쪽). 좁은 화면에서 열이 모자라면 빈 칸으로 흘려 보이고 저장된 자리는 그대로 둔다. 폴더를 열면(더블클릭·터치 한 번·Enter) 항목 창이 뜨고, 항목을 다른 폴더나 휴지통으로 끌어 놓는다(Pointer Events, 터치는 300ms 길게 눌러야 시작, 위쪽 고정 줄 `.topbar`를 빼고 끝에서 저절로 스크롤). 폴더를 휴지통에 놓으면 확인 후 `foldAct('del')`. 모든 지우기·옮기기에 「되돌리기」 알림(`dkToast`), 휴지통 목록은 저장하지 않는다
- 폴더 이름 바꾸기는 `dkRename`: FAVDIR·메모를 먼저 옮기고 `foldMake(새 이름)` → `foldKill(옛 이름)` 순서. 지금 폴더·`fav-view`·`ixSrc`·바탕화면 자리도 따라간다. 바탕화면은 `renderFavs`·`foldSave`·`updateFavCount`를 감싸서 홈이 보일 때만 다시 그린다(`dkSoon`, 숨어 있으면 `DK.dirty` 후 `PAGE_ON.home`). 시험 `desktest.js`·`pw_desk.js`는 콘티 구성기 섹션을 감춘 사본으로 돈다(아이콘 개수 고정)
- **등장인물 그림·빈 칸 채우기·콘티 연결 (2026-10)**: 인물에 그림용 생김새 `fig`{hair,build,dark,glasses,hat,scar}. 고르기 전에는 외모·특징·설명 글에서 `castFigGuess`로 짐작(저장 안 함), 고르면 저장(`.cast-figbox[data-touched]`). 그림은 콘티 구성기의 `drawCv`를 `window.__ctPortrait(canvas)`로 빌려 그린다(Rough.js, `castPics`가 콘티 모듈이 준비될 때까지 기다림). 카드 머리에 작은 그림, 펼치면 큰 그림과 고르기
- 「빈 칸 채우기」(`castFill`, 카드·모티브 색인 만들기 칸): 적힌 칸은 두고 빈 칸만(이름·역할·설명·외모·성격·결핍·특징·말투·관계·fig) AI가 채운다. 같은 폴더 다른 인물 이름과 겹치지 않게. 사용자 요청으로 넣은 것이다(예전 「인물 자동 생성」 삭제와는 별개)
- 콘티 구성기 ↔ 등장인물: 「등장인물에서 가져오기」(`fromCast`, 이야기에 이름·별명이 나오는 인물, 없으면 보고 있는 폴더 8명까지), 카드 「등장인물에 넣기/반영」(`__castUpsert`), 콘티에서 생김새를 고치면 등장인물에도 반영. 콘티에 없는 이름은 `charOf`가 `__castFind`로 등장인물에서 찾는다. 창구: `__castFind`·`__castList`·`__castView`·`__castUpsert`. 시험 `castfigtest.js`, `pw_castfig.js`(rough.js는 node_modules에서 route)
- **바탕화면 2차 (2026-10)**: 누르면(마우스 한 번 클릭·터치 한 번) 연다 — 폴더는 항목, 즐겨찾기는 폴더 목록, 등장인물은 인물 목록(누르면 그 카드 펼침), 글 보관함은 최근 글 10개(누르면 `txGo`), 정보 페이지 묶음 `g:갈래`(PAGES 갈래별, 바로 가기 있는 favs·cast·texts·conti는 뺌)는 페이지 칸 목록. 콘티·꺼낸 페이지 `p:id`는 바로 이동. 다시 누르면 닫힘(열고 0.45초 뒤부터)
- 길게 누르기(터치 450ms·마우스 550ms 움직이지 않고 떼기, 마우스 오른쪽 클릭, ContextMenu 키) → 정보 창 `DK.info`(`dkInfoHTML`): 폴더 이름·메모(바로 저장)·지금 폴더로·삭제, 묶음·바로 가기·꺼낸 페이지 「표시 이름」(`deskLayout.names`), 즐겨찾기 담는 곳·즐겨찾기 먼저 뽑기, 등장인물 자동 넣기·넣을 폴더, 글 자동 저장, 페이지 「바탕화면에 꺼내기/빼기」(`deskLayout.pins`), 항목 폴더 옮기기·별표 빼기. 길게 누른 뒤 움직이면 끌기(터치는 이때부터 스크롤 막음). 길게 누르면 크롬이 pointercancel을 보내므로 그것도 정보로 받는다. 길게 누른 뒤 0.6초 클릭은 무시(`DK.lpAt`, 새 창 버튼이 눌리던 문제)
- 홈을 줄였다: 머리글의 설명·분류표는 「이 사전에 대해」(`details.hero-more`)로 접고, 아래 페이지 카드는 「페이지 전체 목록」(`details.home-all`)으로 접었다. 900px 이하 홈에서는 목차(rail)를 숨긴다. 폰(520px 이하) 윗줄은 두 줄로(라벨 숨김). 아이콘 칸은 폰 70×82·넓은 화면 92×92. `dkInset`은 아직 붙지 않은 sticky 윗줄 높이도 잰다
- 시험: `deskinfotest.js`(jsdom), `pw_desk2.js`(마우스·터치 실제, 콘티 섹션 감춘 사본으로 돌림). 옛 `pw_desk.js`는 더블클릭·300ms 자동 끌기 기준이라 낡았다
- **콘티 ↔ 등장인물 자동 맞추기 (2026-10)**: 콘티 `syncCast()` — 등장인물 페이지 인물 중 대강 이야기·컷 글·컷 인물에 이름(별명, 2글자 이상)이 나오는 사람을 `B.chars`에 넣고, 이미 있는 인물은 생김새를 등장인물 페이지 것으로 덮는다(기준은 등장인물 페이지). 콘티를 열 때마다(`__contiShow`, 예전엔 처음 한 번만 그려서 고친 생김새가 안 보였다), 「구성기에서 가져오기」, 「AI로 콘티 쓰기」 전에 부른다. AI 콘티 프롬프트의 [등장인물]은 `B.chars`라서, 예전엔 가져오기를 안 누르면 이름이 안 붙었다. 시험 `contisynctest.js`
- **인물 그림 부품 늘리기 (2026-10)**: 부품 정의는 등장인물 모듈의 `FIG_SEL`(고르기: hair 8·eyes 5·build 5·pose 7·outfit 5)과 `FIG_CHK`(켜기 30개: 머리·얼굴 / 옷·소품 / 몸의 흔적). `figBlank`·`figClean`(값 검사)·`figCtlHTML`(고르는 칸, 등장인물 카드·모티브 만들기·콘티 인물 고치기 공용)·`figTags`. 글→부품 `castFigGuess`(`FIG_RULES`·`FIG_BRULES`, 캐릭터 모티브 색인 외모 모티브 이름을 그대로 잡는다. 자리 말 없는 「흉터」는 얼굴). 그리기는 콘티의 `figBody`·`hairDraw`를 새로 썼다(옛 키 hair·build·dark·glasses·hat·scar 그대로 읽음). 작은 키는 실제로 작게, 뒷짐은 팔을 몸통 뒤에. rough.js `circle`의 셋째 값은 **지름**이다(눈동자가 두 배로 커졌던 적 있음)
- 빈 칸 채우기 AI에는 부품 목록을 넘기고 받은 fig는 `figClean` 후 외모 글 짐작과 합친다. 콘티 「이야기에서 인물 찾기」는 `looktext`(외모 묘사 한 줄)도 받아 짐작한다. 그림 갤러리 확인 `pw_figs.js`
- **판타지 그림 부품 (2026-10)**: `FIG_SEL`에 race(엘프·수인·마족·용인·드워프·천사·요정·언데드)·ears·horns·wings·tail·armor·weapon·beard, outfit에 로브·사제복·귀족 옷, `FIG_CHK` 「판타지」(cape·helmet·crown·circlet·halo·crest·glow·scales·fangs·gem). 종족이 정하는 부품(`FIG_RACE`)은 그릴 때만 `figLook`으로 채우고 저장하지 않는다. 고르는 칸은 `details.fig-more.fig-fan` 「판타지」(`figCtlSync`). 그리기 도우미 `wingDraw`·`capeDraw`·`tailDraw`·`armorDraw`·`pauldron`·`weaponDraw`·`headTop`·`helmetDraw`·`beardDraw`. 투구는 hat이 아니라 helmet, 망토·로브는 긴 옷자락이 아니다. 천사 같은·뿔테·창문 등은 판타지로 잡지 않는다
- **판타지 캐릭터 모티브 (2026-10)**: CHARS 221 → 291. 판타지 전용 70개는 `CHARS_FAN`(이름 목록 `CHAR_FAN`), 갈래 외모 · 종족 19, 외모 · 장비·무기 23, 결핍 · 혈통·계약 10 등. 캐릭터 뽑기 「판타지 모티브 포함」(`chFan`, 기본 끔). 색인 「판타지」 태그·「판타지만」 칩(`cfan`). `CHAR_FIG`(모티브 이름 → 그림 부품, 92개)를 `castFigGuess`가 먼저 쓰고(`figMotif`, 긴 이름부터), **잡은 이름은 글에서 지운 뒤** 낱말 규칙을 돌린다(땋은 수염 → 묶은 머리, 등에 멘 대검 → 등짐 같은 이중 판정 방지). 시험 `fanfigtest.js`·`charsfantest.js`, 그림 `pw_figs_fan.js`
- **판타지 (2026-10)**: 그림 부품 race·ears·horns·wings·tail·armor·weapon·beard·outfit(로브·사제복·귀족 옷)·「판타지」 켜기 묶음(cape·helmet·crown·circlet·halo·crest·glow·scales·fangs·gem). 종족이 정하는 부품은 그릴 때만(`figLook`, `FIG_RACE`). 캐릭터 모티브 70개(`CHARS_FAN`, `CHAR_FAN`, 외모·종족/장비·무기, 결핍·혈통·계약), `CHAR_FIG`(모티브 이름 → 부품, `castFigGuess`가 먼저 씀). 뽑기 「판타지 모티브 포함」(`chFan`, 기본 끔), 색인 「판타지만」
- **캐릭터 모티브 확장 자리**: `CHAR_BADGE`(이름 뒤 뱃지)·`CHAR_DETAIL`(「▸」 펼침 줄)·`CHAR_OUT`(뽑기 결과 아래)·`CHAR_PICK`(뽑기 바꾸기, 하나뿐이라 덮어쓸 때 앞의 것을 넘겨 부른다). `// [[DATA:…]]`·`// [[MOD:…]]` pair·mcut·stat·poseref·bestcut
- **궁합**: `CHAR_PAIR` 결핍 71개 → 성격·외모·why, 역색인 `PAIR_REV`. 「궁합대로 뽑기」(`chPair`, 기본 켬, 열에 일곱 궁합에서), 뽑기 아래 「연결」 상자, ▸ 궁합·역링크. 시험 `pairtest.js`
- **첫 등장 컷(4+5 합침, 그림으로)**: `CHAR_CUT` 291개 `{k,ang,pose,face,focus,flash,who,line,slot}`. ▸에 콘티 그림(외모는 CHAR_FIG 부품) + 「BS · 팔짱」 + 한 줄, 뽑기 아래 결핍·성격·외모 세 컷(`mcCharLook`). 시험 `mcuttest.js`
- **흔함 정도**: `CHAR_STAT` 291개 `[live|sat|dead, "왜 → 살리는 법"]`(232·55·4), `CHAR_COMBO` 뻔한 조합 30. 이름 뒤 상태 점, ▸ 이유·살리기·조합, 「포화 빼기」 칩(MutationObserver로 행 숨김), 뽑기 경고. 시험 `stattest.js`
- **대표 사례 보강**: 빈 칸 54줄 채움(나무위키·위키로 확인한 것만), 미카사→바쿠고(치켜올라간 눈), 로이→에드워드(장갑). 42 → 96 / 291
- **만화 자세·구도 페이지(`poses`)**: `POSE_REF` 46개(자세 29·구도 17) `{id,name,kind,pose,face,k,ang,focus,flash,desc,use,tip,ex,pose2,face2,sil}`, 콘티 그림 카드, 필터·검색·출처. `window.__poseRef`. 시험 `posereftest.js`
- **베스트컷(`cutlib`)·자세 31개**: 새 자세 24개(걷기·달리기·점프·앉기·무릎 꿇기·쓰러짐·주먹·발차기·검 겨누기/휘두르기·가리키기·손 내밀기·뒤돌아보기·머리 감싸기·마법 시전·활 쏘기·착지 등)는 콘티 `POSE_J` 관절표, `figBody`는 save/restore 감싸개(`figBody0`). 인물마다 `look.face`(left·right·back·front). 기록 `mangaCuts`(동기화) `{id,title,folder,k,ang,focus,flash,chars:[{name,pose,face,x}],scr,line}`, 폴더 `bf_`, `cutView`. 등장인물 카드 「베스트컷 만들기」, 콘티 컷 고치기 인물별 자세·방향(`c.wp`)·「베스트컷에서 넣기」·「이 컷을 베스트컷으로 저장」. 그림 오류는 `window.__ctErr`. 시험 `bctest.js`. 회귀 묶음 `node /tmp/…/bestcut/reg.js <html>` → 작업 폴더에 `reg.js`로 복사
- **콘티 구성기는 대강 이야기만 쓴다 (2026-10-16 사용자 요청).** 「구성기에서 가져오기」(`ct-pull`)와 클리셰 목록·[구성]·클리셰 연출 규칙을 프롬프트에서 뺐다. 판은 `fresh()`가 분량(`ct-total`)과 `BAND_SPEC`(도입10·전개34·전환14·절정32·마지막 훅10)으로 깐다(`bandFor`). 이야기가 비면 쓰지 않는다. 옛 보드의 `B.cl`은 페이지를 열 때 지운다. `pull`·`toolSeq`의 클리셰 경로는 남아 있지만 쓰지 않는다
- 옛 판(구성기에서 가져온 것, `B.v`가 2가 아님)은 페이지를 열 때 클리셰를 지우고 `bandFor`로 다섯 구간을 다시 나눈다. 새 판은 `v:2`
- **컷 옮기기·구간 다시 쓰기 (2026-10-16)**: 컷을 끌어 순서를 바꾼다 — 마우스는 HTML5 끌어 놓기(`dragstart`는 `pointerdown`에서 잡은 카드 `DRAG.down`을 쓴다), 터치·펜은 350ms 길게 누른 뒤에만 끌기(그 전에 움직이면 보통 스크롤, 끄는 중엔 `touchmove` preventDefault, 끝에서 저절로 스크롤), 키보드는 카드에서 Alt+화살표, 편집기 「◀ 앞으로」「뒤로 ▶」. 놓는 자리는 카드 왼쪽/오른쪽 반(`dropSide`, 한 줄 한 장이면 위/아래). `moveCut(from,to)`는 컷 내용만 옮기고 `renumber` — 구간(band)·장면(scenes)·cl은 번호 자리라 그대로 둔다. 끌기 직후 400ms 클릭은 편집기를 열지 않는다(`DRAG.noClick`)
- 편집기 「이 구간 다시 쓰기」+「요청(선택)」(`redoScene`): 이 컷이 든 장면(`B.scenes`) → 없으면 구간, 16컷 넘으면 이 컷 중심 16컷(`redoRange`). `cutPrompt`에 `[작가 요청 — 이 구간에만 적용]`을 붙여 한 번 부르고 `applyLines`. 오류면 아무것도 안 바꾼다. 마지막 옮기기/다시 쓰기 하나만 상태 줄 아래 칩(`#ct-undo`, `setUndo`)으로 되돌린다(컷이 늘거나 줄었으면 거절). `{temperature:0.65}`를 넘기지만 지금 `aiCall`은 0.9 고정이라 무시된다. 시험 `tD_move.py`(마우스·CDP 터치·Alt·다시 쓰기, 그림 `s_drag.png`)
- **참고 글 (2026-10-16)**: 콘티 구성기 「글 보관함에서 함께 볼 글」에서 줄거리·웹소설·컷별 콘티를 하나씩 고른다(`renderRefs`, 기기별 localStorage `contiRefs` {plot,novel,cuts: mangaTexts id}). 하나를 고르면 `refChain`(parent로 이어진 글)으로 빈 갈래를 채운다. 대강 이야기는 비워도 된다
- 「AI로 콘티 쓰기」는 참고 글이 있으면 먼저 **검토 호출**(`reviewPrompt`, `RSYS`)로 장면 배정표 「a-b|요약|꼭 보여 줄 것」 + 「검토|어긋남」을 받아 `B.scenes`·`B.scenesNote`에 저장하고(`parseScenes`, 재료가 같으면 `srcKey`로 다시 부르지 않음), 묶음마다 겹치는 장면만 붙여 쓴다(`scenesFor`). 우선순위: 대강 이야기 → 컷별 콘티 → 웹소설 → 줄거리. 검토 실패 시 「이어서 쓰기」는 처음부터(`dataset.n=0`)
- **베스트컷 → 등장인물 탭 (2026-10)**: `#cast` 위 탭 「인물」·「베스트컷」(`castTab` p|bc, `castTabApply`→`__bcMount`). PAGES의 `cutlib`은 지웠고 옛 `#cutlib`은 `show`를 감싸 `#cast`+베스트컷 탭으로. 작품 고르기 `bc-cfold`는 `castView`와 함께, 그 작품 인물 얼굴 줄 `#bc-pcs`
- **랜덤 자세·구도**: 자세표 `BC_PI`(갈래 a액션·v대치·e감정·d일상, act·tr·im·def·an), `window.__ctPoseInfo`가 먼저. `BC_RULE` 갈래별 구도·앵글·집중선·방향(vs·team). `bcRandom` — 조용한 자세뿐이면 어느 갈래든 더치·집중선·역동 없음(순서 주의: allQ 검사가 액션보다 먼저), 액션은 dyn 1~2. 「유명 자세·구도에서 랜덤」 `bcRollRef`, 고정 `BC.lock`·줄마다 `c.lk`, 「↻ 다시」 `BC.last`. 쓰러짐은 그림표 `POSE_ACT`에도 넣었다(액션 갈래 후보라서)
- **역동성 dyn·역동 자세**: 컷 `c.dyn` 0·1·2 → `cutData`가 `data-dyn`(0보다 클 때만) → `drawCv` `D.dyn`, `look.dyn`이 먼저(`dynOf`). dyn 0은 예전과 픽셀까지 같다. 새 자세 12개 `POSE_NEW`(날아차기·돌진·내려찍기·점프 베기·몸 비틀어 피하기·미끄러지며 착지·손 뻗어 붙잡기·외치기·막아서기·도약 준비·회전 베기·날아가며 맞음), 자세 43개. 효과 `dynFx`(속도선·타격·먼지·금·칼 궤적·머리카락·망토 날림 `hairFlow`·`capeFlow`), 원근 과장 near. 콘티 컷 고치기 「역동성」(`.ct-dyn`), 베스트컷 역동성 칸. 시험 `dyntest.js`·`bc2test.js`
- **시험 (2026-10 저녁 고침)**: AI가 제미나이 직접 연결로 바뀐 뒤 실패하던 옛 시험을 고쳤다. 작업 폴더 `lib.js`가 제미나이 요청(`…/v1beta/models/X:generateContent`)을 옛 OpenRouter 모양(`chat/completions`, messages)으로 바꿔 시험의 가짜 fetch에 넘기고 답을 `candidates`로 되돌린다(`orKey`는 `gmKey`로 옮김, 모델 목록도 흉내). 제미나이 그대로 시험할 때는 `mk(...,{rawGemini:true})`. 새 `gemtest.js`(새로고침 버튼·잘못된 키·limit 0/하루 한도 → 다른 모델·없는 모델 → 추천 모델·생각 설정 400 → 빼고 다시·웹 검색 출처·대화 기록 역할·길이 한도). OpenRouter 전용이던 `freetest`·`reftest`는 `old/`로. `rtest`는 제미나이 키 기준, `contisynctest`는 「뼈대만 깔기」. 회귀 묶음 `node reg.js <html>` 30개 + contismoke 모두 통과
- **장면 단위 쓰기 (2026-10-16)**: `B.scenes`가 있으면 `chunks()`가 장면 하나를 한 묶음으로 쓴다(3컷 안 되면 이웃과 합침, 16컷 넘으면 나눔, 겹침은 뒤 장면을 자르고 빈틈은 구간 묶음으로 채워 1~끝 빈틈없이). 이름은 「구간 · 장면 요약」, 진행 표시에도 나온다. 묶음은 검토가 끝난 뒤 짠다(`writeAll` 안 `plan`)
- 앞 맥락: `writeAll`이 `ch.prev={a,b}`를 넘기고 `cutPrompt`의 [바로 앞 컷]은 앞 묶음 전체(20줄까지)를 붙인다. 참고 글이 없어도 대강 이야기가 300자를 넘으면 검토를 돌린다(짧으면 재료가 바뀐 옛 배정표는 버림)
- 모델·온도: `aiCall`이 `opts.temperature`를 받는다(기본 0.9). 검토는 `{temperature:0.5, model:strongModel()}`(추천 중 막히지 않은 Pro, 없으면 고른 모델), 컷 쓰기는 0.65. Pro가 무료 등급 `limit: 0`이면 `qMarkZero` 후 `aiAlt`로 Flash가 대신한다. 시험 `t_scene.py`(refs·story·short)
- **콘티 연출 규칙 (2026-10-16)**: `cutPrompt` 끝의 규칙은 `contiRules(ch, 장면배정표 있음)`이 만든다. 「규칙」(형식·인물 칸·구도·효과·범위, 예전 그대로) + 「연출」(「만화 연출 문법」·「페이지 배분」을 컷 단위로 줄인 11줄: 같은 샷 세 번 연속 금지, 장면 첫 컷은 넓게, CU 앞 조용한 컷, 반응 컷, 무음 컷, INSERT, 좌우 자리 유지, 대사 15~20자 한 문장, 마지막 컷은 질문으로) + 형식 예시 `CEX`(비 오는 버스 정류장 9컷, 인물 A·B — 내용은 쓰지 말라고 적음). 규칙+예시 약 1,500자. `CSYS`에 세로 스크롤 한 화면 1~2컷을 넣었다
- **다 쓴 뒤 다듬기(`polishAll`, `PSYS`, 2026-10-16)**: `writeAll`이 마지막 묶음까지 쓰면 전체 컷(+장면 배정표·등장인물)을 한 번 더 보내 180도 선·반복 대사/화면·같은 샷 연속·배정표 어긋남·이어지지 않는 행동·20자 넘는 대사를 **고칠 줄만** 받아 조용히 바꾼다(「없음」이면 그대로, 최대 컷 수의 25%, 80컷 넘으면 5컷 겹쳐 두 번). 점수·평가·보고는 없다 — 삭제한 「콘티 점검」을 되살린 것이 아니다. 실패하면 「다듬기는 건너뛰었다」만 붙이고 끝낸다
- 바꾼 컷은 `B.prePolish`(옛 값)·`B.postPolish`에 남기고 `ct-resume` 옆에 「다듬기 되돌리기」(`ct-unpolish`, `unpolishBtn`)를 띄운다. 다듬은 뒤 손으로 고친 컷은 되돌리지 않는다
- **콘티 흐름 점검 (2026-10)**: 콘티 모듈 `/* ---------- 흐름 점검 */`(연결 바로 앞). 규칙 점검 `flowRules`(AI 없이 바로): 장면 첫 컷이 넓은 컷(ELS·LS·EMPTY·BIRD·CROWD·FS)이 아님 → 장소, 장면 안에서 이미 누가 보인 뒤 새 인물이 들어오는 동작 없이 나타남 → 인물(장소 컷 다음 첫 등장은 짚지 않음), 두 사람 컷의 왼쪽·오른쪽이 앞 컷과 뒤집힘(OTS 빼고) → 시선, 같은 샷 세 번 → 리듬, 쓴 컷 사이 빈 컷 → 빈칸. AI 점검 `flowCheck`(`FSYS`, strongModel, 온도 0.3): 대강 이야기·장면 배정표·등장인물·컷 줄을 주고 「번호|종류|무엇이|고치는 법」 많아야 10줄(종류 인과·시간·장소·인물·감정·정보·리듬·시선). 결과는 `B.flow={at,items:[{n,kind,why,fix,sig}]}`, `sig`(화면|대사)로 컷을 옮겨도 따라가고 내용이 바뀌면 버린다. 「무시」는 `B.flowIgn`. 판 위 「흐름 점검」 상자(`#ct-flow`, 목록 누르면 그 컷으로)와 컷 위 「⚠ 끊김 · 종류」 표시(누르면 설명·「이 자리 다시 쓰기」 = `redoScene(n-1, 끊김+고치는 법 요청)`·「무시」, 편집기는 안 열림). `renderBoard`·`refreshCut`·`polishAll`을 감쌌다: 다 쓰고 다듬은 뒤 「다 쓴 뒤 자동으로」(`ctFlowAuto`, 기본 켬)면 AI 점검. 창구 `window.__ctFlow`. 시험 `flowtest.js`, 화면 `pw_flow.js`
- **장면 전환 표시·흐름 고치기 (2026-10-17)**: 사용자가 원한 건 「끊김」보다 **장면이 바뀌는 자리 표시**였다. AI 흐름 점검이 실제로 쓴 컷을 장면으로도 나눈다(`장면|a-b|장소·시간|요약|넘어오는 방식` 줄, `flowParseScenes`, 방식 `FLOW_TR` 시작·장소 이동·시간 경과·회상·회상 끝·시점 바뀜·교차 편집·이어짐) → `B.flow.scenes`(첫 컷 `sig`로 컷을 옮겨도 따라감). 없으면 장면 배정표 `B.scenes`(「배정표」 표시). 판에는 장면 첫 컷 앞에 구분선 `.ct-scene`(장면 n · 범위 · 장소·시간 · 요약 · 방식), 흐름 상자에 장면 줄 `.ct-scenebar`. 규칙 점검의 장면도 이것을 쓴다
- 고치기: 「이 자리 다시 쓰기」는 이제 **그 컷이 든 장면**을 다시 쓴다(예전엔 앞 장면을 다시 써서 안 고쳐졌다). 고치는 법에 「넣」·「추가」가 있으면 빈 컷을 먼저 넣고(`insertCut`, `flowShiftScenes`) 채우게 한다(컷 수 고정이라 못 넣던 문제). 「모두 고치기」(`flowFixAll`): 다시 쓰는 구간별로 묶어 뒤에서부터 차례로 고친 뒤 다시 점검. 다시 쓸 때마다(`cutPrompt` 감쌈) 그 범위의 지난 점검 내용(빈칸 빼고)을 「[지난 흐름 점검에서 짚은 곳 — 이번에는 고쳐서 쓴다]」로 붙인다. 「AI로 콘티 쓰기」를 다시 누르면 `writeAll` 감쌈이 비우기 전에 `B.flowPrev`로 남겨 쓰고 다 쓰면 지운다. 고친 뒤 「다 쓴 뒤 자동으로」가 켜져 있으면 다시 점검
- **콘티 연출 색인(`ctfx`, 2026-10-17)**: 컷 여러 개를 잇는 연출 46개 `CONTI_FX`(`// [[DATA:ctfx]]`, 갈래 `CONTI_FX_GROUPS` 전환·시간·감정·시선·공간·정보·리듬·웹툰 스크롤, media both·print·webtoon). 항목 `{id,name,group,media,desc,use,risk,tip,ex,seq,gram?}`, 컷 `{k,ang,focus,flash,silent,hook,who:['A','B'],scr,line,wp?,dyn?,gap?}`. 카드마다 3~5컷 콘티 그림(A 짧은 검은 머리·B 긴 머리 `CF_LOOK`), 웹툰 카드는 세로로 여백 표시. 갈래·지면 필터, 검색, 출처 16개, 사례는 확인한 6개만. 「이 연출로 콘티에 넣기」 → `__ctInsertCuts`. 창구 `window.__ctFx {list, groups, byId, show, spec, insert, comp, filter}`. 시험 `ctfxtest.js`
- **이미지 연출 분석 (2026-10-17)**: 작품 분석(`probe`) 탭 「줄거리 분석」(`#pb-story`)·「이미지 연출 분석」(`#imgfx-root`, `[[MOD:imgfx]]`), 탭 `pbTab`. 이미지(고르기·끌어 놓기·붙여 넣기) → 긴 변 1600px JPEG .85(세로 웹툰 너비 900·높이 3600까지) → `aiCall` `opts.images=[{mime,data}]`(REST `inline_data:{mime_type,data}`), `opts.json`이면 `responseMimeType:'application/json'`. 온도 0.2, 추천 Pro(`ifStrong`). 답 `{format,panels:[{n,box%,k,ang,focus,flash,silent,who,scr,line,pose,note}],read,tools,fx,cliches,why,use}`를 `ifParse`가 검사. 이미지 위 번호 상자 ↔ 컷 줄, 줄마다 고치기와 콘티 그림, 시선 흐름·연출 도구·콘티 연출 기법(`__ctFx.show`)·클리셰·왜·쓰는 법. 「콘티로 가져오기」(`__ctInsertCuts`, 등장인물에 있는 이름만 남김), 「베스트컷으로 저장」(`__bcFromConti`). 기록 `imgFxHist` 이 기기만 최근 20개(원본 이미지는 안 남김). 창구 `window.__imgFx`. 시험 `imgfxtest.js`(시험 어댑터 `lib.js`가 이미지 조각을 `image_url`로 넘김)
- **말풍선·나레이션 그리기 (2026-10-17)**: `c.line` 한 줄에 풍선 하나(셋까지), `이름: 대사`는 그 사람 머리로 꼬리(칸에 없으면 화면 밖), 접두어 없으면 인물 칸 첫 사람, `(속마음)` 구름, `!`·`!?` 외침, `…`만이면 작은 풍선. `c.nar`+`c.narPos` top(왼쪽 위)·bottom(오른쪽 아래)·between(컷 사이 띠, 판 카드에서는 그림 위 `.ct-narb`). `cutData` → `data-line`/`data-nar`/`data-narpos`, 그리기는 `drawCv` 끝 `bubbles`(`balParse`·`balCands`·`balPlace`·`balDraw`·`narDraw`). 머리 자리 `D.heads`(figBody `headMark`), 격자 후보 점수(얼굴·몸·이름표 덜 가림, 말한 사람 가까이, 위쪽, 읽는 순서 왼→오·위→아래). 글자 8~20px. 이름표는 풍선 뒤에(`tagFlush`). 판 「말풍선 보기」(`ctBalloons`, 끄면 `data-nob`). 컷 고치기·베스트컷에 대사 textarea·나레이션·위치. 시험 `balloontest.js`(`window.__ctBalLog`)
- **콘티 말풍선·나레이션 쓰기 (2026-10-17)**: AI 콘티 줄 「번호|구도|인물|화면|대사|나레이션」 — 대사는 「 / 」로 풍선을 잇고 「이름: 」, 나레이션은 「위:」「아래:」「사이:」(`balloonsParse`·`narParse`·`narSet`·`lineParse`; 6칸은 나레이션을 늘 정하고 5칸·4칸 옛 줄은 그대로 둔다). `cutRow`를 앞 컷 목록·다듬기·흐름 점검·「글로 복사」가 함께 씀. `contiRules`에 말풍선·나레이션 규칙, `CEX` 6칸. 「나레이션 배치」(`#ct-narr`): 대강 이야기+글 보관함 참고 글+쓴 컷 → 「번호|위치|문구」 제안 미리보기(체크·위치·문구 고치기, 「덮어쓰기」 꺼져 있으면 있던 나레이션 유지) → 넣기·되돌리기. 「대사도 웹소설에서」는 대사 없는 컷에만 「번호|대사」. 창구 `window.__ctNar`. 시험 `nartest.js`
- **뼈대 장면·장면 리셋·빈 말풍선·판형 (2026-10-17)**: 「뼈대만 깔기」(`skeleton(total,band,cl,seed)`)는 구간마다 장면 몇 개(`skSizes`, 3컷 이상)로 나누고 장면 종류 `SK_TYPES`(여는·바로 들어가는·일상·대화·움직임·이동·드러냄·여운·시간 흐름·회상·맞부딪침·고백·넘김; 구간별 후보 `SK_BAND`)의 컷 역할 순서(head·body·tail)로 깐다. 씨앗이 매번 바뀌어 누를 때마다 다르다. 컷에 `hint`(역할, 빈 컷 캡션과 AI 컷 배정표에 보임)·`bal`/`balk`(빈 말풍선 자리)·`narph`, 판에 `B.skScenes` [{a,b,type,name,desc,place?,who?,sum?,role?,ed?}](`SK_LAST`), 컷 넣기·빼기 때 `shiftAfter`가 같이 민다. 같은 구도 연속은 `skSmooth`가 후보 안에서 바꾼다. 클리셰 칸은 그대로 `toolSeq`.
  - 장면 목록 `sceneList()` = AI 흐름 점검 장면(flow) → 검토 배정표(plan) → 뼈대 장면(sk) → 구간(band). 구분선(`.ct-scene`, `sceneHTML`)에 어디·언제/누가(비면 컷 인물)/무슨 일/이 장면이 하는 일(없으면 연출 설명), 단추 「설명」(고치면 원래 자리에 저장 `sceneSave`, ed=1 — 흐름 점검을 다시 해도 같은 시작 번호면 남는다)·「글 지우기」(구도는 둔다)·「뼈대 다시」(`skRegen`, 이 장면만 새 종류로)·「AI로 다시 쓰기」(`redoScene(n,req,btn,{a,b,name})`, 24컷까지) — 모두 되돌리기. `cutPrompt`에 작가가 적은 장면 설명·뼈대 장면을 붙인다. 흐름 점검 장면 줄은 `장면|a-b|장소·시간|인물|무슨 일|하는 일|넘어오는 방식`(옛 5칸도 읽음).
  - 말풍선 고르기 `#ct-balmode`(localStorage `ctBalloons`: 기본 빈 풍선 `data-bempty` · `text` 글자 · `0` 끄기 `data-nob`). 뼈대 컷(화면·대사 없음)은 `data-bph`로 자리 표시 풍선(ㅇㅇ…)을 글자 없이 그린다. 베스트컷 미리보기는 늘 글자.
  - 판형 `#ct-mode` → `B.mode`(기본 localStorage `ctMode`): 만화 `.m-manga` 한 줄 두 컷(최대 760px), 웹툰 `.m-webtoon` 한 줄 한 컷(440px). 컷 크기 `c.size`: wide 가로로 긴 한 컷(만화 한 줄 전부 2.2:1, 웹툰 2:1)·tall 세로로 긴 한 컷(만화 두 줄 높이, 웹툰 9:16)·half(웹툰 두 컷 나란히)·n 보통·없으면 자동(`cutSize`: 만화는 집중선·넘김 → wide, 웹툰은 BIRD·과장 역동·FS+앙각 → tall). 옛 big = wide. 쓰임 `c.use` — `CUT_USE` 가로(전경·배경 묘사·대치·전체 상황·움직임 방향·결정적 순간), 세로(높이·규모·낙하·전신 등장·내려다보기·여운·위에서 아래로); 컷 고치기에서 쓰임을 고르면 어울리는 구도·앵글을 맞춘다. AI 구도 칸 `ELS+가로:전경`·`FS+앙각+세로:높이`(`parseComp` size·use, `compText`), 뼈대도 어울리는 칸에 가로·세로 컷을 넣는다(이어 붙지 않게). 시험 `sk26test.js`, 화면 `pw_sk26.js`.
  - 말풍선 줄이기(2026-10-17): 뼈대 빈 풍선은 이야기를 움직이는 말이 오는 컷 역할(`SK_SAY`)에만 하나씩, 장면의 1/3까지, 이어 붙지 않게. AI 규칙: 정보·결심·갈등·관계가 바뀌는 말만, 감탄사·맞장구·「…」·그림으로 보이는 것의 되풀이는 비우고, 대사 컷은 절반 이하·한 컷 풍선 하나(둘은 주고받을 때만). `balloonsParse`는 둘까지, 부호만인 풍선(`BAL_FILLER`)은 버린다. 「나레이션 배치」의 대사 붙이기는 빈 컷의 40%까지.
  - 만화 판형은 세로 컷을 쓰지 않는다: `cutSize`가 만화에서 tall·half를 보통으로, 컷 고치기에 세로·작게 고르기 없음, 뼈대(`SK_MODE`)는 세로 후보를 빼고, AI 규칙도 만화에선 +세로 금지.
- **콘티 구성기 검토 반영 (2026-10-17)**
  - 안전장치: 글이 있는 판에서 「AI로 콘티 쓰기」는 한 번 더 눌러야 시작하고(`dataset.arm`), 시작 전 판 통째를 `snapUndo`로 남긴다. 되돌리기는 쌓인다(`UNDOS`, 20개, `undoPaint`). 뼈대 깔기·장면 나누기·분량 바꾸기·판 불러오기도 판 되돌리기. `contiBoard`·`contiSaved`를 `GD_KEYS`·`BK_KEYS`에(판은 `gdMerge`에서 at이 새로운 쪽, 보관 판은 `REC_KEYS`), `save()`는 `window.__stale`이면 쓰지 않는다. 분량을 바꾸면 고친 장면 설명을 `scaleScenes`로 새 분량에 옮긴다.
  - 이야기 먼저: 이야기가 있으면 늘 장면 배정표부터(`needRev`), 배정표 줄은 `a-b|요약|꼭 보여 줄 것|장소·시간|장면 종류` + `분량|알맞은 컷 수|이유`(`parseScenes` → type·place·`B.scenesTot`, 옛 3칸도). `layScenes`가 장면 종류(없으면 `guessType` 낱말)대로 글 없는 컷의 구도를 다시 깔고 `B.skScenes`를 비운다. 「이야기로 장면 나누기」(`#ct-scenego`, `planScenes`)는 쓰기 전에 장면만. 추천 분량이 15%·4컷 넘게 다르면 `#ct-totgo`. 무작위 뼈대 장면은 작가가 고친 것만 AI에 넘긴다. 장면 나누기가 빈 답이면(한도·키 오류 말고) 구간대로 계속 쓴다. `reviewPrompt`에 등장인물.
  - 규칙 정리: `contiRules` 형식 7 + 연출 8, 판형별(`boardMode`)만, 장면 첫 컷 규칙은 「첫 컷이나 늦어도 둘째 컷」으로(바로 들어가는 장면과 안 부딪치게), 대사 규칙 하나로. 시스템 글 `csys()` 만화(`CSYS_M`)·웹툰. 판 점검 숫자 `boardStats`(흐름 점검 상자): 대사 컷 %, 풍선 수, 같은 샷 3연속, 가로·세로 컷, 나레이션. 실제 Gemini 측정 스크립트 `work/realtest.js`(GEMINI_KEY 필요, 이 작업 공간에선 막힘).
  - 쪽·간격: 만화 `pageMap` 한 쪽 6칸(가로 컷 2칸, 구간 바뀌면 새 줄), 짝수 쪽 마지막 컷 `PG_TURN` 「쪽 넘김 자리」(배지·AI 컷 배정표), `.ct-page` 구분선. 웹툰 `c.gap` 0~3(`+붙임`·`+여백`·`+긴 여백`, `parseComp`/`compText`, 편집기 「앞 컷과 간격」, 자동: 장면 첫 컷 2·컷 사이 나레이션·회상 경계 3) → `.gp-N` 여백. `insertCuts`가 gap·size·use를 옮긴다.
  - 화면: 늘 보이는 줄 `.ct-main`(AI로 콘티 쓰기·이어서·이야기로 장면 나누기·나레이션 배치·판형), 나머지는 `details.ct-more`(뼈대만 깔기 (무작위)·선 다시 긋기·글로 복사·그림으로 저장·말풍선·판 보관). 장면 구분선은 「설명」 + ⋯ 메뉴(`.ct-scm`). 판 보관 `#ct-saved`(recPut contiSaved {name,total,mode,board}), 그림으로 저장 `boardPng`(판 화면 그대로 PNG, 15000px마다 나눔). 시험 `p28test.js`, 화면 `pw_p28.js`.
- **콘티 저장소 (2026-10-17)**: 페이지 `#contis`(`[[MOD:ctstore]]`, PAGES 도구), 바탕화면 바로 가기 `s:contis`(콘티 페이지가 있을 때만 `req:'conti'`, 누르면 최근 10편 → `ctgo`로 열기, 길게 누르면 자동 저장 `ctauto`). 기록 묶음 `contiSaved` 항목 {id,name,folder,created,at,total,mode,scenes,written,story,chars,board(판 JSON)}(`stMeta`). 콘티 모듈의 잇기: 저장소에서 열면 `B.sid`, 그 뒤 `save()` → `stTouch`가 2초 뒤 그 항목을 고친다(항목이 지워졌으면 잇기를 푼다, `stKeep`은 save를 거치지 않고 판에만 적음). 「뼈대만 깔기」는 잇기를 풀고, 분량 바꾸기·쓰기 전 새 판(fresh)은 지킨다. AI로 다 쓰면(`ctAutoStore`, 기본 켬) 이어진 콘티를 고치거나 새로 저장(`stSave`). 콘티 구성기 「더 보기」에 저장소에 저장/새 콘티로 복제/저장소 열기, 늘 보이는 줄에 이어진 이름(`#ct-stlink`). 저장소 페이지: 찾기·판형·폴더 거르기, 카드마다 앞 4컷 그림 띠(`__ctCutData`+`__ctPortrait`, 저장한 판의 인물 생김새), 전체 미리 보기(번호·화면·대사), 열기·이름 바꾸기·복제·폴더(새 폴더)·글로 복사·지우기(한 번 더). 창구 `window.__ctStore`. 시험 `storetest.js`, 화면 `pw_store.js`.
