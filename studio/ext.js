/* =========================================================
   확장: 클리셰 라이브러리 · 연출 템플릿 · 만화 기호 · 장면 목록
   (app.js가 노출한 window.WT 사용)
   스토리 클리셰 1000: trope-engine-korea (MIT)
   만화 기호 39: manpu_doodle (Unlicense)
   ========================================================= */
(function(){
'use strict';
const W=window.WT; if(!W) return console.error('WT 없음');
const {S,$,$$,el,esc,toast,copy,LS,buildItems,renderItem,setSrc,on,showTab}=W;
const ta=$('#src');

/* ───────── 삽입: 커서가 있는 줄 다음에 ───────── */
function insertSnippet(text){
  const v=ta.value; let pos=Math.min(ta.selectionStart==null?v.length:ta.selectionStart,v.length);
  if(!v.trim()){setSrc(text+'\n');return 1;}
  let nl=v.indexOf('\n',pos); if(nl<0) nl=v.length;
  const before=v.slice(0,nl),after=v.slice(nl);
  const line=before.split('\n').length+1;
  setSrc(before+'\n'+text+after);
  return line;
}
function lineOfKnot(name){const L=S.src.split('\n');for(let i=0;i<L.length;i++){if(new RegExp('^\\s*={2,}\\s*(?:function\\s+)?'+name+'\\b').test(L[i]))return i;}return -1;}
function scrollToLine(i){const L=ta.value.split('\n');let a=0;for(let k=0;k<i&&k<L.length;k++)a+=L[k].length+1;ta.focus();ta.setSelectionRange(a,a+(L[i]||'').length);ta.scrollTop=Math.max(0,(i-3)*20);}

/* ───────── 미리보기 시트 ───────── */
const sheet=el('div','sheet'); sheet.innerHTML='<div class="box"></div>'; document.body.appendChild(sheet);
sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.classList.remove('on');});
const box=$('.box',sheet);
function previewInto(container,lines){
  container.innerHTML='';
  const keep=lines.filter(l=>!/^\s*([*+]|->|~|VAR\b|===)/.test(l)&&!/^\s*@(ending|title|cast)\b/.test(l)&&l.trim());
  const warns=[]; const items=buildItems(keep,false,w=>warns.push(w));
  items.forEach(it=>{if(it.t==='panel')it.noCm=true;renderItem(it,container);});
  $$('.fade',container).forEach(n=>n.classList.remove('fade'));
  if(!items.length)container.innerHTML='<div class="sm" style="padding:14px">미리볼 컷이 없어요</div>';
  return warns;
}

/* ───────── 클리셰 탭 ───────── */
const GENRES=[...new Set((window.TROPES||[]).map(t=>t[1]))];
const ROLES=[...new Set((window.TROPES||[]).map(t=>t[3]))];
const ST=Object.assign({sec:'dir',cat:'로맨스',genre:'로맨스·로판',role:'',q:'',lim:30,A:'jun',B:'seo',board:LS.get('wt_board',[])},{});
const seen=new Set();
function castOptions(sel){return Object.keys(window.CHARS).filter(id=>!window.CHARS[id].mob).map(id=>`<option value="${id}" ${id===sel?'selected':''}>${esc(window.CHARS[id].name)} (${id})</option>`).join('');}
function fillTpl(t){const A=ST.A,B=ST.B,An=window.CHARS[A]?window.CHARS[A].name:A,Bn=window.CHARS[B]?window.CHARS[B].name:B;return t.replace(/\{A\}/g,A).replace(/\{B\}/g,B).replace(/\{An\}/g,An).replace(/\{Bn\}/g,Bn);}

