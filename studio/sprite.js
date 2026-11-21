/* =========================================================
   내 캐릭터 만들기: 프로필 프롬프트(GPT) → 스프라이트 시트 프롬프트 →
   시트 사진 업로드 → 배경 제거·격자 자르기·표정 자동 배정 → 캐릭터로 저장
   ========================================================= */
(function(){
'use strict';
const W=window.WT; if(!W) return;
const {S,$,$$,el,esc,toast,copy,LS}=W;

const EXN={n:'보통',calm:'차분',smile:'미소',grin:'씨익',blank:'멍',shy:'수줍',panic:'당황',shock:'충격',dead:'절망',deadsweat:'식은땀',angry:'화남',sad:'슬픔',cry:'울음',menace:'위압',smirk:'비웃',hurt:'상처',think:'생각',gloom:'우울'};
const EN={n:'neutral calm face',calm:'calm composed',smile:'warm gentle smile',grin:'big grin',blank:'blank dazed stare',shy:'shy blushing, looking away',panic:'flustered panicking, sweat drop',shock:'shocked, eyes wide, mouth open',dead:'despair, hollow eyes',deadsweat:'cold sweat, nervous smile',angry:'angry, furrowed brows',sad:'sad, downcast eyes',cry:'crying, tears streaming',menace:'menacing cold glare, shadowed eyes',smirk:'smug smirk, one brow raised',hurt:'hurt, trembling lip',think:'thinking, finger on chin',gloom:'gloomy, dark vertical lines over face'};
const LAYOUTS={ '3x3':['n','smile','shy','panic','shock','angry','sad','cry','smirk'],
 '4x3':['n','smile','grin','shy','panic','shock','angry','sad','cry','smirk','think','menace'],
 '4x4':['n','calm','smile','grin','blank','shy','panic','shock','dead','angry','sad','cry','menace','smirk','hurt','think'],
 '2x2':['n','smile','angry','sad'] };
const FALL={calm:['n'],grin:['smile'],blank:['n','calm'],deadsweat:['dead','panic','sad'],dead:['sad','shock'],menace:['angry','smirk'],smirk:['smile','grin'],hurt:['sad'],think:['n','calm'],gloom:['sad','dead'],shy:['smile'],panic:['shock'],cry:['sad'],sad:['hurt'],angry:['menace'],shock:['panic'],smile:['n'],n:['calm'],};

/* ───────── 저장소 (IndexedDB, 실패 시 메모리) ───────── */
const mem={}; let db=null;
function idb(){return new Promise(res=>{try{const r=indexedDB.open('wt_sprites',2);r.onupgradeneeded=()=>{const d=r.result;if(!d.objectStoreNames.contains('c'))d.createObjectStore('c',{keyPath:'id'});if(!d.objectStoreNames.contains('a'))d.createObjectStore('a',{keyPath:'id'});};r.onsuccess=()=>{db=r.result;res(db);};r.onerror=()=>res(null);}catch(e){res(null);}});}
const dbAll=()=>new Promise(res=>{if(!db)return res(Object.values(mem));try{const q=db.transaction('c').objectStore('c').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([]);}catch(e){res([]);}});
const dbPut=r=>new Promise(res=>{mem[r.id]=r;if(!db)return res();try{const t=db.transaction('c','readwrite');t.objectStore('c').put(r);t.oncomplete=()=>res();t.onerror=()=>res();}catch(e){res();}});
const dbDel=id=>new Promise(res=>{delete mem[id];if(!db)return res();try{const t=db.transaction('c','readwrite');t.objectStore('c').delete(id);t.oncomplete=()=>res();t.onerror=()=>res();}catch(e){res();}});

/* ───────── 렌더 연동: charSVG 가로채기 ───────── */
const origSVG=window.charSVG;
function resolve(spr,key){
  if(spr[key]) return spr[key];
  const seen=new Set([key]); const q=(FALL[key]||[]).concat(['n','calm','smile']);
  for(const k of q){ if(spr[k]) return spr[k]; }
  return Object.values(spr)[0];
}
window.charSVG=function(id,exprStr){
  const c=window.CHARS[id];
  if(c&&c.spr&&Object.keys(c.spr).length){
    const parts=String(exprStr||'n').split('+'); const url=resolve(c.spr,parts[0]);
    const mods=parts.slice(1);
    let ov='';
    if(mods.includes('sweat')) ov+=`<path d="M158,52 q9,14 0,22 q-9,-8 0,-22z" fill="#c4e8ff" stroke="#4f7d99" stroke-width="1.8"/>`;
    if(mods.includes('shadow')||mods.includes('gloom')) ov+=`<rect x="0" y="40" width="200" height="222" fill="#2a1c35" opacity=".28"/>`;
    return `<svg viewBox="0 0 200 262" xmlns="http://www.w3.org/2000/svg"><image href="${url}" x="0" y="40" width="200" height="222" preserveAspectRatio="xMidYMax meet"/>${ov}</svg>`;
  }
  return origSVG(id,exprStr);
};
function applySprite(rec){
  let c=window.CHARS[rec.id];
  if(!c){ c=Object.assign({},W.BASECH[rec.male?'jun':'seo']||Object.values(W.BASECH)[0],{name:rec.name}); window.CHARS[rec.id]=c; W.BASECH[rec.id]=c; }
  c.spr=rec.cells; c.sprUser=true; if(rec.name&&!BUILTIN.has(rec.id)) c.name=rec.name;
  W.rebuildNames();
}
function removeSprite(id){
  const c=window.CHARS[id]; if(!c) return;
  delete c.spr; delete c.sprUser;
  if(!BUILTIN.has(id)){ delete window.CHARS[id]; delete W.BASECH[id]; }
  W.rebuildNames();
}
const BUILTIN=new Set(Object.keys(W.BASECH));

/* ───────── 프로필 ───────── */
const FIELDS=[['name','이름','예: 한서윤'],['gender','성별','여 / 남'],['age','나이·학년','예: 고2'],['hair','머리','예: 검은 긴 생머리, 앞머리 없음'],['eyes','눈','예: 큰 갈색 눈, 약간 처진 눈매'],['outfit','옷','예: 남색 교복 블레이저, 빨간 리본'],['trait','성격·분위기','예: 누구에게나 친절하지만 주인공에게만 차갑다'],['extra','특징','예: 왼쪽 머리핀, 안경 없음']];
const STYLES=['한국 웹툰 스타일(깔끔한 선, 셀 셰이딩)','소녀만화 스타일(큰 눈, 반짝임)','소년만화 스타일(굵은 선)','로맨스 판타지 일러스트 스타일','단순한 2D 플랫 스타일'];
let P=Object.assign({name:'',gender:'',age:'',hair:'',eyes:'',outfit:'',trait:'',extra:'',style:STYLES[0],layout:'3x3',concept:''},LS.get('wt_prof',{}));
const saveP=()=>LS.set('wt_prof',P);

function promptProfile(){
  return `웹툰에 나올 캐릭터 프로필을 만들어 줘.

[내가 원하는 캐릭터]
${P.concept||'(여기에 캐릭터 설명을 적어 주세요)'}

반드시 아래 형식으로만, 한 줄에 하나씩 답해 줘. 다른 설명은 넣지 마.
이름:
성별: (여 또는 남)
나이:
머리: (색, 길이, 모양을 그림으로 그릴 수 있게 구체적으로)
눈:
옷: (매일 같은 옷으로 고정)
성격:
특징: (머리핀, 점, 안경 등 항상 같은 소품)`;
}
function parseProfile(txt){
  const map={이름:'name',성별:'gender',나이:'age',학년:'age',머리:'hair',헤어:'hair',눈:'eyes',옷:'outfit',복장:'outfit',성격:'trait',분위기:'trait',특징:'extra',특이사항:'extra',소품:'extra'};
  let n=0; txt.split('\n').forEach(l=>{const m=l.match(/^\s*[-*•]?\s*\**\s*([가-힣·]+)\s*\**\s*[:：]\s*(.+)$/);if(!m)return;const k=map[m[1]];if(k){P[k]=m[2].replace(/\*+/g,'').replace(/\([^)]*\)\s*$/,'').trim()||m[2].trim();n++;}});
  saveP(); return n;
}
function promptSheet(){
  const ex=LAYOUTS[P.layout]; const [c,r]=P.layout.split('x').map(Number);
  const prof=[P.name&&`name: ${P.name}`,P.gender&&`gender: ${P.gender==='남'?'male':'female'}`,P.age&&`age: ${P.age}`,P.hair&&`hair: ${P.hair}`,P.eyes&&`eyes: ${P.eyes}`,P.outfit&&`outfit: ${P.outfit}`,P.trait&&`personality: ${P.trait}`,P.extra&&`signature details: ${P.extra}`].filter(Boolean).join('; ');
  return `Create ONE image: a character expression sprite sheet for a visual-novel / webtoon choice game.

CHARACTER: ${prof||'(describe your character)'}
ART STYLE: ${P.style}, clean line art, soft cel shading.

LAYOUT (very important):
- A strict grid of ${c} columns x ${r} rows = ${ex.length} cells, evenly spaced, same size.
- The SAME character in every cell: identical face shape, hairstyle, hair color, outfit and accessories.
- Bust-up (head and shoulders to chest), facing front, same size, same position and same camera angle in every cell.
- Plain pure white background, no gradient, no shadows on the ground, no frames, no panel borders, no text, no labels, no numbers.
- Leave clear white space between cells so characters never touch or overlap.

EXPRESSIONS, in reading order (left to right, top to bottom):
${ex.map((k,i)=>`${i+1}. ${EN[k]}`).join('\n')}

Only the expression changes between cells (eyes, brows, mouth, blush, sweat drops). Keep everything else identical. High resolution, square image.`;
}

/* ───────── 이미지 처리 ───────── */
const dist=(d,i,b)=>Math.abs(d[i]-b[0])+Math.abs(d[i+1]-b[1])+Math.abs(d[i+2]-b[2]);
function loadCanvas(file){return new Promise((res,rej)=>{const u=URL.createObjectURL(file);const im=new Image();im.onload=()=>{const k=Math.min(1,1800/Math.max(im.width,im.height));const c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(u);res(c);};im.onerror=()=>rej(new Error('이미지를 읽지 못했어요'));im.src=u;});}
function removeBg(src,tol){
  const c=document.createElement('canvas');c.width=src.width;c.height=src.height;const x=c.getContext('2d',{willReadFrequently:true});x.drawImage(src,0,0);
  const w=c.width,h=c.height,img=x.getImageData(0,0,w,h),d=img.data;
  const corner=[0,(w-1)*4,(h-1)*w*4,((h-1)*w+w-1)*4];
  if(corner.filter(i=>d[i+3]<20).length>=3) return c; // 이미 투명 배경
  const px=[]; corner.forEach(i=>px.push([d[i],d[i+1],d[i+2]]));
  const bg=[0,1,2].map(k=>px.map(p=>p[k]).sort((a,b)=>a-b)[1]);
  const T=tol*3, seen=new Uint8Array(w*h), q=new Int32Array(w*h); let qh=0,qt=0;
  const push=(p)=>{if(!seen[p]&&dist(d,p*4,bg)<=T){seen[p]=1;q[qt++]=p;}};
  for(let i=0;i<w;i++){push(i);push((h-1)*w+i);} for(let j=0;j<h;j++){push(j*w);push(j*w+w-1);}
  while(qh<qt){const p=q[qh++],x0=p%w,y0=(p/w)|0; if(x0>0)push(p-1); if(x0<w-1)push(p+1); if(y0>0)push(p-w); if(y0<h-1)push(p+w);}
  const soft=T*1.7;
  for(let p=0;p<w*h;p++){ if(seen[p]){d[p*4+3]=0;continue;}
    const x0=p%w,y0=(p/w)|0; let near=false;
    for(const o of [-1,1,-w,w]){const n=p+o; if(n>=0&&n<w*h&&seen[n]&&(Math.abs(o)===w||(o===-1?x0>0:x0<w-1))){near=true;break;}}
    if(near){const dd=dist(d,p*4,bg); if(dd<soft) d[p*4+3]=Math.max(0,Math.min(255,((dd-T)/(soft-T))*255));}
  }
  x.putImageData(img,0,0); return c;
}
function runs(counts,minGap){ // 내용 있는 구간 목록
  const r=[]; let s=-1,gap=0;
  for(let i=0;i<counts.length;i++){ if(counts[i]>0){ if(s<0)s=i; gap=0; } else if(s>=0){ gap++; if(gap>=minGap){ r.push([s,i-gap]); s=-1; gap=0; } } }
  if(s>=0) r.push([s,counts.length-1-gap>=s?counts.length-1-gap:counts.length-1]);
  return r.filter(a=>a[1]-a[0]>counts.length*0.04);
}
function detectGrid(c){
  const x=c.getContext('2d',{willReadFrequently:true}),w=c.width,h=c.height,d=x.getImageData(0,0,w,h).data;
  const col=new Array(w).fill(0),row=new Array(h).fill(0);
  for(let j=0;j<h;j++)for(let i=0;i<w;i++) if(d[(j*w+i)*4+3]>30){col[i]++;row[j]++;}
  const cr=runs(col,Math.max(4,w*0.006)), rr=runs(row,Math.max(4,h*0.006));
  return {cols:cr,rows:rr};
}
function cellsFromGrid(c,grid,mode){
  const w=c.width,h=c.height; let xs,ys;
  if(mode==='auto'){ const g=detectGrid(c); xs=g.cols; ys=g.rows; if(!xs.length||!ys.length||xs.length*ys.length<2||xs.length*ys.length>25){xs=null;} }
  if(mode!=='auto'||!xs){ const [cn,rn]=(mode==='auto'?'3x3':mode).split('x').map(Number); xs=[];ys=[]; for(let i=0;i<cn;i++)xs.push([Math.round(w*i/cn),Math.round(w*(i+1)/cn)-1]); for(let j=0;j<rn;j++)ys.push([Math.round(h*j/rn),Math.round(h*(j+1)/rn)-1]); }
  const out=[]; ys.forEach(y=>xs.forEach(xx=>out.push([xx[0],y[0],xx[1],y[1]])));
  return {rects:out,cols:xs.length,rows:ys.length};
}
function bbox(c,r){
  const x=c.getContext('2d',{willReadFrequently:true}); const w=r[2]-r[0]+1,h=r[3]-r[1]+1; const d=x.getImageData(r[0],r[1],w,h).data;
  let x0=w,y0=h,x1=-1,y1=-1; for(let j=0;j<h;j++)for(let i=0;i<w;i++) if(d[(j*w+i)*4+3]>40){if(i<x0)x0=i;if(i>x1)x1=i;if(j<y0)y0=j;if(j>y1)y1=j;}
  if(x1<0) return null; return [r[0]+x0,r[1]+y0,r[0]+x1,r[1]+y1];
}
function slice(c,mode,crop){
  const g=cellsFromGrid(c,null,mode); const boxes=g.rects.map(r=>bbox(c,r));
  const keep=boxes.map((b,i)=>b&&(b[2]-b[0]>c.width*0.03)&&(b[3]-b[1]>c.height*0.03)?{b,i}:null);
  const valid=keep.filter(Boolean); if(!valid.length) return {cells:[],cols:g.cols,rows:g.rows};
  const cut=b=>{const hh=b[3]-b[1]+1; return crop==='bust'?[b[0],b[1],b[2],b[1]+Math.round(hh*0.62)]:crop==='face'?[b[0],b[1],b[2],b[1]+Math.round(hh*0.4)]:b;};
  const B=valid.map(v=>cut(v.b)); const maxW=Math.max(...B.map(b=>b[2]-b[0]+1)),maxH=Math.max(...B.map(b=>b[3]-b[1]+1));
  const k=Math.min(1,560/Math.max(maxW,maxH)); const cw=Math.max(8,Math.round(maxW*k)),ch=Math.max(8,Math.round(maxH*k));
  const cells=valid.map((v,n)=>{const b=B[n],o=document.createElement('canvas');o.width=cw;o.height=ch;const bw=(b[2]-b[0]+1)*k,bh=(b[3]-b[1]+1)*k;
    o.getContext('2d').drawImage(c,b[0],b[1],b[2]-b[0]+1,b[3]-b[1]+1,(cw-bw)/2,ch-bh,bw,bh); return {idx:v.i,url:o.toDataURL('image/png')};});
  return {cells,cols:g.cols,rows:g.rows};
}


const PRESET={
 seo:{name:'서윤',gender:'여',age:'고2',hair:'어두운 보랏빛 도는 검은 긴 생머리, 지그재그 앞머리',eyes:'보랏빛 도는 갈색 큰 눈',outfit:'남색 교복 블레이저, 흰 셔츠, 빨간 리본',trait:'모두에게 친절한 학교의 전설. 주인공에게만 차갑다',extra:'분홍색 머리핀'},
 jun:{name:'이준',gender:'남',age:'고2',hair:'짧은 진갈색 머리, 삐죽한 앞머리',eyes:'갈색 눈',outfit:'남색 교복 블레이저, 흰 셔츠, 붉은 넥타이',trait:'평범하고 소심한 주인공',extra:'특별한 소품 없음'},
 doh:{name:'도하',gender:'여',age:'고2',hair:'주황빛 갈색 포니테일',eyes:'갈색 눈',outfit:'남색 교복 블레이저, 흰 셔츠, 빨간 리본',trait:'밝고 다정한 소꿉친구',extra:'머리끈'},
 cha:{name:'채린',gender:'여',age:'고2',hair:'연보라색 단발, 일자 앞머리',eyes:'보라색 눈',outfit:'남색 교복 블레이저, 흰 셔츠, 빨간 리본',trait:'당돌하고 직설적인 후배',extra:'노란 리본 머리 장식'},
 woo:{name:'우진',gender:'남',age:'고2',hair:'검은 짧은 머리',eyes:'검은 눈',outfit:'남색 교복 블레이저, 흰 셔츠, 붉은 넥타이',trait:'조용한 중학교 때부터의 친구',extra:'둥근 안경'},
 tae:{name:'태성',gender:'남',age:'고3',hair:'탈색한 금발 짧은 머리',eyes:'짙은 갈색 눈',outfit:'단추를 풀어헤친 교복 셔츠',trait:'학교 일진, 비웃는 태도',extra:'귀걸이'}
};
function usedChars(){
  const src=S.src; return Object.keys(window.CHARS).filter(id=>{const c=window.CHARS[id];if(c.mob)return false;
    return src.includes('@char '+id+' ')||src.includes('"'+id+'"')||src.includes('@char '+c.name+' ')||new RegExp('^\\s*'+c.name+'[*%!~$^]?:','m').test(src);});
}
function startFor(id){
  const pr=PRESET[id]; if(pr) Object.assign(P,pr); else {P.name=(window.CHARS[id]||{}).name||'';}
  saveP(); U.lay=null; U.target=id; U.src=null; U.sliced=null; U.tab='s'; sheet.classList.add('on'); paint();
}


/* ───────── 엑스트라 한 장 시트 (눈 안 보이게) ───────── */
const MOB_ORDER=['n','smile','grin','shy','panic','shock','angry','sad','cry','think','smirk','gloom'];
const MOBEN={n:'neutral, mouth closed',calm:'calm',smile:'smiling',grin:'laughing with open mouth',blank:'mouth slightly open, dazed',shy:'blushing cheeks, small smile',panic:'wavy flustered mouth, sweat drops',shock:'mouth wide open in shock, sweat',dead:'gloomy, mouth line, dark lines over face',deadsweat:'nervous, big sweat drop',angry:'angry vein mark, gritted teeth',sad:'mouth turned down',cry:'tears running down cheeks from under the bangs',menace:'dark shadow over upper face, evil grin',smirk:'smug smirk',hurt:'trembling mouth',think:'hand on chin, mouth pursed',gloom:'vertical gloom lines over head'};
function mobExprs(){
  const used=new Set(); const ids=Object.keys(window.CHARS).filter(i=>window.CHARS[i].mob);
  S.src.split('\n').forEach(l=>{const m=l.match(/^\s*@char\s+(\S+)\s+(\S+)/);if(m&&ids.includes(m[1]))used.add(m[2].split('+')[0]);});
  const list=MOB_ORDER.filter(k=>used.has(k)).concat([...used].filter(k=>!MOB_ORDER.includes(k)));
  for(const k of MOB_ORDER){if(list.length>=9)break;if(!list.includes(k))list.push(k);}
  return list.slice(0,12);
}
function promptMob(list,kinds){
  const cols=list.length<=4?2:list.length<=9?3:4, rows=Math.ceil(list.length/cols);
  const who={m:'a generic male student extra (short plain hair, navy school blazer, tie)',g:'a generic female student extra (plain bob hair, navy school blazer, ribbon)'};
  return kinds.map(k=>`Create ONE image: an expression sprite sheet of ${who[k]} for a Korean webtoon. This is a background EXTRA (mob character), not a main character.

STYLE: ${P.style||'Korean webtoon style'}, clean line art, soft cel shading, slightly muted colors so they stay in the background.

EYES MUST NOT BE VISIBLE in any cell: the eyes are completely hidden under thick bangs / a soft shadow over the upper face. Show emotion ONLY with the mouth, blush, sweat drops, tears, vein marks and manga symbols.

LAYOUT: strict grid of ${cols} columns x ${rows} rows, evenly spaced, same size cells. Same character in every cell, bust-up, facing front, same size and position. Plain pure white background, no borders, no text, no numbers, clear white gaps between cells.

EXPRESSIONS in reading order (left to right, top to bottom):
${list.map((k,i)=>`${i+1}. ${MOBEN[k]||k}`).join('\n')}`).join('\n\n---\n\n');
}
function openMob(){
  const list=mobExprs(); const kinds=['m','g'];
  box.innerHTML=`<h2>엑스트라 표정 시트</h2><div class="sm" style="line-height:1.6">대본에서 엑스트라(반애들)가 쓰는 표정 ${list.length}개를 모아 한 장 시트 요청문을 만들어요. <b>눈은 앞머리·그림자로 가려서</b> 입·홍조·땀으로만 감정을 보여줘요.</div>
  <div class="sm" style="margin-top:8px">${list.map((k,i)=>`${i+1}.${EXN[k]||k}`).join(' · ')}</div>
  <div class="row" style="margin-top:8px"><label class="sm"><input type="checkbox" id="mk_m" checked> 남학생</label><label class="sm"><input type="checkbox" id="mk_g" checked> 여학생</label></div>
  <pre class="code" id="mobp" style="max-height:30vh;overflow:auto;white-space:pre-wrap;font-size:11px"></pre>
  <div class="row"><button class="btn" id="mobCp" type="button">요청문 복사</button><button class="btn ghost" id="mobUpM" type="button">남학생 시트 올리기</button><button class="btn ghost" id="mobUpG" type="button">여학생 시트 올리기</button></div>
  <div class="sm" style="margin-top:8px">남녀를 따로 한 장씩 그리게 해요. 올리면 칸이 자동으로 나뉘고 표정 이름이 위 순서대로 붙어요.</div>`;
  const ks=()=>['m','g'].filter(k=>$('#mk_'+k,box).checked);
  const upd=()=>$('#mobp',box).textContent=promptMob(list,ks());
  upd(); $('#mk_m',box).onchange=upd; $('#mk_g',box).onchange=upd;
  $('#mobCp',box).onclick=()=>copy(promptMob(list,ks()));
  const go=id=>{U.lay=list;U.target=id;U.src=null;U.sliced=null;U.tab='u';paint();setTimeout(()=>$('#sf',box)&&$('#sf',box).click(),50);};
  $('#mobUpM',box).onclick=()=>go('mob'); $('#mobUpG',box).onclick=()=>go('mobg');
  sheet.classList.add('on');
}

/* ───────── UI ───────── */
const sheet=el('div','sheet'); sheet.innerHTML='<div class="box"></div>'; document.body.appendChild(sheet);
sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.classList.remove('on');});
const box=$('.box',sheet);
const U={tab:'p',src:null,clean:null,tol:34,mode:'auto',crop:'full',sliced:null,assign:[],drop:new Set(),target:'',male:false,busy:false};
const TABS=[['p','① 프로필'],['s','② 그림 요청문'],['u','③ 시트 올리기'],['m','내 캐릭터']];
const inp=(k,ph,v)=>`<input class="search" data-pf="${k}" placeholder="${esc(ph)}" value="${esc(v)}" style="margin-top:5px">`;
function paint(){
  let h=`<div class="seg">${TABS.map(([k,n])=>`<button type="button" class="chip${U.tab===k?' on':''}" data-tab="${k}">${n}</button>`).join('')}</div>`;
  if(U.tab==='p'){
    h+=`<div class="sm" style="margin-top:10px;line-height:1.6">캐릭터 설명을 한두 줄 적고 <b>요청문을 복사</b>해서 ChatGPT에 붙여 넣으세요. 답변을 아래에 붙이면 칸이 자동으로 채워져요. 직접 적어도 돼요.</div>
    <textarea class="search" data-pf="concept" rows="3" placeholder="예: 모두에게 친절한 학원물 여주. 주인공에게만 차갑다." style="margin-top:8px;resize:vertical">${esc(P.concept)}</textarea>
    <div class="row" style="margin-top:8px"><button class="btn sm2" id="cpP" type="button">GPT용 프로필 요청문 복사</button></div>
    <textarea class="search" id="paste" rows="3" placeholder="GPT 답변을 여기에 붙여 넣기" style="margin-top:10px;resize:vertical"></textarea>
    <div class="row" style="margin-top:6px"><button class="btn ghost sm2" id="fillP" type="button">자동으로 칸 채우기</button></div>
    <h3>프로필</h3>${FIELDS.map(([k,n,ph])=>`<div class="sm" style="margin-top:6px">${n}</div>${inp(k,ph,P[k])}`).join('')}
    <div class="row" style="margin-top:12px"><button class="btn" data-tab="s" type="button">다음: 그림 요청문 →</button></div>`;
  } else if(U.tab==='s'){
    h+=`<div class="sm" style="margin-top:10px;line-height:1.6">표정을 한 장에 모은 <b>스프라이트 시트</b>를 그리게 하는 요청문이에요. ChatGPT에 붙여 넣어 이미지를 만들고, 저장한 뒤 ③에서 올리세요.</div>
    <div class="sm" style="margin-top:10px">그림체</div><select data-pf="style" style="width:100%;margin-top:4px">${STYLES.map(s=>`<option ${P.style===s?'selected':''}>${esc(s)}</option>`).join('')}</select>
    <div class="sm" style="margin-top:10px">표정 개수</div><div class="seg">${Object.keys(LAYOUTS).map(k=>`<button type="button" class="chip${P.layout===k?' on':''}" data-lay="${k}">${LAYOUTS[k].length}종 (${k})</button>`).join('')}</div>
    <div class="sm" style="margin-top:6px">${LAYOUTS[P.layout].map((k,i)=>`${i+1}.${EXN[k]}`).join(' · ')}</div>
    <pre class="code" id="spp" style="max-height:34vh;overflow:auto;white-space:pre-wrap;font-size:11px">${esc(promptSheet())}</pre>
    <div class="row"><button class="btn" id="cpS" type="button">요청문 복사</button><button class="btn ghost" data-tab="u" type="button">③ 시트 올리기 →</button></div>
    <div class="sm" style="margin-top:8px">팁: 한 번에 안 맞으면 "같은 캐릭터로, 격자 간격을 더 넓혀서 다시"라고 말하세요.</div>`;
  } else if(U.tab==='u'){
    h+=`<div class="sm" style="margin-top:10px;line-height:1.6">시트 이미지를 올리면 <b>배경 제거 → 칸 나누기 → 표정 이름 붙이기</b>를 자동으로 해요. 잘못된 칸은 아래에서 고칠 수 있어요.</div>
    <div class="row" style="margin-top:10px"><button class="btn" id="pick" type="button">📷 시트 이미지 고르기</button><input type="file" id="sf" accept="image/*" hidden></div>
    <div id="up"></div>`;
  } else {
    h+=`<div id="mine" style="margin-top:10px"></div>`;
  }
  box.innerHTML=h;
  if(U.tab==='u'&&U.src) paintUp();
  if(U.tab==='m') paintMine();
}
function paintUp(){
  const up=$('#up',box); if(!up) return;
  const chars=Object.keys(window.CHARS);
  const lay=LAYOUTS[P.layout]; const ex=Object.keys(EXN);
  let h=`<div class="card" style="margin-top:10px"><div class="sm">배경 제거 강도 <b id="tv">${U.tol}</b> <span class="sm">(윤곽이 지워지면 낮게, 배경이 남으면 높게)</span></div><input type="range" id="tol" min="6" max="90" value="${U.tol}" style="width:100%">
   <div class="sm" style="margin-top:8px">칸 나누기</div><div class="seg">${['auto','2x2','3x2','3x3','4x3','3x4','4x4','5x2'].map(m=>`<button type="button" class="chip${U.mode===m?' on':''}" data-gm="${m}">${m==='auto'?'자동':m}</button>`).join('')}</div>
   <div class="sm" style="margin-top:8px">자르기</div><div class="seg">${[['full','전체'],['bust','상반신'],['face','얼굴 위주']].map(([k,n])=>`<button type="button" class="chip${U.crop===k?' on':''}" data-cr="${k}">${n}</button>`).join('')}</div></div>`;
  if(U.busy) h+=`<div class="sm" style="margin:12px">처리 중…</div>`;
  else if(U.sliced){
    if(!U.sliced.cells.length) h+=`<div class="sm" style="margin:12px">캐릭터를 찾지 못했어요. 배경 제거 강도나 칸 나누기를 바꿔 보세요.</div>`;
    else{
      h+=`<div class="sm" style="margin:10px 0 4px">${U.sliced.cells.length}칸을 찾았어요 (${U.sliced.cols}×${U.sliced.rows}). 표정 이름을 확인하세요.</div><div class="mgrid" style="grid-template-columns:repeat(3,1fr)">`;
      U.sliced.cells.forEach((c,n)=>{const on=!U.drop.has(n);h+=`<div style="background:repeating-conic-gradient(#e9e9e9 0 25%,#fff 0 50%) 0 0/14px 14px;opacity:${on?1:.3};padding:4px"><img src="${c.url}" style="height:96px"><select data-as="${n}" style="width:100%;margin-top:3px">${ex.map(k=>`<option value="${k}" ${U.assign[n]===k?'selected':''}>${EXN[k]}</option>`).join('')}</select><button type="button" class="chip" data-dr="${n}" style="margin-top:3px;width:100%">${on?'빼기':'넣기'}</button></div>`;});
      h+=`</div><h3>저장</h3><div class="sm">이름</div>${inp('name','캐릭터 이름',P.name)}
       <div class="sm" style="margin-top:8px">저장 방식</div><select id="tg" style="width:100%;margin-top:4px"><option value="">새 캐릭터로 추가</option>${chars.map(i=>`<option value="${i}" ${U.target===i?'selected':''}>${esc(window.CHARS[i].name)} 의 그림을 교체 (${i})</option>`).join('')}</select>
       <div class="row" style="margin-top:12px"><button class="btn" id="saveC" type="button">캐릭터로 저장</button></div>`;
    }
  }
  up.innerHTML=h;
}
async function process(){
  if(!U.src) return; U.busy=true; paintUp();
  await new Promise(r=>setTimeout(r,30));
  try{ U.clean=removeBg(U.src,U.tol); U.sliced=slice(U.clean,U.mode,U.crop);
    const lay=U.lay||LAYOUTS[P.layout]; const all=Object.keys(EXN);
    U.assign=U.sliced.cells.map((c,n)=>{ // 격자 위치 순서 = 표정 순서
      const k=lay[c.idx]; return k||all[n%all.length]; }); U.drop=new Set();
  }catch(e){ U.sliced={cells:[],cols:0,rows:0}; toast('처리 오류: '+e.message); }
  U.busy=false; paintUp();
}
async function saveChar(){
  const name=(P.name||'').trim(); const target=$('#tg',box).value;
  if(!name&&!target) return toast('이름을 입력해 주세요');
  const cells={}; U.sliced.cells.forEach((c,n)=>{if(!U.drop.has(n)) cells[U.assign[n]]=c.url;});
  if(!Object.keys(cells).length) return toast('넣을 칸이 없어요');
  const id=target||('u_'+Date.now().toString(36)); const rec={id,name:target?window.CHARS[target].name:name,cells,male:/남/.test(P.gender)};
  await dbPut(rec); applySprite(rec);
  toast(`${rec.name} 저장 완료 · 표정 ${Object.keys(cells).length}개`); U.tab='m'; paint();
  try{W.renderChars();}catch(e){} if(S.tab==='play') W.startPlay();
}
function paintMine(){
  const m=$('#mine',box); const ids=Object.keys(window.CHARS).filter(i=>window.CHARS[i].sprUser);
  if(!ids.length){ m.innerHTML=`<div class="sm" style="line-height:1.6">아직 올린 캐릭터가 없어요. ①→②→③ 순서로 만들어 보세요.<br>올린 그림은 이 기기 브라우저에 저장돼요.</div>`; return; }
  m.innerHTML=ids.map(i=>{const c=window.CHARS[i];return `<div class="card" style="margin-top:8px"><div class="row" style="align-items:center"><div style="width:70px">${window.charSVG(i,'smile')}</div><div style="flex:1"><b>${esc(c.name)}</b> <span class="code">${esc(i)}</span><div class="sm">표정 ${Object.keys(c.spr).length}개: ${Object.keys(c.spr).map(k=>EXN[k]||k).join(' ')}</div></div><button class="chip" data-del="${i}" type="button">삭제</button></div></div>`;}).join('');
}

