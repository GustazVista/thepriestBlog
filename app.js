const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const okUrl=u=>/^https?:\/\/\S+$/i.test(u||"");
const OK=CFG.url.startsWith("https://")&&!CFG.key.startsWith("PASTE");
const SB=OK&&window.supabase?window.supabase.createClient(CFG.url,CFG.key):null;
const blob=id=>SB.storage.from("media").getPublicUrl(id).data.publicUrl;
const SPEC={
 channels:{label:"Channels",tt:"name",req:["name","url"],f:[["name","Channel name","t"],["desc","Description","a"],["image","Image / thumbnail","i"],["url","Channel URL (https://…)","u"],["btn","Button text (default: ACCESS CHANNEL)","t"]]},
 projects:{label:"Projects",tt:"title",req:["title"],f:[["title","Project title","t"],["desc","Description","a"],["image","Image / thumbnail","i"],["url","Website or GitHub link (optional)","u"],["status","Status","s"],["tech","Technologies (comma separated, optional)","t"]]},
 hobbies:{label:"Hobbies",tt:"title",req:["title"],f:[["title","Hobby title","t"],["desc","Description","a"],["imgs","Images (reorder with ◀ ▶)","m"]]},
 about:{label:"About me",one:"site/about",help:"Name, photo, intro, biography, skills, social links and custom text blocks.",f:[["name","Name or nickname","t"],["image","Profile image","i"],["intro","Short introduction","a"],["bio","Longer biography","a"],["skills","Skills & interests (comma separated)","t"],["socials","Social links — one per line: Label | https://…","a"],["blocks","Custom text blocks — one per line: Title | text","a"]]},
 settings:{label:"Settings",one:"site/settings",help:"Site title, tagline and login visibility. Hiding the login button does not lock you out: add #admin to your site’s address to log in. Visitors never see admin tools.",f:[["title","Site title","t"],["tagline","Tagline (optional)","t"],["loginHidden","Hide the login button on the site","c"]]}
};
const S={d:{channels:[],projects:[],hobbies:[]},about:{},set:{},owner:false,tab:"channels"};
let F=null,tmr;
const toast=m=>{const t=$("#toast");t.textContent=m;t.hidden=false;clearTimeout(tmr);tmr=setTimeout(()=>t.hidden=true,3500)};
const img=id=>id?`<div class="img"><img src="${blob(id)}" alt="" loading="lazy"></div>`:`<div class="img">NO_SIGNAL</div>`;
const lines=(v)=>String(v||"").split("\n").map(l=>l.split("|").map(z=>z.trim())).filter(p=>p[0]);
const owner=(c,l)=>S.owner?`<p><button class="btn" data-act="${SPEC[c].one?"edit1":"new"}" data-c="${c}">${l}</button></p>`:"";

