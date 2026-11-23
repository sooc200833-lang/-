(function(){
'use strict';
if(typeof renderSteps!=='function'||typeof renderCompose75!=='function')return;
var originalRender=renderSteps, originalCompose=renderCompose75;
var oldStepNav=stepNav;
function move(){
 var six=document.querySelector('#conti .ct-step[data-st="6"]'),seven=document.querySelector('#conti .ct-step[data-st="7.5"]');
 if(!six||!seven)return;
 var target=document.getElementById('ct-compose75');
 if(!target)return;
 if(!document.getElementById('ct-six-composer')){
  var block=document.createElement('section');block.id='ct-six-composer';block.style.cssText='margin:24px 0;padding:14px;border:1px solid var(--rule-hard,#999);border-radius:12px';
  block.innerHTML='<h3>시트 기반 컷 합성 · 터치 편집</h3><p class="small">6단계에서 컷별 인물과 배경을 조합합니다. 인물을 선택한 뒤 이동·크기·회전을 조절하세요.</p>';
  six.appendChild(block);
 }
 document.getElementById('ct-six-composer').appendChild(target);
 seven.hidden=true;seven.style.display='none';
}
if(Array.isArray(STEPS)){for(var i=STEPS.length-1;i>=0;i--)if(+STEPS[i][0]===7.5)STEPS.splice(i,1);}
stepNav=function(){if(+CSTEP===7.5)CSTEP=6;oldStepNav();};
renderSteps=function(){
 if(+CSTEP===7.5)CSTEP=6;
 originalRender();
 move();
 if(+CSTEP===6)renderCompose75();
};
function makeEditor(){
 var cv=document.getElementById('cmp75-cv'),c=cmp75Cut();if(!cv||!c)return;
 cv.style.touchAction='none';
 var cast=cmp75Cast(c),selected=cast[0]||null,active=null;
 var ui=document.createElement('div');ui.className='cmp75-person';ui.id='cmp-six-controls';
 ui.innerHTML='<b>손가락 정밀 편집</b><p class="small">캐릭터를 터치해 선택한 뒤 드래그로 이동합니다. 아래 슬라이더로 크기·회전·좌표를 세밀하게 조절할 수 있어요.</p>'+
 '<div class="cmp75-tools"><label>선택 <select id="cmp-six-name"></select><button class="chip" type="button" id="cmp-six-undo">↶ 되돌리기</button></label></div>'+
 '<div class="cmp75-tools">'+
 '<label>좌우 <input type="range" data-six="dx" min="-100" max="100" step=".5"></label>'+
 '<label>상하 <input type="range" data-six="dy" min="-100" max="100" step=".5"></label>'+
 '<label>크기 <input type="range" data-six="scale" min="20" max="300" step="1"></label>'+
 '<label>회전 <input type="range" data-six="rotation" min="-180" max="180" step="1"></label>'+
 '</div><p class="small" id="cmp-six-status" aria-live="polite"></p>';
 cv.after(ui);
 var select=ui.querySelector('#cmp-six-name');cast.forEach(function(n){var o=document.createElement('option');o.value=n;o.textContent=n;select.appendChild(o);});
 var history=[];
 function v(){return selected?cmp75Layout(c,selected,cast.indexOf(selected)):null;}
 function snapshot(){history.push(JSON.stringify(c.sheet75));if(history.length>30)history.shift();}
 function controls(){var p=v();if(!p)return;select.value=selected;ui.querySelectorAll('[data-six]').forEach(function(x){x.value=p[x.dataset.six]==null?(x.dataset.six==='scale'?100:0):p[x.dataset.six];});ui.querySelector('#cmp-six-status').textContent=selected+' 선택됨';}
 function redraw(){cmp75State(c).ok=false;cmp75Paint();}
 function saveNow(){save();redraw();}
 select.addEventListener('change',function(){selected=select.value;controls();});
 ui.addEventListener('input',function(e){var k=e.target.dataset.six,p=v();if(!k||!p)return;if(!e.target._snap){snapshot();e.target._snap=true;}p[k]=+e.target.value;redraw();});
 ui.addEventListener('change',function(e){if(e.target.dataset.six){e.target._snap=false;saveNow();}});
 ui.querySelector('#cmp-six-undo').addEventListener('click',function(){var prev=history.pop();if(!prev)return;c.sheet75=JSON.parse(prev);saveNow();controls();});
 function point(e){var r=cv.getBoundingClientRect();return {x:(e.clientX-r.left)/r.width*100,y:(e.clientY-r.top)/r.height*100};}
 function pick(p){
  var best=null,score=1e9;
  cast.forEach(function(n,i){var q=cmp75Layout(c,n,i);if(q.hidden)return;var x=q.x+q.dx,y=q.y+q.dy;
   // Characters are bottom anchored. Hit-test the visible torso region, not only the feet.
   var height=(c.k==='cu'||c.k==='ecu'?90:c.k==='bs'?73:c.k==='ls'?35:64)*(q.scale||100)/100;
   var dx=Math.abs(p.x-x),dy=y-p.y;
   if(dx<Math.max(10,height*.55)&&dy>=-4&&dy<=height+8){var d=dx+Math.abs(dy-height*.5)*.4;if(d<score){score=d;best=n;}}
  });
  return best;
 }
 cv.addEventListener('pointerdown',function(e){
  var p=point(e),n=pick(p);if(!n)return;
  selected=n;controls();snapshot();active={id:e.pointerId,x:p.x,y:p.y};
  try{cv.setPointerCapture(e.pointerId);}catch(_){}
  e.preventDefault();e.stopImmediatePropagation();
 },true);
 cv.addEventListener('pointermove',function(e){
  if(!active||e.pointerId!==active.id)return;
  var p=point(e),q=v();if(!q)return;
  q.dx=Math.max(-100,Math.min(100,q.dx+p.x-active.x));q.dy=Math.max(-100,Math.min(100,q.dy+p.y-active.y));
  active.x=p.x;active.y=p.y;controls();redraw();e.preventDefault();e.stopImmediatePropagation();
 },true);
 function end(e){if(!active||e.pointerId!==active.id)return;active=null;saveNow();e.stopImmediatePropagation();}
 cv.addEventListener('pointerup',end,true);cv.addEventListener('pointercancel',end,true);
 controls();
}
renderCompose75=function(){
 originalCompose();
 makeEditor();
};
move();
if(+CSTEP===7.5)CSTEP=6;
try{stepNav();renderSteps();}catch(e){console.warn('Step 6 integration',e);}
})();