/* =========================================================
   웹툰 선택지 스튜디오
   ink(inkjs) 대본 → 웹툰 컷 렌더 · Embla 대사 스와이프 ·
   Scrollama 스크롤 확정 · Comical-JS 말풍선 꼬리
   ========================================================= */
(function(){
'use strict';
const $ = (s,r=document)=>r.querySelector(s), $$ = (s,r=document)=>[...r.querySelectorAll(s)];
const el = (t,c,h)=>{const e=document.createElement(t); if(c) e.className=c; if(h!=null) e.innerHTML=h; return e;};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), r1=v=>Math.round(v*10)/10;
const LS={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const fmt=t=>esc(t).replace(/&lt;(\/?)(br|b|i)&gt;/g,'<$1$2>');
let toastT; const toast=m=>{const t=$('#toast');t.textContent=m;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),2200);};
const copy=async txt=>{try{await navigator.clipboard.writeText(txt);toast('복사했어요');}catch(e){toast('복사가 막혀 있어요. 길게 눌러 직접 복사해 주세요');}};

/* ───────── 상태 ───────── */
const S={
  src:LS.get('wt2_src',null)||((v=>v&&v!==window.SAMPLE_INK?v:null)(LS.get('wt_src',null)))||window.SAMPLE_SEOYUN, undo:[], redo:[], story:null, errs:[], lint:[],
  path:[], replay:null, visited:new Set(), edit:false, ended:false,
  endings:LS.get('wt_end',{}), firstHint:true,
  set:Object.assign({memo:false,comical:false,dark:false,font:14,haptic:true},LS.get('wt_set',{})),
};
const feed=$('#feed'); window.__feed=feed;

/* ───────── 배경 ───────── */
const SV=(inner,defs='')=>`<svg viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg"><defs>${defs}</defs>${inner}</svg>`;
const grad=(id,a,b)=>`<linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient>`;
const clouds=`<g fill="#fff" opacity=".92"><ellipse cx="110" cy="110" rx="42" ry="13"/><ellipse cx="138" cy="100" rx="28" ry="15"/><ellipse cx="300" cy="72" rx="36" ry="10"/><ellipse cx="318" cy="66" rx="20" ry="10"/></g>`;
const BG={
  white:SV(`<rect width="400" height="400" fill="#fff"/>`),
  class:SV(`<rect width="400" height="400" fill="#f6f0e6"/><rect x="24" y="28" width="352" height="214" fill="url(#skC)"/>${clouds}<g stroke="#d4c9b7" stroke-width="7" fill="none"><rect x="24" y="28" width="352" height="214"/><line x1="141" y1="28" x2="141" y2="242"/><line x1="259" y1="28" x2="259" y2="242"/><line x1="24" y1="150" x2="376" y2="150"/></g><path d="M14,20 C40,110 24,190 46,258 L0,258 L0,20Z" fill="#ecdcc0"/><path d="M386,20 C360,110 376,190 354,258 L400,258 L400,20Z" fill="#ecdcc0"/><rect y="258" width="400" height="142" fill="#e7dccb"/><rect y="258" width="400" height="5" fill="#d5c7b1"/><g fill="#fff" opacity=".25"><polygon points="140,28 196,28 330,400 210,400"/><polygon points="262,28 288,28 400,320 400,400 372,400"/></g>`,grad('skC','#a5d2f2','#eaf5fc')),
  hall:SV(`<rect width="400" height="400" fill="#f2ede5"/><polygon points="0,0 150,130 150,230 0,400" fill="#e8e0d3"/><polygon points="400,0 250,130 250,230 400,400" fill="#e3dacb"/><rect x="150" y="130" width="100" height="100" fill="#fbf8f2"/><polygon points="0,400 400,400 250,230 150,230" fill="#d9cdb9"/><g fill="#cde5f5"><polygon points="18,70 110,135 110,190 18,190"/></g><g stroke="#d1c6b4" stroke-width="3" fill="none"><polygon points="18,70 110,135 110,190 18,190"/><line x1="64" y1="102" x2="64" y2="190"/></g>`),
  roof:SV(`<rect width="400" height="400" fill="url(#skR)"/>${clouds}<rect y="226" width="400" height="174" fill="url(#fen)"/><rect y="218" width="400" height="9" fill="#7d8a93"/><rect y="330" width="400" height="70" fill="#a9aeb2"/>`,grad('skR','#86bfeb','#e6f3fb')+`<pattern id="fen" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M0,0 L22,22 M22,0 L0,22" stroke="#6e7b85" stroke-width="1.6" opacity=".8"/></pattern>`),
  pink:SV(`<rect width="400" height="400" fill="url(#pk)"/><g fill="#fff" opacity=".5"><circle cx="60" cy="80" r="26"/><circle cx="340" cy="120" r="18"/><circle cx="300" cy="300" r="32"/><circle cx="90" cy="320" r="14"/><circle cx="200" cy="40" r="10"/></g>`,`<radialGradient id="pk" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#fff5f8"/><stop offset="1" stop-color="#f6bfd2"/></radialGradient>`),
  sepia:SV(`<rect width="400" height="400" fill="url(#sp)"/>`,`<radialGradient id="sp" cx=".5" cy=".5" r=".7"><stop offset="0" stop-color="#fdf3df"/><stop offset="1" stop-color="#e2c493"/></radialGradient>`),
  dark:SV(`<rect width="400" height="400" fill="url(#dk)"/>`,`<radialGradient id="dk" cx=".5" cy=".4" r=".7"><stop offset="0" stop-color="#2d2a35"/><stop offset="1" stop-color="#0f0d12"/></radialGradient>`),
  grey:SV(`<rect width="400" height="400" fill="url(#gy)"/><g stroke="#8a8a8a" stroke-width="4"><line x1="0" y1="120" x2="140" y2="120"/><line x1="0" y1="200" x2="140" y2="200"/><line x1="290" y1="90" x2="400" y2="90"/><line x1="290" y1="170" x2="400" y2="170"/></g><g fill="#a29b90"><rect x="14" y="88" width="40" height="32"/><rect x="64" y="96" width="30" height="24"/><rect x="300" y="140" width="50" height="30"/></g>`,grad('gy','#d6d4d0','#8f8c88')),
  toilet:SV(`<rect width="400" height="400" fill="#dfe8ea"/><rect width="400" height="400" fill="url(#tl)"/><rect x="70" y="40" width="260" height="360" fill="#9fb4bb" stroke="#5f767d" stroke-width="4"/>`,`<pattern id="tl" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40,0 L0,0 0,40" fill="none" stroke="#c5d1d4" stroke-width="2"/></pattern>`),
  dusk:SV(`<rect width="400" height="400" fill="url(#du)"/><rect x="24" y="28" width="352" height="214" fill="none" stroke="#3a2a3a" stroke-width="7" opacity=".5"/>`,grad('du','#f6a76b','#7f5a8f')),
  night:SV(`<rect width="400" height="400" fill="url(#ni)"/><g fill="#fff" opacity=".8"><circle cx="60" cy="50" r="1.6"/><circle cx="150" cy="90" r="1.2"/><circle cx="260" cy="40" r="1.8"/><circle cx="330" cy="110" r="1.3"/><circle cx="100" cy="150" r="1.1"/></g><circle cx="320" cy="60" r="22" fill="#f6f0c8"/>`,grad('ni','#1d2340','#4b4f7a')),
};
const BGS=Object.keys(BG).concat(['shock']);
const CSSBG={shock:'repeating-conic-gradient(from 0deg at 50% 55%,#161213 0 4deg,#fff 4deg 10deg)'};
const FXS=['lines','gloom','sparkle','flowers','vignette'];

/* 외침 말풍선 */
(function(){const pts=[],n=28;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,r=i%2?39:50+(i%4?2:-1);pts.push((50+Math.cos(a)*r).toFixed(1)+','+(50+Math.sin(a)*r).toFixed(1));}
const svg=`<svg xmlns='http://www.w3.org/2000/svg' viewBox='-2 -2 104 104' preserveAspectRatio='none'><polygon points='${pts.join(' ')}' fill='white' stroke='#1c1716' stroke-width='1.8' vector-effect='non-scaling-stroke'/></svg>`;
document.documentElement.style.setProperty('--burst',`url("data:image/svg+xml,${encodeURIComponent(svg)}")`);})();

