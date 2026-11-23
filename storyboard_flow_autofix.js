(function(){
if(typeof flowFixAll!=='function'||typeof aiAsk!=='function')return;
var busy=false; var timer=null; var phaseTimer=null; function progress(btn,msg){if(btn&&btn.isConnected)btn.textContent=msg;var el=document.getElementById('ct-flow-autofix-progress');if(!el){el=document.createElement('div');el.id='ct-flow-autofix-progress';el.style.cssText='padding:12px;margin:8px 0;border:1px solid #d6b66e;border-radius:9px;font-size:13px;line-height:1.6';var host=document.getElementById('ct-flow');if(host)host.appendChild(el);}if(el)el.textContent=msg;}
flowFixAll=function(btn){
 if(busy||FLOW_FIXING||running||redoBusy||!B||!B.cuts||B.cuts.length<3)return;
 if(!aiReady()){stat('Gemini API 연결이 필요합니다.');return;}
 busy=true;if(btn)btn.disabled=true;progress(btn,'1/3 · Gemini에 컷 분석 요청 중…');
 var len=B.cuts.length,sig=B.cuts.map(function(c){return flowSig(c);}).join('~');
 var rows=B.cuts.map(function(c){return [c.n,compText(c),flowNames(c).join(','),c.scr||'',c.line||'',c.nar||''].join('|');}).join('\n');
 var req='[원고]\n'+String(B.story||'').slice(0,4000)+'\n[콘티]\n'+rows+'\n[문제]\n'+flowAll().map(function(x){return x.n+'번 '+x.kind+' '+x.why;}).join('\n')+'\n중복되고 불필요한 컷은 삭제하고, 필요한 컷은 수정하라. 복선, 개그 타이밍, 핵심 사건은 유지한다. 첫 컷과 마지막 컷은 삭제 금지. 삭제는 전체 20% 이하. JSON만 응답: {"actions":[{"op":"delete","n":3,"reason":"중복"},{"op":"edit","n":4,"scr":"수정 화면","line":"수정 대사","reason":"연결"}]}';
 var started=Date.now();phaseTimer=setInterval(function(){var sec=Math.floor((Date.now()-started)/1000);progress(btn,'1/3 · Gemini 응답 대기 '+sec+'초 (최대 45초)');},1000);var timed=new Promise(function(_,reject){timer=setTimeout(function(){reject(Error('45초 동안 Gemini 응답이 없어 중단했습니다. API 설정·모델·네트워크를 확인하세요.'));},45000);});Promise.race([aiAsk('한국 웹툰 콘티 편집자. JSON만 출력.',req,3000,{temperature:0.2}),timed]).then(function(t){clearTimeout(timer);clearInterval(phaseTimer);progress(btn,'2/3 · AI 응답 분석 및 삭제 후보 확인 중…');
  if(aiIsErr(t))throw Error(String(t));
  if(B.cuts.length!==len||B.cuts.map(function(c){return flowSig(c);}).join('~')!==sig)throw Error('분석 중 콘티가 바뀌었습니다');
  var str=String(aiClean?aiClean(t):t).replace(/\x60\x60\x60(?:json)?/g,'').trim(),a=str.indexOf('{'),b=str.lastIndexOf('}');
  if(a<0||b<a)throw Error('AI 응답 형식 오류');
  var list=JSON.parse(str.slice(a,b+1)).actions||[],seen={},del=[],edit=[];
  list.forEach(function(x){var n=+x.n;if(!Number.isInteger(n)||n<1||n>len||seen[n])return;seen[n]=true;if(x.op==='delete'&&n>1&&n<len)del.push(n);else if(x.op==='edit')edit.push(x);});
  del=del.slice(0,Math.floor(len*.2));if(!del.length&&!edit.length){stat('수정할 컷이 없습니다.');return;}
  progress(btn,'3/3 · 컷 삭제·수정 적용 중…');snapUndo('AI 컷 정리 되돌리기','AI 정리 전으로 복원했습니다.');
  edit.forEach(function(x){var c=B.cuts[x.n-1];if(!c)return;if(typeof x.scr==='string'&&x.scr.trim())c.scr=x.scr.slice(0,800);if(typeof x.line==='string'&&!srcOnly())c.line=x.line.slice(0,500);});
  del.sort(function(a,b){return b-a;}).forEach(function(n){removeCut(n);});
  if(B.flow){B.flow.items=[];B.flow.scenes=[];}
  save();renderAll();stat('AI 자동 정리: '+del.length+'컷 삭제, '+edit.length+'컷 수정. 되돌리기 가능.');
 }).catch(function(e){progress(btn,'AI 정리 실패: '+e.message);stat('AI 정리 실패: '+e.message);}).finally(function(){clearTimeout(timer);clearInterval(phaseTimer);busy=false;if(btn&&btn.isConnected){btn.disabled=false;btn.textContent='모두 고치기';}});
};
})();