function render(){
 const s=S.set,t=s.title||"PERSONAL_ARCHIVE",wait=S.nodb||!S.ready;
 document.title=t;$("#logo").textContent="> "+t;$("#adm").hidden=!S.owner;$("#lg").hidden=!(S.hasOwner&&!S.session&&!s.loginHidden);
 const msg=S.nodb?"<p class='m'>// ACCESS_DENIED — open this page while signed in to claude.ai.</p>":S.err?`<p class="m">// ERROR: ${esc(S.err)}</p>`:`<p class="m">// LOADING_ARCHIVE<span class="cur">_</span></p>${S.slow?"<p class='m'>// SIGNAL_WEAK — content can’t be reached yet.</p>":""}`;
 $("#home").innerHTML=`<div class="ht"></div><p class="m">&gt; SYSTEM_ONLINE // ARCHIVE_ACTIVE</p><h1 class="gl" data-t="${esc(t)}">${esc(t)}</h1>${s.tagline?`<p>${esc(s.tagline)}</p>`:""}<p>&gt; <span class="cur">_</span></p><p>${["channels","projects","hobbies","about"].map(p=>`<a class="btn" href="#${p}" data-go="${p}">[ ${p.toUpperCase()} ]</a> `).join("")}</p>`+(S.owner&&!s.title?`<p class="m">// Owner: set your site title in ADMIN → SETTINGS.</p>`:"");
 const L=(c,fn)=>wait||S.err?msg:(S.d[c].length?`<div class="grid">${S.d[c].map(fn).join("")}</div>`:`<p class="m">// NO_ENTRIES_YET</p>`)+owner(c,"[ + ADD ENTRY ]");
 $("#b-channels").innerHTML=L("channels",(c,i)=>`<article class="card"><span class="m">CHANNEL_${String(i+1).padStart(2,"0")}</span>${img(c.image)}<h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p>${okUrl(c.url)?`<a class="btn" href="${esc(c.url)}" target="_blank" rel="noopener noreferrer">[ ${esc(c.btn||"ACCESS CHANNEL")} → ]</a>`:""}</article>`);
 $("#b-projects").innerHTML=L("projects",p=>`<article class="card">${img(p.image)}<h3>${esc(p.title)}</h3><span class="m">[ ${esc(p.status||"Planned")} ]</span><p>${esc(p.desc)}</p><div>${String(p.tech||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div>${okUrl(p.url)?`<a class="btn" href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">[ OPEN → ]</a>`:""}</article>`);
 $("#b-hobbies").innerHTML=L("hobbies",(h,hi)=>`<article class="card"><h3>${esc(h.title)}</h3><p>${esc(h.desc)}</p><div class="thumbs">${(h.imgs||[]).map((id,i)=>`<button class="th" data-lb="1" data-h="${hi}" data-i="${i}" aria-label="Enlarge image"><img src="${blob(id)}" alt="" loading="lazy"></button>`).join("")}</div></article>`);
 const a=S.about;
 $("#b-about").innerHTML=wait||S.err?msg:Object.keys(a).length?`<div class="about"><div>${a.image?img(a.image):""}</div><div><h3 style="font-size:26px;color:var(--a2)">${esc(a.name)}</h3><p>${esc(a.intro)}</p><p class="bio">${esc(a.bio)}</p><div>${String(a.skills||"").split(",").map(x=>x.trim()).filter(Boolean).map(x=>`<span class="tag">${esc(x)}</span>`).join("")}</div><p>${lines(a.socials).filter(p=>okUrl(p[1])).map(p=>`<a class="btn" href="${esc(p[1])}" target="_blank" rel="noopener noreferrer">${esc(p[0])}</a> `).join("")}</p>${lines(a.blocks).map(p=>`<h3 style="color:var(--a);margin-top:16px">&gt; ${esc(p[0])}</h3><p>${esc(p[1])}</p>`).join("")}</div></div>${owner("about","[ EDIT ABOUT ]")}`:`<p class="m">// SECTION_EMPTY</p>${owner("about","[ EDIT ABOUT ]")}`;
 if(S.adm)drawAdm();
}

function drawAdm(){
 const sp=SPEC[S.tab],tabs=Object.keys(SPEC);
 let h=`<div class="bar"><h2>&gt; ADMIN_CONSOLE</h2><button class="btn" data-act="logout">[ LOGOUT ]</button><button class="btn" data-act="closeadm">[ VIEW SITE ]</button></div><div class="bar">${tabs.map(t=>`<button class="btn ${S.tab==t?"on":""}" data-act="tab" data-t="${t}">${SPEC[t].label}</button>`).join("")}</div>`;
 if(sp.one)h+=`<p class="m">${sp.help}</p><button class="btn" data-act="edit1" data-c="${S.tab}">[ EDIT ${sp.label} ]</button>`;
 else{const it=S.d[S.tab];h+=`<p><button class="btn" data-act="new" data-c="${S.tab}">[ + NEW ENTRY ]</button></p>`+(it.length?it.map((x,i)=>`<div class="row">${img((x.imgs||[])[0]||x.image)}<span class="nm">${esc(x[sp.tt])}</span><button class="btn" data-act="mv" data-c="${S.tab}" data-id="${x.id}" data-d="-1" ${i?"":"disabled"} aria-label="Move up">▲</button><button class="btn" data-act="mv" data-c="${S.tab}" data-id="${x.id}" data-d="1" ${i<it.length-1?"":"disabled"} aria-label="Move down">▼</button><button class="btn" data-act="edit" data-c="${S.tab}" data-id="${x.id}">EDIT</button><button class="btn" data-act="ask" data-c="${S.tab}" data-id="${x.id}">DEL</button></div>`).join(""):`<p class="m">// EMPTY — nothing here yet.</p>`);}
 $("#adm-b").innerHTML=h;
}

const showMd=h=>{$("#mdb").innerHTML=h;$("#md").hidden=false};
const closeMd=()=>{$("#md").hidden=true;F=null;S.cf=null};
function openForm(c,id){
 const sp=SPEC[c],cur=sp.one?(c=="about"?S.about:S.set):(S.d[c].find(x=>x.id==id)||{});
 const data={...cur};delete data.id;
 if(!id&&!sp.one&&c=="projects")data.status="Planned";
 F={c,id,data,files:{},prev:{},orig:{...data},imgs:sp.f.some(x=>x[2]=="m")?(data.imgs||[]).map(i=>({id:i})):null,err:"",busy:false};
 drawF();$("#md").hidden=false;
}
function sync(){document.querySelectorAll("#mdb [data-f]").forEach(e=>F.data[e.dataset.f]=e.type=="checkbox"?e.checked:e.value)}
function drawF(){
 const sp=SPEC[F.c];
 $("#mdb").innerHTML=`<h3 style="color:var(--a)">&gt; ${F.id||sp.one?"EDIT":"NEW"} // ${sp.label.toUpperCase()}</h3>`+sp.f.map(([k,l,t])=>{
  const v=F.data[k]??"";let x;
  if(t=="a")x=`<textarea rows="4" data-f="${k}">${esc(v)}</textarea>`;
  else if(t=="s")x=`<select data-f="${k}">${["Planned","In Progress","Completed"].map(o=>`<option ${v==o?"selected":""}>${o}</option>`).join("")}</select>`;
  else if(t=="i"){const src=F.prev[k]||(v&&blob(v));x=(src?`<div class="img" style="max-width:240px"><img src="${src}" alt=""></div>`:"")+`<input type="file" accept="image/*" data-file="${k}">`+(src?`<button class="btn" data-act="clr" data-k="${k}">REMOVE IMAGE</button>`:"")}
  else if(t=="m")x=`<div class="thumbs">${F.imgs.map((m,j)=>`<div class="tb"><img src="${m.prev||blob(m.id)}" alt=""><button class="btn" data-act="fmv" data-j="${j}" data-d="-1">◀</button><button class="btn" data-act="fmv" data-j="${j}" data-d="1">▶</button><button class="btn" data-act="frm" data-j="${j}">✕</button></div>`).join("")}</div><input type="file" accept="image/*" multiple data-file="${k}">`;
  else if(t=="c")x=`<input type="checkbox" style="width:auto" data-f="${k}" ${v?"checked":""}>`;
  else x=`<input ${t=="u"?'type="url"':""} data-f="${k}" value="${esc(v)}">`;
  return `<label>${l}${(sp.req||[]).includes(k)?" *":""}</label>${x}`}).join("")+`<p class="er">${esc(F.err)}</p><div class="bar"><button class="btn" data-act="save" ${F.busy?"disabled":""}>${F.busy?"SAVING…":"SAVE"}</button><button class="btn" data-act="cancel">CANCEL</button></div>`;
}
async function save(){
 sync();const sp=SPEC[F.c],d={...F.data};
 const bad=m=>{F.err=m;drawF()};
 for(const r of sp.req||[])if(!String(d[r]||"").trim())return bad(r.toUpperCase()+" IS REQUIRED");
 for(const [k,,t] of sp.f)if(t=="u"&&d[k]&&!okUrl(d[k]))return bad("URL MUST START WITH HTTP:// OR HTTPS://");
 F.busy=true;F.err="";drawF();
 try{
  const up=async f=>(await S.assets.upload(f)).id;
  if((Object.keys(F.files).length||(F.imgs||[]).some(m=>m.file))&&!S.assets)throw{message:"image uploads are unavailable in this view"};
  for(const k in F.files)d[k]=await up(F.files[k]);
  for(const [k,,t] of sp.f)if(t=="m"){d[k]=[];for(const m of F.imgs)d[k].push(m.id||await up(m.file))}
  const col=sp.one?null:S.db.collection(F.c);
  if(sp.one)await S.db.doc(sp.one).set(d);
  else if(F.id)await col.doc(F.id).update(d);
  else await col.doc().set({...d,order:Date.now()});
  const gone=[];
  for(const [k,,t] of sp.f){const o=F.orig[k];if(t=="i"&&o&&o!==d[k])gone.push(o);if(t=="m")(o||[]).forEach(x=>{if(!d[k].includes(x))gone.push(x)})}
  for(const g of gone)try{await S.assets.delete(g)}catch(e){}
  closeMd();toast("SAVED");
 }catch(e){F.busy=false;F.err="SAVE FAILED: "+(e.message||e.code||"unknown error");drawF()}
}
async function move(c,id,dir){
 const a=S.d[c],i=a.findIndex(x=>x.id==id),B=a[i+dir],A=a[i];if(!B)return;
 try{await S.db.collection(c).doc(A.id).update({order:B.order});await S.db.collection(c).doc(B.id).update({order:A.order})}catch(e){toast("REORDER FAILED")}
}
function ask(c,id){const x=S.d[c].find(y=>y.id==id);S.cf={c,id};showMd(`<h3 style="color:var(--a)">&gt; CONFIRM_DELETE</h3><p>Delete “${esc(x[SPEC[c].tt])}” and its images? This can’t be undone.</p><div class="bar"><button class="btn" data-act="yes">DELETE</button><button class="btn" data-act="cancel">CANCEL</button></div>`)}
async function del(){
 const {c,id}=S.cf,x=S.d[c].find(y=>y.id==id),ids=[x.image,...(x.imgs||[])].filter(Boolean);
 try{await S.db.collection(c).doc(id).delete();for(const g of ids)try{await S.assets.delete(g)}catch(e){}closeMd();toast("DELETED")}catch(e){closeMd();toast("DELETE FAILED")}
}
function lb(){
 const l=S.lb,el=$("#lb");if(!l){el.hidden=true;return}
 const ims=S.d.hobbies[l.h]?.imgs||[];if(!ims.length){el.hidden=true;return}
 el.innerHTML=`<button class="btn" data-act="lbn" data-d="-1">◀</button><img src="${blob(ims[l.i])}" alt=""><button class="btn" data-act="lbn" data-d="1">▶</button>`;el.hidden=false;
}
const PAGES=["home","channels","projects","hobbies","about"];
const go=id=>{$("#nav").classList.remove("open");location.hash=id};
function route(){const h=location.hash.slice(1),p=PAGES.includes(h)?h:(h=="admin"&&S.pg)||"home",ch=p!==S.pg;S.pg=p;
 document.querySelectorAll("main section").forEach(x=>x.classList.toggle("pg",x.id==p));
 document.querySelectorAll("nav a").forEach(a=>a.classList.toggle("on",a.dataset.go==p));if(ch){scrollTo(0,0);const el=$("#"+p);el.classList.add("fresh");setTimeout(()=>el.classList.remove("fresh"),900)}}
document.addEventListener("click",e=>{
 const g=e.target.closest("[data-go]");if(g)return go(g.dataset.go);
 const l=e.target.closest("[data-lb]");if(l){S.lb={h:+l.dataset.h,i:+l.dataset.i};return lb()}
 const b=e.target.closest("[data-act]");if(!b)return;const d=b.dataset;
 const A={
  menu:()=>$("#nav").classList.toggle("open"),showlogin:()=>showLogin(),login:()=>auth(),logout:async()=>{await SB.auth.signOut();location.reload()},openadm:()=>{S.adm=1;$("#ov").hidden=false;drawAdm()},closeadm:()=>{S.adm=0;$("#ov").hidden=true},
  tab:()=>{S.tab=d.t;drawAdm()},new:()=>openForm(d.c),edit:()=>openForm(d.c,d.id),edit1:()=>openForm(d.c),
  mv:()=>move(d.c,d.id,+d.d),ask:()=>ask(d.c,d.id),yes:del,cancel:closeMd,save,
  clr:()=>{sync();F.data[d.k]="";delete F.files[d.k];delete F.prev[d.k];drawF()},
  fmv:()=>{sync();const j=+d.j,k=j+ +d.d;if(F.imgs[k]){[F.imgs[j],F.imgs[k]]=[F.imgs[k],F.imgs[j]];drawF()}},
  frm:()=>{sync();F.imgs.splice(+d.j,1);drawF()},
  lbn:()=>{e.stopPropagation();const n=(S.d.hobbies[S.lb.h].imgs||[]).length;S.lb.i=(S.lb.i+ +d.d+n)%n;lb()},
  lbx:()=>{if(e.target.id=="lb"||e.target.tagName=="IMG"){S.lb=null;lb()}}
 };A[d.act]?.();
});
document.addEventListener("change",e=>{
 const k=e.target.dataset.file;if(!k||!F)return;sync();
 const fs=[...e.target.files];if(fs.some(f=>!f.type.startsWith("image/")||f.size>20*1048576)){F.err="IMAGES ONLY, 20 MB MAX EACH";return drawF()}
 if(SPEC[F.c].f.find(x=>x[0]==k)[2]=="m")fs.forEach(f=>F.imgs.push({file:f,prev:URL.createObjectURL(f)}));
 else if(fs[0]){F.files[k]=fs[0];F.prev[k]=URL.createObjectURL(fs[0])}
 F.err="";drawF();
});
document.addEventListener("keydown",e=>{if(e.key=="Enter"&&e.target.id=="pw")auth();if(e.key=="Escape"){if(S.lb){S.lb=null;lb()}else if(!$("#md").hidden)closeMd()}});


function showLogin(){showMd(`<h3 style="color:var(--a)">&gt; ${S.hasOwner?"OWNER_LOGIN":"CREATE_OWNER_ACCOUNT"}</h3>${S.hasOwner?"":`<p class="m">// First-time setup: this account becomes the only owner. Registration closes right after.</p>`}<label>Email</label><input id="em" type="email" autocomplete="username"><label>Password (8+ characters)</label><input id="pw" type="password" autocomplete="${S.hasOwner?"current-password":"new-password"}"><p class="er" id="ae"></p><div class="bar"><button class="btn" id="ab" data-act="login">${S.hasOwner?"LOGIN":"REGISTER"}</button><button class="btn" data-act="cancel">CANCEL</button></div>`)}
async function auth(){
 const email=$("#em").value.trim(),password=$("#pw").value,e=$("#ae"),b=$("#ab"),lab=S.hasOwner?"LOGIN":"REGISTER";
 if(!email||password.length<8)return e.textContent="ENTER AN EMAIL AND A PASSWORD OF 8+ CHARACTERS";
 b.disabled=true;b.textContent="WORKING…";e.textContent="";
 const r=await(S.hasOwner?SB.auth.signInWithPassword({email,password}):SB.auth.signUp({email,password}));
 b.disabled=false;b.textContent=lab;
 if(r.error){const m=r.error.message;return e.textContent=/database error/i.test(m)?"REGISTRATION IS CLOSED":m.toUpperCase()}
 if(!r.data.session){S.hasOwner=true;return e.textContent="CHECK YOUR EMAIL TO CONFIRM, THEN LOG IN"}
 closeMd();await boot();
}
async function boot(){
 try{
  const {data:{session}}=await SB.auth.getSession();
  const h=await SB.rpc("has_owner");if(h.error)throw h.error;
  S.hasOwner=!!h.data;S.session=!!session;S.owner=session?!!(await SB.rpc("is_owner")).data:false;
  const {data,error}=await SB.from("content").select("id,kind,data");if(error)throw error;
  S.d={channels:[],projects:[],hobbies:[]};S.about={};S.set={};
  for(const r of data){if(r.kind=="site")S[r.id=="about"?"about":"set"]=r.data;else S.d[r.kind]?.push({id:r.id,...r.data})}
  for(const c in S.d)S.d[c].sort((x,y)=>(x.order||0)-(y.order||0));
  S.ready=1;S.err=null;
 }catch(e){S.err=e.message||"CONNECTION FAILED — did you run setup.sql?"}
 render();
 if(!S.err&&!S.session&&(!S.hasOwner||location.hash=="#admin")&&$("#md").hidden)showLogin();
}
function mk(kind,id){
 const w=async f=>{const {error}=await f;if(error)throw error;await boot()};
 return{
  set:d=>w(SB.from("content").upsert({id,kind,data:d})),
  update:d=>{const m={...(S.d[kind]||[]).find(x=>x.id==id),...d};delete m.id;return w(SB.from("content").upsert({id,kind,data:m}))},
  delete:()=>w(SB.from("content").delete().eq("id",id))};
}
if(SB){
 S.db={collection:c=>({doc:id=>mk(c,id||crypto.randomUUID())}),doc:p=>mk("site",p.split("/")[1])};
 S.assets={
  upload:async f=>{const x=(f.name.split(".").pop()||"").toLowerCase(),id=crypto.randomUUID()+(/^[a-z0-9]{2,5}$/.test(x)?"."+x:"");const {error}=await SB.storage.from("media").upload(id,f,{contentType:f.type});if(error)throw error;return{id}},
  delete:async id=>{await SB.storage.from("media").remove([id])}};
}else S.err="SETUP_REQUIRED — paste your Supabase URL and anon key near the top of index.html";
render();
(()=>{let seen;try{seen=sessionStorage.getItem("boot")}catch(e){}
 if(seen||matchMedia("(prefers-reduced-motion:reduce)").matches)return;
 const el=$("#boot"),L=["&gt; BOOT_SEQUENCE v1.0","&gt; MOUNTING ARCHIVE .......... [OK]","&gt; ESTABLISHING SECURE LINK .. [OK]","&gt; ACCESS GRANTED_"];
 el.hidden=false;let i=0;
 const end=()=>{clearInterval(t);el.classList.add("out");setTimeout(()=>el.hidden=true,500);try{sessionStorage.setItem("boot","1")}catch(e){}};
 const t=setInterval(()=>{if(i<L.length)el.insertAdjacentHTML("beforeend","<div>"+L[i++]+"</div>");else end()},320);
 el.onclick=end;
})();
route();if(SB)boot();
addEventListener("hashchange",()=>{route();if(SB&&S.ready&&location.hash=="#admin"&&!S.session)showLogin()});