/* ───────── 캐릭터 / @cast ───────── */
const BASECH=Object.assign({},window.CHARS);
let byName={};
function rebuildNames(){byName={};for(const [id,c] of Object.entries(window.CHARS)){if(!(c.name in byName))byName[c.name]=id;}}
function applyCasts(src){
  for(const k of Object.keys(window.CHARS)) if(!(k in BASECH)) delete window.CHARS[k];
  const re=/^\s*@cast\s+(\S+)\s+(\S+)(?:\s+(#[0-9a-fA-F]{3,8}))?/gm; let m;
  while((m=re.exec(src))){const base=window.CHARS[m[2]]||BASECH[m[2]]; if(!base) continue;
    window.CHARS[m[1]]=Object.assign({},base,{name:m[1]},m[3]?{hair:m[3]}:{});}
  rebuildNames();
}
const charId=tok=>window.CHARS[tok]?tok:(byName[tok]||null);
const charName=id=>(window.CHARS[id]||{}).name||id;

/* ───────── ink 컴파일 ───────── */
function compile(src){
  const errs=[]; let story=null;
  applyCasts(src);
  try{
    const opts=new inkjs.CompilerOptions(null,[],false,(msg,type)=>errs.push({msg:String(msg),type}),null);
    story=new inkjs.Compiler(src,opts).Compile();
  }catch(e){ if(!errs.length) errs.push({msg:String(e&&e.message||e),type:2}); story=null; }
  if(errs.some(e=>e.type===2)) story=null;
  return {story,errs};
}

/* ───────── 대본 해석: ink 출력 → 컷 모델 ───────── */
const POS_RE=/\s@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:>(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?))?\s*$/;
const DLG_RE=/^([^\s:：@]{1,10}?)([!*%~$^]?)\s*[:：]\s*(.+)$/;
const MK={'':'','!':'!','*':'t','%':'i','~':'~','$':'d','^':'w'};
function parseDialogue(t){
  const m=t.match(DLG_RE); if(!m) return null;
  let text=m[3],pos=null,tail=null; const pm=text.match(POS_RE);
  if(pm){text=text.slice(0,pm.index).trim();pos={x:+pm[1],y:+pm[2]};if(pm[3]!=null)tail={tx:+pm[3],ty:+pm[4]};}
  return {who:m[1],ty:MK[m[2]],text,pos,tail,raw:t.replace(POS_RE,'').trim()};
}
const num=(v,d)=>{const n=parseFloat(v);return isNaN(n)?d:n;};
function newPanel(bg,h){return {t:'panel',bg:bg||'white',h:h==null?null:h,fx:[],fb:false,nb:false,chars:[],marks:[],bubbles:[],note:''};}

function buildItems(lines,hasChoices,warn){
  const W=warn||(()=>{}); const items=[]; let cur=null,chat=null;
  const need=()=>{if(!cur){cur=newPanel('white',null);items.push(cur);}return cur;};
  for(const ln of lines){
    if(ln[0]==='@'){
      const sp=ln.search(/\s/); const cmd=(sp<0?ln.slice(1):ln.slice(1,sp)).toLowerCase(); const rest=sp<0?'':ln.slice(sp+1).trim(); const tk=rest.split(/\s+/).filter(Boolean);
      switch(cmd){
        case 'panel':{cur=newPanel('white',null);chat=null;let bgSet=false;
          tk.forEach(t=>{ if(!bgSet&&BGS.includes(t)){cur.bg=t;bgSet=true;} else if(/^-?\d*\.?\d+$/.test(t)) cur.h=parseFloat(t);
            else if(t==='fb') cur.fb=true; else if(t==='nb') cur.nb=true; else if(t==='cm') cur.cm=true; else if(FXS.includes(t)) cur.fx.push(t);
            else W(`@panel: 알 수 없는 값 "${t}"`);});
          items.push(cur);break;}
        case 'char':{const p=need();const id=charId(tk[0]);if(!id){W(`@char: 캐릭터 "${tk[0]}"를 못 찾았어요`);}
          const c={id:id||'mob',expr:tk[1]||'calm',x:num(tk[2],50),s:num(tk[3],1),fy:null,flip:false};
          for(const t of tk.slice(4)){if(t==='flip')c.flip=true;else if(/^-?\d*\.?\d+$/.test(t))c.fy=parseFloat(t);}
          p.chars.push(c);break;}
        case 'mark':{const p=need();const nums=tk.filter(t=>/^-?\d*\.?\d+$/.test(t));const name=tk.filter(t=>!/^-?\d*\.?\d+$/.test(t)).join(' ');let idx=-1;if(/^\d{1,3}$/.test(tk[0]||'')&&nums.length>=4){idx=+tk[0]-1;nums.shift();}else idx=(window.MANPU||[]).indexOf(name);if(idx<0||idx>38){W(`@mark: 기호 "${name||tk[0]}"를 못 찾았어요`);break;}p.marks.push({i:idx,x:num(nums[0],60),y:num(nums[1],20),s:num(nums[2],16)});break;}
        case 'art':{const p=need();p.art=tk[0]||'';break;}
        case 'bub':{const p=need();p.bs=num(tk[0],1);break;}
        case 'note':{const p=cur||items[items.length-1]; if(p&&p.t==='panel') p.note+=(p.note?' / ':'')+rest;break;}
        case 'txt':items.push({t:'txt',x:rest});cur=chat=null;break;
        case 'dark':items.push({t:'txt',x:rest,dark:true});cur=chat=null;break;
        case 'sfx':{const fl=tk.filter(t=>t==='red'||t==='quiet');const text=tk.filter(t=>t!=='red'&&t!=='quiet').join(' ');items.push({t:'sfx',x:text,red:fl.includes('red'),quiet:fl.includes('quiet')});cur=chat=null;break;}
        case 'gap':items.push({t:'gap',l:tk[0]==='l'});cur=chat=null;break;
        case 'stamp':{const [a,b]=rest.slice(tk[0].length).split('::');items.push({t:'stamp',k:tk[0]||'happy',x:(a||'').trim(),sub:(b||'').trim()});cur=chat=null;break;}
        case 'chat':chat={t:'chat',title:rest||'단톡방',m:[]};items.push(chat);cur=null;break;
        case 'msg':{if(!chat){chat={t:'chat',title:'단톡방',m:[]};items.push(chat);}const d=parseDialogue(rest);if(d)chat.m.push([d.who,d.text,charId(d.who)||'mob']);else chat.m.push(['',rest,'mob']);break;}
        case 'ending':{const [a,b]=rest.split('::');const id=(a||'').trim().split(/\s+/)[0];items.push({t:'ending',id,title:(a||'').trim().slice(id.length).trim()||id,sub:(b||'').trim()});cur=chat=null;break;}
        case 'title':{const [a,b]=rest.split('::');items.push({t:'title',x:(a||'').trim(),sub:(b||'').trim()});break;}
        case 'cast':break;
        default:W(`알 수 없는 명령 @${cmd}`);
      } continue;
    }
    if(ln.startsWith('!!')){const text=ln.slice(2).trim(); if(cur){cur.bubbles.push({kind:'sfx',ty:'x',who:'',text,pos:null,tail:null,raw:ln});} else items.push({t:'sfx',x:text}); continue;}
    if(/^\(.*\)$/.test(ln)){const text=ln.slice(1,-1);if(cur)cur.bubbles.push({kind:'nar',ty:'n',who:'',text,pos:null,tail:null,raw:ln});else items.push({t:'txt',x:text});continue;}
    const d=parseDialogue(ln);
    if(d){const p=need();
      if(!window.CHARS[d.who]&&!byName[d.who]) W(`"${d.who}": 이름이 등록된 캐릭터가 아니에요`);
      else if(p.chars.length&&!p.chars.some(c=>charName(c.id)===d.who||c.id===d.who)) W(`"${d.who}"가 이 컷에 @char로 등장하지 않아요`);
      d.kind='say';p.bubbles.push(d);
      if(d.text.length>70)W(`말풍선이 길어요(${d.text.length}자): ${d.text.slice(0,14)}…`);
      continue;}
    if(cur){cur.bubbles.push({kind:'nar',ty:'n',who:'',text:ln,pos:null,tail:null,raw:ln});} else items.push({t:'txt',x:ln});
  }
  if(hasChoices){const last=items[items.length-1]; if(!last||last.t!=='panel'){W('선택지 앞에 @panel이 없어서 빈 컷을 자동으로 만들었어요');const p=newPanel('white',null);items.push(p);}}
  items.forEach(it=>{if(it.t==='panel'){if(it.h==null)it.h=it.chars.length?1:0.1; if(it.bubbles.length>4)W(`한 컷에 말풍선이 ${it.bubbles.length}개예요`);}});
  return items;
}

/* ───────── 컷 렌더 ───────── */
const CW=.52,CR=262/200,FC=108/262;
function placeChar(c,h){
  const svgH=c.s*CW*CR; let fy=c.fy; if(fy==null) fy=((h-svgH)+FC*svgH)/h*100;
  const top=fy/100*h-FC*svgH;
  const d=el('div','cw'+(c.flip?' flip':'')); d.style.width=(c.s*CW*100)+'%'; d.style.left=`calc(${c.x}% - ${c.s*CW*50}%)`; d.style.top=(top/h*100)+'%';
  d.innerHTML=charSVG(c.id,c.expr); d.dataset.id=c.id;
  c._g={faceY:fy/100*h,headTop:top+0.153*svgH}; c._el=d; return d;
}
function addFx(art,list){
  list.forEach(f=>{const d=el('div','fx fx-'+f);
    if(f==='sparkle'||f==='flowers'){const ch=f==='sparkle'?'✦':'✿';for(let i=0;i<(f==='sparkle'?10:14);i++){const s=el('span','',ch);s.style.left=(Math.random()*92+2)+'%';s.style.top=(Math.random()*85+3)+'%';s.style.fontSize=(f==='sparkle'?8+Math.random()*16:12+Math.random()*14)+'px';d.appendChild(s);}}
    art.appendChild(d);});
}
function makeBubbleEl(b){
  const e=el('div','bb '+b.ty+(b.kind==='sfx'?' x':'')); e.innerHTML=(b.ty==='~'?'<i class="wb"></i>':'')+fmt(b.text); e._b=b; b.el=e; return e;
}
const TAILLESS=['n','x','i','!'];
function speakerOf(m,who){return m.chars.find(c=>charName(c.id)===who||c.id===who);}

function buildPanel(m){
  const pn=el('div','pn fade'+(m.fb?' fb':'')+(m.nb?' nb':''));
  const art=el('div','art');
  if(CSSBG[m.bg]) art.style.background=CSSBG[m.bg]; else art.appendChild(el('div','bgsvg',BG[m.bg]||BG.white));
  addFx(art,m.fx); pn.appendChild(art);
  const zone=el('div','zone'); const stage=el('div','stage'); stage.style.aspectRatio=`1 / ${m.h}`;
  const AU=m.art&&(window.ARTS||{})[m.art];
  if(m.art){const im=el('div','artimg');if(AU)im.style.backgroundImage=`url(${AU})`;else im.innerHTML='<span>🖼 컷 그림 '+esc(m.art)+' 없음<br>캐릭터 탭 › 컷 그림에서 올려 주세요</span>';stage.appendChild(im);}
  m.chars.forEach(c=>{const d=placeChar(c,m.h);if(AU)d.style.visibility='hidden';stage.appendChild(d);});
  (m.marks||[]).forEach(k=>{const im=new Image();im.className='mk';im.alt='';im.src='lib/manpu/manpu'+String(k.i+1).padStart(3,'0')+'.png';im.style.cssText=`left:${k.x}%;top:${k.y/m.h}%;width:${k.s}%`;stage.appendChild(im);});
  const bubs=el('div','bubs');
  pn.append(zone,stage,bubs); if(m.bs&&m.bs!==1)pn.style.setProperty('--bs',m.bs);
  m.bubbles.forEach(b=>{const e=makeBubbleEl(b); if(b.pos||b.kind==='sfx'){b.ex=true;e.classList.add('ex');bubs.appendChild(e);} else zone.appendChild(e);});
  if(m.note) pn.appendChild(el('div','note','✎ '+esc(m.note)));
  const tb=el('button','chip','✎ 꼬리'); tb.type='button'; tb.style.cssText='position:absolute;top:6px;right:6px;z-index:20;display:none'; tb.className='chip tailbtn'; pn.appendChild(tb);
  pn._m=m;pn._zone=zone;pn._stage=stage;pn._bubs=bubs;pn._tb=tb;m.pn=pn;
  RO.observe(pn); return pn;
}
const RO=new ResizeObserver(es=>es.forEach(en=>{const pn=en.target;if(pn.isConnected&&pn.clientWidth!==pn._W) layoutPanel(pn,true);}));

function layoutPanel(pn,force){
  const m=pn._m,W=pn.clientWidth; if(!W) return; if(!force&&pn._W===W) return; pn._W=W;
  const zone=pn._zone; let y=10,alt=0,n=0;
  m.bubbles.forEach(b=>{
    if(b.ex) return; const e=b.el,sp=speakerOf(m,b.who);
    if(b.ty==='n'){e.style.left=(W*.04)+'px';b._cx=null;}
    else{const x=sp?clamp(sp.x,36,64):(alt++%2?62:38);e.style.left=(x*W/100-e.offsetWidth/2)+'px';b._cx=x;}
    e.style.top=y+'px'; const h=e.offsetHeight; b._top=y;b._h=h; y+=h+(b.ty==='n'?12:26); n++;
  });
  let zoneH=n?y-6:0;
  if(pn._strip){const st=pn._strip; st.style.top=(n?y:8)+'px'; zoneH=(n?y:8)+st.offsetHeight+36; if(pn._embla) pn._embla.reInit();}
  zone.style.height=zoneH+'px';
  const stageH=W*m.h,H=zoneH+stageH;
  m.bubbles.forEach(b=>{ if(!b.ex)return; const e=b.el;
    const p=b.pos||{x:68,y:(zoneH+stageH*.32)/H*100}; e.style.left=(p.x*W/100-e.offsetWidth/2)+'px'; e.style.top=(p.y*H/100-e.offsetHeight/2)+'px'; });
  /* 꼬리 조준 */
  m.bubbles.forEach(b=>{
    const e=b.el; e.classList.remove('hide-tail'); if(TAILLESS.includes(b.ty)||e.classList.contains('cm')) return;
    const sp=speakerOf(m,b.who); const cx=(b.ex?b.pos.x:b._cx)*W/100; const bottom=b.ex?(b.pos.y*H/100+e.offsetHeight/2):(b._top+b._h);
    if(!sp){e.style.setProperty('--tx','50%');e.style.setProperty('--sk','0deg');return;}
    const tipX=sp.x*W/100, tipY=zoneH+sp._g.headTop*W-4, dx=tipX-cx, dy=tipY-bottom, bw=e.offsetWidth;
    if(dy<8){e.classList.add('hide-tail');return;}
    const tx=clamp(50+(dx/bw)*100*.55,24,76); const sk=clamp(Math.atan2(dx-(tx-50)/100*bw,Math.max(dy,16))*180/Math.PI,-38,38);
    e.style.setProperty('--tx',tx+'%'); e.style.setProperty('--sk',sk+'deg'); e.style.setProperty('--dx',clamp(dx*.05,-10,10)+'px');
  });
  if(!m.noCm&&!pn._cmDone&&(m.cm||S.set.comical||m.bubbles.some(b=>b.tail))) queueComical(pn);
}

/* ───────── Comical-JS 꼬리 ───────── */
const cmQ=[]; let cmBusy=false,cmActive=null;
const CMSTYLE={'':'speech','t':'thought','w':'speech','~':'speech','d':'speech','!':'shout'};
function queueComical(pn){pn._cmDone=true;cmQ.push(pn);pumpComical();}
function pumpComical(){
  if(cmBusy||cmActive) return; const pn=cmQ.shift(); if(!pn) return; cmBusy=true;
  setTimeout(()=>{try{prepComical(pn);ComicalJS.Comical.startEditing([pn]);
    setTimeout(()=>{try{if(!cmActive)ComicalJS.Comical.stopEditing();}catch(e){} cmBusy=false;pumpComical();},120);
  }catch(e){console.warn('comical',e);cmBusy=false;pumpComical();}},40);
}
function prepComical(pn){
  const {Bubble}=ComicalJS; const m=pn._m,W=pn.clientWidth,H=pn.clientHeight;
  if(!pn.querySelector('img.cmimg')){const im=new Image();im.className='cmimg';im.alt='';im.src='data:image/svg+xml,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2710%27 height=%2710%27/%3E';im.style.cssText='position:absolute;inset:0;width:100%;height:100%;opacity:0;pointer-events:none;z-index:0';pn.insertBefore(im,pn.firstChild.nextSibling);}
  m.bubbles.forEach(b=>{ if(TAILLESS.includes(b.ty)) return; const e=b.el; e.classList.add('cm');
    const spec=Bubble.getDefaultBubbleSpec(e,CMSTYLE[b.ty]||'speech');
    const pr=pn.getBoundingClientRect(),br=e.getBoundingClientRect(); const bx=br.left-pr.left+br.width/2,by=br.top-pr.top+br.height;
    let tipX,tipY; if(b.tail){tipX=b.tail.tx*W/100;tipY=b.tail.ty*H/100;} else{const sp=speakerOf(m,b.who); if(sp){tipX=sp.x*W/100;tipY=pn._zone.offsetHeight+sp._g.headTop*W-4;} else {tipX=bx;tipY=by+30;}}
    spec.tails=[{tipX,tipY,midpointX:(bx*.55+tipX*.45),midpointY:(by+tipY)/2,autoCurve:true}];
    e.setAttribute('data-bubble',JSON.stringify(spec)); });
}
function startTailEdit(pn){
  if(cmActive) finishTailEdit(); prepComical(pn); cmActive=pn; pn._tb.textContent='✓ 꼬리 저장'; pn._tb.classList.add('on');
  ComicalJS.Comical.startEditing([pn]); toast('분홍 점을 끌어 꼬리 방향을 바꾸세요');
}
function finishTailEdit(){
  const pn=cmActive; if(!pn) return; cmActive=null; const {Bubble}=ComicalJS; const W=pn.clientWidth,H=pn.clientHeight,pr=pn.getBoundingClientRect(); let n=0;
  pn._m.bubbles.forEach(b=>{ if(TAILLESS.includes(b.ty)||!b.el.getAttribute('data-bubble')) return;
    try{const sp=Bubble.getBubbleSpec(b.el);const t=sp.tails&&sp.tails[0]; if(!t) return;
      const br=b.el.getBoundingClientRect(); b.pos={x:r1((br.left-pr.left+br.width/2)/W*100),y:r1((br.top-pr.top+br.height/2)/H*100)}; b.tail={tx:r1(t.tipX/W*100),ty:r1(t.tipY/H*100)};
      if(writeBubble(b)) n++;}catch(e){} });
  try{ComicalJS.Comical.stopEditing();}catch(e){}
  pn._tb.textContent='✎ 꼬리'; pn._tb.classList.remove('on'); toast(n?`꼬리 ${n}개를 대본에 저장했어요`:'저장할 변경이 없어요'); pumpComical();
}

/* ───────── 소스에 위치 쓰기 ───────── */
function writeBubble(b){
  const lines=S.src.split('\n'); let idx=-1;
  for(let i=0;i<lines.length;i++){ if(lines[i].trim().replace(POS_RE,'').trim()===b.raw){idx=i;break;} }
  if(idx<0){toast('이 줄은 대본에서 못 찾았어요(변수가 들어간 줄?)');return false;}
  const suf=' @'+r1(b.pos.x)+','+r1(b.pos.y)+(b.tail?'>'+r1(b.tail.tx)+','+r1(b.tail.ty):'');
  lines[idx]=lines[idx].replace(POS_RE,'').replace(/\s+$/,'')+suf; setSrc(lines.join('\n')); return true;
}

/* ───────── 말풍선 드래그 편집 ───────── */
(function(){
  let drag=null;
  feed.addEventListener('pointerdown',e=>{
    if(!S.edit) return; const bb=e.target.closest('.bb'); if(!bb||bb.classList.contains('sl')||!bb._b) return; const pn=bb.closest('.pn'); if(!pn||pn===cmActive) return;
    e.preventDefault(); const b=bb._b,W=pn.clientWidth,H=pn.clientHeight,pr=pn.getBoundingClientRect(),br=bb.getBoundingClientRect();
    if(!b.ex){pn._bubs.appendChild(bb);bb.classList.add('ex');b.ex=true;b.pos={x:0,y:0};}
    const cx=br.left-pr.left+br.width/2,cy=br.top-pr.top+br.height/2,bw=br.width,bh=br.height; bb.style.left=(cx-bw/2)+'px';bb.style.top=(cy-bh/2)+'px'; bb.classList.add('drag');
    drag={bb,b,pn,W,H,bw,bh,sx:e.clientX,sy:e.clientY,cx,cy}; bb.setPointerCapture(e.pointerId);
  });
  feed.addEventListener('pointermove',e=>{if(!drag)return;drag.bb.style.left=(drag.cx+e.clientX-drag.sx-drag.bw/2)+'px';drag.bb.style.top=(drag.cy+e.clientY-drag.sy-drag.bh/2)+'px';});
  const up=e=>{if(!drag)return;const {bb,b,pn,W,H,cx,cy,sx,sy}=drag;drag=null;bb.classList.remove('drag');
    b.pos={x:r1(clamp((cx+e.clientX-sx)/W*100,2,98)),y:r1(clamp((cy+e.clientY-sy)/H*100,2,98))}; layoutPanel(pn,true);
    if(writeBubble(b)) toast(`위치 저장 @${b.pos.x},${b.pos.y}`);};
  feed.addEventListener('pointerup',up); feed.addEventListener('pointercancel',up);
  feed.addEventListener('click',e=>{if(S.edit&&!e.target.closest('.bb,.tailbtn,.embla,button')){const pn=e.target.closest('.pn');if(pn&&pn._m&&pn!==cmActive){emit('panelTap',pn._m);return;}}const t=e.target.closest('.tailbtn');if(!t)return;const pn=t.closest('.pn');if(cmActive===pn)finishTailEdit();else startTailEdit(pn);});
})();

/* ───────── 컷 밖 요소 ───────── */
function renderItem(it,target){
  const feed=target||window.__feed;
  switch(it.t){
    case 'panel':{const pn=buildPanel(it);feed.appendChild(pn);return pn;}
    case 'txt':feed.appendChild(el('div','txt fade'+(it.dark?' dark':''),fmt(it.x)));break;
    case 'sfx':feed.appendChild(el('div','sfx fade'+(it.red?' red':'')+(it.quiet?' quiet':''),esc(it.x)));break;
    case 'gap':feed.appendChild(el('div','gap'+(it.l?' l':'')));break;
    case 'stamp':feed.appendChild(el('div','stamp fade '+it.k,`<b>${esc(it.x)}</b><small>${esc(it.sub)}</small>`));break;
    case 'chat':{const c=el('div','chat fade');c.appendChild(el('div','hd',`<span>${esc(it.title)}</span><span>≡</span>`));const bd=el('div','bd');
      it.m.forEach(([who,tx,id])=>{if(!who){bd.appendChild(el('div','sys',fmt(tx)));return;}const m=el('div','m');m.innerHTML=`<div class="av">${charSVG(id,'calm')}</div><div><div class="nm">${esc(who)}</div><div class="tx">${fmt(tx)}</div></div>`;bd.appendChild(m);});
      c.appendChild(bd);feed.appendChild(c);break;}
    case 'title':feed.appendChild(el('div','cover fade',`<small>${esc(it.sub||'')}</small><b>${esc(it.x)}</b>`));$('#ttl').textContent=it.x;break;
    case 'ending':{S.ended=true;if(!S.demo&&!S.endings[it.id]){S.endings[it.id]={t:it.title,s:it.sub};LS.set('wt_end',S.endings);}
      const all=endingList(); const got=all.filter(e=>S.endings[e.id]).length;
      feed.appendChild(el('div','end-card fade',`<h3>END · ${esc(it.title)}</h3><p>${esc(it.sub)}<br>엔딩 수집 ${got} / ${all.length}</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn sm2" data-a="restart" type="button">처음부터</button><button class="btn ghost sm2" data-a="map" type="button">맵 보기</button></div>`));break;}
  }
}
function endingList(){const out=[],re=/^\s*@ending\s+(\S+)\s*(.*)$/gm;let m;while((m=re.exec(S.src))){const [a,b]=m[2].split('::');out.push({id:m[1],t:(a||'').trim(),s:(b||'').trim()});}return out;}

/* ───────── 플레이 흐름 ───────── */
function trackVisit(){try{const p=S.story.state.currentPathString;if(p){const k=p.split('.')[0];if(k&&!/^\d+$/.test(k))S.visited.add(k);}}catch(e){}}
function runUntilChoice(){
  const lines=[];
  try{ while(S.story.canContinue){S.story.Continue();const t=(S.story.currentText||'').trim();trackVisit();if(t)lines.push(...t.split('\n').map(s=>s.trim()).filter(Boolean));} }
  catch(e){feed.appendChild(el('div','errbox','⚠ 실행 오류: '+esc(e.message||e)));}
  return lines;
}
function playStep(){
  const lines=runUntilChoice(); const choices=S.story.currentChoices||[];
  const items=buildItems(lines,choices.length>0); let last=null;
  items.forEach(it=>{const r=renderItem(it);if(it.t==='panel')last=r;});
  if(choices.length){ attachChoices(last,choices); }
  else if(!S.ended){ feed.appendChild(el('div','end-card fade','<h3>THE END</h3><p>대본이 여기서 끝났어요.</p><div class="row" style="justify-content:center;margin-top:14px"><button class="btn sm2" data-a="restart" type="button">처음부터</button></div>')); }
}
function parseChoice(c,pn){
  let t=c.text.trim(),sub='',expr=null; const sm=t.match(/\s*::\s*(.*)$/); if(sm){sub=sm[1].trim();t=t.slice(0,sm.index);} const em=t.match(/\s@([\w+]+)\s*$/); if(em){expr=em[1];t=t.slice(0,em.index);}
  const d=parseDialogue(t.trim()); let who='',ty='',text=t.trim(); if(d){who=d.who;ty=d.ty;text=d.text;}
  return {who,ty,text,expr,sub,idx:c.index};
}
function attachChoices(pn,choices){
  const m=pn._m; const opts=choices.map(c=>parseChoice(c,pn));
  const tgt=m.chars.find(c=>opts[0].who&&(charName(c.id)===opts[0].who||c.id===opts[0].who))||m.chars.find(c=>c.id==='jun')||m.chars[0]||null;
  const forced=S.replay&&S.replay.length?S.replay.shift():null;
  if(forced!=null){ const o=opts[forced]||opts[0]; const b={kind:'say',ty:o.ty,who:o.who,text:o.text,pos:null,tail:null,raw:''};
    const e=makeBubbleEl(b); pn._zone.appendChild(e); m.bubbles.push(b); if(tgt&&o.expr) tgt._el.innerHTML=charSVG(tgt.id,o.expr);
    pn._W=0; layoutPanel(pn,true); S.path.push(opts[forced]?forced:0); S.story.ChooseChoiceIndex(opts[forced]?opts[forced].idx:opts[0].idx); return playStep(); }
  pn.classList.add('choice');
  const vp=el('div','embla'); const cont=el('div','embla__container'); vp.appendChild(cont); pn._strip=vp;
  opts.forEach(o=>{const s=el('div','embla__slide');if(o.sub)s.appendChild(el('div','sub',esc(o.sub)));
    const b=el('div','bb sl '+o.ty,(o.ty==='~'?'<i class="wb"></i>':'')+fmt(o.text)); b.style.setProperty('--tx','50%');b.style.setProperty('--sk','0deg');if(TAILLESS.includes(o.ty))b.classList.add('tn');s.appendChild(b);cont.appendChild(s);});
  pn._zone.appendChild(vp);
  const dots=el('div','dots'); opts.forEach((_,i)=>dots.appendChild(el('i',i?'':'on'))); pn.append(dots,el('div','edge l','‹'),el('div','edge r','›'));
  let hint=null; if(S.firstHint&&opts.length>1){hint=el('div','hint','← 대사를 밀어서 바꿔요 →');pn.appendChild(hint);}
  const commit=el('div','commit','<span>마음에 드는 대사를 띄운 채로 그대로 아래로</span><span class="ar">↓</span><button class="btn ghost sm2" type="button">이 대사로 확정</button>'); const step=el('div','step'); commit.appendChild(step);
  feed.appendChild(commit);
  const emb=EmblaCarousel(vp,{axis:'x',align:'center',containScroll:false,dragFree:false,loop:false,duration:22}); pn._embla=emb;
  const setExpr=i=>{const o=opts[i];if(tgt&&o.expr) tgt._el.innerHTML=charSVG(tgt.id,o.expr);};
  setExpr(0); emb.on('select',()=>{const i=emb.selectedScrollSnap();[...dots.children].forEach((d,j)=>d.classList.toggle('on',j===i));setExpr(i);if(hint){hint.remove();hint=null;S.firstHint=false;}});
  pn._W=0; layoutPanel(pn,true);
  let done=false; const sc=scrollama();
  const lock=()=>{ if(done)return; done=true; try{sc.destroy();}catch(e){}
    const i=emb.selectedScrollSnap(); emb.destroy(); cont.style.transform='none'; [...cont.children].forEach((s,j)=>{if(j!==i)s.style.display='none';}); vp.style.touchAction='auto';
    pn.classList.add('locked'); commit.classList.add('done'); if(hint)hint.remove(); S.firstHint=false;
    if(S.set.haptic&&navigator.vibrate){try{navigator.vibrate(14);}catch(e){}}
    const o=opts[i]; if(tgt&&o.expr) tgt._el.innerHTML=charSVG(tgt.id,o.expr);
    S.path.push(i); if(!S.demo)LS.set('wt_path',{h:S.src.length,p:S.path});
    S.story.ChooseChoiceIndex(o.idx); playStep(); };
  sc.setup({step,offset:0.5,once:false}).onStepEnter(r=>{if(r.direction==='down'&&!S.edit)lock();});
  commit.querySelector('button').onclick=lock;
}

/* ───────── 시작 / 재시작 ───────── */
function startPlay(replay,fromKnot){
  if(cmActive) finishTailEdit();
  const {story,errs}=compile(S.src); S.errs=errs; S.story=story; S.visited=new Set(); S.path=[]; S.ended=false; S.replay=replay?[...replay]:null; S.firstHint=!replay;
  feed.innerHTML=''; $('#ttl').textContent='웹툰 선택지 스튜디오'; showTab('play');
  if(!story){feed.appendChild(el('div','errbox','⚠ 대본에 오류가 있어서 재생할 수 없어요.<br>'+errs.filter(e=>e.type===2).map(e=>esc(e.msg)).join('<br>')+'<br><br>대본 탭에서 고쳐주세요.'));return;}
  const saved=fromKnot?null:LS.get('wt_path',null);
  if(fromKnot){try{story.ChoosePathString(fromKnot);}catch(e){feed.appendChild(el('div','errbox','⚠ 장면 "'+esc(fromKnot)+'"을 찾을 수 없어요'));return;} feed.appendChild(el('div','how',`장면 <b>${esc(fromKnot)}</b>부터 미리보기 중 · <a href="#" data-a="restart">처음부터</a>`));}
  playStep();
  if(!replay&&!fromKnot){
    const pre=[el('div','how','아래로 스크롤하며 읽어요. 대사가 나오면 옆으로 밀어 고르고, 그대로 아래로 내리면 이어져요.')];
    if(saved&&saved.h===S.src.length&&saved.p&&saved.p.length){const b=el('div','row');b.style.cssText='justify-content:center;margin-top:14px';const bt=el('button','btn ghost sm2',`이어하기 (${saved.p.length}번 선택)`);bt.type='button';bt.onclick=()=>startPlay(saved.p);b.appendChild(bt);pre.push(b);}
    const idx=feed.firstElementChild&&feed.firstElementChild.classList.contains('cover')?1:0;
    pre.reverse().forEach(n=>feed.insertBefore(n,feed.children[idx]||null));
  }
  refreshSide();
}
feed.addEventListener('click',e=>{const a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='restart'){if(S.demo){S.src=S.demoBak;S.demo=false;}LS.set('wt_path',null);startPlay();window.scrollTo(0,0);}if(a.dataset.a==='map')showTab('map');});

