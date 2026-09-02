const K="minhaAgendaV1";
let D=JSON.parse(localStorage.getItem(K)||'{"events":[],"tasks":[],"notes":[]}'),M=new Date(),TYPE="event";

const $=s=>document.querySelector(s),
$$=s=>document.querySelectorAll(s),
today=()=>new Date().toISOString().slice(0,10);

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

const fmt=d=>new Date(d+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric"});

function save(){
  localStorage.setItem(K,JSON.stringify(D));
  render();
}

function go(id){
  $$("section").forEach(x=>x.classList.remove("active"));
  $("#"+id).classList.add("active");
  $$("[data-go]").forEach(x=>x.classList.toggle("active",x.dataset.go==id));
}

$$("[data-go]").forEach(x=>x.onclick=()=>go(x.dataset.go));

$("#theme").onclick=()=>{
  document.body.classList.toggle("dark");
  localStorage.setItem("dark",document.body.classList.contains("dark"));
};

if(localStorage.getItem("dark")=="true")
  document.body.classList.add("dark");

function task(t){
  return '<div class="item row"><div><input type="checkbox" data-toggle="'+t.id+'" '+(t.done?"checked":"")+'><span class="'+(t.done?"done":"")+'">'+esc(t.title)+'</span><br><small>'+esc(t.date||"Sem data")+' • '+esc(t.priority||"Normal")+'</small></div><button class="danger" data-dt="'+t.id+'">Excluir</button></div>'
}

function render(){
  let n=new Date();

  $("#date").textContent=n.toLocaleDateString("pt-BR",{
    weekday:"long",
    day:"numeric",
    month:"long"
  });

  $("#ec").textContent=D.events.length;
  $("#tc").textContent=D.tasks.filter(x=>!x.done).length;
  $("#nc").textContent=D.notes.length;

  let ev=[...D.events]
    .filter(e=>new Date(e.date+"T"+(e.time||"23:59"))>=n)
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
    .slice(0,5);

  $("#up").innerHTML=ev.length?
    ev.map(e=>'<div class="item"><b>'+esc(e.title)+'</b><br><small>'+fmt(e.date)+(e.time?" • "+esc(e.time):"")+(e.location?" • "+esc(e.location):"")+'</small></div>').join("")
    :
    '<div class="muted">Nenhum compromisso próximo.</div>';

  let tt=D.tasks.filter(x=>x.date==today());

  $("#today").innerHTML=tt.length?
    tt.map(task).join("")
    :
    '<div class="muted">Nenhuma tarefa para hoje.</div>';

  $("#tasksList").innerHTML=D.tasks.length?
    D.tasks.map(task).join("")
    :
    '<div class="muted">Nenhuma tarefa cadastrada.</div>';

  $("#events").innerHTML=D.events.length?
    D.events
    .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time))
    .map(e=>'<div class="item row"><div><b>'+esc(e.title)+'</b><br><small>'+fmt(e.date)+(e.time?" • "+esc(e.time):"")+(e.location?" • "+esc(e.location):"")+'</small>'+(e.notes?'<div class="muted">'+esc(e.notes)+'</div>':'')+'</div><button class="danger" data-de="'+e.id+'">Excluir</button></div>')
    .join("")
    :
    '<div class="muted">Nenhum compromisso cadastrado.</div>';

  let y=M.getFullYear(),
      m=M.getMonth(),
      days=new Date(y,m+1,0).getDate(),
      first=new Date(y,m,1).getDay();

  $("#month").textContent=new Date(y,m,1).toLocaleDateString("pt-BR",{
    month:"long",
    year:"numeric"
  });

  let c="";

  for(let i=0;i<first;i++)
    c+="<span></span>";

  for(let d=1;d<=days;d++){
    let ds=new Date(y,m,d).toISOString().slice(0,10);

    c+='<button class="day '+(ds==today()?"today ":"")+(D.events.some(e=>e.date==ds)?"has":"")+'" data-day="'+ds+'">'+d+"</button>";
  }

  $("#cal").innerHTML=c;

  let q=$("#search").value.toLowerCase();

  let ns=D.notes.filter(x=>
    (x.title+" "+x.text).toLowerCase().includes(q)
  );

  $("#notesList").innerHTML=ns.length?
    ns.map(x=>'<div class="note"><div class="row"><b>'+esc(x.title)+'</b><button class="danger" data-dn="'+x.id+'">Excluir</button></div><p>'+esc(x.text)+'</p></div>').join("")
    :
    '<div class="muted">Nenhuma anotação encontrada.</div>';
}

function open(type,date=""){
  TYPE=type;

  $("#modal").classList.add("show");

  $("#mtitle").textContent=
    type=="event"?"Novo compromisso":
    type=="task"?"Nova tarefa":
    "Nova anotação";

  let f=$("#form");

  if(type=="event")
    f.innerHTML='<label>Título<input name="title" required></label><label>Data<input name="date" type="date" value="'+(date||today())+'" required></label><label>Horário<input name="time" type="time"></label><label>Local<input name="location"></label><label>Observações<textarea name="notes"></textarea></label><div class="actions"><button type="button" class="icon" id="cancel">Cancelar</button><button class="primary">Salvar</button></div>';

  if(type=="task")
    f.innerHTML='<label>Tarefa<input name="title" required></label><label>Data<input name="date" type="date" value="'+(date||today())+'"></label><label>Prioridade<select name="priority"><option>Normal</option><option>Alta</option><option>Baixa</option></select></label><div class="actions"><button type="button" class="icon" id="cancel">Cancelar</button><button class="primary">Salvar</button></div>';

  if(type=="note")
    f.innerHTML='<label>Título<input name="title" required></label><label>Texto<textarea name="text" required></textarea></label><div class="actions"><button type="button" class="icon" id="cancel">Cancelar</button><button class="primary">Salvar</button></div>';

  $("#cancel").onclick=close;
}

function close(){
  $("#modal").classList.remove("show");
}

$("#close").onclick=close;

$("#form").onsubmit=e=>{
  e.preventDefault();

  let o=Object.fromEntries(new FormData(e.target));

  o.id=Date.now();

  if(TYPE=="event")
    D.events.push(o);

  if(TYPE=="task"){
    o.done=false;
    D.tasks.push(o);
  }

  if(TYPE=="note")
    D.notes.push(o);

  save();
  close();
};

document.addEventListener("click",e=>{

  let n=e.target.closest("[data-new]");
  if(n)open(n.dataset.new);

  let d=e.target.closest("[data-dt]");
  if(d){
    D.tasks=D.tasks.filter(x=>x.id!=d.dataset.dt);
    save();
  }

  let de=e.target.closest("[data-de]");
  if(de){
    D.events=D.events.filter(x=>x.id!=de.dataset.de);
    save();
  }

  let dn=e.target.closest("[data-dn]");
  if(dn){
    D.notes=D.notes.filter(x=>x.id!=dn.dataset.dn);
    save();
  }

  let tg=e.target.closest("[data-toggle]");
  if(tg){
    let t=D.tasks.find(x=>x.id==tg.dataset.toggle);
    if(t)t.done=tg.checked;
    save();
  }

  let day=e.target.closest("[data-day]");
  if(day)open("event",day.dataset.day);
});

$("#prev").onclick=()=>{
  M.setMonth(M.getMonth()-1);
  render();
};

$("#next").onclick=()=>{
  M.setMonth(M.getMonth()+1);
  render();
};

$("#search").oninput=render;

$("#fab").onclick=()=>open("event");

render();