box.addEventListener('click',async e=>{
  const t=e.target.closest('[data-tab],[data-lay],[data-gm],[data-cr],[data-dr],[data-del],#cpP,#fillP,#cpS,#pick,#saveC'); if(!t) return; const d=t.dataset;
  if(d.tab){U.tab=d.tab;return paint();}
  if(d.lay){P.layout=d.lay;saveP();return paint();}
  if(d.gm){U.mode=d.gm;return process();}
  if(d.cr){U.crop=d.cr;return process();}
  if(d.dr!=null){const n=+d.dr;U.drop.has(n)?U.drop.delete(n):U.drop.add(n);return paintUp();}
  if(d.del){await dbDel(d.del);removeSprite(d.del);toast('삭제했어요');paintMine();try{W.renderChars();}catch(e){}return;}
  if(t.id==='cpP'){return copy(promptProfile());}
  if(t.id==='cpS'){return copy(promptSheet());}
  if(t.id==='fillP'){const n=parseProfile($('#paste',box).value);toast(n?`${n}칸을 채웠어요`:'형식을 못 찾았어요 (이름: … 형태여야 해요)');return paint();}
  if(t.id==='pick'){return $('#sf',box).click();}
  if(t.id==='saveC'){return saveChar();}
});
box.addEventListener('input',e=>{const t=e.target; if(t.id==='tol'){U.tol=+t.value;$('#tv',box).textContent=t.value;clearTimeout(U.tt);U.tt=setTimeout(process,250);return;} const k=t.dataset.pf; if(k&&!t.matches('select')){P[k]=t.value;saveP();if(k==='concept'){} } });
box.addEventListener('change',async e=>{const t=e.target;
  if(t.id==='sf'&&t.files[0]){try{U.src=await loadCanvas(t.files[0]);U.sliced=null;paint();process();}catch(err){toast(err.message);}return;}
  if(t.dataset.pf==='style'){P.style=t.value;saveP();const pre=$('#spp',box);if(pre)pre.textContent=promptSheet();return;}
  if(t.dataset.as!=null){U.assign[+t.dataset.as]=t.value;return;}
  if(t.id==='tg'){U.target=t.value;return;}
});
function open(tab){ U.lay=null; if(tab)U.tab=tab; paint(); sheet.classList.add('on'); }

