/* =========================================================
   캐릭터 일러스트 (SVG 흉상) + 표정 시스템
   charSVG('seo', 'blank+blush') 처럼 호출
   ========================================================= */
(function(){
const L = '#3b2a26';           // 선 색
let uid = 0;

const CH = {
  jun:  {name:'이준',  male:1, hair:'#3a2e2a', iris:'#4a3428', back:'short', front:'jun',  tie:1},
  seo:  {name:'서윤',  hair:'#2a2330', iris:'#6a3f55', back:'long',  front:'seo',  pin:1},
  doh:  {name:'도하',  hair:'#b9672c', iris:'#7a4a22', back:'pony',  front:'doh'},
  doh2: {name:'도하',  hair:'#b9672c', iris:'#7a4a22', back:'wavy',  front:'doh',  lip:1, coat:'#ead6b6'},
  cha:  {name:'채린',  hair:'#9583c8', iris:'#5b48a6', back:'bob',   front:'cha',  bow:1},
  woo:  {name:'우진',  male:1, hair:'#1f2328', iris:'#2a2a2a', back:'short', front:'woo', glasses:1, tie:1},
  tae:  {name:'태성',  male:1, hair:'#e2c46a', iris:'#4a3a2a', back:'short', front:'tae', open:1, ear:1},
  mob:  {name:'반애들', male:1, hair:'#9d968f', iris:'#777', back:'short', front:'jun', tie:1, mob:1},
  mobg: {name:'반애들', hair:'#a9a19a', iris:'#777', back:'bob', front:'cha', mob:1},
};

const PRESET = {
  n:     {eye:'n', brow:'n', mouth:'smile'},
  calm:  {eye:'n', brow:'n', mouth:'line'},
  smile: {eye:'smile', brow:'n', mouth:'smile'},
  grin:  {eye:'smile', brow:'n', mouth:'grin'},
  blank: {eye:'blank', brow:'flat', mouth:'line'},
  shy:   {eye:'n', brow:'worry', mouth:'wavy', blush:1},
  panic: {eye:'swirl', brow:'worry', mouth:'wavy', blush:1, sweat:1},
  shock: {eye:'shock', brow:'worry', mouth:'open', sweat:1},
  dead:  {eye:'dot', brow:'n', mouth:'line'},
  deadsweat:{eye:'dot', brow:'worry', mouth:'wavy', sweat:1},
  angry: {eye:'n', brow:'angry', mouth:'shout', anger:1},
  sad:   {eye:'n', brow:'worry', mouth:'frown'},
  cry:   {eye:'n', brow:'worry', mouth:'frown', tear:1},
  menace:{eye:'n', brow:'n', mouth:'smile', shadow:1},
  smirk: {eye:'blank', brow:'angry', mouth:'smirk'},
  hurt:  {eye:'closed', brow:'worry', mouth:'frown', sweat:1},
  think: {eye:'n', brow:'n', mouth:'o'},
  gloom: {eye:'blank', brow:'worry', mouth:'frown', gloom:1},
};
function parse(str){
  const parts = (str||'calm').split('+');
  const e = Object.assign({}, PRESET[parts[0]] || PRESET.calm);
  parts.slice(1).forEach(m=>{
    if (PRESET[m]) Object.assign(e, PRESET[m]); else e[m] = 1;
  });
  if (e.smileM) e.mouth='smile';
  return e;
}

/* ---------- 머리 ---------- */
const BACK = {
  long: 'M56,100 C48,40 152,40 144,100 C150,150 156,200 166,240 Q100,256 34,240 C44,200 50,150 56,100Z',
  wavy: 'M56,100 C48,40 152,40 144,100 C154,140 144,170 160,214 C150,226 130,230 120,224 L80,224 C70,230 50,226 40,214 C56,170 46,140 56,100Z',
  bob:  'M54,100 C46,42 154,42 146,100 C150,130 154,152 150,170 Q130,178 118,160 L82,160 Q70,178 50,170 C46,152 50,130 54,100Z',
  pony: 'M60,100 C52,44 148,44 140,100Z M128,58 C180,46 190,124 168,182 C164,140 158,108 134,84Z',
  short:'M60,104 C50,44 150,44 140,104Z',
};
const FRONT = {
  seo: 'M60,108 C56,56 80,40 100,40 C122,40 146,54 140,108 C138,96 136,88 132,82 L128,98 L120,80 L113,97 L104,78 L96,97 L88,80 L80,98 L72,82 C68,90 63,98 60,108Z M64,96 C58,130 62,160 56,196 L66,188 C70,156 70,126 72,100Z M136,96 C142,130 138,160 144,196 L134,188 C130,156 130,126 128,100Z',
  doh: 'M60,108 C54,56 84,38 104,40 C132,42 150,64 140,108 C136,92 130,80 120,74 C108,86 88,94 70,98 C66,102 63,105 60,108Z M64,96 C60,120 62,140 58,160 L68,150 C70,130 70,112 72,100Z',
  cha: 'M58,108 C54,54 82,38 100,40 C124,40 148,56 142,108 L136,92 L127,86 L118,99 L108,84 L97,99 L86,86 L75,99 L66,92Z',
  jun: 'M60,110 C54,56 84,36 102,38 C126,38 148,56 140,110 L134,90 L128,100 L120,82 L112,98 L104,80 L96,96 L88,82 L80,98 L72,86 L66,100Z',
  woo: 'M60,114 C54,54 84,36 102,38 C126,38 148,56 140,114 L134,102 L126,110 L118,98 L110,110 L100,96 L92,110 L84,98 L76,110 L68,102Z',
  tae: 'M60,106 C52,60 64,36 84,32 L80,14 L96,30 L104,10 L111,30 L125,14 L122,36 C144,44 150,70 140,106 L134,86 C120,78 96,78 72,84 C68,92 64,98 60,106Z',
};

/* ---------- 눈 ---------- */
function eye(cx, cy, k, c, side, skin){
  const g = !c.male;
  const ry = g?12.5:9, irx = g?8.5:7, iry = g?11:7.8;
  const lash = `M${cx-11},${cy-6} Q${cx},${cy-(g?15:12)} ${cx+11},${cy-7}`;
  const flick = g ? (side==='l' ? `M${cx-11},${cy-6} l-4,-3` : `M${cx+11},${cy-7} l4,-3`) : '';
  const full = () => `
    <ellipse cx="${cx}" cy="${cy+1}" rx="${g?10.5:9.5}" ry="${ry}" fill="#fff"/>
    <ellipse cx="${cx}" cy="${cy+2}" rx="${irx}" ry="${iry}" fill="${c.iris}"/>
    <ellipse cx="${cx}" cy="${cy+4}" rx="${irx-1.5}" ry="${iry*0.45}" fill="#fff" opacity=".18"/>
    <ellipse cx="${cx}" cy="${cy+2}" rx="3.6" ry="${iry*0.55}" fill="#1d1418"/>
    <circle cx="${cx+2.6}" cy="${cy-2.2}" r="${g?2.8:2.2}" fill="#fff"/>
    <circle cx="${cx-3}" cy="${cy+6}" r="1.2" fill="#fff" opacity=".85"/>`;
  const lashes = `<path d="${lash} ${flick}" stroke="#1d1418" stroke-width="${g?3.6:3}" fill="none" stroke-linecap="round"/>
    <path d="M${cx-6},${cy+ry+0.5} Q${cx},${cy+ry+2} ${cx+6},${cy+ry+0.5}" stroke="${L}" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  switch(k){
    case 'smile':  return `<path d="M${cx-9},${cy+3} Q${cx},${cy-8} ${cx+9},${cy+3}" stroke="#1d1418" stroke-width="3.2" fill="none" stroke-linecap="round"/>`;
    case 'closed': return `<path d="M${cx-9},${cy} Q${cx},${cy+6} ${cx+9},${cy}" stroke="#1d1418" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case 'dot':    return `<circle cx="${cx}" cy="${cy+2}" r="2.6" fill="#1d1418"/>`;
    case 'swirl':  return `<path d="M${cx},${cy+2} m-1,0 a1,1 0 1,1 2,0 a3,3 0 1,1 -5,0 a5,5 0 1,1 9,0 a7,7 0 1,1 -13,0" stroke="#1d1418" stroke-width="1.8" fill="none"/>`;
    case 'shock':  return `<ellipse cx="${cx}" cy="${cy+1}" rx="9.5" ry="${ry}" fill="#fff" stroke="${L}" stroke-width="1.4"/>
                           <circle cx="${cx}" cy="${cy+2}" r="2.4" fill="#1d1418"/>`;
    case 'blank':  return full() + `<rect x="${cx-13}" y="${cy-18}" width="26" height="${g?15:13}" fill="${skin}"/>
                           <path d="M${cx-11},${cy-3} L${cx+11},${cy-3.5} ${flick?'':''}" stroke="#1d1418" stroke-width="${g?3.4:3}" fill="none" stroke-linecap="round"/>
                           <path d="M${cx-6},${cy+ry+0.5} Q${cx},${cy+ry+2} ${cx+6},${cy+ry+0.5}" stroke="${L}" stroke-width="1.2" fill="none"/>`;
    default:       return full() + lashes;
  }
}
function brows(k, c){
  const col = c.mob ? '#7a736c' : '#2a1e1c', w = c.male?3.2:2.2;
  const one = (cx, s) => {
    switch(k){
      case 'angry': return s<0 ? `M${cx-9},91 L${cx+9},97` : `M${cx-9},97 L${cx+9},91`;
      case 'worry': return s<0 ? `M${cx-9},95 L${cx+9},89` : `M${cx-9},89 L${cx+9},95`;
      case 'flat':  return `M${cx-9},94 L${cx+9},94`;
      default:      return `M${cx-9},95 Q${cx},90 ${cx+9},94`;
    }
  };
  return `<path d="${one(84,-1)} ${one(116,1)}" stroke="${col}" stroke-width="${w}" fill="none" stroke-linecap="round"/>`;
}
function mouth(k, c){
  const s = `stroke="${L}" stroke-width="2" fill="none" stroke-linecap="round"`;
  const lip = c.lip ? `<path d="M95,147 Q100,149 105,147" stroke="#e7849a" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : '';
  switch(k){
    case 'line':  return `<path d="M95,147 L105,147" ${s}/>`+lip;
    case 'smile': return `<path d="M92,144 Q100,151 108,144" ${s}/>`+lip;
    case 'grin':  return `<path d="M90,142 Q100,157 110,142Z" fill="#c4505a" stroke="${L}" stroke-width="2" stroke-linejoin="round"/><path d="M92,143 L108,143 L106,146 L94,146Z" fill="#fff"/>`;
    case 'open':  return `<ellipse cx="100" cy="148" rx="5" ry="6.5" fill="#b8454e" stroke="${L}" stroke-width="2"/>`;
    case 'o':     return `<ellipse cx="100" cy="148" rx="2.6" ry="3" fill="#b8454e" stroke="${L}" stroke-width="1.6"/>`;
    case 'wavy':  return `<path d="M89,147 q2.75,-3 5.5,0 t5.5,0 t5.5,0 t5.5,0" ${s}/>`;
    case 'frown': return `<path d="M93,150 Q100,144 107,150" ${s}/>`;
    case 'smirk': return `<path d="M92,147 Q102,150 109,141" ${s}/>`;
    case 'shout': return `<path d="M88,141 Q100,163 112,141 Q100,147 88,141Z" fill="#9e3640" stroke="${L}" stroke-width="2" stroke-linejoin="round"/>`;
    default:      return `<path d="M95,147 L105,147" ${s}/>`;
  }
}

/* ---------- 몸 ---------- */
function body(c, skin){
  const coat = c.coat || '#2f3a56';
  let s = `<path d="M20,262 C26,222 58,204 100,204 C142,204 174,222 180,262Z" fill="${coat}" stroke="${L}" stroke-width="2.2"/>`;
  s += `<path d="M88,158 L88,206 Q100,216 112,206 L112,158Z" fill="${skin}" stroke="${L}" stroke-width="2"/>`;
  s += `<path d="M88,166 Q100,182 112,166 L112,176 Q100,190 88,176Z" fill="#e8c4b2"/>`;
  if (c.open) {
    s += `<path d="M76,206 L100,262 L124,206 L114,200 L100,222 L86,200Z" fill="#fff" stroke="${L}" stroke-width="2"/>`;
    s += `<path d="M86,224 Q100,232 114,224" stroke="#c9b25a" stroke-width="1.6" fill="none"/>`;
  } else {
    s += `<path d="M80,206 L100,240 L120,206 L112,200 L100,216 L88,200Z" fill="#fff" stroke="${L}" stroke-width="2"/>`;
    if (c.tie) s += `<path d="M96,216 L104,216 L107,252 L100,262 L93,252Z" fill="#7a2a35" stroke="${L}" stroke-width="1.8"/>`;
    else s += `<path d="M100,216 L84,207 L84,226Z M100,216 L116,207 L116,226Z" fill="#c94a5a" stroke="${L}" stroke-width="1.8" stroke-linejoin="round"/><circle cx="100" cy="216" r="4.2" fill="#c94a5a" stroke="${L}" stroke-width="1.8"/>`;
  }
  return s;
}

const FACE_F = 'M64,100 C64,140 82,166 100,170 C118,166 136,140 136,100 C136,64 120,48 100,48 C80,48 64,64 64,100Z';
const FACE_M = 'M63,98 C63,138 80,166 100,170 C120,166 137,138 137,98 C137,62 121,46 100,46 C79,46 63,62 63,98Z';

window.charSVG = function(id, exprStr){
  const c = CH[id] || CH.mob, e = parse(exprStr);
  const skin = c.mob ? '#f1e3d8' : '#fde8da';
  const fid = 'f' + (++uid);
  const face = c.male ? FACE_M : FACE_F;
  let s = `<svg viewBox="0 0 200 262" xmlns="http://www.w3.org/2000/svg" ${c.mob?'opacity=".92"':''}>
  <defs><clipPath id="${fid}"><path d="${face}"/></clipPath>
  <linearGradient id="${fid}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1c35" stop-opacity=".92"/><stop offset=".75" stop-color="#2a1c35" stop-opacity=".75"/><stop offset="1" stop-color="#2a1c35" stop-opacity="0"/></linearGradient></defs>`;
  s += `<path d="${BACK[c.back]}" fill="${c.hair}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;
  if (c.back==='pony') s += `<circle cx="134" cy="64" r="5" fill="#e65a6a" stroke="${L}" stroke-width="1.6"/>`;
  s += body(c, skin);
  if (c.male) s += `<path d="M65,104 C54,100 54,122 67,125" fill="${skin}" stroke="${L}" stroke-width="2"/><path d="M135,104 C146,100 146,122 133,125" fill="${skin}" stroke="${L}" stroke-width="2"/>`;
  if (c.ear) s += `<circle cx="141" cy="124" r="2.6" fill="#ddd" stroke="${L}" stroke-width="1.2"/>`;
  s += `<path d="${face}" fill="${skin}" stroke="${L}" stroke-width="2.2"/>`;
  // 얼굴 내부
  s += `<g clip-path="url(#${fid})">`;
  if (e.blush) s += `<ellipse cx="78" cy="133" rx="12" ry="6" fill="#ff8fa8" opacity=".5"/><ellipse cx="122" cy="133" rx="12" ry="6" fill="#ff8fa8" opacity=".5"/>
     <path d="M70,136 l5,-7 M75,136 l5,-7 M80,136 l5,-7 M114,136 l5,-7 M119,136 l5,-7 M124,136 l5,-7" stroke="#e8577a" stroke-width="1.3" stroke-linecap="round"/>`;
  s += `</g>`;
  if (c.mob) s += `<g clip-path="url(#${fid})"><rect x="58" y="40" width="84" height="84" fill="${c.hair}" opacity=".55"/><path d="M60,124 Q100,112 140,124" stroke="#6d665f" stroke-width="1.6" fill="none" opacity=".6"/></g>`;
  else { s += brows(e.brow, c);
  s += eye(84, 114, e.eye, c, 'l', skin) + eye(116, 114, e.eye, c, 'r', skin); }
  if (e.tear) s += `<path d="M110,128 q-2,14 3,24 q5,-10 -3,-24z" fill="#a9dcf7" stroke="#5b9bc4" stroke-width="1"/>`;
  s += `<path d="M99,130 L101,134" stroke="#d9a493" stroke-width="1.6" stroke-linecap="round"/>`; // 코
  s += mouth(e.mouth, c);
  if (e.shadow || e.gloom){
    s += `<g clip-path="url(#${fid})">`;
    if (e.shadow) s += `<rect x="58" y="44" width="84" height="88" fill="url(#${fid}s)"/>
        <ellipse cx="85" cy="116" rx="3.4" ry="2" fill="#fff"/><ellipse cx="117" cy="116" rx="3.4" ry="2" fill="#fff"/>`;
    if (e.gloom) { let g=''; for(let x=70;x<=130;x+=5) g+=`M${x},50 L${x},${92+((x/5)%3)*4} `; s += `<path d="${g}" stroke="#4d3d6b" stroke-width="1.6" opacity=".55"/>`; }
    s += `</g>`;
  }
  if (c.glasses) s += `<g stroke="#2a2a2a" stroke-width="2.2" fill="#fff" fill-opacity=".12"><rect x="70" y="103" width="28" height="22" rx="7"/><rect x="102" y="103" width="28" height="22" rx="7"/><path d="M98,112 L102,112" fill="none"/></g>`;
  // 앞머리
  s += `<path d="${FRONT[c.front]}" fill="${c.hair}" stroke="${L}" stroke-width="2.2" stroke-linejoin="round"/>`;
  if (!c.mob) s += `<path d="M76,60 Q100,48 124,60" stroke="#fff" stroke-width="5" opacity=".28" fill="none" stroke-linecap="round"/>`;
  if (c.front==='cha') s += `<path d="M100,41 C94,24 112,20 108,32" stroke="${L}" stroke-width="2" fill="none"/>`;
  if (c.pin) s += `<path d="M122,66 l12,-6" stroke="#f0a3b8" stroke-width="4" stroke-linecap="round"/>`;
  if (c.bow) s += `<path d="M138,74 l-10,-8 l0,14Z M138,74 l10,-8 l0,14Z" fill="#f2d24f" stroke="${L}" stroke-width="1.6" stroke-linejoin="round"/>`;
  // 땀, 핏대
  if (e.sweat) s += `<path d="M148,76 q7,11 0,18 q-7,-7 0,-18z" fill="#c4e8ff" stroke="#4f7d99" stroke-width="1.6"/>`;
  if (e.anger) s += `<g stroke="#e0283b" stroke-width="3" stroke-linecap="round" fill="none"><path d="M128,56 q4,4 0,8 M138,56 q-4,4 0,8 M129,54 q4,-4 8,0 M129,66 q4,4 8,0"/></g>`;
  s += `</svg>`;
  return s;
};
window.CHARS = CH;
window.CHAR_PRESETS = PRESET;
window.charParse = parse;
})();
