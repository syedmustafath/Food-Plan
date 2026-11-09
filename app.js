/* ---------- static plan content ---------- */
const DAYS=[
 {n:'Sunday',g:[['Protein',['Rui mach','Eggs']],['Carb',['Oats']],['Veggies',['Lal shak','Lau','Carrots']],['Fruit',['Apple','Malta']],['Snack',['Muri']]]},
 {n:'Monday',g:[['Protein',['Chicken','Daal']],['Carb',['Chira']],['Veggies',['Potol','Beans','Cucumbers']],['Fruit',['Papaya','Dates (2-3)']],['Snack',['Boot bhuna']]]},
 {n:'Tuesday',g:[['Protein',['Sardines','Boot']],['Carb',['Brown rice']],['Veggies',['Kolmi shak','Cauliflower','Onions']],['Fruit',['Guava','Lemon']],['Snack',['Chana']]]},
 {n:'Wednesday',g:[['Protein',['Beef','Eggs']],['Carb',['Oats']],['Veggies',['Mishti kumra','Bhendi','Tomatoes']],['Fruit',['Angur','Banana']],['Snack',['Muri']]]},
 {n:'Thursday',g:[['Protein',['Puti mach','Daal']],['Carb',['Brown rice']],['Veggies',['Spinach','Begun','Green chilli']],['Fruit',['Apple','Malta']],['Snack',['Boot bhuna']]]},
 {n:'Friday',g:[['Protein',['Chicken','Eggs']],['Carb',['Whole grain bread']],['Veggies',['Lau','Potol','Carrots']],['Fruit',['Papaya','Dates (2-3)']],['Snack',['Lassi']]]},
 {n:'Saturday',g:[['Protein',['Beef','Daal']],['Carb',['Brown rice']],['Veggies',['Spinach','Begun','Tomatoes']],['Fruit',['Banana','Guava']],['Snack',['Chana']]]}
];
const BASICS=['Doi or milk','Handful of nuts or seeds','2-3 veggies','1-2 fruits','Unsweetened tea','Honey, 1 tsp max'];
const SHOP=[
 ['Proteins',[['Eggs','3 days'],['Chicken','2 meals'],['Beef','2 meals'],['Rui mach','1'],['Sardines','1'],['Puti mach','1'],['Daal','3 meals'],['Boot','1 meal'],['Doi and milk','daily']]],
 ['Carbs',[['Brown rice','3 meals'],['Oats','2'],['Chira','1'],['Whole grain bread','1 loaf']]],
 ['Veggies',[['Spinach','2 days'],['Begun','2 days'],['Tomatoes','2 days'],['Lau','2 days'],['Carrots','2 days'],['Potol','2 days'],['Lal shak',''],['Kolmi shak',''],['Beans',''],['Cucumbers',''],['Cauliflower',''],['Mishti kumra',''],['Bhendi',''],['Onions','also daily cooking'],['Green chilli','also daily cooking']]],
 ['Fruits',[['Bananas','2 days'],['Guava','2 days'],['Apples','2 days'],['Malta','2 days'],['Papaya','2 days'],['Dates','2 days'],['Lemon',''],['Angur','']]],
 ['Snacks and drinks',[['Chana',''],['Muri',''],['Boot bhuna',''],['Lassi','unsweetened'],['Tea','']]],
 ['Pantry',[['Almonds','restock as needed'],['Peanuts',''],['Cashews',''],['Chia seeds',''],['Flax seeds',''],['Coconut',''],['Olive or mustard oil',''],['Honey',''],['Turmeric',''],['Cumin','']]]
];
const THR=0.7;

