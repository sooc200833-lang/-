// CMU BVH (cgspeed) -> dictionary POSE3-style poses.
// Our figure: x = character's left, y up, z front. Groups: hips(rt, dy) > sp(sp) > hd(hd); sp > sh(la/ra) > el; hips > hp(ll/rl) > kn.
// Arm  : sh.rotation = Euler XYZ (a0, -s*a3, s*a1) on (0,-1,0); elbow Rx(a2), a2<=0.  la = [a0, a1, a2, a3]
// Leg  : hp.rotation = Euler XYZ (a0, 0, s*a1*.5); knee Rx(a2), a2>=0.               ll = [a0, a1, a2]
// Usage: node mocap_convert.js <dir with *.bvh> <out.json>
const fs = require('fs'), path = require('path');
const DIR = process.argv[2], OUT = process.argv[3];
const NAMES = {'02_01':'걷기','02_03':'달리기','02_04':'점프','02_05':'주먹질','02_06':'줍기','02_07':'검술','10_01':'공 차기','13_01':'의자에 앉기','13_04':'턱 괴고 앉기',
  '13_10':'손 뻗어 잡기','13_11':'앞으로 뛰기','13_14':'웃음','13_17':'복싱','13_27':'손짓·가리키기','22_03':'얼굴 감싸고 앉기','90_16':'엎어지기','79_06':'악수','79_25':'무거운 상자',
  '79_31':'칠판에 쓰기','79_36':'전화 받기','79_41':'커피 마시기','79_69':'크게 기뻐함','79_70':'크게 웃음','79_71':'슬퍼함','79_72':'울음','79_73':'겁먹음','79_74':'화냄',
  '79_85':'노트북 타자','79_86':'활 쏘기','79_88':'파리 쫓기','79_89':'아기 안기','79_94':'힘자랑','79_96':'총 쏘기'};
const D = Math.PI/180;
// ---- math ----
const mul=(A,B)=>{const C=new Array(9).fill(0);for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++)C[i*3+j]+=A[i*3+k]*B[k*3+j];return C;};
const mv=(A,v)=>[A[0]*v[0]+A[1]*v[1]+A[2]*v[2],A[3]*v[0]+A[4]*v[1]+A[5]*v[2],A[6]*v[0]+A[7]*v[1]+A[8]*v[2]];
const T=A=>[A[0],A[3],A[6],A[1],A[4],A[7],A[2],A[5],A[8]];
const Rx=a=>{const c=Math.cos(a),s=Math.sin(a);return[1,0,0,0,c,-s,0,s,c];}, Ry=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,0,s,0,1,0,-s,0,c];}, Rz=a=>{const c=Math.cos(a),s=Math.sin(a);return[c,-s,0,s,c,0,0,0,1];};
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], add=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]], nrm=a=>{const l=Math.hypot(...a)||1;return[a[0]/l,a[1]/l,a[2]/l];};
const frame=(X,Yt)=>{X=nrm(X);let Z=nrm(cross(X,Yt));const Y=cross(Z,X);return[X[0],Y[0],Z[0],X[1],Y[1],Z[1],X[2],Y[2],Z[2]];};   // columns X Y Z
const eulerXYZ=m=>{const y=Math.asin(Math.max(-1,Math.min(1,m[2])));let x,z;if(Math.abs(m[2])<.9999){x=Math.atan2(-m[5],m[8]);z=Math.atan2(-m[1],m[0]);}else{x=Math.atan2(m[7],m[4]);z=0;}return[x/D,y/D,z/D];};
const eXYZ=(x,y,z)=>mul(mul(Rx(x*D),Ry(y*D)),Rz(z*D));
// ---- BVH ----
function parseBVH(txt){ const tok=txt.split(/\s+/).filter(Boolean); let i=0; const J=[]; const st=[];
  while(tok[i]!=='MOTION'){ const t=tok[i];
    if(t==='ROOT'||t==='JOINT'){ const j={name:tok[i+1],parent:st.length?st[st.length-1]:-1,off:[0,0,0],ch:[]}; J.push(j); i+=2; continue; }
    if(t==='End'){ const j={name:J[st[st.length-1]].name+'_end',parent:st[st.length-1],off:[0,0,0],ch:[],end:1}; J.push(j); i+=2; continue; }
    if(t==='{'){ st.push(J.length-1); i++; continue; } if(t==='}'){ st.pop(); i++; continue; }
    if(t==='OFFSET'){ J[st[st.length-1]].off=[+tok[i+1],+tok[i+2],+tok[i+3]]; i+=4; continue; }
    if(t==='CHANNELS'){ const n=+tok[i+1]; J[st[st.length-1]].ch=tok.slice(i+2,i+2+n); i+=2+n; continue; } i++; }
  i++; const nf=+tok[i+1]; i+=2; const ft=+tok[i+2]; i+=3; const nc=J.reduce((a,j)=>a+j.ch.length,0), F=[];
  for(let f=0;f<nf;f++){ F.push(tok.slice(i,i+nc).map(Number)); i+=nc; } return {J, F, ft}; }