/* ───────── 탭 ───────── */
let scrollSave=0;
function showTab(t){
  const cur=$('.tab.on'); if(cur&&cur.id==='tab-play') scrollSave=window.scrollY;
  $$('.tab').forEach(x=>x.classList.toggle('on',x.id==='tab-'+t)); $$('nav.bottom button').forEach(b=>b.classList.toggle('on',b.dataset.t===t));
  $$('header [data-show]').forEach(b=>b.style.display=b.dataset.show.split(' ').includes(t)?'':'none'); S.tab=t;
  if(t==='play'){requestAnimationFrame(()=>{window.scrollTo(0,scrollSave);$$('.pn',feed).forEach(p=>layoutPanel(p,true));});}
  else window.scrollTo(0,0);
  emit('tab',t);
  if(t==='chars')renderChars(); if(t==='map'){renderMap();renderVars();renderGal();} if(t==='help')renderHelp(); if(t==='script')lintNow();
}
$$('nav.bottom button').forEach(b=>b.onclick=()=>showTab(b.dataset.t));
$$('nav.bottom button').forEach(b=>b.classList.toggle('on',false));
$('#btnRestart').onclick=()=>{if(S.demo){S.src=S.demoBak;S.demo=false;}LS.set('wt_path',null);startPlay();window.scrollTo(0,0);};
$('#btnEdit').onclick=e=>{S.edit=!S.edit;document.body.classList.toggle('edit',S.edit);e.target.classList.toggle('on',S.edit);$$('.tailbtn').forEach(b=>b.style.display=S.edit?'':'none');if(!S.edit&&cmActive)finishTailEdit();toast(S.edit?'편집 모드: 말풍선을 끌어 옮기면 대본에 위치가 저장돼요':'편집 모드 끔');};