/* Which meal each food belongs to (used by the "By meal" view). Edit freely; ids/tracking are unaffected. */
const MEALS=['Breakfast','Lunch','Snack','Dinner'];
const MEAL_OF={
  Protein:{'Eggs':'Breakfast','Chicken':'Dinner','Beef':'Dinner'},   // others (fish, daal, boot) default to Lunch
  Carb:{'Oats':'Breakfast','Chira':'Breakfast','Whole grain bread':'Breakfast'}, // rice defaults to Lunch
  Veggies:{'Lau':'Dinner','Potol':'Dinner','Beans':'Dinner','Cauliflower':'Dinner','Mishti kumra':'Dinner','Bhendi':'Dinner','Begun':'Dinner'}, // shak and salad default to Lunch
  Fruit:{'Banana':'Breakfast','Papaya':'Breakfast','Lemon':'Lunch'},
  Snack:{}
};
const DEFAULT_MEAL={Protein:'Lunch',Carb:'Lunch',Veggies:'Lunch',Fruit:'Snack',Snack:'Snack'};
// Per-day exceptions so every day covers every meal (Tuesday and Thursday have no egg/oats/bread breakfast) and lunch isn't a single item.
const DAY_MEAL={
  Tuesday:{'Fruit:Guava':'Breakfast'},
  Wednesday:{'Veggies:Mishti kumra':'Lunch'},   // otherwise lunch would be tomatoes only
  Thursday:{'Fruit:Apple':'Breakfast'},
  Friday:{'Veggies:Lau':'Lunch'}                // otherwise lunch would be carrots only
};
const mealOf=(g,it,day)=>(DAY_MEAL[day]&&DAY_MEAL[day][g+':'+it])||(MEAL_OF[g]&&MEAL_OF[g][it])||DEFAULT_MEAL[g];
let VIEW='group';
try{VIEW=localStorage.getItem('food-plan-view')==='meal'?'meal':'group';}catch(e){}
function sections(d){
  if(VIEW==='group')return d.g.map(([lab,items])=>[lab,items.map(it=>({g:lab,it}))]);
  return MEALS.map(m=>[m,d.g.flatMap(([lab,items])=>items.filter(it=>mealOf(lab,it,d.n)===m).map(it=>({g:lab,it})))]).filter(x=>x[1].length);
}
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

/* ---------- date helpers (recomputed on every build so a long-open tab rolls over at midnight) ---------- */
const pad=n=>String(n).padStart(2,'0');
const key=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
const addDays=(d,n)=>new Date(d.getFullYear(),d.getMonth(),d.getDate()+n);
const fmt=d=>d.getDate()+' '+MON[d.getMonth()];
let today,TODAY,weekStart,todayIdx;
function setDates(){
  const n=new Date();
  today=new Date(n.getFullYear(),n.getMonth(),n.getDate());
  TODAY=key(today);weekStart=addDays(today,-today.getDay());todayIdx=today.getDay();
}
const planIds=i=>DAYS[i].g.flatMap(([l,items])=>items.map(it=>l+':'+it));

/* ---------- Supabase ---------- */
const $=id=>document.getElementById(id);
const configured=window.SUPABASE_URL&&!window.SUPABASE_URL.includes('YOUR-PROJECT')&&window.SUPABASE_ANON_KEY&&!window.SUPABASE_ANON_KEY.includes('YOUR-ANON');
let sb=null,channel=null;
let data={log:{},shop:{}};

function setSync(msg,err){const s=$('sync');s.textContent=msg;s.className=err?'err':'';}
function fail(e){console.error(e);setSync('Not saved: '+(e&&e.message||'network error'),true);}
function ok(){setSync('Synced');}

function entry(k){return data.log[k]||(data.log[k]={b:[],p:[]});}

async function loadAll(){
  const [log,shop]=await Promise.all([
    sb.from('log_entries').select('day,basics,plan'),
    sb.from('shop_ticks').select('item_id')
  ]);
  if(log.error)throw log.error;
  if(shop.error)throw shop.error;
  data={log:{},shop:{}};
  log.data.forEach(r=>{data.log[r.day]={b:r.basics||[],p:r.plan||[]};});
  shop.data.forEach(r=>{data.shop[r.item_id]=1;});
}

/* debounced per-day upsert */
const pending={};
function saveDay(dk){
  clearTimeout(pending[dk]);setSync('Saving...');
  pending[dk]=setTimeout(async()=>{
    const e=entry(dk);
    const {error}=await sb.from('log_entries').upsert({day:dk,basics:e.b,plan:e.p,updated_at:new Date().toISOString()});
    delete pending[dk];
    error?fail(error):ok();
  },350);
}
async function setShop(id,on){
  setSync('Saving...');
  const q=on?sb.from('shop_ticks').upsert({item_id:id}):sb.from('shop_ticks').delete().eq('item_id',id);
  const {error}=await q;error?fail(error):ok();
}

