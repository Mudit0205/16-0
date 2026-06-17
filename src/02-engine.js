// ---- IPL leagues: real franchises for every season, built from that season's squads ----
const avgR=arr=>arr.length?arr.reduce((a,p)=>a+p.r,0)/arr.length:78;
function buildLeague(season){
  const by={}; PLAYERS.filter(p=>p.season===season).forEach(p=>{(by[p.team]=by[p.team]||[]).push(p)});
  return Object.entries(by).map(([name,ps])=>{
    ps=ps.slice().sort((a,b)=>b.r-a.r); const xi=ps.slice(0,11);
    const rating=Math.round(xi.reduce((a,p)=>a+p.r,0)/Math.max(xi.length,1));
    const bats=(ps.filter(p=>p.role==="BAT"||p.role==="WK"||p.role==="AR").slice(0,7));
    const bowls=(ps.filter(p=>p.role==="PACE"||p.role==="SPIN"||p.role==="AR").slice(0,6));
    const abbr=name.replace("Royal Challengers ","RC ").split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,3);
    const B=bats.length?bats:xi.slice(0,6), W=bowls.length?bowls:xi.slice(0,5);
    return {name,abbr,rating,bats:B,bowls:W,batR:avgR(B),bowlR:avgR(W)};
  }).filter(t=>t.bats.length>=3);
}
const SEASONS=[...new Set(PLAYERS.map(p=>p.season))].sort((a,b)=>b-a)
  .filter(s=>buildLeague(s).length>=7);                 // seasons with a real league
const LEAGUES={}; SEASONS.forEach(s=>{LEAGUES[s]=buildLeague(s);});
// schedule that gives every team exactly 14 games for any league size N
function buildSchedule(N){
  const sched=[];
  for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)sched.push([i,j]);   // round robin -> N-1 each
  let r=14-(N-1);                                                // remaining games per team
  if(r<=0) return sched;
  for(let o=1;o<=Math.floor(r/2);o++)for(let i=0;i<N;i++){const j=(i+o)%N;sched.push([Math.min(i,j),Math.max(i,j)]);}
  if(r%2===1 && N%2===0)for(let i=0;i<N/2;i++)sched.push([i,i+N/2]);  // one perfect matching for the odd remainder
  return sched;
}
const ri=(lo,hi)=>lo+Math.floor(Math.random()*(hi-lo+1));
const clmp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
function wpick(pool){const wt=pool.map(p=>Math.pow(Math.max(1,p.r-55),1.7));const tot=wt.reduce((a,b)=>a+b,0);
  let x=Math.random()*tot;for(let i=0;i<pool.length;i++){x-=wt[i];if(x<=0)return pool[i];}return pool[pool.length-1];}
// innings total = BATTING team's batting strength vs BOWLING team's bowling strength (a real contest)
const innTotal=(batTeam,bowlTeam)=>Math.max(108,Math.min(236,Math.round(
  160 + ((batTeam.batR||batTeam.rating)-80)*2.0 - ((bowlTeam.bowlR||bowlTeam.rating)-80)*1.5 + gauss(0,17))));
