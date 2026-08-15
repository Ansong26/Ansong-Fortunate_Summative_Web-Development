
/* ---------- Application state ---------- */
const state = {
  view: "landing",
  index: 0,
  answers: [],
  score: {},
  streak: 0,
  seconds: 120,
  timerId: null,
  timedOut: false,
  profile: {}
};

const questions = [('single', 'When a program becomes unexpectedly slow, what would you investigate first?', ['Memory and CPU behaviour', 'The visual design', 'The colour palette', 'The page title'], [0]), ('single', 'Which activity sounds most exciting?', ['Understanding how memory and processors work', 'Building immersive 3D experiences', 'Creating websites and APIs', 'Training a model to recognise patterns'], [0, 1, 2, 3]), ('single', 'You receive a large problem. What is your preferred first move?', ['Inspect system constraints', 'Sketch an interactive experience', 'Design data flow between interface and server', 'Explore the data and identify patterns'], [0, 1, 2, 3]), ('single', 'Which technology challenge interests you most?', ['Operating systems and hardware', 'Spatial interaction and 3D', 'Databases, APIs and user interfaces', 'Prediction and intelligent systems'], [0, 1, 2, 3]), ('single', 'Which project would you most likely volunteer for?', ['A tiny operating-system component', 'A virtual campus tour', 'A student services web portal', 'A model predicting study outcomes'], [0, 1, 2, 3]), ('hotspot', 'Hotspot: click the area you would investigate first when debugging a computer.', ['CPU', 'Memory', 'Storage', 'Network'], [0, 1, 2, 3]), ('video', 'Video scenario: imagine a 12-second product demo. Pause when you notice the interaction that matters most to you.', ['Performance/technical behaviour', '3D interaction', 'User interface flow', 'Data-driven behaviour'], [0, 1, 2, 3]), ('single', 'Which learning outcome would make you most proud?', ['Writing efficient low-level code', 'Creating believable virtual worlds', 'Launching a complete web application', 'Building a useful predictive model'], [0, 1, 2, 3])];
const categories = ['Low-Level Programming', 'AR/VR', 'Full-Stack Web Development', 'Machine Learning'];

/* ---------- Navigation ---------- */
function showView(id){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelectorAll("[data-nav]").forEach(b=>b.classList.toggle("active",b.dataset.nav===id));
  state.view=id;
  window.scrollTo({top:0,behavior:"smooth"});
}

/* ---------- Inline validation ---------- */
function setError(input, message){
  const error = input.parentElement.querySelector(".error-message");
  input.classList.toggle("is-invalid", !!message);
  input.classList.toggle("is-valid", !message);
  if(error) error.textContent = message || "";
}
function validateName(){
  const el=document.getElementById("name");
  if(!el) return false;
  const ok=/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/.test(el.value.trim());
  setError(el,ok?"":"Enter a valid name using letters, spaces, apostrophes or hyphens.");
  return ok;
}
function validateEmail(){
  const el=document.getElementById("email");
  if(!el) return false;
  const ok=/^[A-Za-z0-9._%+-]+@bse\.ac\.mu$/.test(el.value.trim().toLowerCase());
  setError(el,ok?"":"Use your institutional email, e.g. student.id@bse.ac.mu.");
  return ok;
}
function validatePhone(){
  const el=document.getElementById("phone");
  if(!el) return false;
  const ok=/^\+230\s?[0-9]{8}$/.test(el.value.trim());
  setError(el,ok?"":"Use a Mauritius number such as +230 51234567.");
  return ok;
}
function validateForm(){
  const a=validateName(),b=validateEmail(),c=validatePhone();
  const goal=document.getElementById("goal");
  if(goal) setError(goal,goal.value.trim().length>=10?"":"Please describe a goal of at least 10 characters.");
  return a&&b&&c&&goal&&goal.value.trim().length>=10;
}
["name","email","phone","goal"].forEach(id=>{
  const el=document.getElementById(id);
  if(el){ el.addEventListener("input",validateForm); el.addEventListener("blur",validateForm); }
});