/* ---------- UI helpers ---------- */
let boxN=0;
function box(checked,label,note,onChange,disabled){
  const l=document.createElement('label');l.className='item';l.dataset.o=++boxN;
  const c=document.createElement('input');c.type='checkbox';c.checked=checked;c.disabled=!!disabled;
  c.addEventListener('change',()=>onChange(c.checked));
  const s=document.createElement('span');s.textContent=label;
  l.append(c,s);
  if(note){const m=document.createElement('small');m.textContent=note;l.append(m);}
  return l;
}
const REDUCE=matchMedia('(prefers-reduced-motion:reduce)').matches;
function sortGroups(animate){
  const gs=[...document.querySelectorAll('.day .group')];
  const before=new Map();
  if(animate&&!REDUCE)gs.forEach(g=>g.querySelectorAll('.item').forEach(it=>before.set(it,it.getBoundingClientRect().top)));
  gs.forEach(g=>{
    const its=[...g.querySelectorAll('.item')];
    its.sort((a,b)=>(a.querySelector('input').checked-b.querySelector('input').checked)||(a.dataset.o-b.dataset.o));
    its.forEach(it=>g.append(it));
  });
  if(animate&&!REDUCE)before.forEach((top,it)=>{
    const dy=top-it.getBoundingClientRect().top;
    if(dy)it.animate([{transform:'translateY('+dy+'px)'},{transform:'none'}],{duration:260,easing:'ease'});
  });
}
function toggle(arr,v,on){const i=arr.indexOf(v);if(on&&i<0)arr.push(v);if(!on&&i>=0)arr.splice(i,1);}

/* ---------- build day cards + shopping list from `data` ---------- */
const daysEl=$('days'),catsEl=$('cats'),nav=$('dayNav');
let cards=[],shopTotal=0;

function build(){
  setDates();
  const keepScroll=daysEl.scrollLeft,hadInit=daysEl.dataset.init;
  daysEl.innerHTML='';nav.innerHTML='';catsEl.innerHTML='';shopTotal=0;

  // Last Saturday stays editable (for updating after midnight on Sunday), then Sunday..Saturday of this week.
  const slots=[{di:6,date:addDays(weekStart,-1),prev:true},...DAYS.map((d,i)=>({di:i,date:addDays(weekStart,i)}))];
  slots.forEach(sl=>{
    const d=DAYS[sl.di],date=sl.date,dk=key(date),isToday=dk===TODAY,future=date>today;
    const card=document.createElement('article');
    card.className='day'+(isToday?' today':'')+(future?' future':'');
    card.dataset.day=dk;
    card.innerHTML=`<div class="day-head"><div><h3>${d.n}${isToday?'<span class="badge">Today</span>':''}${sl.prev?'<span class="badge prev">Last week</span>':''}</h3><small>${fmt(date)}</small></div><div class="head-r"><span class="count"></span><button class="clear" type="button">Clear ticks</button></div></div><div class="bar"><i></i></div>`;
    if(future){const p=document.createElement('p');p.className='note';p.textContent='Opens on '+fmt(date)+'.';card.append(p);}
    const bg=document.createElement('div');bg.className='group basicsg';
    bg.innerHTML='<div class="glabel">Every day</div>';
    BASICS.forEach(t=>bg.append(box(entry(dk).b.includes(t),t,'',on=>{toggle(entry(dk).b,t,on);saveDay(dk);refresh(true);},future)));
    card.append(bg);
    sections(d).forEach(([lab,items])=>{
      const g=document.createElement('div');g.className='group';
      g.innerHTML=`<div class="glabel">${lab}</div>`;
      items.forEach(({g:grp,it})=>{
        const id=grp+':'+it;
        g.append(box(entry(dk).p.includes(id),it,VIEW==='meal'?grp:'',on=>{toggle(entry(dk).p,id,on);saveDay(dk);refresh(true);},future));
      });
      card.append(g);
    });
    card.querySelector('.clear').onclick=()=>{
      entry(dk).p=[];entry(dk).b=[];card.querySelectorAll('input').forEach(x=>x.checked=false);saveDay(dk);refresh(true);
    };
    if(future)card.querySelector('.clear').hidden=true;
    daysEl.append(card);
  });
  cards=[...document.querySelectorAll('.day')];

  SHOP.forEach(([name,items])=>{
    const sec=document.createElement('section');sec.className='cat';
    sec.innerHTML=`<h3>${name}<span></span></h3>`;
    items.forEach(([n,q])=>{
      shopTotal++;const id='s:'+name+':'+n;
      sec.append(box(!!data.shop[id],n,q,on=>{if(on)data.shop[id]=1;else delete data.shop[id];setShop(id,on);refresh();}));
    });
    catsEl.append(sec);
  });

  cards.forEach((c,i)=>{
    const dn=DAYS[new Date(c.dataset.day+'T00:00').getDay()].n;
    const b=document.createElement('button');b.type='button';b.textContent=dn.slice(0,3);
    b.setAttribute('aria-label',dn+(i===0?' (last week)':''));
    if(c.dataset.day===TODAY)b.classList.add('isToday');
    if(i===0)b.classList.add('prevDay');
    b.onclick=()=>goTo(i,true);nav.append(b);
  });
  if(hadInit)daysEl.scrollLeft=keepScroll;
  refresh();
  setTimeout(()=>{if(!daysEl.dataset.init){goTo(todayIdx+1,false);daysEl.dataset.init=1;}markActive();},0);
}