function renderCliche(){
  const root=$('#cliche');
  const cats=[...new Set(window.DIRECTING.map(d=>d.cat))];
  const seg=(items,cur,key)=>`<div class="seg">${items.map(i=>`<button type="button" class="chip${i===cur?' on':''}" data-${key}="${esc(i)}">${esc(i)}</button>`).join('')}</div>`;
  let h=`<h2>클리셰 라이브러리</h2><div class="sm">눌러서 미리보고, 마음에 들면 <b>대본에 넣기</b>. 넣은 컷은 대본 탭의 커서 위치(없으면 맨 끝)에 들어가요.</div>
  <div class="seg" style="margin-top:10px">${[['dir','연출 클리셰'],['story','스토리 클리셰'],['mark','만화 기호']].map(([k,n])=>`<button type="button" class="chip${ST.sec===k?' on':''}" data-sec="${k}">${n}</button>`).join('')}</div>`;
  if(ST.sec==='dir'){
    h+=`<div class="card"><div class="sm">대사 주인공·상대 캐릭터를 고르면 템플릿에 자동으로 들어가요.</div>
      <div class="row" style="margin-top:8px"><span class="sm">주인공</span><select id="selA">${castOptions(ST.A)}</select><span class="sm">상대</span><select id="selB">${castOptions(ST.B)}</select></div></div>
      <div class="row" style="margin-top:10px"><button class="btn sm2" id="rndPlay" type="button">🎲 랜덤 클리셰 플레이</button></div><div style="margin-top:10px">${seg(cats,ST.cat,'cat')}</div><div class="cl-list">`;
    window.DIRECTING.filter(d=>d.cat===ST.cat).forEach((d,i)=>{h+=`<div class="cl-item" data-dir="${window.DIRECTING.indexOf(d)}"><b>${esc(d.n)}</b><div class="sm">${esc(d.d)}</div><button class="chip" data-dplay="${window.DIRECTING.indexOf(d)}" type="button" style="margin-top:6px">▶ 바로 플레이</button></div>`;});
    h+='</div>';
  } else if(ST.sec==='story'){
    h+=`<div style="margin-top:10px"><input class="search" id="q" placeholder="검색 (예: 오해, 고백, 복수, 질투)" value="${esc(ST.q)}"></div>
    <div style="margin-top:8px">${seg(GENRES,ST.genre,'genre')}</div><div style="margin-top:6px">${seg(['전체'].concat(ROLES),ST.role||'전체','role')}</div>
    <div class="row" style="margin-top:10px"><button class="btn sm2" id="rnd" type="button">🎲 이 장르로 랜덤 조합</button><button class="btn ghost sm2" id="reqBtn" type="button">AI 요청문 복사 (${ST.board.length})</button></div>
    <div id="rndOut"></div>`;
    if(ST.board.length) h+=`<h3>내 클리셰 보드</h3><div class="cl-list board">${ST.board.map((b,i)=>`<div class="cl-item"><b>${esc(b[2])}</b><div class="sm"><span class="tag">${esc(b[1])}</span><span class="tag">${esc(b[3])}</span>→ ${esc(b[4])}</div><div class="row" style="margin-top:6px"><button class="chip" data-bn="${i}" type="button">대본에 주석 넣기</button><button class="chip" data-bd="${i}" type="button">빼기</button></div></div>`).join('')}</div>`;
    const q=ST.q.trim().toLowerCase();
    const list=window.TROPES.filter(t=>(!ST.genre||t[1]===ST.genre)&&(!ST.role||t[3]===ST.role)&&(!q||t[2].toLowerCase().includes(q)||t[4].includes(q)));
    h+=`<h3>${esc(ST.genre)} · ${list.length}개</h3><div class="cl-list">${list.slice(0,ST.lim).map(t=>`<div class="cl-item" data-tid="${esc(t[0])}"><b>${esc(t[2])}</b><div class="sm"><span class="tag">${esc(t[3])}</span>독자 보상 · ${esc(t[4])}</div></div>`).join('')}</div>`;
    if(list.length>ST.lim) h+=`<div class="row" style="justify-content:center;margin-top:10px"><button class="btn ghost sm2" id="more" type="button">더 보기</button></div>`;
    h+=`<div class="sm" style="margin-top:14px">클리셰 목록은 웹소설용이라 시작 장르를 <b>로맨스·로판</b>, <b>아카데미·랭킹</b>, <b>빙의·환생·악역</b>으로 두면 학원 로맨스에 맞아요.</div>`;
  } else {
    h+=`<div class="sm" style="margin-top:10px">누르면 <span class="code">@mark 이름 x y 크기</span>가 대본에 들어가요. 컷 안 위치는 x,y(%)로 옮기면 돼요.</div><div class="mgrid">${window.MANPU.map((n,i)=>`<div data-mk="${i}"><img src="lib/manpu/manpu${String(i+1).padStart(3,'0')}.png" alt="">${esc(n)}</div>`).join('')}</div>`;
  }
  root.innerHTML=h;
}


/* ───────── 클리셰 플레이: 클리셰 컷을 바로 한 편의 짧은 선택지 장면으로 ───────── */
const REACT={
 '로맨스':[['그대로 받아들인다','smile','정석 · 설렘 루트','happy','두근…','그 순간부터, 뭔가 시작됐다.'],['장난으로 넘긴다','grin','비틀기 · 웃음 루트','',  '풉.','…분위기는 풀렸지만, 가슴은 더 시끄러웠다.'],['도망친다','panic','회피 · 밀당 루트','','다다다','다음 날, 서로 눈도 못 마주쳤다.']],
 '개그':[['진지하게 받는다','blank','정석 · 정색','','…','웃음이 터진 건 주변 쪽이었다.'],['같이 오버한다','grin','비틀기 · 텐션 업','','와하하!','교실이 난장판이 됐다.'],['못 본 척한다','think','회피 · 평화','','스윽','…없던 일이 됐다. 아마도.']],
 '긴장':[['맞선다','angry','정면 돌파','','쿵','공기가 한 번에 얼어붙었다.'],['한 발 물러선다','sad','양보 · 관망','','스윽','…아직은 때가 아니다.'],['웃어 넘긴다','smirk','역공 · 여유','','피식','상대가 먼저 눈을 피했다.']]
};
function demoSrc(d,A,B){
  const An=(window.CHARS[A]||{}).name||A,R=REACT[d.cat]||REACT['로맨스'];
  const body=fillTpl(d.t);
  let t=`@txt 클리셰 플레이 · ${d.n}\n-> c\n=== c ===\n${body}\n@txt 이 순간, ${An}은(는)?\n`;
  R.forEach((r,i)=>{t+=`* [${An}: ${r[0]} @${r[1]} ::${r[2]}]\n    -> r${i}\n`;});
  R.forEach((r,i)=>{t+=`=== r${i} ===\n@panel white 0.9 ${i===0?'sparkle':'lines'}\n@char ${A} ${r[1]} 32 1\n@char ${B} ${i===2?'shock':'smile'} 70 1 flip\n!!${r[4]}\n(${r[5]})\n@stamp ${i===0?'happy':'bad'} ${r[2].split(' · ')[0]} :: ${r[2]}\n@ending cl_${i} ${r[2]} :: 클리셰 플레이\n-> END\n`;});
  return t;
}
function demoPlay(d){
  const A=ST.A,B=ST.B; sheet.classList.remove('on');
  if(!S.demo)S.demoBak=S.src; S.src=demoSrc(d,A,B); S.demo=true;
  const bak=S.demoBak; W.startPlay(); window.scrollTo(0,0);
  toast('클리셰 플레이 중 · ↻처음/대본 탭의 ▶로 원래 이야기로 돌아가요');
}
on('src',()=>{S.demo=false;});

