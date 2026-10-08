# Genera celestia-mvp/js/i18n.js a partir de tr_site.py + tr_menus.py
import json,re,sys
import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from tr_site import TR
from tr_menus import TRM
D={}
def n(s): return re.sub(r'\s+',' ',s).strip()
for src in (TRM,TR):
    for k,v in src.items(): D[n(k)]=v
EXTRA={"Fin de semana (V–D)":"Weekend (Fri–Sun)","Entre semana (L–V)":"Weekday (Mon–Fri)","Fin de semana":"Weekend","Entre semana":"Weekday","Vi noche / Sá / Do":"Fri night / Sat / Sun",
"Semana":"Weekday","semana":"weekday","desde":"from","2 a 12 personas":"2 to 12 guests","12+ personas":"12+ guests","incluye traslado":"travel included",
"Seña 50% del servicio":"50% service deposit","Seña":"Deposit","Saldo":"Balance","Total":"Total","Ocasión":"Occasion","Notas":"Notes","Zona":"Area","Turno":"Time slot",
"Almuerzo + cena":"Lunch + dinner","Por ejemplo":"For example","Menú Patagonia":"Patagonia menu","Degustación Norte Argentino":"Northern Argentina tasting"}
for k,v in EXTRA.items(): D.setdefault(n(k),v)
js = r'''/* Celestia · traducción ES→EN del sitio (generado por i18n/build.py) */
(function(){
var D=__DICT__;
var MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
var MON=['January','February','March','April','May','June','July','August','September','October','November','December'];
var MES3=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
var MON3=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
var DIA=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
var DAY=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
var DIA3=['dom','lun','mar','mié','jue','vie','sáb'];
var DAY3=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
function ix(a,s){return a.indexOf(String(s).toLowerCase().replace(/\.$/,''));}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1);}
function g(n){return n==='1'?' guest':' guests';}
var RX=[
 [/^(\d+) personas?$/i,function(m){return m[1]+g(m[1]);}],
 [/^(\d+) a (\d+) personas$/i,function(m){return m[1]+' to '+m[2]+' guests';}],
 [/^(\d+) pasos$/i,function(m){return m[1]+' courses';}],
 [/^Menú (\d+) · (\d+) pasos$/,function(m){return 'Menu '+m[1]+' · '+m[2]+' courses';}],
 [/^desde (\$[\d.,]+)$/i,function(m){return 'from '+m[1];}],
 [/^Paso (\d) de (\d)$/,function(m){return 'Step '+m[1]+' of '+m[2];}],
 [/^~?(\$[\d.,]+) por persona$/,function(m){return '~'+m[1]+' per person';}],
 [/^\+ (\$[\d.,]+) asistente$/,function(m){return '+ '+m[1]+' assistant';}],
 [/^\+ (\$[\d.,]+) 2 asistentes$/,function(m){return '+ '+m[1]+' 2 assistants';}],
 [/^\+ (\$[\d.,]+) · (\d) asistentes? de servicio$/,function(m){return '+ '+m[1]+' · '+m[2]+' service assistant'+(m[2]==='1'?'':'s');}],
 [/^(\d+) personas · (.+)$/,null],
 [/^(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre) (\d{4})$/i,function(m){return MON[ix(MES,m[1])]+' '+m[2];}],
 [/^(domingo|lunes|martes|miércoles|jueves|viernes|sábado),? (\d+) de (\w+) de (\d{4})$/i,function(m){return DAY[ix(DIA,m[1])]+', '+MON[ix(MES,m[3])]+' '+m[2]+', '+m[4];}],
 [/^(domingo|lunes|martes|miércoles|jueves|viernes|sábado),? (\d+) de (\w+)$/i,function(m){return DAY[ix(DIA,m[1])]+', '+MON[ix(MES,m[3])]+' '+m[2];}],
 [/^(dom|lun|mar|mié|jue|vie|sáb)\.?,? (\d+) (ene|feb|mar|abr|may|jun|jul|ago|sep|oct|nov|dic)\.?$/i,function(m){return DAY3[ix(DIA3,m[1])]+' '+m[2]+' '+MON3[ix(MES3,m[3])];}],
 [/^(Domingo|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado) (\d+) · fin de semana$/,function(m){return DAY[ix(DIA,m[1])]+' '+m[2]+' · weekend';}],
 [/^(Domingo|Lunes|Martes|Miércoles|Jueves|Viernes|Sábado) (\d+) · (.+)$/,function(m){var r=tr(m[3]);return DAY[ix(DIA,m[1])]+' '+m[2]+' · '+(r==null?m[3]:r);}],
 [/^(Almuerzo|Cena) \((.+)\)$/,function(m){return (m[1]==='Cena'?'Dinner':'Lunch')+' ('+m[2]+')';}],
 [/^Cocina (.+)$/,function(m){var r=tr(cap(m[1]));return r!=null?r+' cuisine':null;}],
 [/^Foto de referencia: (.+) en$/,function(m){return 'Reference photo: '+m[1]+' on';}],
 [/^Ref: (.+)$/,function(m){return 'Ref: '+m[1];}],
 [/^Hola, (.+) →$/,function(m){return 'Hi, '+m[1]+' →';}]
];
function tr(s){
  if(s==null)return null; s=s.replace(/\s+/g,' ').trim(); if(!s)return null;
  if(Object.prototype.hasOwnProperty.call(D,s))return D[s];
  for(var i=0;i<RX.length;i++){var m=s.match(RX[i][0]);if(m&&RX[i][1]){var r=RX[i][1](m);if(r!=null)return r;}}
  var p=s.match(/^([^0-9A-Za-zÁÉÍÓÚáéíóúÑñ¿¡$~+(“"]+)(.+)$/);
  if(p){var r2=tr(p[2]);if(r2!=null)return p[1]+r2;}
  if(s.indexOf(' · ')>0){var parts=s.split(' · '),ok=false,out=parts.map(function(x){var t=tr(x);if(t!=null){ok=true;return t;}return x;});if(ok)return out.join(' · ');}
  return null;
}
var ATTR=['placeholder','aria-label','title','alt','data-eyebrow'];
var lang='es';
function trNode(nd){
  var v=nd.nodeValue; if(!v||!v.trim())return;
  if(nd.__en!==undefined&&v===nd.__en)return;
  var r=tr(v); if(r==null)return;
  var lead=v.match(/^\s*/)[0],trail=v.match(/\s*$/)[0];
  nd.__es=v; nd.__en=lead+r+trail; nd.nodeValue=nd.__en;
}
function trEl(el){
  ATTR.forEach(function(a){var v=el.getAttribute&&el.getAttribute(a);if(!v)return;var k='__es_'+a,ke='__en_'+a;if(el[ke]===v)return;var r=tr(v);if(r==null)return;el[k]=v;el[ke]=r;el.setAttribute(a,r);});
}
function skip(n){var p=n.nodeType===1?n:n.parentElement;while(p){var t=p.tagName;if(t==='SCRIPT'||t==='STYLE'||t==='NOSCRIPT'||t==='TEXTAREA')return true;if(p.hasAttribute&&p.hasAttribute('data-no-tr'))return true;p=p.parentElement;}return false;}
function walk(root){
  if(!root)return;
  if(root.nodeType===3){if(!skip(root))trNode(root);return;}
  if(root.nodeType!==1||skip(root))return;
  trEl(root);
  var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,null);var n;
  while((n=w.nextNode())){if(n.nodeType===3){if(!skip(n))trNode(n);}else trEl(n);}
}
function revert(){
  var w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT,null);var n;
  while((n=w.nextNode())){
    if(n.nodeType===3){if(n.__es!==undefined&&n.nodeValue===n.__en)n.nodeValue=n.__es;delete n.__es;delete n.__en;}
    else ATTR.forEach(function(a){if(n['__es_'+a]!==undefined&&n.getAttribute(a)===n['__en_'+a])n.setAttribute(a,n['__es_'+a]);delete n['__es_'+a];delete n['__en_'+a];});
  }
}
var obs=new MutationObserver(function(ms){
  if(lang!=='en')return;
  ms.forEach(function(m){
    if(m.type==='characterData')trNode(m.target);
    else if(m.type==='attributes')trEl(m.target);
    else m.addedNodes.forEach(function(x){walk(x);});
  });
});
var TITLE_ES=document.title;
function apply(l){
  lang=l==='en'?'en':'es';
  document.documentElement.classList.remove('cel-pre');
  document.documentElement.lang=lang;
  document.documentElement.classList.toggle('lang-en',lang==='en');
  if(lang==='en'){
    walk(document.body);
    document.title=document.documentElement.getAttribute('data-title-en')||'Private Chef in Buenos Aires · Celestia | Daro Castello';
    obs.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:ATTR});
  }else{
    obs.disconnect(); revert(); document.title=TITLE_ES;
  }
  document.querySelectorAll('[data-cel-lang]').forEach(function(b){b.classList.toggle('on',b.getAttribute('data-cel-lang')===lang);b.setAttribute('aria-pressed',b.getAttribute('data-cel-lang')===lang?'true':'false');});
}
function inicial(){
  try{var s=localStorage.getItem('celestia_idioma');if(s==='en'||s==='es')return s;}catch(e){}
  var nav=(navigator.language||'es').toLowerCase();
  return nav.indexOf('en')===0?'en':'es';
}
window.celSetLang=function(l){try{localStorage.setItem('celestia_idioma',l);}catch(e){}apply(l);};
window.celLang=function(){return lang;};
window.celTr=tr;
function init(){
  document.querySelectorAll('[data-cel-lang]').forEach(function(b){b.addEventListener('click',function(e){e.preventDefault();window.celSetLang(b.getAttribute('data-cel-lang'));});});
  apply(inicial());
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
'''
js=js.replace('__DICT__',json.dumps(D,ensure_ascii=False,separators=(',',':')))
open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..','..','js','i18n.js'),'w',encoding='utf-8').write(js)
print('entries',len(D),'bytes',len(js.encode()))