/* ---------- tracker maths ---------- */
function counts(date){
  const e=data.log[key(date)];
  const valid=new Set(planIds(date.getDay()));
  const b=e?e.b.filter(x=>BASICS.includes(x)).length:0;
  const p=e?e.p.filter(x=>valid.has(x)).length:0;
  return {b,p,bt:BASICS.length,pt:valid.size,pct:(b+p)/(BASICS.length+valid.size)};
}
function streaks(){
  let cur=0,d=new Date(today);
  if(counts(d).pct<THR)d=addDays(d,-1);
  for(let i=0;i<400;i++){if(counts(d).pct>=THR){cur++;d=addDays(d,-1);}else break;}
  const keys=Object.keys(data.log).sort();let best=0;
  if(keys.length){
    const [y,m,dd]=keys[0].split('-').map(Number);let s=new Date(y,m-1,dd),run=0;
    while(s<=today){if(counts(s).pct>=THR){run++;best=Math.max(best,run);}else run=0;s=addDays(s,1);}
  }
  return {cur,best};
}
function avg(from,to){
  let t=0,n=0,any=false;
  for(let d=new Date(from);d<=to;d=addDays(d,1)){const c=counts(d);t+=c.pct;n++;if(c.b+c.p>0)any=true;}
  return any&&n?Math.round(t/n*100):null;
}

/* ---------- tracker render ---------- */
let picked=null;
function renderTracker(){
  if(!picked)picked=TODAY;
  const st=streaks();
  const thisAvg=avg(weekStart,today),lastAvg=avg(addDays(weekStart,-7),addDays(weekStart,-1));
  let onTrack=0;for(let d=new Date(weekStart);d<=today;d=addDays(d,1))if(counts(d).pct>=THR)onTrack++;
  $('stats').innerHTML=
    `<div class="stat"><b>${st.cur}</b><span>Day streak</span></div>`+
    `<div class="stat"><b>${onTrack} of ${todayIdx+1}</b><span>Days on track this week</span></div>`+
    `<div class="stat"><b>${thisAvg===null?'-':thisAvg+'%'}</b><span>This week's average</span></div>`+
    `<div class="stat"><b>${lastAvg===null?'-':lastAvg+'%'}</b><span>Last week's average</span></div>`;

  let w='';
  for(let i=0;i<=todayIdx;i++){
    const d=addDays(weekStart,i),c=counts(d);
    w+=`<div class="wk"><span class="nm${i===todayIdx?' td':''}">${DAYS[i].n.slice(0,3)}</span><div class="mini"><div class="b"><i style="width:${c.b/c.bt*100}%"></i></div><div class="p"><i style="width:${c.p/c.pt*100}%"></i></div></div><span class="fr">${c.b}/${c.bt} basics<br>${c.p}/${c.pt} plan</span></div>`;
  }
  $('week').innerHTML=w;
  $('thrNote').textContent='A day is on track at '+Math.round(THR*100)+'% or more of its basics and plan items. Tap a day for details.';

  const hm=$('hm');hm.innerHTML='';
  ['S','M','T','W','T','F','S'].forEach(x=>{const h=document.createElement('div');h.className='dh';h.textContent=x;hm.append(h);});
  const start=addDays(weekStart,-28);
  for(let i=0;i<35;i++){
    const d=addDays(start,i),k=key(d),fut=d>today,c=counts(d);
    let lv='l0';
    if(fut)lv='f';else if(c.pct>=1)lv='l4';else if(c.pct>=THR)lv='l3';else if(c.pct>=0.4)lv='l2';else if(c.pct>0)lv='l1';
    const b=document.createElement('button');b.type='button';
    b.className='cell '+lv+(k===TODAY?' td':'');
    b.textContent=d.getDate();
    b.setAttribute('aria-label',DAYS[d.getDay()].n+' '+fmt(d)+(fut?', upcoming':', '+Math.round(c.pct*100)+'% done'));
    if(!fut)b.onclick=()=>{picked=k;renderDetail();};else b.disabled=true;
    hm.append(b);
  }
  renderDetail();
}
function renderDetail(){
  const [y,m,d]=picked.split('-').map(Number),date=new Date(y,m-1,d),c=counts(date);
  $('detail').innerHTML=`<strong>${DAYS[date.getDay()].n}, ${fmt(date)}</strong>: ${Math.round(c.pct*100)}% done. Basics ${c.b} of ${c.bt}, day plan ${c.p} of ${c.pt}.`;
}