function openDir(idx){
  const d=window.DIRECTING[idx]; const text=fillTpl(d.t);
  box.innerHTML=`<h2>${esc(d.n)}</h2><div class="sm">${esc(d.d)}</div>
   <div class="row" style="margin-top:8px"><span class="sm">주인공</span><select id="pA">${castOptions(ST.A)}</select><span class="sm">상대</span><select id="pB">${castOptions(ST.B)}</select></div>
   <div class="pv" id="pv"></div><pre class="code" id="ptx"></pre>
   <div class="row"><button class="btn" id="pplay" type="button">▶ 클리셰 플레이</button><button class="btn ghost" id="pins" type="button">대본에 넣기</button><button class="btn ghost" id="pprm" type="button">🎨 그림 요청문</button><button class="btn ghost" id="pcl" type="button">닫기</button></div>`;
  const upd=()=>{const t=fillTpl(d.t);$('#ptx',box).textContent=t;const w=previewInto($('#pv',box),t.split('\n'));return t;};
  $('#pA',box).onchange=e=>{ST.A=e.target.value;upd();};$('#pB',box).onchange=e=>{ST.B=e.target.value;upd();};
  upd(); sheet.classList.add('on');
  $('#pcl',box).onclick=()=>sheet.classList.remove('on');
  $('#pplay',box).onclick=()=>demoPlay(d);
  $('#pprm',box).onclick=()=>{const p=window.WTSprite&&window.WTSprite.cutPrompt(fillTpl(d.t).split('\n'));p?copy(p):toast('요청문을 만들 수 없어요');};
  $('#pins',box).onclick=()=>{const ln=insertSnippet(fillTpl(d.t));sheet.classList.remove('on');toast(`대본 ${ln}번째 줄에 넣었어요`);};
}

const GKEY=Object.fromEntries((window.TROPES||[]).map(t=>[t[0],t]));
function openTrope(id){
  const t=GKEY[id]; const on=ST.board.some(b=>b[0]===id);
  box.innerHTML=`<h2>${esc(t[2])}</h2><div class="sm"><span class="tag">${esc(t[1])}</span><span class="tag">${esc(t[3])}</span>독자 보상 · ${esc(t[4])}</div>
  <div class="sm" style="margin-top:10px;line-height:1.7">이 클리셰는 <b>${esc(t[3])}</b> 자리에 쓰는 씨앗이에요. 그대로 쓰기보다 '누가 보고, 무엇이 증거고, 무슨 대가가 있는지'를 한 컷으로 만들어 보세요.</div>
  <div class="row" style="margin-top:12px"><button class="btn" id="tb" type="button">${on?'보드에서 빼기':'내 보드에 담기'}</button><button class="btn ghost" id="tc" type="button">대본에 주석으로</button><button class="btn ghost" id="tx" type="button">닫기</button></div>`;
  sheet.classList.add('on');
  $('#tx',box).onclick=()=>sheet.classList.remove('on');
  $('#tb',box).onclick=()=>{if(on)ST.board=ST.board.filter(b=>b[0]!==id);else ST.board.push(t);LS.set('wt_board',ST.board);sheet.classList.remove('on');renderCliche();toast(on?'뺐어요':'보드에 담았어요');};
  $('#tc',box).onclick=()=>{const ln=insertSnippet(`// [클리셰 ${t[0]}] ${t[2]} (${t[3]} → ${t[4]})`);sheet.classList.remove('on');toast(`대본 ${ln}번째 줄에 주석으로 넣었어요`);};
}
function randomCombo(){
  const pool=r=>window.TROPES.filter(t=>t[1]===ST.genre&&t[3]===r); const pick=r=>{const p=pool(r);return p[Math.floor(Math.random()*p.length)];};
  const parts=['정체성','강점','증명 장면','주변 반응','대가'].map(r=>[r,pick(r)]).filter(x=>x[1]);
  $('#rndOut').innerHTML=`<div class="card"><b style="font-family:'Gowun Batang'">랜덤 조합 (${esc(ST.genre)})</b>${parts.map(([r,t])=>`<div class="sm" style="margin-top:6px"><span class="tag">${esc(r)}</span>${esc(t[2])}</div>`).join('')}
   <div class="row" style="margin-top:10px"><button class="btn sm2" id="rndBoard" type="button">보드에 담기</button></div></div>`;
  $('#rndBoard').onclick=()=>{parts.forEach(([,t])=>{if(!ST.board.some(b=>b[0]===t[0]))ST.board.push(t);});LS.set('wt_board',ST.board);renderCliche();toast('보드에 담았어요');};
}
function aiRequest(){
  const seeds=ST.board.length?ST.board:[];
  const txt=`아래 웹툰 선택지 대본 문법으로 새 장면을 써 줘. 클리셰는 그대로 쓰지 말고 '증거 장면 + 대가'를 넣어 변주해 줘.

[참고 클리셰]
${seeds.map(b=>`- ${b[2]} (${b[3]} → ${b[4]})`).join('\n')||'- (보드가 비어 있어요)'}

[문법]
@panel 배경 높이 효과 / @char 캐릭터 표정 x 크기 / 이름: 대사 / 이름*: 속마음 / 이름%: 히로인 속마음 / (나레이션)
선택지: * [이름: 대사 @표정 ::설명] 다음에 -> 매듭이름
엔딩: @stamp 종류 글 :: 부제, @ending id 이름 :: 부제, -> END

[등장인물] ${Object.keys(window.CHARS).filter(i=>!window.CHARS[i].mob).map(i=>window.CHARS[i].name+'('+i+')').join(', ')}`;
  copy(txt);
}

