# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

이 폴더에서는 **만화 클리셰·연출 사전**만 작업한다. 로비(`index.html`), 실험 페이지(`ai-chat.html`, `ai-lab.html`, `threejs-illustrations.html`) 등 사전 밖의 파일은 사용자가 말하지 않으면 건드리지 않는다.

## 먼저 읽을 것
`NOTES.md`가 사전의 작업 기록이다(데이터 배열, 함수 이름, localStorage 키, AI 연결 방식, **사용자 요청으로 삭제해서 다시 넣으면 안 되는 기능**). 120KB라 통째로 읽지 말고 `##` 제목이나 함수·섹션 이름으로 검색해서 필요한 부분만 읽는다. 중요한 결정이나 새 구조를 만들면 NOTES.md 끝에 날짜와 함께 덧붙인다.

## 어느 파일을 고치나
- **`dictionary_step_7_5_fast_gemini.html` — 지금 실제로 고치는 사전 본문**(약 2.2MB 한 파일). 사이트에서는 로비 카드 → `storyboard_touch.html`(전체 화면 iframe) → 이 파일로 열린다. 2026-11-23 이후 커밋은 모두 이 파일에 들어갔다
- `dictionary.html` — 11-23까지의 이전 본문. NOTES.md에서 "index.html"·"dictionary.html"이라고 부르는 내용은 같은 코드가 위 파일에 이어져 있다
- `dictionary.html.html`, `dictionary_independent_3d_gpt_steps.html`, `dictionary_webtoon_preview_fix.html` — 한 번 올리고 손대지 않은 사본. 사용자가 말하지 않으면 고치지 않는다
- `storyboard_*.js` — 어떤 HTML에서도 불러오지 않는 패치 원본(전역 `renderSteps`, `aiAsk` 등이 있을 때만 붙는 IIFE). 본문에 이미 들어갔는지 확인하고 다룬다
- `assets/pack/` — 사전의 「에셋 모음」 기본 팩(`index.json` + `bg/` + `obj/`, 출처는 `CREDITS.md`)

## 사전 본문 구조
- 빌드·서버 없는 한 페이지 앱. GitHub Pages(https://sooc200833-lang.github.io/-/)에서 `main` push 1~2분 뒤 반영된다
- 페이지는 `<section id="…">`이고 URL 해시로 이동한다(목록은 NOTES.md "페이지"). 섹션 id와 localStorage 키는 바꾸지 않는다 — 사용자의 저장 데이터가 거기 묶여 있다
- 데이터는 코드 안 큰 배열(`ROWS` 클리셰, `MOTIFDATA` 소재, `CHARS` 캐릭터, `ENDINGS` 엔딩 등)이고, 사용자가 추가한 것은 시작할 때 `localStorage.userAdds`에서 합쳐진다
- 기능 묶음은 `[[MOD:이름]]` / `[[CSS:이름]]` 주석으로 구분된다. 이 표지로 검색해서 해당 부분만 고친다. 일부 모듈은 파일 끝의 별도 `<script>`에 있고, 메인 `<script>` 안의 함수(`aiAsk`, `aiReady` 등)는 그 스크립트 안에서만 보이므로 모듈 위치가 중요하다(NOTES.md 해당 항목 참고)
- 저장: 글·설정은 localStorage(+구글 드라이브 동기화 `gdSync`/`gdMerge`), 그림은 IndexedDB(기기별, 동기화 안 됨)
- AI: 구글 제미나이 API를 브라우저에서 직접 호출(`aiCall`/`aiAsk`, 키는 사용자가 넣는 localStorage `gmKey`). 모델 이름을 코드에 박지 않는다(`ormLoad`가 목록에서 고른다). 그림·영상은 ChatGPT/Grok용 요청문을 만들어 복사하거나 새 탭으로 여는 방식이다

## 명령
jsdom이 이 PC에만 설치되어 있다(`node_modules`, `package*.json`은 `.git/info/exclude`로 git에서 제외 — 저장소에 올리지 않는다). 테스트 스크립트는 저장소에 없다. 필요할 때 임시로 만든다.

인라인 `<script>` 문법 검사 (본문을 고친 뒤 매번):
```sh
node -e "const h=require('fs').readFileSync(process.argv[1],'utf8');[...h.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].forEach((m,i)=>{try{new (require('vm').Script)(m[1])}catch(e){console.log(i,e.message);process.exitCode=1}})" dictionary_step_7_5_fast_gemini.html
```
기능 시험은 jsdom으로 페이지를 띄우고 가짜 `fetch`로 AI 응답을 흉내 낸다. 외부 AI·구글 호출은 실제 GitHub Pages 주소에서만 된다.

## 지킬 것
- 작업 전 `git pull`. 다른 대화에서 올린 변경을 옛 파일로 덮어쓴 적이 있다
- 본문은 수정 뒤 위 문법 검사를 통과해야 한다. 파일이 통째로 비거나 스크립트가 깨진 채 올라간 사고가 있었다
- 커밋·push는 사용자가 요청할 때만. NOTES.md의 "GitHub Contents API로 PUT" 방식은 옛 claude.ai 시절 방식이니 쓰지 않고 git을 쓴다
- 사용자는 코드를 읽지 않는다. 설명은 한국어로, 짧게, 결과 위주로
