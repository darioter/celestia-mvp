<style>
.cp-cw{position:relative;display:flex;flex-direction:column}
.cp-cw>.cp-card{flex:1}
.cp-cw:has(>.cp-card.hide){display:none}
.cp-esc{position:absolute;bottom:14px;right:16px;z-index:2;display:inline-flex;align-items:center;gap:7px;border:1px solid var(--crd);background:var(--cr);color:var(--nv);font:600 12.5px 'DM Sans',sans-serif;padding:5px 12px 5px 6px;border-radius:999px;cursor:pointer;min-height:34px;transition:transform .25s,background .2s,border-color .2s}
.cp-esc i{width:22px;height:22px;border-radius:50%;background:var(--nv);color:var(--gdl);display:inline-flex;align-items:center;justify-content:center;font-style:normal;font-size:9.5px}
.cp-esc:hover{border-color:var(--gd);background:#fff}
.cp-cw:hover .cp-esc{transform:translateY(-4px)}
.cp-esc.on{background:var(--gdl);border-color:var(--gd)}
.cp-esc:focus-visible,.cp-pl button:focus-visible{outline:3px solid var(--gd);outline-offset:2px}
.cp-pl{position:fixed;left:50%;bottom:18px;transform:translate(-50%,140%);z-index:60;width:min(560px,calc(100% - 32px));display:flex;align-items:center;gap:10px;background:var(--nv);color:var(--cr);border:1px solid rgba(232,201,106,.5);border-radius:18px;padding:10px 12px;box-shadow:0 18px 40px rgba(13,27,42,.35);transition:transform .3s}
.cp-pl.on{transform:translate(-50%,0)}
.cp-pl button{flex:none;min-width:40px;min-height:40px;border-radius:999px;border:1px solid rgba(250,246,239,.25);background:transparent;color:var(--cr);font:600 13px 'DM Sans',sans-serif;cursor:pointer;padding:0 10px}
.cp-pl .pp{background:var(--gdl);color:var(--nv);border-color:var(--gdl);font-size:13px}
.cp-pl-t{flex:1;min-width:0}
.cp-pl-t b{display:block;font:400 15px/1.25 'DM Serif Display',serif;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cp-pl-t small{font-size:11.5px;color:rgba(250,246,239,.6)}
.cp-pl-t a{color:var(--gdl);text-decoration:none}
@media(max-width:640px){.cp-pl{bottom:12px;gap:8px;padding:8px 10px}.cp-pl .vel{display:none}}
</style>
<div class="cp-pl" id="cp-pl" role="region" aria-label="Reproductor de notas" aria-live="polite"><button type="button" class="pp" id="pl-pp" aria-label="Pausar">❚❚</button><div class="cp-pl-t"><b id="pl-t"></b><small id="pl-s"></small></div><button type="button" class="vel" id="pl-vel" aria-label="Velocidad de lectura">1×</button><button type="button" id="pl-x" aria-label="Cerrar">✕</button></div>
<script>(function(){
var S=window.speechSynthesis;if(!S||!window.SpeechSynthesisUtterance||!window.fetch||!window.DOMParser)return;
var H=document.documentElement,en=function(){return H.classList.contains('lang-en');};
function T(es,e){return en()?e:es;}
function tr(ev,p){try{window.celTrack&&celTrack(ev,p||{});}catch(e){}}
var pl=document.getElementById('cp-pl'),pp=document.getElementById('pl-pp'),pt=document.getElementById('pl-t'),ps=document.getElementById('pl-s'),pv=document.getElementById('pl-vel');
var voces=[];function cargar(){voces=S.getVoices()||[];}cargar();if('onvoiceschanged' in S)S.onvoiceschanged=cargar;
function voz(){var l=en()?'en':'es',pref=en()?['en-US','en-GB']:['es-AR','es-US','es-419','es-MX','es-ES'];
  for(var k=0;k<pref.length;k++){var v=voces.find(function(x){return x.lang&&x.lang.replace('_','-').toLowerCase()===pref[k].toLowerCase();});if(v)return v;}
  return voces.find(function(x){return x.lang&&x.lang.toLowerCase().indexOf(l)===0;})||null;}
var cache={},cola=[],i=0,estado='stop',vel=1,tok=0,actual=null,btn=null;
function limpio(el){var t;if(el.tagName==='TR'){t=[].map.call(el.children,function(c){return c.textContent;}).join(', ');}else t=el.textContent||'';return t.replace(/\s+/g,' ').trim();}
function textos(html){var d=new DOMParser().parseFromString(html,'text/html'),L=en()?'.b-en':'.b-es',out=[];
  var t=d.querySelector('.cp-hero h1 '+L),b=d.querySelector('.cp-hero .cp-baj '+L);if(t)out.push(limpio(t));if(b)out.push(limpio(b));
  var r=d.querySelector('.cp-body '+L);if(r)r.querySelectorAll('h2,p,li,tbody tr,aside').forEach(function(el){if(el.closest('aside')&&el.tagName!=='ASIDE')return;var x=limpio(el);if(x)out.push(x);});
  return out;}
function marcarBtn(){document.querySelectorAll('.cp-esc').forEach(function(x){var on=x===btn&&estado!=='stop';x.classList.toggle('on',on);x.setAttribute('aria-pressed',on?'true':'false');
  x.querySelector('i').textContent=on&&estado==='play'?'❚❚':'▶';x.querySelector('span').textContent=on?(estado==='play'?T('Pausar','Pause'):estado==='carga'?T('Cargando…','Loading…'):T('Seguir','Resume')):T('Escuchar','Listen');});}
function ui(){pl.classList.toggle('on',estado!=='stop');pp.textContent=estado==='play'?'❚❚':'▶';pp.setAttribute('aria-label',estado==='play'?T('Pausar','Pause'):T('Seguir','Resume'));
  if(actual){pt.textContent=actual.titulo;ps.innerHTML=(estado==='carga'?T('Cargando…','Loading…'):(Math.min(i+1,cola.length)+' / '+cola.length))+' · <a href="/blog/'+actual.slug+'">'+T('Abrir la nota','Open the note')+'</a>';}
  marcarBtn();}
function decir(){var my=++tok;if(i>=cola.length){parar();return;}
  var u=new SpeechSynthesisUtterance(cola[i]);u.lang=en()?'en-US':'es-AR';var v=voz();if(v)u.voice=v;u.rate=vel;
  u.onend=u.onerror=function(){if(my!==tok||estado!=='play')return;i++;ui();decir();};
  S.speak(u);ui();}
function parar(){estado='stop';tok++;try{S.cancel();}catch(e){}cola=[];i=0;ui();btn=null;actual=null;marcarBtn();}
function pausar(){estado='pausa';tok++;S.cancel();ui();}
function seguir(){estado='play';S.cancel();decir();}
function cargarNota(slug){var k=slug+(en()?':en':':es');if(cache[k])return Promise.resolve(cache[k]);
  return fetch('/blog/'+slug).then(function(r){if(!r.ok)throw 0;return r.text();}).then(function(h){cache[k]=textos(h);return cache[k];});}
function escuchar(b){var slug=b.getAttribute('data-slug');
  if(btn===b&&estado!=='stop'){estado==='play'?pausar():seguir();return;}
  parar();btn=b;actual={slug:slug,titulo:((b.closest('.cp-card')||b.parentNode).querySelector('h3 '+(en()?'.b-en':'.b-es'))||{}).textContent||''};estado='carga';ui();
  var my=++tok;cargarNota(slug).then(function(c){if(my!==tok)return;cola=c;i=0;estado='play';S.cancel();decir();tr('blog_escuchar',{articulo:'/blog/'+slug,origen:'indice'});})
  .catch(function(){if(my!==tok)return;location.href='/blog/'+slug;});}
document.querySelectorAll('.cp-esc').forEach(function(b){b.hidden=false;b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();escuchar(b);});});
pp.addEventListener('click',function(){estado==='play'?pausar():seguir();});
document.getElementById('pl-x').addEventListener('click',parar);
var V=[1,1.25,0.85],vi=0;pv.addEventListener('click',function(){vi=(vi+1)%V.length;vel=V[vi];pv.textContent=String(vel).replace('.',',')+'×';if(estado==='play'){S.cancel();decir();}});
addEventListener('pagehide',function(){try{S.cancel();}catch(e){}});
var _en=en();new MutationObserver(function(){if(en()!==_en){_en=en();parar();}}).observe(H,{attributes:true,attributeFilter:['class']});
try{S.cancel();}catch(e){}marcarBtn();
})();</script>