/* 이벤트 위임 */
$('#cliche').addEventListener('click',e=>{
  const t=e.target.closest('[data-sec],[data-cat],[data-genre],[data-role],[data-dplay],#rndPlay,[data-dir],[data-tid],[data-mk],[data-bn],[data-bd],#rnd,#more,#reqBtn');
  if(!t) return; const d=t.dataset;
  if(d.sec){ST.sec=d.sec;return renderCliche();}
  if(d.cat){ST.cat=d.cat;return renderCliche();}
  if(d.genre){ST.genre=d.genre;ST.lim=30;return renderCliche();}
  if(d.role!=null&&t.matches('[data-role]')){ST.role=d.role==='전체'?'':d.role;ST.lim=30;return renderCliche();}
  if(d.dplay!=null) return demoPlay(window.DIRECTING[+d.dplay]);
  if(t.id==='rndPlay') return demoPlay(window.DIRECTING[Math.floor(Math.random()*window.DIRECTING.length)]);
  if(d.dir!=null) return openDir(+d.dir);
  if(d.tid) return openTrope(d.tid);
  if(d.mk!=null){const n=window.MANPU[+d.mk];const ln=insertSnippet(`@mark ${n} 70 18 16`);return toast(`@mark ${n} 를 ${ln}번째 줄에 넣었어요`);}
  if(d.bn!=null){const b=ST.board[+d.bn];const ln=insertSnippet(`// [클리셰 ${b[0]}] ${b[2]} (${b[3]} → ${b[4]})`);return toast(`${ln}번째 줄에 주석으로 넣었어요`);}
  if(d.bd!=null){ST.board.splice(+d.bd,1);LS.set('wt_board',ST.board);return renderCliche();}
  if(t.id==='rnd') return randomCombo();
  if(t.id==='more'){ST.lim+=40;return renderCliche();}
  if(t.id==='reqBtn') return aiRequest();
});
$('#cliche').addEventListener('input',e=>{if(e.target.id==='q'){ST.q=e.target.value;const p=e.target.selectionStart;renderCliche();const q=$('#q');q.focus();q.setSelectionRange(p,p);}});
$('#cliche').addEventListener('change',e=>{if(e.target.id==='selA'){ST.A=e.target.value;}if(e.target.id==='selB'){ST.B=e.target.value;}});

/* ───────── 장면 목록 (대본 탭) ───────── */
function buildOutline(){
  const det=$('#outline'); if(!det) return; const lines=S.src.split('\n'); const ks=[]; let cur=null;
  lines.forEach((l,i)=>{const m=l.match(/^\s*={2,}\s*(?:function\s+)?(\w+)/);if(m){cur={name:m[1],line:i,cuts:0,ch:0};ks.push(cur);return;}
    if(!cur) return; if(/^\s*@panel\b/.test(l))cur.cuts++; if(/^\s*[*+]\s/.test(l))cur.ch++;});
  const body=$('#olBody'); body.innerHTML=ks.length?ks.map(k=>`<div class="ol"><span class="n" data-go="${k.line}">${esc(k.name)}</span><span class="sm">컷 ${k.cuts}${k.ch?` · 선택 ${k.ch}`:''}</span><button class="chip" data-play="${esc(k.name)}" type="button">▶ 여기부터</button></div>`).join(''):'<div class="sm">=== 매듭 ===이 아직 없어요</div>';
  $('#olSum').textContent=`장면 목록 (${ks.length})`;
}
(function(){
  const holder=$('#snips'); const d=el('details','outline'); d.id='outline'; d.innerHTML='<summary id="olSum">장면 목록</summary><div id="olBody"></div>'; holder.parentNode.insertBefore(d,holder);
  d.addEventListener('click',e=>{const g=e.target.closest('[data-go]');if(g)return scrollToLine(+g.dataset.go);const p=e.target.closest('[data-play]');if(p){W.startPlay(null,p.dataset.play);window.scrollTo(0,0);}});
  d.addEventListener('toggle',buildOutline); on('src',()=>{if(d.open)buildOutline();});
  buildOutline();
})();

on('tab',t=>{if(t==='cliche')renderCliche();if(t==='script')buildOutline();});




