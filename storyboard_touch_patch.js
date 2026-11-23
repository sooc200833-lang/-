(function(){
'use strict';
if(!window.Konva){console.warn('Konva unavailable; original 7.5 editor remains');return;}
var oldRender=window.renderCompose75,oldPaint=window.cmp75Paint;
if(typeof oldRender!=='function'||typeof oldPaint!=='function')return;
var E={stage:null,layer:null,back:null,nodes:{},selected:null,transformer:null,serial:0,history:[],gesture:null};
function state(){var c=cmp75Cut();return c&&cmp75State(c);}
function value(n){var c=cmp75Cut();return c&&cmp75Layout(c,n,cmp75Cast(c).indexOf(n));}
function record(){var c=cmp75Cut();if(!c)return;E.history.push(JSON.stringify(c.sheet75));if(E.history.length>30)E.history.shift();}
function saveEdit(){var c=cmp75Cut();if(!c)return;cmp75State(c).ok=false;save();}
function selected(){return E.selected&&value(E.selected);}
function showPanel(){
 var v=selected(),panel=document.getElementById('cmp75-advanced');
 if(!panel)return;
 panel.querySelector('#cmp75-selected').textContent=E.selected||'인물을 터치해서 선택';
 ['rotation','opacity','depth','headX','headY','headScale'].forEach(function(k){
 var el=panel.querySelector('[data-adv="'+k+'"]');
 if(el)el.value=v?(v[k]==null?({rotation:0,opacity:100,depth:0,headX:0,headY:0,headScale:100}[k]):v[k]):el.defaultValue;
 });
}
function syncNode(n,node){
 var v=value(n);if(!v)return;
 var w=E.stage.width(),h=E.stage.height();
 node.position({x:(v.x+v.dx)*w/100,y:(v.y+v.dy)*h/100});
 node.rotation(+v.rotation||0);node.opacity((v.opacity==null?100:v.opacity)/100);
 node.visible(!v.hidden);
}
function draw(){
 var c=cmp75Cut(),host=document.getElementById('cmp75-konva');
 if(!c||!host||!E.stage)return;
 var serial=++E.serial,st=state(),cast=cmp75Cast(c);
 var bg=cmp75Bg(c);
 Promise.all([cmp75Img(bg)].concat(cast.map(function(n,i){return cmp75Img(cmp75Url(c,n,i));}))).then(function(imgs){
 if(serial!==E.serial||!E.stage||!host.isConnected)return;
 E.layer.destroyChildren();E.nodes={};E.selected=cast.indexOf(E.selected)>=0?E.selected:null;
 var W=960,H=720;
 E.layer.add(new Konva.Rect({x:0,y:0,width:W,height:H,fill:'#f3eee7',listening:false}));
 if(imgs[0]){
  var bi=imgs[0],z=st.bg.zoom||1,k=Math.max(W/bi.width,H/bi.height)*z;
  E.layer.add(new Konva.Image({image:bi,x:(W-bi.width*k)/2+(st.bg.x||0)*W/100,y:(H-bi.height*k)/2+(st.bg.y||0)*H/100,width:bi.width*k,height:bi.height*k,listening:false}));
 }
 var people=cast.map(function(n,i){return {n:n,i:i,v:value(n),img:imgs[i+1]};});
 people.sort(function(a,b){return (+a.v.depth||0)-(+b.v.depth||0)||(a.v.y+a.v.dy)-(b.v.y+b.v.dy);});
 people.forEach(function(o){
 var v=o.v,im=o.img;
 var h=(c.k==='cu'||c.k==='ecu'?H*.9:c.k==='bs'?H*.73:c.k==='ls'?H*.35:H*.64)*(v.scale/100);
 var w=im?h*im.width/im.height:55;
 var node=im?new Konva.Image({image:im,width:w,height:h,offsetX:w/2,offsetY:h,draggable:true,name:o.n}):new Konva.Rect({width:w,height:h,offsetX:w/2,offsetY:h,fill:'#a5b6c5',draggable:true,name:o.n});
 syncNode(o.n,node);
 node.on('tap click',function(){pick(o.n);});
 node.on('dragstart transformstart',record);
 node.on('dragend',function(){
  var x=node.x()/W*100,y=node.y()/H*100;
  v.dx=x-v.x;v.dy=y-v.y;saveEdit();showPanel();
 });
 node.on('transformend',function(){
  v.dx=node.x()/W*100-v.x;v.dy=node.y()/H*100-v.y;
  v.rotation=Math.round(node.rotation()*10)/10;
  v.scale=Math.max(20,Math.min(400,Math.round(v.scale*node.scaleX())));
  saveEdit();draw();
 });
 E.layer.add(node);E.nodes[o.n]=node;
 });
 E.transformer=new Konva.Transformer({rotateEnabled:true,enabledAnchors:['top-left','top-right','bottom-left','bottom-right'],keepRatio:true,borderStroke:'#f7a629',anchorStroke:'#f7a629',anchorFill:'#fff',anchorSize:13});
 E.layer.add(E.transformer);
 if(E.selected&&E.nodes[E.selected])E.transformer.nodes([E.nodes[E.selected]]);
 E.layer.batchDraw();showPanel();
 });
}
function pick(n){E.selected=n;if(E.transformer)E.transformer.nodes(E.nodes[n]?[E.nodes[n]]:[]);showPanel();}
function mount(){
 var cv=document.getElementById('cmp75-cv');if(!cv)return;
 var holder=document.createElement('div');holder.id='cmp75-konva';
 holder.style.cssText='width:100%;max-width:700px;aspect-ratio:4/3;touch-action:none;border:1px solid #888;border-radius:10px;overflow:hidden';
 cv.parentNode.insertBefore(holder,cv);cv.style.display='none';
 E.stage=new Konva.Stage({container:holder,width:960,height:720});
 E.layer=new Konva.Layer();E.stage.add(E.layer);
 function resize(){if(!holder.isConnected)return;var w=holder.clientWidth;E.stage.scale({x:w/960,y:w/960});E.stage.width(w);E.stage.height(w*0.75);}
 // Keep a fixed logical 960x720 coordinate space; use CSS sizing instead of scaling the stage.
 E.stage.width(960);E.stage.height(720);holder.style.position='relative';
 var canvas=holder.querySelector('.konvajs-content');if(canvas){canvas.style.transformOrigin='top left';canvas.style.width='100%';canvas.style.height='100%';}
 function fit(){var w=holder.clientWidth;E.stage.container().style.height=(w*.75)+'px';E.stage.scale({x:w/960,y:w/960});E.stage.size({width:w,height:w*.75});}
 // Konva stage coordinates are CSS pixels after resizing; keep 960x720 by scaling the container via CSS.
 E.stage.size({width:960,height:720});holder.style.overflow='hidden';
 var inner=holder.querySelector('.konvajs-content');
 function fitCss(){if(inner){inner.style.transform='scale('+(holder.clientWidth/960)+')';inner.style.transformOrigin='0 0';}}
 fitCss();window.addEventListener('resize',fitCss,{passive:true});
 E.stage.on('click tap',function(ev){if(ev.target===E.stage)pick(null);});
 var start=null;
 E.stage.on('touchmove',function(ev){
  var ts=ev.evt.touches;if(!ts||ts.length!==2||!E.selected)return;
  ev.evt.preventDefault();
  var a=ts[0],b=ts[1],dist=Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY),angle=Math.atan2(b.clientY-a.clientY,b.clientX-a.clientX)*180/Math.PI;
  if(!start){start={dist:dist,angle:angle,scale:value(E.selected).scale,rotation:value(E.selected).rotation||0};record();return;}
  var v=value(E.selected);v.scale=Math.max(20,Math.min(400,Math.round(start.scale*dist/start.dist)));v.rotation=start.rotation+angle-start.angle;
  var node=E.nodes[E.selected];if(node){node.scale({x:v.scale/start.scale,y:v.scale/start.scale});node.rotation(v.rotation);}showPanel();
 });
 E.stage.on('touchend',function(){if(start){start=null;saveEdit();draw();}});
 var panel=document.createElement('div');panel.id='cmp75-advanced';panel.className='cmp75-person';
 panel.innerHTML='<b>✋ 정밀 터치 편집 · <span id="cmp75-selected">인물을 터치해서 선택</span></b>'+
 '<p class="small">인물 드래그 이동 · 모서리 핸들 크기 조절 · 회전 핸들 회전 · 두 손가락 확대/회전</p>'+
 '<div class="cmp75-tools">'+
 '<label>회전 <input data-adv="rotation" type="range" min="-180" max="180" value="0"></label>'+
 '<label>투명도 <input data-adv="opacity" type="range" min="0" max="100" value="100"></label>'+
 '<label>앞뒤 순서 <input data-adv="depth" type="range" min="-10" max="10" value="0"></label>'+
 '</div><div class="cmp75-tools"><button type="button" id="cmp75-undo" class="chip">↶ 되돌리기</button><button type="button" id="cmp75-front" class="chip">맨 앞으로</button><button type="button" id="cmp75-back" class="chip">맨 뒤로</button><button type="button" id="cmp75-reset-person" class="chip">인물 보정 초기화</button></div>'+
 '<p class="small">얼굴 각도와 표정은 위의 인물별 선택 메뉴에서 바꿀 수 있어요. 합성 전신 이미지는 저장하지 않습니다.</p>';
 holder.insertAdjacentElement('afterend',panel);
 panel.addEventListener('input',function(ev){var k=ev.target.dataset.adv,v=selected();if(!k||!v)return;if(!ev.target._started){record();ev.target._started=true;}v[k]=+ev.target.value;saveEdit();draw();});
 panel.addEventListener('change',function(ev){ev.target._started=false;});
 panel.addEventListener('click',function(ev){var id=ev.target.id,v=selected();if(id==='cmp75-undo'){var old=E.history.pop(),c=cmp75Cut();if(old&&c){c.sheet75=JSON.parse(old);save();draw();}return;}if(!v)return;record();if(id==='cmp75-front')v.depth=10;else if(id==='cmp75-back')v.depth=-10;else if(id==='cmp75-reset-person'){v.rotation=0;v.opacity=100;v.depth=0;v.dx=0;v.dy=0;v.scale=100;}else return;saveEdit();draw();});
 draw();
}
window.cmp75Paint=function(){oldPaint();if(E.stage)draw();};
window.renderCompose75=function(){if(E.stage){E.stage.destroy();E.stage=null;}oldRender();mount();};
})();