/* 캐릭터 탭에 진입 버튼 삽입 */
const host=$('#chars');
function inject(){ if($('#mkChar',host)||!host.firstElementChild) return;
  const b=el('div','card'); b.id='mkChar'; b.innerHTML=`<b style="font-family:'Gowun Batang'">🎨 내 캐릭터 만들기</b><div class="sm" style="margin-top:4px;line-height:1.5">GPT로 프로필·표정 시트를 만들고, 사진을 올리면 자동으로 편집해 캐릭터로 써요.</div><div class="sm" style="margin-top:10px"><b>지금 만화의 등장인물</b> — 눌러서 그림을 바꿔요</div><div class="row" id="usedRow" style="margin-top:6px;gap:8px;flex-wrap:wrap"></div><div class="row" style="margin-top:10px"><button class="btn sm2" data-o="p" type="button">새 캐릭터 만들기</button><button class="btn ghost sm2" data-o="u" type="button">시트 바로 올리기</button><button class="chip" data-o="m" type="button">내 캐릭터</button><button class="chip" data-o="mob" type="button">👥 엑스트라 시트</button></div>`;
  host.insertBefore(b,host.firstElementChild);
  $('#usedRow',b).innerHTML=usedChars().map(id=>`<button type="button" data-st="${id}" style="width:64px;background:var(--paper);border:1px solid var(--line);border-radius:10px;padding:3px;font:inherit;font-size:11px;color:inherit">${window.charSVG(id,'smile')}${esc(window.CHARS[id].name)}${window.CHARS[id].sprUser?' ✓':''}</button>`).join('')||'<span class="sm">등장인물 없음</span>'; }