/* =========================================================
   ＋ 쉬운 추가 (문법 몰라도 버튼으로 컷·대사·선택지·장면·엔딩)
   ========================================================= */
{
const {BGS,FXS}=W;
const PRE=window.CHAR_PRESETS?Object.keys(window.CHAR_PRESETS):['n','smile','shy','panic','shock','angry','sad','cry'];
const EXN={n:'보통',calm:'차분',smile:'미소',grin:'씨익',blank:'멍',shy:'수줍',panic:'당황',shock:'충격',dead:'절망',deadsweat:'식은땀',angry:'화남',sad:'슬픔',cry:'울음',menace:'위압',smirk:'비웃',hurt:'상처',think:'생각',gloom:'우울'};
const BGN={white:'흰 배경',class:'교실',hall:'복도',roof:'옥상',road:'길',cafe:'카페',night:'밤',home:'집',gym:'체육관',shock:'충격'};
const KIND=[['','말'],['*','속마음'],['%','히로인 속마음'],['!','외침'],['~','떨리는 말'],['$','위압'],['^','속삭임']];
const chars=()=>Object.keys(window.CHARS).filter(i=>!window.CHARS[i].mob);
const cname=id=>window.CHARS[id]?window.CHARS[id].name:id;
const copts=(sel,none)=>(none?`<option value="">${none}</option>`:'')+chars().map(i=>`<option value="${i}" ${i===sel?'selected':''}>${esc(cname(i))}</option>`).join('');
const eopts=sel=>PRE.map(p=>`<option value="${p}" ${p===sel?'selected':''}>${EXN[p]||p}</option>`).join('');
const knots=()=>[...S.src.matchAll(/^\s*={2,}\s*(\w+)/gm)].map(m=>m[1]);
let M={h:1,bs:1,art:'',tab:'cut',bg:'class',fx:[],c1:'jun',e1:'calm',c2:'seo',e2:'smile',lines:[{w:'seo',k:'',t:''}],cw:'jun',cn:[{t:'',e:'smile',d:'',to:''},{t:'',e:'sad',d:'',to:''}],sn:'',es:'happy',et:'',eu:'',ei:''};
const side=(sel,n)=>`<select data-m="${n}">${sel}</select>`;
function build(){
  if(M.tab==='cut'){
    const L=[];
    L.push(`@panel ${M.bg} ${M.h}${M.fx.length?' '+M.fx.join(' '):''}`);
    if(M.art) L.push(`@art ${M.art}`);
    if(M.bs!==1) L.push(`@bub ${M.bs}`);
    if(M.c1) L.push(`@char ${M.c1} ${M.e1} 30 1`);
    if(M.c2) L.push(`@char ${M.c2} ${M.e2} 70 1 flip`);
    M.lines.filter(l=>l.t.trim()).forEach(l=>L.push((l.w==='_n'?`(${l.t.trim()})`:`${cname(l.w)}${l.k}: ${l.t.trim()}`)+(l.px!=null?` @${l.px},${l.py}`:'')));
    return L.join('\n');
  }
  if(M.tab==='say'){ const l=M.lines[0]; return l.t.trim()?(l.w==='_n'?`(${l.t.trim()})`:`${cname(l.w)}${l.k}: ${l.t.trim()}`):''; }
  if(M.tab==='choice'){
    const n=M.cn.filter(c=>c.t.trim()); if(!n.length) return '';
    return n.map((c,i)=>`* [${cname(M.cw)}: ${c.t.trim()} @${c.e}${c.d.trim()?' ::'+c.d.trim():''}]\n    -> ${c.to||'다음'}`).join('\n');
  }
  if(M.tab==='scene') return M.sn.trim()?`\n=== ${M.sn.trim().replace(/\s+/g,'_')} ===\n@panel white 1.0`:'';
  if(M.tab==='end'){
    const T={happy:'HAPPY END ♥',true:'TRUE END',bad:'BAD END'}[M.es];
    return `@stamp ${M.es} ${T} :: ${M.eu||''}\n@ending ${M.ei||'E'+(1+((S.src.match(/@ending/g)||[]).length))} ${M.et||'엔딩 이름'} :: ${M.eu||''}\n-> END`;
  }
  return '';
}
function paint(){
  const tabs=[['cut','🎬 컷'],['say','💬 대사'],['choice','🔀 선택지'],['scene','📍 장면'],['end','🏁 엔딩']];
  let h=`<div class="seg">${tabs.map(([k,n])=>`<button type="button" class="chip${M.tab===k?' on':''}" data-t="${k}">${n}</button>`).join('')}</div>`;
  const lineRow=(l,i,del)=>`<div class="row" style="margin-top:6px;gap:5px;flex-wrap:nowrap"><select data-ln="${i}" data-f="w" style="max-width:90px"><option value="_n" ${l.w==='_n'?'selected':''}>나레이션</option>${copts(l.w)}</select><select data-ln="${i}" data-f="k" style="max-width:96px">${KIND.map(([v,n])=>`<option value="${v}" ${l.k===v?'selected':''}>${n}</option>`).join('')}</select>${del?`<button class="chip" data-del="${i}" type="button">✕</button>`:''}</div><input class="search" data-ln="${i}" data-f="t" placeholder="대사를 입력" value="${esc(l.t)}" style="margin-top:5px">${M.tab==='cut'?`<div class="row" style="gap:6px;margin-top:4px;align-items:center"><label class="sm"><input type="checkbox" data-pos="${i}" ${l.px!=null?'checked':''}> 위치 직접</label>${l.px!=null?`<span class="sm">←→</span><input type="range" data-ln="${i}" data-f="px" min="5" max="95" value="${l.px}" style="flex:1"><span class="sm">↑↓</span><input type="range" data-ln="${i}" data-f="py" min="5" max="95" value="${l.py}" style="flex:1">`:''}</div>`:''}`;
  if(M.tab==='cut'){
    h+=`<div class="sm" style="margin-top:8px">배경</div><div class="seg">${BGS.map(b=>`<button type="button" class="chip${M.bg===b?' on':''}" data-bg="${b}">${BGN[b]||b}</button>`).join('')}</div>
    <div class="sm" style="margin-top:6px">효과 (여러 개 가능)</div><div class="seg">${FXS.map(f=>`<button type="button" class="chip${M.fx.includes(f)?' on':''}" data-fx="${f}">${f}</button>`).join('')}</div>
    <div class="sm" style="margin-top:8px">칸 비율</div><div class="seg">${[[0.5,'와이드 2:1'],[0.75,'4:3'],[1,'정사각'],[1.33,'세로 3:4'],[1.6,'세로 길게'],[2,'세로 1:2']].map(([v,n])=>`<button type="button" class="chip${M.h==v?' on':''}" data-h="${v}">${n}</button>`).join('')}</div>
    <div class="sm" style="margin-top:8px">말풍선 크기 <b>${Math.round(M.bs*100)}%</b></div><input type="range" data-m="bs" min="0.7" max="1.5" step="0.05" value="${M.bs}" style="width:100%">
    <div class="sm" style="margin-top:8px">컷 그림 ${M.art?'<b>✓ 올림</b> <button class="chip" data-artx="1" type="button">빼기</button>':'<span>(없으면 기본 캐릭터 그림)</span>'}</div>
    <div class="row" style="margin-top:4px"><button class="chip" id="cpCut" type="button">🎨 이 컷 그림 요청문 복사</button><button class="chip" id="upCut" type="button">🖼 그림 올리기</button><input type="file" id="cutF" accept="image/*" hidden></div>
    <div class="sm" style="margin-top:8px">왼쪽 캐릭터</div><div class="row" style="gap:6px"><select data-m="c1">${copts(M.c1,'없음')}</select><select data-m="e1">${eopts(M.e1)}</select></div>
    <div class="sm" style="margin-top:8px">오른쪽 캐릭터</div><div class="row" style="gap:6px"><select data-m="c2">${copts(M.c2,'없음')}</select><select data-m="e2">${eopts(M.e2)}</select></div>
    <div class="sm" style="margin-top:8px">대사</div>${M.lines.map((l,i)=>lineRow(l,i,M.lines.length>1)).join('')}
    <button class="chip" data-addline="1" type="button" style="margin-top:8px">＋ 대사 한 줄 더</button>`;
  } else if(M.tab==='say'){
    h+=`<div class="sm" style="margin-top:8px">현재 컷에 이어 붙일 한 줄이에요.</div>`+lineRow(M.lines[0],0,false);
  } else if(M.tab==='choice'){
    h+=`<div class="sm" style="margin-top:8px">플레이어가 고를 말 (좌우로 넘겨서 선택)</div><div class="row" style="margin-top:4px"><span class="sm">말하는 사람</span><select data-m="cw">${copts(M.cw)}</select></div>`;
    M.cn.forEach((c,i)=>{h+=`<div class="card" style="margin-top:8px"><b class="sm">선택 ${i+1}</b>${M.cn.length>2?` <button class="chip" data-delc="${i}" type="button">✕</button>`:''}
      <input class="search" data-cn="${i}" data-f="t" placeholder="대사" value="${esc(c.t)}" style="margin-top:5px">
      <input class="search" data-cn="${i}" data-f="d" placeholder="짧은 설명 (선택)" value="${esc(c.d)}" style="margin-top:5px">
      <div class="row" style="margin-top:5px;gap:6px"><select data-cn="${i}" data-f="e">${eopts(c.e)}</select><select data-cn="${i}" data-f="to"><option value="">→ 이어질 장면</option>${knots().map(k=>`<option value="${k}" ${c.to===k?'selected':''}>${k}</option>`).join('')}</select></div></div>`;});
    if(M.cn.length<4) h+=`<button class="chip" data-addc="1" type="button" style="margin-top:8px">＋ 선택지 더</button>`;
    h+=`<div class="sm" style="margin-top:8px">이어질 장면이 없으면 먼저 📍 장면을 만들고 오세요.</div>`;
  } else if(M.tab==='scene'){
    h+=`<div class="sm" style="margin-top:8px">새 장면(이야기 갈래)을 만들어요. 선택지가 여기로 이어질 수 있어요.</div><input class="search" data-m="sn" placeholder="장면 이름 (예: 옥상)" value="${esc(M.sn)}" style="margin-top:8px">`;
  } else {
    h+=`<div class="sm" style="margin-top:8px">엔딩 도장</div><div class="seg">${[['happy','해피'],['true','트루'],['bad','배드']].map(([k,n])=>`<button type="button" class="chip${M.es===k?' on':''}" data-es="${k}">${n}</button>`).join('')}</div>
    <input class="search" data-m="et" placeholder="엔딩 이름" value="${esc(M.et)}" style="margin-top:8px"><input class="search" data-m="eu" placeholder="부제 (선택)" value="${esc(M.eu)}" style="margin-top:6px">`;
  }
  h+=`<div class="pv" id="cpv"></div><div class="row"><button class="btn" id="cins" type="button">대본에 넣기</button><button class="btn ghost" id="ccl" type="button">닫기</button></div>`;
  box.innerHTML=h; refresh();
}
function refresh(){
  const t=build(); const pv=$('#cpv',box); if(!pv) return;
  if(M.tab==='cut'||M.tab==='say') previewInto(pv,t.split('\n'));
  else pv.innerHTML=`<pre class="code" style="margin:10px">${esc(t)||'내용을 입력하세요'}</pre>`;
}
function open(tab){ if(tab)M.tab=tab; paint(); sheet.classList.add('on'); }
box.addEventListener('click',e=>{
  if(!box.querySelector('#cins')) return;
  const t=e.target.closest('#cpCut,#upCut,[data-h],[data-artx],[data-t],[data-bg],[data-fx],[data-es],[data-addline],[data-del],[data-addc],[data-delc],#cins,#ccl'); if(!t) return;
  const d=t.dataset;
  if(d.t){M.tab=d.t;return paint();}
  if(d.bg){M.bg=d.bg;return paint();}
  if(d.h){M.h=+d.h;return paint();}
  if(d.artx){M.art='';return paint();}
  if(t.id==='cpCut'){const p=window.WTSprite&&window.WTSprite.cutPrompt(build().split('\n'));return p?copy(p):toast('컷 내용이 없어요');}
  if(t.id==='upCut'){return $('#cutF',box).click();}
  if(d.fx){M.fx=M.fx.includes(d.fx)?M.fx.filter(x=>x!==d.fx):M.fx.concat(d.fx);return paint();}
  if(d.es){M.es=d.es;return paint();}
  if(d.addline!=null){M.lines.push({w:M.lines[M.lines.length-1].w==='jun'?'seo':'jun',k:'',t:''});return paint();}
  if(d.del!=null){M.lines.splice(+d.del,1);return paint();}
  if(d.addc!=null){M.cn.push({t:'',e:'n',d:'',to:''});return paint();}
  if(d.delc!=null){M.cn.splice(+d.delc,1);return paint();}
  if(t.id==='ccl') return sheet.classList.remove('on');
  if(t.id==='cins'){const s=build(); if(!s){return toast('내용을 먼저 입력해 주세요');}
    const ln=insertSnippet(s); if(M.tab==='cut'||M.tab==='say')M.lines=M.lines.map(l=>({...l,t:''})); if(M.tab==='choice')M.cn.forEach(c=>{c.t='';c.d='';});
    sheet.classList.remove('on'); toast(`대본 ${ln}번째 줄에 넣었어요 · ▶로 확인해 보세요`);}
});
box.addEventListener('input',e=>{const t=e.target;if(t.dataset.m==='bs'){M.bs=+t.value;t.previousElementSibling.querySelector('b').textContent=Math.round(M.bs*100)+'%';refresh();return;}if(t.dataset.ln!=null){const f=t.dataset.f;M.lines[+t.dataset.ln][f]=(f==='px'||f==='py')?+t.value:t.value;}else if(t.dataset.cn!=null){M.cn[+t.dataset.cn][t.dataset.f]=t.value;}else if(t.dataset.m){M[t.dataset.m]=t.value;}else return;refresh();});
box.addEventListener('change',async e=>{const t=e.target;
  if(t.id==='cutF'&&t.files[0]){const r=await window.WTSprite.artFromFile(t.files[0]);M.art=r.id;const opts=[0.5,0.75,1,1.33,1.6,2];M.h=opts.reduce((a,b)=>Math.abs(b-r.ratio)<Math.abs(a-r.ratio)?b:a);toast('컷 그림을 넣었어요 · 비율도 맞췄어요');return paint();}
  if(t.dataset.pos!=null){const l=M.lines[+t.dataset.pos];if(t.checked){l.px=50;l.py=20;}else{l.px=l.py=null;}return paint();}
  if(t.tagName!=='SELECT')return;if(t.dataset.ln!=null){M.lines[+t.dataset.ln][t.dataset.f]=t.value;}else if(t.dataset.cn!=null){M.cn[+t.dataset.cn][t.dataset.f]=t.value;}else if(t.dataset.m){M[t.dataset.m]=t.value;}refresh();});

/* 대본 탭 상단: 큰 추가 버튼들 + 하단 고정 바 */
const sn=$('#snips'); const old=sn.innerHTML;
sn.className=''; sn.innerHTML=`<div class="addbar">${[['cut','🎬','컷'],['say','💬','대사'],['choice','🔀','선택지'],['scene','📍','장면'],['end','🏁','엔딩']].map(([k,i,n])=>`<button type="button" data-add="${k}"><b>${i}</b>${n}</button>`).join('')}</div>
<details class="outline" style="margin-top:8px"><summary>고급 문법 조각 (변수·단톡·글 블록 등)</summary><div class="snip" id="snips2" style="margin-top:6px"></div></details>`;
$$('.chip',document).length; 
// 기존 칩을 고급 영역으로 이동
(function(){const tmp=el('div');tmp.innerHTML=old;const s2=$('#snips2');while(tmp.firstChild)s2.appendChild(tmp.firstChild);})();
sn.addEventListener('click',e=>{const b=e.target.closest('[data-add]');if(b)open(b.dataset.add);});
$('.pad',$('#tab-script')).insertAdjacentHTML('afterbegin','');
}
})();