/* ───────── 대본 탭 ───────── */
const SNIPS=[
 ['컷','@panel class 1.0\n@char jun calm 30 1\n@char seo smile 72 1 flip\n서윤: 안녕하세요.\n'],
 ['캐릭터','@char jun calm 50 1\n'],
 ['대사','이준: 대사\n'],
 ['속마음','이준*: 속마음\n'],
 ['히로인속마음','서윤%: (분홍 손글씨 속마음)\n'],
 ['외침','이준!: 외침!!\n'],
 ['위압','채린$: 낮게 깔리는 대사\n'],
 ['나레이션','(나레이션 박스)\n'],
 ['효과음','!!쿵\n'],
 ['선택지','* [이준: 대사A @smile ::설명]\n    -> 다음\n* [이준: 대사B @sad ::설명]\n    -> 다음\n'],
 ['매듭','\n=== 새장면 ===\n@panel white 1.0\n'],
 ['단톡','@chat 단톡방\n@msg 서윤: 안녕\n@msg 이준: 응\n'],
 ['엔딩','@stamp happy HAPPY END ♥ :: 부제\n@ending id 엔딩이름 :: 부제\n-> END\n'],
 ['글/효과음 블록','@txt 컷 밖 나레이션\n@sfx 두근 red\n@gap l\n'],
 ['변수','VAR mood = 0\n~ mood += 1\n'],
];
const ta=$('#src'); ta.value=S.src;
$('#snips').innerHTML=''; SNIPS.forEach(([n,t])=>{const b=el('button','chip',n);b.type='button';b.onclick=()=>{const s=ta.selectionStart,e=ta.selectionEnd;ta.setRangeText(t,s,e,'end');ta.focus();onSrc();};$('#snips').appendChild(b);});
let lintT; function scheduleLint(){clearTimeout(lintT);lintT=setTimeout(lintNow,450);}
let typingSnap=null,typingT;
function onSrc(){if(typingSnap==null)typingSnap=S.src;clearTimeout(typingT);typingT=setTimeout(()=>{if(typingSnap!=null&&typingSnap!==ta.value){S.undo.push(typingSnap);if(S.undo.length>80)S.undo.shift();S.redo=[];}typingSnap=null;updUndo();},800);S.src=ta.value;LS.set('wt2_src',S.src);scheduleLint();emit('src');}
function setSrc(v,noUndo){if(v===S.src)return;if(!noUndo){S.undo.push(S.src);if(S.undo.length>80)S.undo.shift();S.redo=[];}S.src=v;ta.value=v;LS.set('wt2_src',v);applyCasts(v);scheduleLint();updUndo();emit('src');}
function undo(){if(!S.undo.length)return toast('되돌릴 게 없어요');S.redo.push(S.src);const v=S.undo.pop();S.src=v;ta.value=v;LS.set('wt2_src',v);applyCasts(v);updUndo();emit('src');toast('되돌렸어요');}
function redo(){if(!S.redo.length)return;S.undo.push(S.src);const v=S.redo.pop();S.src=v;ta.value=v;LS.set('wt2_src',v);applyCasts(v);updUndo();emit('src');toast('다시 실행');}
function updUndo(){const u=$('#btnUndo'),r=$('#btnRedo');if(u)u.disabled=!S.undo.length;if(r)r.disabled=!S.redo.length;}
const listeners={};function on(ev,f){(listeners[ev]=listeners[ev]||[]).push(f);}function emit(ev,a){(listeners[ev]||[]).forEach(f=>{try{f(a)}catch(e){console.error(e)}});}
ta.addEventListener('input',onSrc);
ta.addEventListener('keydown',e=>{if(e.key==='Tab'){e.preventDefault();ta.setRangeText('    ',ta.selectionStart,ta.selectionEnd,'end');onSrc();}});
function lintNow(){
  const {story,errs}=compile(S.src); const box=$('#errs'); box.innerHTML='';
  if(!errs.length) box.innerHTML='<div class="ok">✓ 문법 오류 없음</div>';
  errs.forEach(e=>{const ln=(e.msg.match(/line (\d+)/)||[])[1];const d=el('div','err'+(e.type===2?'':' w'),esc(e.msg));d.onclick=()=>{if(!ln)return;const L=ta.value.split('\n');let a=0;for(let i=0;i<ln-1&&i<L.length;i++)a+=L[i].length+1;ta.focus();ta.setSelectionRange(a,a+(L[ln-1]||'').length);ta.scrollTop=Math.max(0,(ln-4)*20);};box.appendChild(d);});
  rebuildNames();
}
$('#btnRun').onclick=()=>{if(S.demo){S.src=S.demoBak;S.demo=false;}LS.set('wt_path',null);startPlay();window.scrollTo(0,0);};
$('#btnCopy').onclick=()=>copy(ta.value);
$('#btnSample').onclick=()=>{setSrc(window.SAMPLE_SEOYUN);toast('샘플을 불러왔어요');};
$('#btnFile').onclick=()=>$('#file').click();
$('#file').onchange=async e=>{const f=e.target.files[0];if(!f)return;setSrc(await f.text());toast(f.name+' 불러옴');e.target.value='';};