function fk(B, fr){ const P=[], R=[]; let c=0;
  B.J.forEach((j,k)=>{ let pos=j.off.slice(), rot=[1,0,0,0,1,0,0,0,1];
    j.ch.forEach(ch=>{ const v=fr[c++]; if(ch==='Xposition')pos[0]=v; else if(ch==='Yposition')pos[1]=v; else if(ch==='Zposition')pos[2]=v; else{ const m=ch[0]==='X'?Rx(v*D):ch[0]==='Y'?Ry(v*D):Rz(v*D); rot=mul(rot,m); } });
    if(j.parent<0){ P[k]=pos; R[k]=rot; } else { P[k]=add(P[j.parent], mv(R[j.parent], j.off)); R[k]=mul(R[j.parent], rot); } });
  const by={}; B.J.forEach((j,k)=>by[j.name]=P[k]); return by; }
// ---- solve limbs ----
const DOWN=[0,-1,0];
function errArm(p,s,u,f){ const R=eXYZ(p[0],-s*p[3],s*p[1]), a=mv(R,DOWN), b=mv(mul(R,Rx(p[2]*D)),DOWN); return 1-dot(a,u)+1.2*(1-dot(b,f)); }
function errLeg(p,s,u,f){ const R=eXYZ(p[0],0,s*p[1]*.5), a=mv(R,DOWN), b=mv(mul(R,Rx(p[2]*D)),DOWN); return 1-dot(a,u)+1.2*(1-dot(b,f)); }
function solve(err, starts, lo, hi){ let best=null, be=1e9;
  starts.forEach(s0=>{ let p=s0.slice(), e=err(p), step=24; while(step>.4){ let imp=false; for(let k=0;k<p.length;k++) for(const d of [step,-step]){ const q=p.slice(); q[k]=Math.max(lo[k],Math.min(hi[k],q[k]+d)); const eq=err(q); if(eq<e-1e-9){ p=q; e=eq; imp=true; } } if(!imp) step/=2; } if(e<be){ be=e; best=p; } });
  return {p:best.map(v=>Math.round(v)), e:be}; }
const ARM_STARTS=[[0,10,-10,0],[-90,10,-20,0],[-150,30,-30,0],[0,80,-10,0],[40,10,-60,0],[-60,40,-100,30],[-40,10,-120,0],[-90,0,-90,-40],[-120,60,-60,40]];
const LEG_STARTS=[[0,0,5],[-60,0,60],[-90,0,90],[30,0,20],[-30,20,30],[-100,10,110]];
// ---- per frame ----
function poseOf(by, floorY, k){ const hip=by.Hips, lul=by.LeftUpLeg, rul=by.RightUpLeg;
  let lat=sub(lul,rul); lat[1]=0; let fwd=nrm(cross(lat,[0,1,0])); const yaw=Math.atan2(fwd[0],fwd[2]), Ry_=Ry(-yaw);   // 정면(+z)을 보게 돌린다
  const L=n=>mv(Ry_, sub(by[n], hip));
  const Mp=frame(sub(L('LeftUpLeg'),L('RightUpLeg')), nrm(sub(L('Spine1'),[0,0,0])));
  const Mc=frame(sub(L('LeftArm'),L('RightArm')), nrm(sub(L('Neck1'),L('Spine1'))));
  const hy=nrm(sub(L('Head_end'),L('Head'))); let hx=nrm(mv(Mc,[1,0,0])); hx=nrm(sub(hx, hy.map(v=>v*dot(hx,hy)))); const Mh=frame(hx,hy);
  const r=v=>v.map(x=>Math.round(x)), cl=(v,m)=>v.map(x=>Math.max(-m,Math.min(m,x)));
  const o={ rt:r(eulerXYZ(Mp)), sp:r(cl(eulerXYZ(mul(T(Mp),Mc)),70)), hd:r(cl(eulerXYZ(mul(T(Mc),Mh)),50)), dy:Math.round(((hip[1]-floorY)-k.restH)*k.k*100)/100 };
  [['la','Left',1],['ra','Right',-1]].forEach(([key,S,s])=>{ const u=nrm(mv(T(Mc),sub(L(S+'ForeArm'),L(S+'Arm')))), f=nrm(mv(T(Mc),sub(L(S+'Hand'),L(S+'ForeArm'))));
    const z=solve(p=>errArm(p,s,u,f), ARM_STARTS, [-200,-40,-160,-90],[120,190,0,90]); o[key]=[z.p[0],z.p[1],z.p[2],z.p[3]]; o['e'+key]=z.e; });
  [['ll','Left',1],['rl','Right',-1]].forEach(([key,S,s])=>{ const u=nrm(mv(T(Mp),sub(L(S+'Leg'),L(S+'UpLeg')))), f=nrm(mv(T(Mp),sub(L(S+'Foot'),L(S+'Leg'))));
    const z=solve(p=>errLeg(p,s,u,f), LEG_STARTS, [-140,-60,0],[80,120,160]); o[key]=z.p; o['e'+key]=z.e; });
  return o; }