new MutationObserver(()=>inject()).observe(host,{childList:true});
host.addEventListener('click',e=>{const st=e.target.closest('[data-st]');if(st)return startFor(st.dataset.st);const b=e.target.closest('[data-o]');if(b)return b.dataset.o==='mob'?openMob():open(b.dataset.o);});

/* ───────── 컷 그림 저장 ───────── */
window.ARTS=window.ARTS||{};
const artPut=(id,url)=>new Promise(res=>{window.ARTS[id]=url;if(!db)return res();try{const t=db.transaction('a','readwrite');t.objectStore('a').put({id,url});t.oncomplete=()=>res();t.onerror=()=>res();}catch(e){res();}});
const artAll=()=>new Promise(res=>{if(!db)return res([]);try{const q=db.transaction('a').objectStore('a').getAll();q.onsuccess=()=>res(q.result||[]);q.onerror=()=>res([]);}catch(e){res([]);}});
async function artFromFile(file){const c=await loadCanvas(file);const k=Math.min(1,1100/c.width);const o=document.createElement('canvas');o.width=Math.round(c.width*k);o.height=Math.round(c.height*k);o.getContext('2d').drawImage(c,0,0,o.width,o.height);const url=o.toDataURL('image/jpeg',.86);const id='a'+Date.now().toString(36);await artPut(id,url);return {id,ratio:o.height/o.width};}
const EXK={n:'neutral',calm:'calm',smile:'gentle smile',grin:'big grin',blank:'blank stare',shy:'shy, blushing, looking away',panic:'flustered, panicking',shock:'shocked, eyes wide',dead:'despair, hollow eyes',deadsweat:'nervous cold sweat',angry:'angry',sad:'sad',cry:'crying',menace:'menacing glare, shadowed eyes',smirk:'smug smirk',hurt:'hurt',think:'thinking',gloom:'gloomy, dark lines'};
const BGK={white:'plain white background',class:'Korean high school classroom with big windows, daytime',hall:'school hallway',roof:'school rooftop with fence, blue sky',road:'street on the way home',cafe:'cozy cafe',night:'night street with streetlights',home:'bedroom at home',gym:'school gym',pink:'soft pink abstract romantic background',sepia:'sepia flashback tone',dark:'dark abstract background',grey:'grey gloomy abstract background',shock:'dramatic shock background with radial lines'};
const FXK={lines:'speed/concentration lines',gloom:'gloomy vertical lines',sparkle:'sparkles',flowers:'floating flowers (shoujo manga effect)',vignette:'dark vignette'};
function lookOf(id){const c=window.CHARS[id]||{};const p=PRESET[id]||(c.name===P.name?P:null);if(!p)return `${c.name||id}${c.male?' (male)':' (female)'} high school student in navy blazer uniform`;return `${p.name} (${p.gender==='남'?'male':'female'}, ${p.age}): hair ${p.hair}; eyes ${p.eyes}; outfit ${p.outfit}; ${p.extra}`;}
function cutPrompt(lines){
  const items=W.buildItems(lines.filter(l=>l.trim()&&!/^\s*([*+]|->|~|VAR\b|===)/.test(l)),false,()=>{});
  const pans=items.filter(i=>i.t==='panel'); if(!pans.length) return '';
  const ratio=h=>{const r=[[0.5,'2:1 wide'],[0.62,'16:10 wide'],[0.75,'4:3'],[1,'1:1 square'],[1.33,'3:4 tall'],[1.6,'5:8 tall'],[2,'1:2 very tall']];let b=r[0];r.forEach(x=>{if(Math.abs(x[0]-h)<Math.abs(b[0]-h))b=x;});return b[1];};
  const one=(m,i)=>{const cs=m.chars.map(c=>{const pos=c.x<40?'left':c.x>60?'right':'center';const sz=c.s>=1.6?'extreme close-up of face':c.s>=1.2?'close-up':'bust shot';const ex=String(c.expr).split('+');return `- ${pos}, ${sz}${c.flip?', facing left':''}: ${lookOf(c.id)}. Expression: ${ex.map(e=>EXK[e]||e).join(', ')}`;}).join('\n')||'- no characters (scenery only)';
    const said=m.bubbles.filter(b=>b.text).map(b=>`${b.who?b.who+': ':''}${String(b.text).replace(/<br>/g,' ')}`).join(' / ');
    return `${pans.length>1?`PANEL ${i+1}\n`:''}Aspect ratio ${ratio(m.h||1)}.
Background: ${BGK[m.bg]||m.bg}.${m.fx.length?`\nEffects: ${m.fx.map(f=>FXK[f]||f).join(', ')}.`:''}
Characters:
${cs}${said?`\nMood/what is happening (do NOT draw this text): ${said}`:''}${m.note?`\nDirector note: ${m.note}`:''}`;};
  return `Draw ${pans.length>1?pans.length+' separate webtoon panel images':'one webtoon panel'} in ${P.style||'Korean webtoon style'}, clean line art, cel shading, full color.
NO speech bubbles, NO text, NO sound effect letters, NO panel border — I will add them myself. Leave some empty space near the top for speech bubbles.
Keep each character's design exactly consistent with the description.

${pans.map(one).join('\n\n')}`;
}

/* 저장된 그림 복원 */
idb().then(async()=>{(await artAll()).forEach(a=>window.ARTS[a.id]=a.url);return dbAll();}).then(list=>{ if(!list.length) return; list.forEach(applySprite); try{W.renderChars();}catch(e){} if(S.tab==='play'||!S.tab) W.startPlay(); }).then(()=>{if(Object.keys(window.ARTS).length&&(S.tab==='play'||!S.tab))W.startPlay();});
inject();
window.WTSprite={cutPrompt,artFromFile,lookOf,removeBg,slice,detectGrid,promptSheet,promptProfile,parseProfile,P,open};
})();