/* ───────── 캐릭터 탭 ───────── */
let selChar='seo',selExpr='calm';
function renderChars(){
  const box=$('#chars'); const ids=Object.keys(window.CHARS); if(!window.CHARS[selChar]) selChar=ids[0];
  const c=window.CHARS[selChar]; const ex=Object.keys(window.CHAR_PRESETS);
  box.innerHTML=`<h2>캐릭터 시트</h2><div class="sm">표정을 누르면 <span class="code">@char</span> 한 줄이 복사돼요.</div>
  <div class="snip" id="cl"></div>
  <div class="card"><div class="charhead"><div>${charSVG(selChar,selExpr)}</div><div style="flex:1"><b style="font-family:'Gowun Batang';font-size:16px">${esc(c.name)}</b> <span class="code">${esc(selChar)}</span>
  <div class="sm" style="margin-top:4px">머리색 <input type="color" id="hair" value="${/^#[0-9a-f]{6}$/i.test(c.hair)?c.hair:'#444444'}"> <button class="chip" id="castBtn" type="button">대본에 @cast 추가</button></div>
  <div class="sm code" style="margin-top:6px;display:block">@char ${esc(selChar)} ${esc(selExpr)} 50 1</div></div></div>
  <h3>표정 ${ex.length}종 <span class="sm">( +blush +sweat +tear +shadow 조합 가능 )</span></h3><div class="grid" id="eg"></div></div>
  <h3>캐릭터 추가</h3><div class="card"><div class="row"><input id="cn" placeholder="이름" style="flex:1;min-width:90px;padding:8px;border:1px solid var(--line);border-radius:8px;background:var(--paper);color:inherit"><select id="cb" style="padding:8px;border-radius:8px;border:1px solid var(--line);background:var(--paper);color:inherit">${Object.keys(BASECH).map(i=>`<option value="${i}">${esc(BASECH[i].name)} (${i})</option>`).join('')}</select><input type="color" id="cc" value="#3b82f6"><button class="btn sm2" id="ca" type="button">추가</button></div><div class="sm" style="margin-top:6px">기본 캐릭터 모양에 이름과 머리색을 바꿔 새 캐릭터를 만들어요(<span class="code">@cast</span>).</div></div>`;
  const cl=$('#cl',box); ids.forEach(i=>{const b=el('button','chip'+(i===selChar?' on':''),esc(window.CHARS[i].name)+' · '+i);b.type='button';b.onclick=()=>{selChar=i;renderChars();};cl.appendChild(b);});
  const eg=$('#eg',box); ex.forEach(k=>{const d=el('div','ex'+(k===selExpr?' sel':''),charSVG(selChar,k)+k);d.onclick=()=>{selExpr=k;copy(`@char ${selChar} ${k} 50 1`);renderChars();};eg.appendChild(d);});
  $('#hair',box).oninput=e=>{window.CHARS[selChar].hair=e.target.value;$('.charhead>div',box).innerHTML=charSVG(selChar,selExpr);};
  $('#castBtn',box).onclick=()=>{const col=$('#hair',box).value;const line=`@cast ${c.name}${selChar in BASECH?'':'2'} ${selChar in BASECH?selChar:(Object.keys(BASECH).find(k=>BASECH[k].front===c.front)||'jun')} ${col}\n`;setSrc(line+S.src);toast('대본 맨 위에 @cast를 넣었어요');};
  $('#ca',box).onclick=()=>{const n=$('#cn',box).value.trim();if(!n)return toast('이름을 입력해 주세요');setSrc(`@cast ${n} ${$('#cb',box).value} ${$('#cc',box).value}\n`+S.src);selChar=n;renderChars();toast(n+' 추가됨');};
}