const vec=o=>[...o.sp,...o.hd.map(v=>v*.5),...o.la,...o.ra,...o.ll,...o.rl,...o.rt.map(v=>v*1.5),o.dy*150];
const dist=(a,b)=>a.reduce((s,v,i)=>s+Math.abs(v-b[i]),0);
const REST=vec({sp:[0,0,0],hd:[0,0,0],la:[2,8,-12,0],ra:[2,8,-12,0],ll:[0,0,0],rl:[0,0,0],rt:[0,0,0],dy:0});
const out={}, report=[];
Object.keys(NAMES).forEach(id=>{ const f=path.join(DIR,id+'.bvh'); if(!fs.existsSync(f)) return; const B=parseBVH(fs.readFileSync(f,'utf8'));
  const step=Math.max(1,Math.round(.1/B.ft)), skip=Math.min(Math.round(1.2/B.ft), Math.round(B.F.length*.15)), frames=[];
  // 바닥 높이·다리 길이(서 있을 때 엉덩이 높이)
  let floor=1e9; for(let i=0;i<B.F.length;i+=step){ const by=fk(B,B.F[i]); floor=Math.min(floor, by.LeftToeBase[1], by.RightToeBase[1], by.LeftFoot[1], by.RightFoot[1]); }
  // 서 있을 때 엉덩이 높이 = 골반→엉덩이 관절(세로) + 넓적다리·정강이 뼈 길이 + 발목 높이. 우리 인형의 넓적다리+정강이 .87에 맞춰 줄인다
  const J=n=>B.J.find(j=>j.name===n).off, len=v=>Math.hypot(...v), legL=len(J('LeftLeg'))+len(J('LeftFoot')), restH=Math.abs(J('LeftUpLeg')[1])+legL+Math.abs(J('LeftToeBase')[1]), k=.87/legL;
  for(let i=skip;i<B.F.length-Math.min(Math.round(.4/B.ft), Math.round(B.F.length*.05));i+=step){ const p=poseOf(fk(B,B.F[i]), floor, {k:k, restH:restH}); const err=p.ela+p.era+p.ell+p.erl; if(err>.9) continue; frames.push({p, v:vec(p)}); }
  // 서로 가장 다른 순간을 골라(서 있는 기본 자세에서 먼 것부터) 최대 4개
  const pick=[]; const far=fr=>Math.min(dist(fr.v,REST), ...pick.map(q=>dist(fr.v,q.v)));
  for(let n=0;n<4 && frames.length;n++){ let b=null, bd=-1; frames.forEach(fr=>{ const d=far(fr); if(d>bd){ bd=d; b=fr; } }); if(!b || bd<(n?140:60)) break; pick.push(b); }
  pick.forEach((q,n)=>{ const p=q.p, o={sp:p.sp, hd:p.hd, la:p.la, ra:p.ra, ll:p.ll, rl:p.rl}; if(Math.abs(p.rt[0])+Math.abs(p.rt[1])+Math.abs(p.rt[2])>8) o.rt=p.rt; if(Math.abs(p.dy)>.02) o.dy=p.dy;
    if(p.dy<-.1 && p.ll[0]<-55 && p.rl[0]<-55 && Math.abs(p.rt[0])<30 && /앉/.test(NAMES[id])) o.prop='seat';   // 앉는 동작에서 허벅지가 앞으로·몸이 서 있으면 → 의자
    out['모캡·'+NAMES[id]+(pick.length>1?' '+(n+1):'')]=o; });
  report.push(id+' '+NAMES[id]+': frames '+frames.length+' picked '+pick.length); });
fs.writeFileSync(OUT, JSON.stringify(out));
console.log(report.join('\n')); console.log('poses', Object.keys(out).length, 'bytes', JSON.stringify(out).length);