/* ---------- Quiz engine ---------- */
function startQuiz(){
  if(!validateForm()) return;
  state.profile={
    name:document.getElementById("name").value.trim(),
    email:document.getElementById("email").value.trim(),
    phone:document.getElementById("phone").value.trim(),
    goal:document.getElementById("goal").value.trim()
  };
  state.index=0; state.answers=[]; state.streak=0; state.timedOut=false;
  state.score=Object.fromEntries(categories.map(c=>[c,0]));
  state.seconds=120;
  startTimer();
  renderQuestion();
  showView("quiz");
}
function startTimer(){
  clearInterval(state.timerId);
  updateTimer();
  state.timerId=setInterval(()=>{
    state.seconds--;
    updateTimer();
    if(state.seconds<=0){
      clearInterval(state.timerId);
      state.timedOut=true;
      document.getElementById("timeoutWarning").hidden=false;
      submitQuiz();
    }
  },1000);
}
function updateTimer(){
  const m=String(Math.floor(state.seconds/60)).padStart(2,"0");
  const s=String(state.seconds%60).padStart(2,"0");
  const t=document.getElementById("timer");
  if(t) t.textContent=`${m}:${s}`;
}
function renderQuestion(){
  const q=questions[state.index];
  document.getElementById("qNumber").textContent=`Question ${state.index+1} of ${questions.length}`;
  document.getElementById("progressBar").style.width=`${((state.index)/questions.length)*100}%`;
  document.getElementById("questionText").textContent=q[1];
  const media=document.getElementById("media");
  media.innerHTML="";
  if(q[0]==="hotspot") renderHotspot(media,q);
  else if(q[0]==="video") renderVideo(media,q);
  else media.innerHTML=`<div class="notice">Choose the response that best reflects your first instinct.</div>`;
  const options=document.getElementById("options");
  options.innerHTML="";
  q[2].forEach((text,i)=>{
    const b=document.createElement("button");
    b.className="option";
    b.type="button";
    b.innerHTML=`<strong>${String.fromCharCode(65+i)}.</strong> ${text}`;
    b.onclick=()=>selectAnswer(i,b);
    options.appendChild(b);
  });
  document.getElementById("nextBtn").disabled=true;
  if(state.answers[state.index]!==undefined) selectAnswer(state.answers[state.index],options.children[state.answers[state.index]]);
}
function renderHotspot(container,q){
  container.innerHTML=`<div class="hotspot" aria-label="Interactive campus-style hotspot image">
    <div class="zone z1" data-i="0">CPU</div><div class="zone z2" data-i="1">Memory</div>
    <div class="zone z3" data-i="2">Storage</div><div class="zone z4" data-i="3">Network</div>
  </div><p class="muted">Click a visual region to record your choice.</p>`;
  container.querySelectorAll(".zone").forEach(z=>z.addEventListener("click",()=>selectAnswer(Number(z.dataset.i),z)));
}
function renderVideo(container,q){
  container.innerHTML=`<video id="scenarioVideo" controls width="100%" preload="metadata">
    <source src="https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" type="video/mp4">
  </video><p class="muted">The custom timeupdate listener pauses the scenario at 5 seconds so you can reflect before choosing.</p>`;
  const v=document.getElementById("scenarioVideo");
  v.addEventListener("timeupdate",()=>{if(v.currentTime>=5 && !v.dataset.paused){v.pause();v.dataset.paused="true";}});
}
function selectAnswer(i,element){
  state.answers[state.index]=i;
  document.querySelectorAll(".option").forEach(x=>x.classList.remove("selected"));
  if(element) element.classList.add("selected");
  document.getElementById("nextBtn").disabled=false;
}
function nextQuestion(){
  if(state.answers[state.index]===undefined) return;
  if(state.index<questions.length-1){state.index++;renderQuestion();}
  else submitQuiz();
}
function submitQuiz(){
  clearInterval(state.timerId);
  state.score=Object.fromEntries(categories.map(c=>[c,0]));
  state.streak=0;
  questions.forEach((q,i)=>{
    const answer=state.answers[i];
    if(answer===undefined) return;
    const catIndex=q[3][answer];
    const speedMultiplier=state.seconds>60?1.25:1;
    const streakMultiplier=state.streak>=2?1.2:1;
    state.score[categories[catIndex]] += 10*speedMultiplier*streakMultiplier;
    state.streak++;
  });
  renderResults();
  showView("results");
}
function renderResults(){
  const entries=Object.entries(state.score).sort((a,b)=>b[1]-a[1]);
  const top=entries[0];
  document.getElementById("resultTitle").textContent=top[0];
  document.getElementById("resultScore").textContent=Math.round(top[1]);
  document.getElementById("resultFeedback").textContent=feedback(top[0]);
  document.getElementById("recommendation").textContent=recommendation(top[0]);
  document.getElementById("timeoutResult").textContent=state.timedOut?"The timer expired, so your current answers were submitted automatically.":"Completed before the timer expired.";
  drawChart(state.score);
}
function feedback(cat){
  const map={
    "Low-Level Programming":"You show curiosity about how computers work beneath the interface.",
    "AR/VR":"You appear drawn to immersive, visual and spatial problem solving.",
    "Full-Stack Web Development":"You enjoy connecting interfaces, logic, data and users.",
    "Machine Learning":"You are interested in patterns, prediction and intelligent systems.",
    "Communication":"You naturally prioritise clarity, listening and shared understanding.",
    "Critical Thinking":"You tend to question assumptions and compare evidence.",
    "Time Management":"You value structure, prioritisation and reliable execution.",
    "Leadership":"You are comfortable coordinating people toward a shared outcome.",
    "Education":"You are motivated by learning, knowledge and opportunity.",
    "Health":"You are interested in wellbeing and healthier communities.",
    "Climate Change":"You are motivated by environmental resilience and sustainability.",
    "Women Empowerment":"You value inclusion, voice, agency and equal opportunity."
  }; return map[cat]||"Your responses reveal a promising starting point for further exploration.";
}
function recommendation(cat){
  return `Next step: choose one small project related to ${cat}, speak with a mentor, and test your interest through practice rather than choosing only from labels.`;
}