/* ---------- refresh ---------- */
function refresh(animate){
  document.querySelectorAll('.day').forEach(card=>{
    const boxes=card.querySelectorAll('input');const done=[...boxes].filter(b=>b.checked).length,t=boxes.length;
    card.querySelector('.count').textContent=done+' of '+t;
    card.querySelector('.bar i').style.width=(t?done/t*100:0)+'%';
    card.classList.toggle('done',done===t);
  });
  document.querySelectorAll('.cat').forEach(sec=>{
    const boxes=sec.querySelectorAll('input');
    sec.querySelector('h3 span').textContent=[...boxes].filter(b=>b.checked).length+' of '+boxes.length;
  });
  $('shopCount').textContent=document.querySelectorAll('.cat input:checked').length+' of '+shopTotal+' items in the basket';
  sortGroups(animate===true);
  renderTracker();
}

/* ---------- carousel nav ---------- */
function goTo(i,smooth){
  const c=cards[i],r=daysEl.getBoundingClientRect(),cr=c.getBoundingClientRect();
  daysEl.scrollTo({left:daysEl.scrollLeft+(cr.left-r.left)-(r.width-cr.width)/2,behavior:smooth?'smooth':'auto'});
}
function markActive(){
  const r=daysEl.getBoundingClientRect(),mid=r.left+r.width/2;let best=0,bd=1e9;
  cards.forEach((c,i)=>{const cr=c.getBoundingClientRect(),d=Math.abs(cr.left+cr.width/2-mid);if(d<bd){bd=d;best=i;}});
  [...nav.children].forEach((b,i)=>{if(i===best)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
}
let raf;daysEl.addEventListener('scroll',()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(markActive);});

/* ---------- view toggle: food group / meal ---------- */
function syncView(){
  document.querySelectorAll('#viewSeg button').forEach(b=>b.setAttribute('aria-pressed',b.dataset.v===VIEW));
}
document.querySelectorAll('#viewSeg button').forEach(b=>b.onclick=()=>{
  if(VIEW===b.dataset.v)return;
  VIEW=b.dataset.v;try{localStorage.setItem('food-plan-view',VIEW);}catch(e){}
  syncView();build();
});
syncView();

/* ---------- tabs ---------- */
const TABS=['plan','track','shop'];
function show(which){
  TABS.forEach(t=>{
    $('t-'+t).setAttribute('aria-selected',t===which);
    $(t).hidden=t!==which;
  });
  if(which==='plan')setTimeout(()=>{if(!daysEl.dataset.init){goTo(todayIdx+1,false);daysEl.dataset.init=1;}markActive();},0);
  if(which==='track')renderTracker();
}
TABS.forEach(t=>$('t-'+t).onclick=()=>show(t));

/* ---------- shopping reset ---------- */
$('resetShop').onclick=async()=>{
  data.shop={};document.querySelectorAll('.cat input').forEach(b=>b.checked=false);refresh();
  setSync('Saving...');
  const {error}=await sb.from('shop_ticks').delete().neq('item_id','');error?fail(error):ok();
};
/* ---------- export for Google Sheets ---------- */
const GROUPS=['Protein','Carb','Veggies','Fruit','Snack'];
function exportRows(){
  setDates();
  const keys=Object.keys(data.log).filter(k=>{const e=data.log[k];return e.b.length||e.p.length;}).sort();
  const head=['date','weekday','basics_done','basics_total','plan_done','plan_total','percent_done','on_track',
    ...BASICS.map(b=>'basic: '+b),...GROUPS.map(g=>g.toLowerCase()+'_done'),'plan_items_done'];
  const rows=[head];
  if(!keys.length)return rows;
  const [y,m,d]=keys[0].split('-').map(Number);
  for(let day=new Date(y,m-1,d);day<=today;day=addDays(day,1)){
    const e=data.log[key(day)]||{b:[],p:[]},c=counts(day),valid=new Set(planIds(day.getDay()));
    const plan=e.p.filter(x=>valid.has(x));
    rows.push([key(day),DAYS[day.getDay()].n,c.b,c.bt,c.p,c.pt,Math.round(c.pct*100),c.pct>=THR?1:0,
      ...BASICS.map(b=>e.b.includes(b)?1:0),
      ...GROUPS.map(g=>plan.filter(x=>x.startsWith(g+':')).length),
      plan.map(x=>x.split(':').slice(1).join(':')).join('; ')]);
  }
  return rows;
}
const csvCell=v=>{v=String(v);return /[",\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;};
function exportCSV(){return exportRows().map(r=>r.map(csvCell).join(',')).join('\n');}
function exportTSV(){return exportRows().map(r=>r.map(v=>String(v).replace(/[\t\n]/g,' ')).join('\t')).join('\n');}
function exportMsg(t,err){const el=$('exportMsg');el.textContent=t;el.className='note'+(err?' err':'');}

$('exportCsv').onclick=async()=>{
  if(exportRows().length<2)return exportMsg('Nothing to export yet. Tick something off first.',true);
  const name='food-plan-'+TODAY+'.csv',text=exportCSV();
  const file=new File([text],name,{type:'text/csv'});
  try{
    if(navigator.canShare&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:'Food plan history'});
      return exportMsg('Exported '+(exportRows().length-1)+' days.');
    }
  }catch(e){if(e&&e.name==='AbortError')return;}
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([text],{type:'text/csv'}));a.download=name;
  document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  exportMsg('Downloaded '+name+'.');
};
$('copySheets').onclick=async()=>{
  if(exportRows().length<2)return exportMsg('Nothing to export yet. Tick something off first.',true);
  try{await navigator.clipboard.writeText(exportTSV());exportMsg('Copied. Open Google Sheets, tap cell A1 and paste.');}
  catch(e){exportMsg('Could not copy. Use Export CSV instead.',true);}
};

