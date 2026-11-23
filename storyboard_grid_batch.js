(function(){
'use strict';
if(typeof cutImg!=='function'||typeof renderSteps!=='function')return;
var base=renderSteps, batch=0, busy=false;
function init(){
 var six=document.querySelector('#conti .ct-step[data-st="6"]');if(!six||document.getElementById('ct-batch-panel'))return;
 var p=document.createElement('section');p.id='ct-batch-panel';p.style.cssText='margin:18px 0;padding:14px;border:1px solid var(--rule-hard,#888);border-radius:12px';
 p.innerHTML='<h3>🎬 3D 콘티 → GPT 일괄 작화</h3><p class="small">8~10개 컷을 동일한 격자로 내보내고, GPT가 같은 격자에 완성 그림을 그리도록 요청합니다. 결과 이미지를 다시 올리면 컷별로 잘라 배치합니다.</p>'+
 '<div class="filterbar"><label>시작 컷 <select id="ct-batch-start"></select></label><label>컷 수 <select id="ct-batch-count"><option value="8">8컷 (2×4)</option><option value="10">10컷 (2×5)</option></select></label></div>'+
 '<div class="filterbar"><button class="chip ct-go" id="ct-batch-export">① 3D 격자 PNG 만들기</button><button class="chip" id="ct-batch-prompt">② 프롬프트 복사</button><button class="chip" id="ct-batch-send">③ 참고시트와 GPT로 보내기</button></div>'+
 '<p class="small" id="ct-batch-status" aria-live="polite">먼저 컷을 선택하세요.</p>'+
 '<label class="chip">④ GPT 완성 격자 이미지 올리기<input type="file" id="ct-batch-upload" accept="image/png,image/jpeg,image/webp" hidden></label>'+
 '<div id="ct-batch-preview"></div><button class="chip ct-go" id="ct-batch-apply" type="button" hidden>⑤ 잘라낸 컷 모두 적용</button>';
 six.appendChild(p);
 var start=p.querySelector('#ct-batch-start'),count=p.querySelector('#ct-batch-count'),status=p.querySelector('#ct-batch-status'),preview=p.querySelector('#ct-batch-preview'),apply=p.querySelector('#ct-batch-apply');
 function update(){if(!B||!B.cuts)return;var old=start.value;start.innerHTML=B.cuts.map(function(c,i){return '<option value="'+i+'">'+c.n+'번 컷부터</option>';}).join('');if(old)start.value=old;}
 function chosen(){var i=+start.value,n=+count.value;return (B&&B.cuts||[]).slice(i,i+n);}
 function layout(n){return {cols:2,rows:n/2,w:640,h:480,gap:0};}
 function prompt(){
  var cuts=chosen(),l=layout(cuts.length);
  return '아래에 첨부한 격자 이미지는 웹툰 3D 콘티 가이드입니다. 캐릭터 참고시트와 배경 참고 이미지를 반드시 우선 참고하세요.\n'+
  '첨부된 격자 이미지와 정확히 같은 '+l.cols+'열 × '+l.rows+'행, 총 '+cuts.length+'칸의 한 장짜리 웹툰 완성 그림을 만들어 주세요. 각 칸의 위치와 크기를 절대 바꾸지 마세요. 칸 사이 여백, 제목, 숫자, 글자, 말풍선, 테두리를 추가하지 마세요. 이미지 바깥쪽 여백도 0입니다. 각 칸은 독립된 4:3 가로 그림이며 전체 이미지 비율은 '+(l.cols*4)+':'+(l.rows*3)+'입니다. 인물 얼굴과 의상, 배경을 참고시트와 일치시키고, 3D 콘티의 카메라 구도, 인물 위치, 방향, 포즈를 유지하세요. 한국 웹툰 스타일, 깔끔한 선화와 셀 채색, 풀컬러.\n'+
  '칸 순서: 왼쪽 위부터 오른쪽으로, 다음 줄로 내려갑니다.\n'+
  cuts.map(function(c,i){return '칸 '+(i+1)+' = 원본 '+c.n+'번 컷. '+(c.scr||'')+' / 등장: '+ctWho(c).join(', ')+' / 구도: '+(c.k||'')+' / 앵글: '+(c.ang||'');}).join('\n')+
  '\n중요: 업로드 후 사이트가 균등 격자로 자동 분할합니다. 각 칸 내부에 완결된 그림을 넣고 인물의 주요 부분을 칸 경계에 걸치지 마세요.';
 }
 async function grid(){
  var cuts=chosen();if(cuts.length!==+count.value)throw Error('선택한 컷 수가 부족합니다.');
  var l=layout(cuts.length),cv=document.createElement('canvas');cv.width=l.cols*l.w;cv.height=l.rows*l.h;
  var ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  for(var i=0;i<cuts.length;i++){
   status.textContent='3D 컷 렌더링 중… '+(i+1)+'/'+cuts.length;
   var c=cuts[i],source=await cutImg(c,l.w),x=i%2*l.w,y=Math.floor(i/2)*l.h;
   ctx.drawImage(source,x,y,l.w,l.h);
  }
  return cv;
 }
 function download(cv,name){var a=document.createElement('a');a.download=name;a.href=cv.toDataURL('image/png');a.click();}
 p.addEventListener('click',async function(e){
  var id=e.target.id;if(!['ct-batch-export','ct-batch-prompt','ct-batch-send','ct-batch-apply'].includes(id)||busy)return;
  if(id==='ct-batch-prompt'){ctCopy(prompt());status.textContent='격자 규칙과 컷별 작화 프롬프트를 복사했습니다.';return;}
  if(id==='ct-batch-apply'){
   if(!p._parts||p._parts.length!==chosen().length)return;
   if(!window.__ppArt||typeof window.__ppArt.put!=='function'){status.textContent='이미지 저장소를 사용할 수 없습니다.';return;}
   busy=true;try{
    var cuts=chosen();if(cuts.some(function(c,i){return c.n!==p._nums[i];}))throw Error('분할 후 컷 순서가 바뀌었습니다. 다시 업로드해 주세요.');
    if(typeof snapUndo==='function')snapUndo('GPT 격자 컷 적용 되돌리기','일괄 작화 적용 전으로 복원했습니다.');
    for(var j=0;j<cuts.length;j++){var id2='batch'+Date.now().toString(36)+'_'+cuts[j].n;await window.__ppArt.put(id2,p._parts[j]);cuts[j].art=id2;cuts[j].key=1;}
    save();renderBoard();status.textContent=cuts.length+'컷에 완성 이미지를 적용했습니다.';apply.hidden=true;
   }catch(err){status.textContent='적용 실패: '+err.message;}finally{busy=false;}return;
  }
  busy=true;try{
   var cv=await grid(),cuts=chosen(),stamp='cuts_'+cuts[0].n+'-'+cuts[cuts.length-1].n;
   download(cv,stamp+'_3d_grid.png');
   if(id==='ct-batch-send'){
    var refs=refImgs(cuts);
    // The original 3D grid is sent as the first image, followed by available reference sheets.
    await sendGpt(prompt(),[{name:'3D 콘티 격자 '+stamp,u:cv.toDataURL('image/png')}].concat(refs));
    status.textContent='3D 격자 PNG를 저장하고, GPT 공유를 요청했습니다. 공유가 제한되면 저장된 격자와 참고시트를 직접 첨부하세요.';
   }else status.textContent='3D 격자 PNG를 저장했습니다. 같은 격자로 GPT 그림을 만들어 올려주세요.';
  }catch(err){status.textContent='격자 생성 실패: '+err.message;}finally{busy=false;}
 });
 p.querySelector('#ct-batch-upload').addEventListener('change',function(e){
  var file=e.target.files&&e.target.files[0];if(!file)return;
  var cuts=chosen();if(cuts.length!==+count.value){status.textContent='컷 수를 먼저 맞춰 주세요.';return;}
  var url=URL.createObjectURL(file),im=new Image();
  im.onload=function(){
   URL.revokeObjectURL(url);var l=layout(cuts.length),cellW=im.width/l.cols,cellH=im.height/l.rows;
   if(Math.abs(cellW/cellH-4/3)>.04){status.textContent='격자 비율이 맞지 않습니다. 칸마다 4:3인 2×'+l.rows+' 이미지를 올려주세요.';return;}
   var parts=[],thumb=document.createElement('div');thumb.style.cssText='display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin:10px 0';
   for(var i=0;i<cuts.length;i++){
    var cv=document.createElement('canvas');cv.width=640;cv.height=480;cv.getContext('2d').drawImage(im,(i%2)*cellW,Math.floor(i/2)*cellH,cellW,cellH,0,0,640,480);
    parts.push(cv.toDataURL('image/png'));
    var box=document.createElement('div');box.style.cssText='min-width:0';var img=document.createElement('img');img.src=parts[i];img.style.cssText='width:100%;display:block';var label=document.createElement('small');label.textContent=cuts[i].n+'번 컷';box.appendChild(img);box.appendChild(label);thumb.appendChild(box);
   }
   preview.replaceChildren(thumb);p._parts=parts;p._nums=cuts.map(function(c){return c.n;});apply.hidden=false;status.textContent='자동 분할 미리보기 완료. 칸이 맞는지 확인하고 적용하세요.';
  };
  im.onerror=function(){URL.revokeObjectURL(url);status.textContent='이미지를 열지 못했습니다.';};
  im.src=url;
 });
 update();
}
renderSteps=function(){base();if(+CSTEP===6)init();};
if(+CSTEP===6)init();
})();