// distribute an innings' runs across the batting order; returns sorted [{name,runs}], updates season tally.
// CREDIT (0.66): named top-7 account for ~2/3 of runs; the rest is extras + lower order we don't track.
// Bounded power-form + ~40% cheap-dismissal chance keeps individual aggregates realistic (Orange cap ~600).
function batInnings(team,total,tally){
  const order=(team.bats&&team.bats.length)?team.bats.slice(0,7):[{name:"—",r:team.rating}];
  const raw=order.map(p=>{ const sk=Math.max(0.08,Math.min(1,((p.r||70)-58)/40));
    if(Math.random()<0.44-sk*0.08) return Math.random()*0.15;                 // cheap dismissal
    return (0.5+sk*1.2)*Math.pow(Math.random(),1.8); });                       // many small scores, few big
  const sr=raw.reduce((a,b)=>a+b,0)||1; const cards=[];
  order.forEach((p,i)=>{ const r=Math.round(total*0.66*raw[i]/sr);
    cards.push({name:p.name,runs:r});
    const t=tally[p.name]||(tally[p.name]={runs:0,wkts:0,team:team.abbr}); t.runs+=r; });
  cards.sort((a,b)=>b.runs-a.runs); return cards;
}
// spread wickets across the ~6 frontline bowlers with flat weighting -> Purple cap ~22, tight spread.
// returns the best bowling figures of the innings (for the per-match scorecard)
function bowlInnings(bowlTeam,wk,tally){
  const pool=(bowlTeam.bowls&&bowlTeam.bowls.length)?bowlTeam.bowls.slice(0,6):[{name:"—",r:bowlTeam.rating}];
  const wt=pool.map(p=>Math.pow(Math.max(1,(p.r||70)-55),0.5)); const tot=wt.reduce((a,b)=>a+b,0)||1;
  const local={};
  for(let i=0;i<wk;i++){ let x=Math.random()*tot,pick=pool[pool.length-1];
    for(let k=0;k<pool.length;k++){x-=wt[k];if(x<=0){pick=pool[k];break;}}
    const t=tally[pick.name]||(tally[pick.name]={runs:0,wkts:0,team:bowlTeam.abbr}); t.wkts++;
    local[pick.name]=(local[pick.name]||0)+1; }
  const best=Object.entries(local).sort((a,b)=>b[1]-a[1])[0];
  return best?{name:best[0],wkts:best[1]}:{name:"—",wkts:0};
}
function playMatch(A,B,tally){
  // each innings is a contest: A bats vs B's attack, B bats vs A's attack
  let at=innTotal(A,B),bt=innTotal(B,A); if(at===bt)at+=(Math.random()<0.5?1:-1);
  // wickets tilt with the bowling-vs-batting gap: a sharper attack rips through more
  const awk=clmp(ri(2,5)+Math.round(((B.bowlR||B.rating)-(A.batR||A.rating))/10),1,9);
  const bwk=clmp(ri(2,5)+Math.round(((A.bowlR||A.rating)-(B.batR||B.rating))/10),1,9);
  const acards=batInnings(A,at,tally), bcards=batInnings(B,bt,tally);
  const aBowl=bowlInnings(B,awk,tally), bBowl=bowlInnings(A,bwk,tally);   // B's attack vs A, A's attack vs B
  const m={at,bt,awk,bwk,atop:acards[0],btop:bcards[0],
    aBat:acards.slice(0,3),bBat:bcards.slice(0,3),aBowl,bBowl};
  m.win=at>bt?A:B;m.lose=at>bt?B:A;return m;}
function youView(A,B,m,label){if(!A.you&&!B.you)return null;const ya=A.you,op=ya?B:A;
  return {label,opp:op.name,oppAbbr:op.abbr,won:m.win.you,
    meTot:ya?m.at:m.bt,meWk:ya?m.awk:m.bwk,opTot:ya?m.bt:m.at,opWk:ya?m.bwk:m.awk,
    meTop:ya?m.atop:m.btop,opTop:ya?m.btop:m.atop,
    card:{ meBat:ya?m.aBat:m.bBat, opBat:ya?m.bBat:m.aBat,
           meBowl:ya?m.bBowl:m.aBowl, opBowl:ya?m.aBowl:m.bBowl }};}

// ---- leaderboard (optional Supabase backend; stays off until window.LB_URL + LB_KEY are filled) ----
const LB_URL=(typeof window!=="undefined"&&window.LB_URL)||"";
const LB_KEY=(typeof window!=="undefined"&&window.LB_KEY)||"";
const LB_ON=/^https?:\/\//.test(LB_URL)&&LB_KEY.length>20;
async function lbSubmit(row){ if(!LB_ON)return false; try{
  const r=await fetch(LB_URL+"/rest/v1/scores",{method:"POST",
    headers:{apikey:LB_KEY,Authorization:"Bearer "+LB_KEY,"Content-Type":"application/json",Prefer:"return=minimal"},
    body:JSON.stringify(row)}); return r.ok; }catch(e){return false;} }
async function lbFetch(){ if(!LB_ON)return null; try{
  const r=await fetch(LB_URL+"/rest/v1/scores?select=name,ovr,perfect,season&order=created_at.desc&limit=4000",
    {headers:{apikey:LB_KEY,Authorization:"Bearer "+LB_KEY}});
  if(!r.ok)return null; return await r.json(); }catch(e){return null;} }
function lbBoards(rows){          // aggregate raw rows into the three boards (best entry per name)
  const eye={},unb={},club={};
  (rows||[]).forEach(r=>{ const n=(r.name||"").trim(); if(!n||typeof r.ovr!=="number")return;
    if(!eye[n]||r.ovr>eye[n].ovr) eye[n]={name:n,ovr:r.ovr,season:r.season};
    if(r.perfect){ if(!unb[n]||r.ovr<unb[n].ovr) unb[n]={name:n,ovr:r.ovr,season:r.season}; club[n]=(club[n]||0)+1; } });
  return { eye:Object.values(eye).sort((a,b)=>b.ovr-a.ovr).slice(0,50),
    unbeaten:Object.values(unb).sort((a,b)=>a.ovr-b.ovr).slice(0,50),
    club:Object.entries(club).map(([name,n])=>({name,n})).sort((a,b)=>b.n-a.n).slice(0,50) };}