/* ───────── 맵 ───────── */
function parseKnots(src){
  const lines=src.split('\n'),knots={},order=[]; let cur='(시작)'; knots[cur]={name:cur,to:new Set(),end:false,ch:0};order.push(cur);
  for(const l of lines){const km=l.match(/^\s*={2,}\s*(?:function\s+)?(\w+)/); if(km){cur=km[1];if(!knots[cur]){knots[cur]={name:cur,to:new Set(),end:false,ch:0};order.push(cur);}continue;}
    const s=l.replace(/\/\/.*$/,''); let m; const re=/->\s*(\w+)/g; while((m=re.exec(s))){const t=m[1];if(t==='END'||t==='DONE')knots[cur].end=true;else knots[cur].to.add(t);}
    if(/^\s*@ending\b/.test(l)) knots[cur].end=true; if(/^\s*[*+]\s*[\[(]?/.test(l)&&/^\s*[*+]/.test(l)) knots[cur].ch++; }
  return {knots,order};
}
function renderMap(){
  const {knots,order}=parseKnots(S.src); const box=$('#map'); const root=[...knots['(시작)'].to][0]||order[1];
  const depth={}; const q=[]; if(root){depth[root]=0;q.push(root);} const startDiverts=[...knots['(시작)'].to];
  while(q.length){const k=q.shift();if(!knots[k])continue;knots[k].to.forEach(t=>{if(knots[t]&&depth[t]==null){depth[t]=depth[k]+1;q.push(t);}});}
  const un=order.filter(k=>k!=='(시작)'&&depth[k]==null); const maxD=Math.max(0,...Object.values(depth));
  const rows=[]; order.forEach(k=>{if(k==='(시작)')return;const d=depth[k]==null?maxD+1:depth[k];(rows[d]=rows[d]||[]).push(k);});
  const Wd=360,nw=96,nh=30,gy=62,pos={}; rows.forEach((r,ri)=>{if(!r)return;r.forEach((k,i)=>{pos[k]={x:(i+1)*Wd/(r.length+1),y:30+ri*gy};});});
  const Hh=30+rows.length*gy; let s=`<svg viewBox="0 0 ${Wd} ${Hh}"><defs><marker id="ar" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8z" fill="#9a928a"/></marker></defs>`;
  Object.values(knots).forEach(k=>{if(!pos[k.name])return;k.to.forEach(t=>{if(!pos[t])return;const a=pos[k.name],b=pos[t];const my=(a.y+b.y)/2;s+=`<path d="M${a.x},${a.y+nh/2} C${a.x},${my+8} ${b.x},${my-8} ${b.x},${b.y-nh/2-2}" fill="none" stroke="#b9b0a5" stroke-width="1.4" marker-end="url(#ar)"/>`;});});
  Object.values(knots).forEach(k=>{const p=pos[k.name];if(!p)return;const v=S.visited.has(k.name);const ccol=k.end?'#2f7d5b':(depth[k.name]==null?'#aaa':'#c9bfb3');
    s+=`<g><rect x="${p.x-nw/2}" y="${p.y-nh/2}" width="${nw}" height="${nh}" rx="9" fill="${v?'#f9d3e0':'#fffdf9'}" stroke="${ccol}" stroke-width="${k.end?2.4:1.6}"/><text x="${p.x}" y="${p.y+4}" text-anchor="middle">${esc(k.name.length>11?k.name.slice(0,10)+'…':k.name)}</text>${k.ch?`<text x="${p.x+nw/2-4}" y="${p.y-nh/2-2}" text-anchor="end" style="font-size:9px;fill:#e0789b">선택 ${k.ch}</text>`:''}</g>`;});
  s+='</svg>'; box.innerHTML=s+`<div class="sm" style="margin-top:6px">초록 테두리 = 엔딩 · 회색 = 시작에서 연결 안 된 매듭 ${un.length?`(<b>${un.length}</b>개)`:''}</div>`;
}
function renderVars(){
  const box=$('#vars'); const names=[...S.src.matchAll(/^\s*VAR\s+(\w+)/gm)].map(m=>m[1]); if(!S.story||!names.length){box.innerHTML='<span class="sm">VAR 변수가 없어요</span>';return;}
  box.innerHTML=names.map(n=>{let v='?';try{v=S.story.variablesState[n];}catch(e){}return `<span>${esc(n)} <b>${esc(String(v))}</b></span>`;}).join('');
}
function renderGal(){
  const all=endingList(); const got=all.filter(e=>S.endings[e.id]).length; $('#gal').innerHTML=(all.length?`<li class="lock"><span>수집 ${got} / ${all.length}</span><span></span></li>`:'<li class="lock">@ending이 대본에 없어요</li>')+all.map(e=>S.endings[e.id]?`<li><span>${esc(e.t)}</span><span class="sm">${esc(e.s)}</span></li>`:`<li class="lock"><span>？？？</span><span>잠김</span></li>`).join('');
}

/* ───────── 자동 테스트 ───────── */
$('#btnTest').onclick=async()=>{
  const rep=$('#report'),bar=$('#bar'); rep.innerHTML=''; bar.style.width='0';
  const {story,errs}=compile(S.src); if(!story){rep.innerHTML='<div class="err">대본 오류로 테스트할 수 없어요.</div>'+errs.map(e=>`<div class="err">${esc(e.msg)}</div>`).join('');return;}
  const base=story.state.toJson(); const stack=[{json:base,pick:null,path:[]}]; const endings=new Map(),warns=new Set(),dead=[]; let paths=0,iter=0,maxDepth=0,capped=false; const seen=new Set();
  while(stack.length){
    if(iter>=2500){capped=true;break;} iter++; const {json,pick,path}=stack.pop(); story.state.LoadJson(json);
    try{ if(pick!=null) story.ChooseChoiceIndex(pick); }catch(e){warns.add('선택 실패: '+e.message);continue;}
    const lines=[]; let err=null; try{while(story.canContinue){story.Continue();const t=(story.currentText||'').trim();if(t)lines.push(...t.split('\n').map(s=>s.trim()).filter(Boolean));}}catch(e){err=e.message;}
    if(err){warns.add('실행 오류: '+err);continue;}
    const ch=story.currentChoices||[]; const items=buildItems(lines,ch.length>0,w=>warns.add(w)); maxDepth=Math.max(maxDepth,path.length);
    const en=items.find(i=>i.t==='ending');
    if(!ch.length){paths++;const k=en?en.id:'(@ending 없음)';endings.set(k,(endings.get(k)||0)+1);if(!en)dead.push(path.join('→')||'시작');continue;}
    const key=story.state.toJson(); if(seen.has(key)) continue; seen.add(key);
    ch.forEach((c,i)=>stack.push({json:key,pick:i,path:path.concat(i)}));
    if(iter%25===0){bar.style.width=Math.min(95,iter/25)+'%';await new Promise(r=>setTimeout(r));}
  }
  bar.style.width='100%'; const declared=endingList(); const miss=declared.filter(e=>!endings.has(e.id));
  let h=`<div class="card"><b>${paths}</b>개 경로 · 최대 깊이 <b>${maxDepth}</b> · 탐색 ${iter}회${capped?' <span class="err w" style="display:inline">상한 도달</span>':''}</div>`;
  h+='<h3>도달한 엔딩</h3><ul class="rep">'+([...endings].map(([k,v])=>`<li><span>${esc((declared.find(d=>d.id===k)||{}).t||k)}</span><span class="sm">${v}경로</span></li>`).join('')||'<li class="lock">없음</li>')+'</ul>';
  if(miss.length) h+='<h3>도달 불가 엔딩</h3>'+miss.map(e=>`<div class="err">${esc(e.t||e.id)} (${esc(e.id)}) — 어떤 선택으로도 닿지 않아요</div>`).join('');
  if(dead.length) h+='<h3>엔딩 없이 끝난 길</h3>'+dead.slice(0,6).map(d=>`<div class="err w">경로 ${esc(d)}</div>`).join('');
  if(warns.size) h+='<h3>대본 점검</h3>'+[...warns].slice(0,20).map(w=>`<div class="err w">${esc(w)}</div>`).join('');
  if(!miss.length&&!dead.length&&!warns.size) h+='<div class="ok" style="margin-top:10px">✓ 문제 없음</div>';
  rep.innerHTML=h; story.ResetState();
};

/* ───────── 도움말 · 설정 ───────── */
function applySettings(){document.body.classList.toggle('dark',!!S.set.dark);document.body.classList.toggle('memo',!!S.set.memo);document.documentElement.style.setProperty('--fs',S.set.font+'px');LS.set('wt_set',S.set);$$('.pn',feed).forEach(p=>layoutPanel(p,true));}
function renderHelp(){
  $('#help').innerHTML=`<h2>설정</h2>
  <label class="sw">다크 모드<input type="checkbox" id="s-dark" ${S.set.dark?'checked':''}></label>
  <label class="sw">콘티 메모 보기 (@note)<input type="checkbox" id="s-memo" ${S.set.memo?'checked':''}></label>
  <label class="sw">Comical 말풍선 꼬리 (자동 조준)<input type="checkbox" id="s-cm" ${S.set.comical?'checked':''}></label>
  <label class="sw">선택 확정 진동<input type="checkbox" id="s-hap" ${S.set.haptic?'checked':''}></label>
  <label class="sw">말풍선 글자 크기 <span id="fsv">${S.set.font}px</span><input type="range" id="s-fs" min="11" max="20" value="${S.set.font}"></label>
  <div class="sm">Comical 꼬리는 다음 재생부터 적용돼요.</div>
  <h2 style="margin-top:22px">대본 문법</h2>
  <div class="sm">ink 문법(매듭 <span class="code">===</span>, 선택지 <span class="code">*</span>, 변수 <span class="code">VAR ~</span>, 조건 <span class="code">{}</span>)에 아래 명령을 섞어요. 한 줄이 한 요소예요.</div>
  <table class="help">
  <tr><td>@panel 배경 높이 효과</td><td>컷 시작. 배경: ${BGS.join(' ')}<br>효과: ${FXS.join(' ')} · 옵션 fb(전폭) nb(테두리 없음)</td></tr>
  <tr><td>@char 캐릭터 표정 x 크기 [flip]</td><td>컷에 인물 배치. x는 0~100%, 크기 1이 기본, flip은 좌우반전</td></tr>
  <tr><td>이름: 대사</td><td>말풍선(자동 배치, 꼬리가 말한 인물을 향해요)</td></tr>
  <tr><td>이름*: / %: / !: / ~: / $: / ^:</td><td>속마음 · 히로인 속마음(분홍 손글씨) · 외침 · 떨림 · 위압(검정) · 속삭임(점선)</td></tr>
  <tr><td>(글) · !!효과음</td><td>나레이션 박스 · 큰 효과음</td></tr>
  <tr><td>대사 @x,y</td><td>말풍선 위치 고정(컷의 %). 편집 모드에서 끌면 자동 입력돼요</td></tr>
  <tr><td>대사 @x,y&gt;tx,ty</td><td>꼬리 끝 지정(Comical-JS가 그려요)</td></tr>
  <tr><td>* [이름: 대사 @표정 ::설명]</td><td>선택지. 대사는 좌우로 넘기고, 고르는 동안 인물 표정이 바뀌어요</td></tr>
  <tr><td>@txt / @dark / @sfx 글 [red|quiet]</td><td>컷 밖 글 · 검은 배경 글 · 큰 효과음</td></tr>
  <tr><td>@gap [l]</td><td>여백(l은 길게)</td></tr>
  <tr><td>@chat 제목 / @msg 이름: 글</td><td>단톡방 화면</td></tr>
  <tr><td>@stamp 종류 글 :: 부제</td><td>도장. 종류: happy true bad</td></tr>
  <tr><td>@ending id 이름 :: 부제</td><td>엔딩 카드 + 수집 목록</td></tr>
  <tr><td>@cast 이름 기본캐릭터 #색</td><td>새 캐릭터(이름·머리색 변경)</td></tr>
  <tr><td>@title 제목 :: 부제</td><td>표지 제목</td></tr>
  <tr><td>@note 글</td><td>콘티 메모(설정에서 켜면 보여요)</td></tr></table>
  <h3>쓰인 오픈소스 (모두 MIT)</h3>
  <div class="sm">inkjs ${'2.4'} — 대본·분기·변수 / Scrollama ${'3.2'} — 스크롤로 선택 확정 / Embla Carousel ${'8.6'} — 대사 스와이프 / Comical-JS ${'0.4'} — 말풍선 꼬리</div>`;
  const b=id=>$(id);
  b('#s-dark').onchange=e=>{S.set.dark=e.target.checked;applySettings();};
  b('#s-memo').onchange=e=>{S.set.memo=e.target.checked;applySettings();};
  b('#s-cm').onchange=e=>{S.set.comical=e.target.checked;applySettings();};
  b('#s-hap').onchange=e=>{S.set.haptic=e.target.checked;applySettings();};
  b('#s-fs').oninput=e=>{S.set.font=+e.target.value;$('#fsv').textContent=S.set.font+'px';applySettings();};
}
function refreshSide(){}

/* ───────── 시작 ───────── */
applySettings(); rebuildNames(); applyCasts(S.src);
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>$$('.pn',feed).forEach(p=>layoutPanel(p,true)));
showTab('play'); startPlay();
window.__S=S; window.__start=startPlay;
$('#btnUndo').onclick=undo; $('#btnRedo').onclick=redo; updUndo();
window.WT={BASECH,rebuildNames,S,$,$$,el,esc,fmt,toast,copy,clamp,r1,LS,BG,BGS,CSSBG,FXS,SV,DLG_RE,MK,POS_RE,buildItems,buildPanel,layoutPanel,renderItem,compile,charId,charName,applyCasts,startPlay,showTab,setSrc,undo,redo,on,emit,parseDialogue,newPanel,renderChars,endingList};
emit('ready');
})();
