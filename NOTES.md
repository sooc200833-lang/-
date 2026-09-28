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
oneshot, length, redflag, grammar, authors, pagemap, shuffle, arc, epidx, pino, pcre, pmemo, ai, index, motifidx, chars, favs, endidx, combo, refs, advice, final
- `m1`~`m10`은 본편 해설
- **피노 전용**(`pino`, `pcre`, `pmemo`)은 즐겨찾기 폴더 이름이 **피노설정집**일 때만 홈·목차에 나타난다 (`pinoInsert`, `PINOPAGES`)

## 데이터 규모 (코드 안 배열)
- ROWS(클리셰) 611 · MOTIFDATA(소재) 138 · CHARS(캐릭터) 221 · ENDINGS(엔딩) 264
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

## 저장 키
arcForm, deviceId, folderMemo, gdBase, gdLast, gdLinked, ideaText, mangaDataVer, mangaFav, mangaFolders, mangaPreMigrate, mangaPreRestore, orKey, orModel, pinoMemo, pinoTodo, writeFmt
- 동기화 대상: mangaFav, mangaFolders, folderMemo, pinoMemo, pinoTodo, arcForm, ideaText, userAdds (`GD_KEYS`)
- API 키(`orKey`)는 동기화·백업에서 **제외**

## 지켜야 할 것
- **항목 이름을 바꾸면 `ALIAS`에 「옛 키 → 새 키」를 남긴다.** 별표가 이름으로 저장돼 있다
- 저장 형식을 바꾸면 `DATA_VER`를 올리고 `dataMigrate`에서 변환한다
- 저장할 때 모르는 칸을 지우지 않는다 (`keepSave`)
- 초기화 코드를 `hashchange` 핸들러 안에 넣지 않는다 (페이지 이동마다 중복 실행되는 버그가 있었다)
- 피노 크리쳐에 목질·약점·서식지·대칭 같은 **지어낸 설정을 넣지 않는다.** 확정 설정은 설정집 페이지가 기준이다
- 사용자가 준 설정에 없는 내용을 채워 넣지 않는다. 미정은 미정으로 둔다