/* ───────── 전체 원고 복사 ───────── */
(function(){
const W=window.WT,{S,$,el,copy,toast}=W;
const EXN={n:'보통',calm:'차분',smile:'미소',grin:'씨익',blank:'멍',shy:'수줍',panic:'당황',shock:'충격',dead:'절망',deadsweat:'식은땀',angry:'화남',sad:'슬픔',cry:'울음',menace:'위압',smirk:'비웃',hurt:'상처',think:'생각',gloom:'우울'};
const KN={'*':'속마음','%':'속마음','!':'외침','~':'떨림','$':'위압','^':'속삭임'};
const nm=id=>(window.CHARS[id]||{}).name||id;
const clean=t=>t.replace(/<br\s*\/?>/g,' ').replace(/\s@-?[\d.]+,-?[\d.]+(>[-\d.,]+)?\s*$/,'').trim();
function manuscript(withDir){
  const out=[];let cut=0,title='';
  S.src.split('\n').forEach(raw=>{const l=raw.trim();if(!l||l.startsWith('//')||/^(VAR|~|-> ?END)/.test(l))return;
    let m;
    if((m=l.match(/^@title\s+(.*)/))){title=m[1].split('::')[0].trim();out.push('《'+title+'》'+(m[1].includes('::')?' — '+m[1].split('::')[1].trim():''),'');return;}
    if((m=l.match(/^={2,}\s*(\w+)/))){out.push('','■ 장면 '+m[1]);return;}
    if((m=l.match(/^@panel\s+(\S+)(?:\s+([\d.]+))?(.*)/))){cut++;out.push('',`[컷 ${cut}]`+(withDir?` 배경:${m[1]}${m[2]?' 비율1:'+m[2]:''}${m[3].trim()?' 효과:'+m[3].trim():''}`:''));return;}
    if((m=l.match(/^@char\s+(\S+)\s+(\S+)/))){if(withDir)out.push(`  (${nm(m[1])} — ${m[2].split('+').map(e=>EXN[e]||e).join('+')})`);return;}
    if((m=l.match(/^@(txt|dark)\s+(.*)/))){out.push(clean(m[2]));return;}
    if((m=l.match(/^@sfx\s+(\S+)/))){out.push('효과음: '+m[1]);return;}
    if((m=l.match(/^@msg\s+(.*)/))){out.push('  [톡] '+clean(m[1]));return;}
    if((m=l.match(/^@chat\s+(.*)/))){out.push('[단톡방: '+m[1]+']');return;}
    if((m=l.match(/^@stamp\s+\S+\s+(.*)/))){out.push('','★ '+m[1].replace('::','—'));return;}
    if((m=l.match(/^@ending\s+(\S+)\s+(.*)/))){out.push('— 엔딩 '+m[1]+': '+m[2].replace('::','·'));return;}
    if((m=l.match(/^@note\s+(.*)/))){if(withDir)out.push('  ✎ '+m[1]);return;}
    if(l.startsWith('@'))return;
    if((m=l.match(/^[*+]\s*\[(.*)\]\s*(.*)$/))){let t=m[1];const d=(t.match(/::(.*)$/)||[])[1];t=t.replace(/::.*$/,'').replace(/\s@\S+\s*$/,'');t=clean(t).replace(/^([^:\s]{1,12}?)([*%!~$^]?):/,(x,n,k)=>n+(KN[k]?'('+KN[k]+')':'')+':');out.push('  ▶ 선택: '+t+(d?` (${d.trim()})`:''));return;}
    if((m=l.match(/^->\s*(\w+)/))){if(withDir)out.push('    → '+m[1]);return;}
    if(/^\{|^\}|^-\s*else/.test(l))return;
    if(l.startsWith('!!')){out.push('효과음: '+l.slice(2).trim());return;}
    if((m=l.match(/^\((.*)\)$/))){out.push('나레이션: '+clean(m[1]));return;}
    if((m=l.match(/^([^:\s]{1,12}?)([*%!~$^]?):\s*(.*)$/))){out.push(`${m[1]}${KN[m[2]]?'('+KN[m[2]]+')':''}: ${clean(m[3])}`);return;}
    out.push(clean(l));
  });
  return out.join('\n').replace(/\n{3,}/g,'\n\n').trim()+'\n';
}
const row=$('#btnCopy').parentNode;
const b=el('button','btn','📋 원고 복사');b.type='button';row.insertBefore(b,row.firstChild.nextSibling);
b.onclick=()=>{
  const old=document.getElementById('msMenu');if(old)return old.remove();
  const m=el('div','card');m.id='msMenu';m.style.marginTop='8px';
  m.innerHTML=`<b>전체 원고 복사</b><div class="row" style="margin-top:8px"><button class="btn sm2" data-ms="r" type="button">읽기용 원고</button><button class="btn ghost sm2" data-ms="d" type="button">연출 포함 원고</button><button class="btn ghost sm2" data-ms="s" type="button">대본 그대로</button><button class="btn ghost sm2" data-ms="f" type="button">.txt 저장</button></div><div class="sm" style="margin-top:6px">읽기용: 대사·나레이션·선택지만 · 연출 포함: 배경·표정·메모까지</div>`;
  row.after(m);
  m.onclick=e=>{const k=(e.target.closest('[data-ms]')||{}).dataset;if(!k)return;
    if(k.ms==='s')return copy(S.src);
    if(k.ms==='f'){const blob=new Blob([manuscript(true)],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=(((S.src.match(/@title\s+([^:\n]+)/)||[])[1]||'원고').trim())+'.txt';a.click();return toast('원고 파일을 저장했어요');}
    copy(manuscript(k.ms==='d'));};
};
window.WTManuscript=manuscript;
})();
