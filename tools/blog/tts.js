<script>(function(){
var box=document.getElementById('cp-tts');if(!box)return;
var H=document.documentElement,en=function(){return H.classList.contains('lang-en');};
function tr(ev,p){try{window.celTrack&&celTrack(ev,p||{});}catch(e){}}
/* tamaño de letra */
var Z=[1,1.15,1.3,1.5],z=0;try{z=+(localStorage.getItem('cp_letra')||0)||0;}catch(e){}
function letra(){z=Math.max(0,Math.min(Z.length-1,z));H.style.setProperty('--cpz',Z[z]);box.querySelector('[data-fs="-1"]').disabled=z===0;box.querySelector('[data-fs="1"]').disabled=z===Z.length-1;try{localStorage.setItem('cp_letra',z);}catch(e){}}
box.querySelectorAll('[data-fs]').forEach(function(b){b.addEventListener('click',function(){z+=+b.getAttribute('data-fs');letra();tr('blog_letra',{nivel:z});});});letra();
/* lectura en voz alta */
var S=window.speechSynthesis,play=document.getElementById('tts-play');
if(!S||!window.SpeechSynthesisUtterance){play.hidden=true;document.getElementById('tts-stop').hidden=true;document.getElementById('tts-vel').hidden=true;return;}
try{S.cancel();}catch(e){}
var cola=[],i=0,estado='stop',vel=1,tok=0,voces=[];
function cargarVoces(){voces=S.getVoices()||[];}cargarVoces();if('onvoiceschanged' in S)S.onvoiceschanged=cargarVoces;
function voz(){var l=en()?'en':'es',pref=en()?['en-US','en-GB']:['es-AR','es-US','es-419','es-MX','es-ES'];
  for(var k=0;k<pref.length;k++){var v=voces.find(function(x){return x.lang&&x.lang.replace('_','-').toLowerCase()===pref[k].toLowerCase();});if(v)return v;}
  return voces.find(function(x){return x.lang&&x.lang.toLowerCase().indexOf(l)===0;})||null;}
function txt(el){var t=el.innerText||el.textContent||'';if(el.tagName==='TR'){t=[].map.call(el.children,function(c){return c.innerText;}).join(', ');}return t.replace(/\s+/g,' ').trim();}
function armar(){var L=en()?'.b-en':'.b-es',out=[];
  var t=document.querySelector('.cp-hero h1 '+L)||document.querySelector('.cp-hero h1'),b=document.querySelector('.cp-hero .cp-baj '+L)||document.querySelector('.cp-hero .cp-baj');
  if(t)out.push(t);if(b)out.push(b);
  var root=document.querySelector('.cp-body '+L);if(root)root.querySelectorAll('h2,p,li,tbody tr,aside').forEach(function(el){if(el.closest('aside')&&el.tagName!=='ASIDE')return;if(txt(el))out.push(el);});
  return out;}
function marcar(el){document.querySelectorAll('.tts-on').forEach(function(x){x.classList.remove('tts-on');});if(el){el.classList.add('tts-on');var r=el.getBoundingClientRect();if(r.top<150||r.bottom>innerHeight-40)el.scrollIntoView({behavior:'smooth',block:'center'});}}
function ui(){var s=estado==='play';box.classList.toggle('sonando',estado!=='stop');
  play.innerHTML=s?'<i aria-hidden="true">❚❚</i>'+(en()?'Pause':'Pausar'):'<i aria-hidden="true">▶</i>'+(estado==='pausa'?(en()?'Resume':'Seguir escuchando'):(en()?'Listen to this note':'Escuchar la nota'))+(estado==='stop'?' <small>'+(en()?box.getAttribute('data-min-en'):box.getAttribute('data-min'))+'</small>':'');
  play.setAttribute('aria-pressed',s?'true':'false');document.getElementById('tts-stop').hidden=estado==='stop';}
function decir(){var my=++tok;if(i>=cola.length){parar();return;}var el=cola[i];marcar(el);
  var u=new SpeechSynthesisUtterance(txt(el));u.lang=en()?'en-US':'es-AR';var v=voz();if(v)u.voice=v;u.rate=vel;
  u.onend=function(){if(my!==tok||estado!=='play')return;i++;decir();};
  u.onerror=function(){if(my!==tok||estado!=='play')return;i++;decir();};
  S.speak(u);}
function arrancar(){if(!cola.length||estado==='stop'){cola=armar();i=0;tr('blog_escuchar',{articulo:location.pathname});}estado='play';ui();S.cancel();decir();}
function pausar(){estado='pausa';tok++;S.cancel();ui();}
function parar(){estado='stop';tok++;try{S.cancel();}catch(e){}cola=[];i=0;marcar(null);ui();}
play.addEventListener('click',function(){estado==='play'?pausar():arrancar();});
document.getElementById('tts-stop').addEventListener('click',parar);
var V=[1,1.25,0.85],vi=0,vb=document.getElementById('tts-vel');
vb.addEventListener('click',function(){vi=(vi+1)%V.length;vel=V[vi];vb.textContent=String(vel).replace('.',',')+'×';if(estado==='play'){S.cancel();decir();}});
/* tocar un párrafo mientras suena: salta ahí */
document.querySelector('.cp-body').addEventListener('click',function(e){if(estado==='stop')return;var el=e.target.closest('h2,p,li,tr,aside');var k=cola.indexOf(el);if(k<0&&el)k=cola.indexOf(el.closest('aside'));if(k>=0){i=k;if(estado==='play'){S.cancel();decir();}else marcar(el);}});
addEventListener('pagehide',function(){try{S.cancel();}catch(e){}});
var _en=en();new MutationObserver(function(){if(en()!==_en){_en=en();if(estado!=='stop')parar();else ui();}}).observe(H,{attributes:true,attributeFilter:['class']});
ui();
})();</script>