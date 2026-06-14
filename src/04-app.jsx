function App(){
  const [formation,setFormation]=useState(null);   // chosen FORMATION object
  const [xi,setXi]=useState([]);                    // array length 11 of player|null
  const [spin,setSpin]=useState(null);
  const [spinCount,setSpinCount]=useState(0);
  const [rerolls,setRerolls]=useState(2);           // two free re-rolls per game to dodge a squad
  const [result,setResult]=useState(null);
  const [hard,setHard]=useState(false);
  const [anim,setAnim]=useState(false);
  const [theme,setTheme]=useState("dark");
  const [simSeason,setSimSeason]=useState(SEASONS[0]);   // which IPL season's league you face
  const league=LEAGUES[simSeason]||[];
  const [battingOrder,setBattingOrder]=useState(null);   // user-set batting order (slot indices) once XI is full
  const [rev,setRev]=useState(0);                   // matches revealed so far (game-by-game)
  const feedEnd=useRef(null);
  useEffect(()=>{ document.documentElement.setAttribute("data-theme",theme); },[theme]);
  // ---- profile + achievements (persisted on this device) ----
  const [profile,setProfile]=useState(loadProfile);
  const [showAch,setShowAch]=useState(false);
  const [toasts,setToasts]=useState([]);
  useEffect(()=>{ try{localStorage.setItem("ipl160_profile",JSON.stringify(profile));}catch(e){} },[profile]);
  useEffect(()=>{ if(!toasts.length)return; const id=setTimeout(()=>setToasts(t=>t.slice(1)),4500); return ()=>clearTimeout(id); },[toasts]);
  const unlockedCount=profile.unlocked.length;
  // apply a stats update, then unlock any newly-earned achievements (with a toast)
  function bump(updater){
    setProfile(p=>{
      const stats=updater(p.stats);
      const newly=ACHIEVEMENTS.filter(a=>a.chk(stats)&&!p.unlocked.includes(a.id));
      if(newly.length) setTimeout(()=>setToasts(t=>[...t,...newly.map(a=>({...a,key:Math.random()}))]),0);
      return {...p,stats,unlocked:newly.length?[...p.unlocked,...newly.map(a=>a.id)]:p.unlocked};
    });
  }
  function resetProfile(){ setProfile({name:"",unlocked:[],stats:{...BLANK_STATS,seasonsWon:[]}}); setShowAch(false); }
  // reveal the season one game at a time once a result is set
  useEffect(()=>{
    if(!result){setRev(0);return;}
    setRev(0);
    const total=result.feed.length; let n=0;
    const id=setInterval(()=>{ n++; setRev(n); if(n>=total)clearInterval(id); },520);
    return ()=>clearInterval(id);
  },[result]);
  useEffect(()=>{ if(result&&feedEnd.current)feedEnd.current.scrollIntoView({behavior:"smooth",block:"nearest"}); },[rev,result]);

  function chooseFormation(f){
    setFormation(f); setXi(Array(f.slots.length).fill(null));
    setSpin(null);setSpinCount(0);setRerolls(2);setResult(null);setBattingOrder(null);
  }
  function restart(){setFormation(null);setXi([]);setSpin(null);setSpinCount(0);setRerolls(2);setResult(null);setBattingOrder(null);}
  function doReroll(){ if(!spin||rerolls<=0)return; setRerolls(r=>r-1); doSpin(); }

  const themeBtn=(
    <button className="theme-btn" title="Toggle theme" onClick={()=>setTheme(t=>t==="light"?"dark":"light")}>
      {theme==="light"?"🌙":"☀"}
    </button>
  );
  const accountBar=(
    <button className="acct" onClick={()=>setShowAch(true)} title="Achievements">🏆 {unlockedCount}/{ACHIEVEMENTS.length}</button>
  );
  const overlays=(
    <>
      {showAch && (
        <div className="modal-ov" onClick={()=>setShowAch(false)}>
          <div className="modal wide" onClick={e=>e.stopPropagation()}>
            <div className="modal-top">
              <div><h3 className="modal-h">Achievements</h3>
                <div className="small">{unlockedCount} of {ACHIEVEMENTS.length} unlocked · {profile.stats.titles} titles · {profile.stats.sims} seasons played</div></div>
              <button className="theme-btn" onClick={()=>setShowAch(false)}>✕</button>
            </div>
            <div className="ach-grid">
              {ACHIEVEMENTS.map(a=>{const got=profile.unlocked.includes(a.id);return (
                <div key={a.id} className={"ach"+(got?" got":"")}>
                  <span className="ach-ic">{a.icon}</span>
                  <div style={{minWidth:0}}><div className="ach-nm">{a.name}</div><div className="ach-ds">{a.desc}</div></div>
                  {got&&<span className="ach-ok">✓</span>}
                </div>
              );})}
            </div>
            <div className="modal-foot">
              <button className="btn-ghost" onClick={resetProfile}>Reset progress</button>
            </div>
          </div>
        </div>
      )}
      {toasts.length>0 && (
        <div className="toast-wrap">
          {toasts.map(t=>(
            <div key={t.key} className="toast"><span className="toast-ic">{t.icon}</span>
              <div><div className="toast-lbl">🏆 Achievement unlocked</div><div className="toast-nm">{t.name}</div>
                <div className="toast-ds">{t.desc}</div></div></div>
          ))}
        </div>
      )}
    </>
  );

  if(!formation){
    return (
      <div className="wrap">
        {overlays}
        <div className="topbar">
          <span className="kicker">IPL · All Seasons · 2008–2026</span>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>{accountBar}{themeBtn}</div>
        </div>
        <div className="intro">
          <span className="intro-badge">Indian Premier League</span>
          <div className="intro-logo">16<span>·0</span></div>
          <div className="intro-tagline">Spin the slot, draft a real IPL squad player by player, and chase a flawless 16-0 — win all 14 and lift the cup.</div>
          <div className="intro-divider"></div>
          <div className="section-label">Choose your formation</div>
          <div className="forms">
            {FORMATIONS.map((f,i)=>{
              const c={};f.slots.forEach(s=>c[s]=(c[s]||0)+1);
              return (
                <div key={i} className="form" onClick={()=>chooseFormation(f)}>
                  <h3>{f.name}</h3>
                  <div className="desc">{f.desc}</div>
                  <div className="chips">
                    {(c.TOP||0)>0 && <span className="chip">{c.TOP} Top order</span>}
                    {(c.FIN||0)>0 && <span className="chip">{c.FIN} Finisher</span>}
                    {(c.WK||0)>0 && <span className="chip">{c.WK} Keeper</span>}
                    {(c.AR||0)>0 && <span className="chip">{c.AR} All-rounder</span>}
                    {(c.PACE||0)>0 && <span className="chip">{c.PACE} Pace</span>}
                    {(c.SPIN||0)>0 && <span className="chip">{c.SPIN} Spin</span>}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="intro-divider"></div>
          <div className="section-label">Which season's league will you face?</div>
          <select className="seasel" value={simSeason} onChange={e=>setSimSeason(+e.target.value)}>
            {SEASONS.map(s=><option key={s} value={s}>IPL {s} · {LEAGUES[s].length} teams</option>)}
          </select>
          <div className="intro-divider"></div>
          <div className="intro-foot">
            <button className={"hardtog"+(hard?" on":"")} onClick={()=>setHard(h=>!h)}
              title="Hide every rating and stat until your XI is complete">
              <span className="htdot"/> Hard mode <span className="htstate">{hard?"ON":"OFF"}</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  const slots=formation.slots.map((t,i)=>({i,type:t,...SLOTDEF[t]}));
  // batting-order display: openers, then all-rounders (before finishers), keeper, finishers, then bowlers
  const SLOT_ORDER={TOP:0,AR:1,WK:2,FIN:3,PACE:4,SPIN:5};
  const slotsDisplay=slots.slice().sort((a,b)=>(SLOT_ORDER[a.type]-SLOT_ORDER[b.type])||(a.i-b.i));
  const filled=xi.filter(Boolean);
  const overseasCount=filled.filter(p=>p.ovs).length;
  const openSlots=slots.filter(s=>!xi[s.i]);
  const teamRating=filled.length?Math.round(filled.reduce((a,p)=>a+p.r,0)/filled.length):0;
  const complete=filled.length===slots.length;
  const hideR=hard&&!complete;   // hard mode hides ratings while drafting, then reveals once the XI is full
  // ---- batting order: a sensible default (by historical position, then rating) that the user can tweak ----
  const defaultOrder=()=>slots.filter(s=>xi[s.i]).map(s=>s.i).sort((a,b)=>(bpOf(xi[a])-bpOf(xi[b]))||(xi[b].r-xi[a].r));
  const orderValid=battingOrder&&battingOrder.length===filled.length&&battingOrder.every(i=>xi[i]);
  const battOrder=complete?(orderValid?battingOrder:defaultOrder()):null;   // slot indices in batting order
  const canUp=idx=>battOrder&&idx>0&&bpOf(xi[battOrder[idx]])<=idx;          // can this player bat one spot higher?
  const canDown=idx=>battOrder&&idx<battOrder.length-1&&bpOf(xi[battOrder[idx+1]])<=idx+1; // can the one below come up?
  function moveBat(idx,dir){
    const base=battOrder||defaultOrder(); const j=idx+dir; if(j<0||j>=base.length)return;
    if(bpOf(xi[base[idx]])>j+1||bpOf(xi[base[j]])>idx+1)return;   // respect each player's highest valid position
    const nx=base.slice(); const t=nx[idx];nx[idx]=nx[j];nx[j]=t; setBattingOrder(nx);
  }
  // ---- live unit-strength breakdown: Top order / Middle order / Bowling ----
  const _avg=arr=>arr.length?Math.round(arr.reduce((a,p)=>a+p.r,0)/arr.length):0;
  // unit averages are based on the SLOT a player is drafted into (their position in the team), not their tag
  const inSlots=types=>slots.filter(s=>types.includes(s.type)&&xi[s.i]).map(s=>xi[s.i]);
  const topUnit=inSlots(["TOP"]);
  const midUnit=inSlots(["FIN","WK","AR"]);
  const bowlUnit=inSlots(["PACE","SPIN","AR"]);
  const units=[{k:"TOP",label:"Top order",r:_avg(topUnit),n:topUnit.length},
               {k:"MID",label:"Middle / finish",r:_avg(midUnit),n:midUnit.length},
               {k:"BOWL",label:"Bowling",r:_avg(bowlUnit),n:bowlUnit.length}];
  // ---- projected league rank vs the real 2026 field (you + 10 franchises = 11) ----
  const fieldR=league.map(t=>t.rating);
  const projRank=teamRating?1+fieldR.filter(r=>r>teamRating).length:null;
  const ordSuffix=n=>{const s=["th","st","nd","rd"],v=n%100;return n+(s[(v-20)%10]||s[v]||s[0]);};
  // ---- cricket-ground layout: fixed role lanes; keeper always centred behind the stumps ----
  const LANES={TOP:{y:16,ins:30},AR:{y:33,ins:19},FIN:{y:50,ins:22},WK:{y:64,ins:0},BOWL:{y:82,ins:30}};
  const laneKey=t=>(t==="TOP"||t==="FIN"||t==="AR"||t==="WK")?t:"BOWL";   // PACE/SPIN -> BOWL lane
  const groups={};
  slots.forEach(s=>{const k=laneKey(s.type);(groups[k]=groups[k]||[]).push(s);});
  const gpos={};
  Object.entries(groups).forEach(([k,arr])=>{const L=LANES[k],n=arr.length;
    arr.forEach((s,i)=>{gpos[s.i]={x:(n===1)?50:L.ins+(100-2*L.ins)*i/(n-1),y:L.y};});});
  const lastName=n=>{const a=n.trim().split(" ");return a[a.length-1];};
  const dotKey=(p,s)=> p ? (p.role==="BAT"?(p.pos==="FINISH"?"FIN":"TOP"):(p.role==="WK"?"WK":p.role)) : s.type;

  function eligibleSlot(p){
    if(filled.some(q=>q.name===p.name)) return null;
    if(p.ovs && overseasCount>=MAX_OVERSEAS) return null;
    return openSlots.find(s=>s.ok(p))||null;
  }
  function doSpin(){
    const usable=allSquads.filter(sq=>PLAYERS.some(p=>sqKey(p)===sq && eligibleSlot(p)));
    setAnim(true);setTimeout(()=>setAnim(false),450);
    setSpin(rnd(usable.length?usable:allSquads));setSpinCount(c=>c+1);setResult(null);
  }
  function draft(p){
    const slot=eligibleSlot(p); if(!slot) return;
    const nx=[...xi]; nx[slot.i]={...p}; setXi(nx); setSpin(null);
    const fl=nx.filter(Boolean);
    if(fl.length===slots.length){   // XI just completed -> record draft achievements
      const rating=Math.round(fl.reduce((a,q)=>a+q.r,0)/fl.length), ovs=fl.filter(q=>q.ovs).length;
      bump(s=>({...s,drafts:s.drafts+1,bestRating:Math.max(s.bestRating,rating),overseasMax:Math.max(s.overseasMax,ovs)}));
    }
  }

  function simulate(){
    const myBats=filled.filter(p=>p.role==="BAT"||p.role==="WK"||p.role==="AR");
    const myBowls=filled.filter(p=>p.role==="PACE"||p.role==="SPIN"||p.role==="AR");
    const orderedXI=(battOrder||defaultOrder()).map(i=>xi[i]);   // user's batting line-up feeds who scores
    const you={name:"YOUR XI",abbr:"YOU",rating:teamRating,you:true,pts:0,w:0,l:0,
      bats:orderedXI,bowls:myBowls,batR:avgR(myBats),bowlR:avgR(myBowls)};
    // the chosen season's real franchises + your XI
    const teams=[you,...league.map(t=>({...t,pts:0,w:0,l:0}))];
    const N=teams.length;
    const tally={};                                         // player -> {runs,wkts,team}
    const sched=buildSchedule(N);                           // every team plays exactly 14 league games
    const myMatches=[];
    sched.forEach(([i,j])=>{
      const A=teams[i],B=teams[j],m=playMatch(A,B,tally);
      m.win.pts+=2;m.win.w++;m.lose.l++;
      const yv=youView(A,B,m); if(yv) myMatches.push(yv);
    });
    teams.sort((a,b)=>b.pts-a.pts||b.rating-a.rating);
    const top4=teams.slice(0,4),made=top4.includes(you);
    const playoffs=[];
    // playoffs always resolve so the league has a champion + MVP even if you miss out
    const[t1,t2,t3,t4]=top4;
    const q1=playMatch(t1,t2,tally),el=playMatch(t3,t4,tally);
    const q2=playMatch(q1.lose,el.win,tally),fin=playMatch(q1.win,q2.win,tally);
    [[t1,t2,q1,"Qualifier 1"],[t3,t4,el,"Eliminator"],[q1.lose,el.win,q2,"Qualifier 2"],[q1.win,q2.win,fin,"Final"]]
      .forEach(([A,B,m,lab])=>{const yv=youView(A,B,m,lab);if(yv)playoffs.push(yv);});
    const champTeam=fin.win, champion=fin.win===you, pw=playoffs.filter(p=>p.won).length;
    const champName=champTeam.you?"YOUR XI":champTeam.name;
    const stage=champion?"CHAMPIONS":(made?"Lost in the playoffs":"Missed the playoffs");
    // ---- season awards from the per-player tally ----
    const arr=Object.entries(tally).map(([name,t])=>({name,...t}));
    const orange=arr.slice().sort((a,b)=>b.runs-a.runs)[0]||{name:"—",runs:0,team:""};
    const purple=arr.slice().sort((a,b)=>b.wkts-a.wkts)[0]||{name:"—",wkts:0,team:""};
    // MVP index: runs + wickets*20, plus a bonus for going deep (champions / finalists)
    const finalists=new Set([fin.win.abbr,fin.lose.abbr]);
    const score=arr.map(x=>({...x,mvpPts:x.runs+x.wkts*20+(x.team===champTeam.abbr?40:(finalists.has(x.team)?18:0))}));
    const mvp=score.slice().sort((a,b)=>b.mvpPts-a.mvpPts)[0]||{name:"—",runs:0,wkts:0,team:"",mvpPts:0};
    const allr=score.filter(x=>x.wkts>=6&&x.runs>=110).sort((a,b)=>b.mvpPts-a.mvpPts)[0]||null;
    // Player of the Final = the higher top score across the two final innings
    const poFinal=(fin.atop.score>=fin.btop.score)
      ? {name:fin.atop.name,score:fin.atop.score,team:q1.win.abbr}
      : {name:fin.btop.name,score:fin.btop.score,team:q2.win.abbr};
    const feed=[...myMatches.map(m=>({...m,playoff:false})),...playoffs.map(m=>({...m,playoff:true}))];
    setResult({teams,you:{...you},stage,champion,champName,pw,made,perfect:you.w===14&&champion,
      feed,orange,purple,mvp,allr,poFinal,season:simSeason});
    // ---- record achievement stats for this campaign ----
    const projR=1+fieldR.filter(r=>r>teamRating).length;
    const lostFirst5=myMatches.length>=5 && myMatches.slice(0,5).every(m=>!m.won);
    const champPunjabDc=!champion && /Punjab|Delhi/.test(champName);
    const lastIsYou=teams[teams.length-1]===you, topIsYou=teams[0]===you;
    bump(s=>{
      const ns={...s,sims:s.sims+1};
      if(champion){
        ns.titles=s.titles+1;
        ns.seasonsWon=s.seasonsWon.includes(simSeason)?s.seasonsWon:[...s.seasonsWon,simSeason];
        if(hard)ns.hardTitles=s.hardTitles+1;
        if(you.w===14)ns.perfects=s.perfects+1;
        if(you.w===14&&hard)ns.perfectHard=s.perfectHard+1;
        if(projR>=5)ns.underdogTitles=s.underdogTitles+1;
        if(lostFirst5)ns.comeback=s.comeback+1;
      }
      if(champPunjabDc)ns.punjabDc=s.punjabDc+1;
      if(lastIsYou)ns.woodenSpoon=s.woodenSpoon+1;
      if(topIsYou&&!champion)ns.choke=s.choke+1;
      if(you.w===7&&you.l===7)ns.place7=s.place7+1;
      if(you.w===0)ns.whitewash=s.whitewash+1;
      if(orange.team==="YOU"||purple.team==="YOU")ns.capWins=s.capWins+1;
      if(mvp.team==="YOU")ns.mvpWins=s.mvpWins+1;
      return ns;
    });
    setSpin(null);
  }

  // in hard mode, order by name (neutral) so the rating ranking isn't leaked; otherwise best-first
  const squadPlayers=spin?PLAYERS.filter(p=>sqKey(p)===spin)
    .sort((a,b)=>hard?a.name.localeCompare(b.name):b.r-a.r):[];
  const [tName,tSeason]=spin?spin.split("||"):["",""];

  return (
    <div className="wrap">
      {overlays}
      <div className="topbar">
        <div className="brand">
          <h1>16<span>·0</span></h1>
          <span className="kicker">{formation.name} formation</span>
        </div>
        <div style={{display:"flex",gap:10,alignItems:"center",flexWrap:"wrap",justifyContent:"flex-end"}}>
          {accountBar}
          <button className="btn-ghost" style={{padding:"8px 14px"}} onClick={restart}>↺ New game</button>
          {themeBtn}
        </div>
      </div>
      <div className="meta">
        <span>XI <b>{filled.length}/{slots.length}</b></span>
        <span className={overseasCount>MAX_OVERSEAS?"over-bad":"over-ok"}>Overseas <b>{overseasCount}/{MAX_OVERSEAS}</b></span>
        <span>Rating <b>{hideR?"—":(teamRating||"—")}</b></span>
        <span>Spins <b>{spinCount}</b></span>
        <span>Re-rolls <b>{rerolls}</b></span>
        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>Season
          <select className="seasel mini" value={simSeason} onChange={e=>setSimSeason(+e.target.value)}>
            {SEASONS.map(s=><option key={s} value={s}>IPL {s}</option>)}
          </select>
        </span>
        <button className={"hardtog"+(hard?" on":"")} onClick={()=>setHard(h=>!h)}
          title="Hide every rating and stat until your XI is complete">
          <span className="htdot"/> Hard mode <span className="htstate">{hard?"ON":"OFF"}</span>
        </button>
      </div>

      <div className="grid">
        <div className="panel">
          <h2>Spin &amp; Draft</h2>
          {!complete && (
            <>
              <div className={"wheel"+(anim?" spinning":"")}>
                {spin?<div>{tName}<span className="season-tag">{tSeason} squad</span></div>
                     :<div style={{color:"var(--muted)"}}>Spin to land on an IPL squad</div>}
              </div>
              <button className="btn-primary" style={{width:"100%",marginTop:12,opacity:spin?0.4:1}} onClick={doSpin} disabled={!!spin}>{spin?"⛔ Draft a player below first":"🎡 Spin the wheel"}</button>
              {spin && (
                <button className="btn-reroll" onClick={doReroll} disabled={rerolls<=0}>
                  {rerolls>0?"🎲 Re-roll this squad ("+rerolls+" left)":"🎲 Re-roll used — draft a player"}
                </button>
              )}
              {spin && (
                <div className="players">
                  {squadPlayers.map((p,i)=>{
                    const ok=!!eligibleSlot(p);
                    return (
                      <div key={i} className={"pcard"+(ok?"":" dis")} style={{cursor:ok?"pointer":"not-allowed"}} onClick={()=>ok&&draft(p)}>
                        <div className="pleft">
                          <span className={"badge "+(p.ovs?"b-ovs":"b-ind")}>{p.ovs?"OVS":"IND"}</span>
                          <div style={{minWidth:0}}><div className="name">{p.name}</div>
                            <div className="line">{p.role==="BAT"?ROLE_NAME[p.pos]:ROLE_NAME[p.role]}{hard?"":" · "+p.line}</div></div>
                        </div>
                        <div className="rating">{hard?"·":p.r}</div>
                      </div>
                    );
                  })}
                  <div className="small">Tap to draft (it's locked in — no takebacks). Greyed = no open slot, overseas cap reached, or already picked.</div>
                </div>
              )}
            </>
          )}
          {complete && !result && (
            <div className="center" style={{padding:"18px 0"}}>
              <p>Your XI is locked in. Time to find out how far it goes.</p>
              <button className="btn-go" onClick={simulate}>▶ Simulate the season</button>
            </div>
          )}
          {result && (()=>{ const done=rev>=result.feed.length; const wins=result.feed.slice(0,rev).filter(m=>!m.playoff&&m.won).length; const losses=result.feed.slice(0,rev).filter(m=>!m.playoff&&!m.won).length; return (
            <div className="result">
              <div className="record">{done?`${result.you.w}-${result.you.l}`:`${wins}-${losses}`}</div>
              <div className="small">{done?"final league record · 14 games":`simulating… ${rev}/${result.feed.length}`}</div>
              {done && (
              <div className="trophy">
                {result.champion?"🏆 IPL "+result.season+" CHAMPIONS":result.stage}
                {result.pw>0 && <span className="small"> · {result.pw} playoff win{result.pw>1?"s":""}</span>}
                {result.perfect && <div style={{color:"var(--accent)",marginTop:6,fontWeight:800}}>🔥 PERFECT 16-0 — unbeaten champions!</div>}
              </div>)}
              <h2 style={{margin:"14px 0 6px"}}>Your season · match by match</h2>
              <div className="matches">
                {result.feed.slice(0,rev).map((m,i)=>(
                  <div key={i} className={"mrow reveal"+(m.playoff?" po":"")}>
                    <span className={"res "+(m.won?"w":"l")}>{m.won?"W":"L"}</span>
                    <div className="mscore">
                      <div>{m.playoff?<b style={{color:"var(--accent)"}}>{m.label}</b>:`Match ${i+1}`} · vs {m.opp}</div>
                      <div className="mtop">YOU <b style={{color:"var(--txt)"}}>{m.meTot}/{m.meWk}</b> · {m.oppAbbr} {m.opTot}/{m.opWk}  —  ★ <span className="sc">{m.meTop.name} {m.meTop.score}</span> · {m.opTop.name} {m.opTop.score}</div>
                    </div>
                  </div>
                ))}
                <div ref={feedEnd}/>
              </div>
              {done && (<>
              <h2 style={{margin:"14px 0 6px"}}>Season awards</h2>
              <div className="mvp-banner">
                <div className="mvp-medal">🏅</div>
                <div className="mvp-body">
                  <div className="mvp-lbl">Most Valuable Player</div>
                  <div className="mvp-name">{result.mvp.name}</div>
                  <div className="mvp-line">{result.mvp.runs} runs · {result.mvp.wkts} wkts · {result.mvp.team}</div>
                </div>
                <div className="mvp-pts"><b>{result.mvp.mvpPts}</b><span>pts</span></div>
              </div>
              <div className="awards">
                <div className="award"><span className="aw-ico">🏆</span><div><div className="aw-lbl">Champions</div><div className="aw-val">{result.champName}</div></div></div>
                <div className="award"><span className="aw-ico">🎯</span><div><div className="aw-lbl">Player of the Final</div><div className="aw-val">{result.poFinal.name} <span className="small">· {result.poFinal.score} ({result.poFinal.team})</span></div></div></div>
                {result.allr && <div className="award"><span className="aw-ico">🔄</span><div><div className="aw-lbl">Best all-rounder</div><div className="aw-val">{result.allr.name} <span className="small">· {result.allr.runs}r / {result.allr.wkts}w</span></div></div></div>}
              </div>
              <div className="caps">
                <div className="cap orange"><CapIcon c="#ff8a00"/><div><div className="caplbl">Orange Cap · most runs</div><div className="capname">{result.orange.name}</div></div><div className="capval">{result.orange.runs}</div></div>
                <div className="cap purple"><CapIcon c="#9b5cff"/><div><div className="caplbl">Purple Cap · most wickets</div><div className="capname">{result.purple.name}</div></div><div className="capval">{result.purple.wkts}</div></div>
              </div>
              <h2 style={{margin:"14px 0 0"}}>Final table</h2>
              <table>
                <thead><tr><th>#</th><th>Team</th><th>W</th><th>L</th><th>Pts</th></tr></thead>
                <tbody>{result.teams.map((t,i)=>(
                  <tr key={i} className={t.you?"you":""}><td>{i+1}</td><td>{t.you?"YOUR XI":t.name}</td><td>{t.w}</td><td>{t.l}</td><td>{t.pts}</td></tr>
                ))}</tbody>
              </table>
              <div style={{display:"flex",gap:8,marginTop:12,justifyContent:"center"}}>
                <button className="btn-ghost" onClick={simulate}>↻ Re-simulate</button>
                <button className="btn-ghost" onClick={restart}>＋ New game</button>
              </div>
              </>)}
            </div>
          );})()}
        </div>

        <div className="panel">
          <h2>Your XI · avg {hideR?"—":(teamRating||"—")}</h2>
          <div className="ground-wrap">
            <svg className="ground" viewBox="0 0 320 300" preserveAspectRatio="xMidYMid meet">
              <defs>
                <radialGradient id="grass" cx="50%" cy="42%" r="65%">
                  <stop offset="0%" stopColor="var(--field)"/><stop offset="100%" stopColor="var(--field2)"/>
                </radialGradient>
              </defs>
              <rect x="0" y="0" width="320" height="300" fill="transparent"/>
              <ellipse cx="160" cy="150" rx="152" ry="142" fill="url(#grass)" stroke="rgba(255,255,255,.35)" strokeWidth="2"/>
              <ellipse cx="160" cy="150" rx="150" ry="140" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="14"/>
              <ellipse cx="160" cy="150" rx="94" ry="88" fill="none" stroke="rgba(255,255,255,.28)" strokeWidth="1.5" strokeDasharray="3 4"/>
              <rect x="150" y="112" width="20" height="76" rx="2" fill="rgba(232,222,192,.9)"/>
              <line x1="160" y1="118" x2="160" y2="182" stroke="rgba(120,90,40,.5)" strokeWidth="1"/>
            </svg>
            {slots.map(s=>{ const p=xi[s.i]; const g=gpos[s.i]; const elig=spin && !p && squadPlayers.some(q=>{const e=eligibleSlot(q);return e&&e.i===s.i;});
              return (
                <div key={s.i} className={"gchip"+(p?"":" empty")} style={{left:g.x+"%",top:g.y+"%",opacity:elig?1:(p?1:.62),outline:elig?"2px solid var(--accent)":"none"}}>
                  <div className={"gc-dot d-"+dotKey(p,s)}>{p?(hideR?"·":p.r):"+"}</div>
                  <div className="gc-name">{p?lastName(p.name):s.label}</div>
                </div>
              );
            })}
          </div>
          <div className="units">
            {units.map(u=>(
              <div key={u.k} className="unit">
                <div className="unit-top"><span className="unit-lbl">{u.label}</span><span className="unit-val">{hideR?"·":(u.r||"—")}</span></div>
                <div className="unit-bar"><div className={"unit-fill u-"+u.k} style={{width:(hideR?0:Math.max(0,Math.min(100,(u.r-55)/44*100)))+"%"}}/></div>
                <div className="unit-n">{u.n} player{u.n===1?"":"s"}</div>
              </div>
            ))}
          </div>
          <div className={"rankbox"+(complete?" final":"")}>
            {projRank?(<>
              <span className="rank-lbl">{complete?"Projected finish":"Projected rank (so far)"}</span>
              <span className="rank-val">{hideR?"#?":ordSuffix(projRank)} <span className="small">of {league.length+1}</span></span>
              <span className="rank-note">{hideR?"":(projRank<=4?"🏆 in the playoff places":"outside the top 4")}</span>
            </>):<span className="rank-lbl">Draft players to see your projected rank</span>}
          </div>
          <div className="xi">
            {(complete?battOrder.map(i=>slots[i]):slotsDisplay).map((s,idx)=>{
              const p=xi[s.i];
              const elig=spin && !p && squadPlayers.some(q=>{const e=eligibleSlot(q);return e&&e.i===s.i;});
              return (
                <div key={s.i} className={"slot"+(p?" filled":"")+(elig?" elig":"")}>
                  {complete
                    ? <span className="batpos">{idx+1}</span>
                    : <span className="slotrole">{s.label}</span>}
                  {p?(
                    <>
                      <span className="slotname">
                        <span className={"badge "+(p.ovs?"b-ovs":"b-ind")} style={{marginRight:7}}>{p.ovs?"OVS":"IND"}</span>
                        <b>{p.name}</b> <span className="small">· {ROLE_NAME[p.role==="BAT"?p.pos:p.role]}</span>
                      </span>
                      {complete && (
                        <span className="ord-arrows">
                          <button className="ord-btn" disabled={!canUp(idx)} title="Move up" onClick={()=>moveBat(idx,-1)}>▲</button>
                          <button className="ord-btn" disabled={!canDown(idx)} title="Move down" onClick={()=>moveBat(idx,1)}>▼</button>
                        </span>
                      )}
                      <span className="rating" style={{fontSize:15}}>{hideR?"·":p.r}</span>
                    </>
                  ):<span className="slotname small">— empty —</span>}
                </div>
              );
            })}
          </div>
          <div className="small" style={{marginTop:8}}>{complete
            ? "Reorder your batting line-up with the arrows — players can only move up to a spot they've actually batted historically."
            : "Top-order players can't fill a finisher slot and vice-versa. Middle-order players are flexible."}</div>
        </div>
      </div>
      <div className="small center" style={{marginTop:16,opacity:.6}}>
        {PLAYERS.length} player-seasons · 2008–2026 · independent fan project, inspired by 38-0.app · not affiliated with any league
      </div>
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