/* ---------- live sync across devices ---------- */
let reloadT;
function scheduleReload(){
  clearTimeout(reloadT);
  reloadT=setTimeout(async()=>{
    // don't clobber a local write that hasn't reached the server yet
    if(Object.keys(pending).length)return scheduleReload();
    try{await loadAll();build();ok();}catch(e){fail(e);}
  },400);
}
function subscribe(){
  unsubscribe();
  channel=sb.channel('food-plan')
    .on('postgres_changes',{event:'*',schema:'public',table:'log_entries'},scheduleReload)
    .on('postgres_changes',{event:'*',schema:'public',table:'shop_ticks'},scheduleReload)
    .subscribe();
}
function unsubscribe(){if(channel){sb.removeChannel(channel);channel=null;}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&sb)scheduleReload();});

/* ---------- start ---------- */
async function start(){
  if(!configured){
    $('appWrap').hidden=true;
    const a=$('auth');a.hidden=false;
    a.innerHTML='<h1>Weekly food plan</h1><p>Supabase is not configured yet. Put your project URL and anon key in config.js (see README).</p>';
    return;
  }
  sb=window.supabase.createClient(window.SUPABASE_URL,window.SUPABASE_ANON_KEY);
  setSync('Loading...');
  try{await loadAll();build();show('plan');ok();subscribe();}catch(e){fail(e);}
}
start();