/* ---------- Canvas 2D chart: hand-drawn bar graph ---------- */
function drawChart(scores){
  const canvas=document.getElementById("resultChart"),ctx=canvas.getContext("2d");
  const dpr=window.devicePixelRatio||1,w=canvas.clientWidth,h=360;
  canvas.width=w*dpr;canvas.height=h*dpr;ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const max=Math.max(...Object.values(scores),10), keys=Object.keys(scores), pad=50;
  ctx.strokeStyle="#dce2ee";ctx.fillStyle="#172033";ctx.font="14px system-ui";
  ctx.beginPath();ctx.moveTo(pad,20);ctx.lineTo(pad,h-45);ctx.lineTo(w-20,h-45);ctx.stroke();
  keys.forEach((key,i)=>{
    const x=pad+20+i*((w-pad-40)/keys.length), bw=45;
    const bh=(scores[key]/max)*(h-85), y=h-45-bh;
    ctx.fillStyle="#5b4bdb";ctx.fillRect(x,y,bw,bh);
    ctx.fillStyle="#172033";ctx.save();ctx.translate(x+bw/2,h-15);ctx.rotate(-.35);ctx.textAlign="center";ctx.fillText(key,0,0);ctx.restore();
    ctx.fillText(Math.round(scores[key]),x,h-55-bh);
  });
}
window.addEventListener("resize",()=>{if(state.view==="results")drawChart(state.score)});

/* ---------- Contact form ---------- */
function submitContact(e){
  e.preventDefault();
  const form=e.target, msg=document.getElementById("contactSuccess");
  const name=form.querySelector("[name=contactName]"),email=form.querySelector("[name=contactEmail]"),text=form.querySelector("[name=message]");
  let ok=true;
  [[name,/^[A-Za-zÀ-ÖØ-öø-ÿ' -]{2,50}$/,"Enter a valid name."],[email,/^[^@\s]+@[^@\s]+\.[^@\s]+$/,"Enter a valid email."],[text,/.{15,}/,"Message must be at least 15 characters."]].forEach(([el,re,err])=>{
    const good=re.test(el.value.trim());setError(el,good?"":err);ok=ok&&good;
  });
  msg.hidden=!ok;if(ok) form.reset();
}

